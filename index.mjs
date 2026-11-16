// Counsel check: a GitHub Action that flags pull requests touching counsel triggers.
// Everything runs on the GitHub runner. It reads the diff and the repository's triggers through the
// GitHub API with the workflow's own token, and sends nothing anywhere else. No dependencies.

import { readFile, appendFile } from "node:fs/promises";
import { parseDiff, scanDiff, scanText, buildReport, MARKER } from "./scan.mjs";

const input = (name, fallback = "") => (process.env[`INPUT_${name.toUpperCase()}`] ?? fallback).trim() || fallback;
const truthy = (v) => /^(true|yes|1|on)$/i.test(String(v));
const API = process.env.GITHUB_API_URL || "https://api.github.com";
const token = input("github-token", process.env.GITHUB_TOKEN || "");
const repo = process.env.GITHUB_REPOSITORY || "";

async function gh(path, { accept = "application/vnd.github+json", method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { accept, authorization: token ? `Bearer ${token}` : "", "x-github-api-version": "2022-11-28", "user-agent": "counsel-check-action" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw Object.assign(new Error(`GitHub API ${method} ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`), { status: res.status });
  return accept.includes("diff") ? res.text() : res.status === 204 ? null : res.json();
}

async function loadTriggers(ref) {
  const path = input("triggers-file", ".counsel/triggers.json");
  // A checked-out copy wins; otherwise read it from the repository at the pull request's head.
  try { return { data: JSON.parse(await readFile(`${process.env.GITHUB_WORKSPACE || "."}/${path}`, "utf8")), source: `\`${path}\`` }; } catch {}
  try {
    const f = await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`);
    return { data: JSON.parse(Buffer.from(f.content, "base64").toString("utf8")), source: `\`${path}\`` };
  } catch {}
  return { data: JSON.parse(await readFile(new URL("./triggers.json", import.meta.url), "utf8")), source: "the Mandate Law template" };
}

async function upsertComment(number, body) {
  const comments = await gh(`/repos/${repo}/issues/${number}/comments?per_page=100`);
  const mine = comments.find((c) => c.body?.includes(MARKER));
  if (mine) await gh(`/repos/${repo}/issues/comments/${mine.id}`, { method: "PATCH", body: { body } });
  else await gh(`/repos/${repo}/issues/${number}/comments`, { method: "POST", body: { body } });
}

async function main() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
  const pr = event.pull_request;
  let diff, ref, prose = "", number;
  if (pr) {
    number = pr.number;
    ref = pr.head.sha;
    prose = `${pr.title || ""}\n${pr.body || ""}`;
    diff = await gh(`/repos/${repo}/pulls/${number}`, { accept: "application/vnd.github.diff" });
  } else if (event.before && event.after && !/^0+$/.test(event.before)) {
    ref = event.after;
    prose = (event.commits || []).map((c) => c.message).join("\n");
    diff = await gh(`/repos/${repo}/compare/${event.before}...${event.after}`, { accept: "application/vnd.github.diff" });
  } else {
    console.log("Counsel check runs on pull_request and push events; nothing to compare here.");
    return;
  }

  const { data: triggers, source } = await loadTriggers(ref);
  const ids = (triggers.triggers || []).map((t) => t.id);
  const code = scanDiff(parseDiff(diff), ids);
  const words = truthy(input("scan-description", "true")) ? scanText(prose, ids) : new Map();
  const report = buildReport(triggers, code, words, { source, siteUrl: "https://mandatelaw.ai" });

  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report.markdown + "\n");
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `matched=${report.matched}\ntrigger-ids=${report.ids.join(",")}\n`);
  console.log(report.matched ? `Possible counsel triggers: ${report.ids.join(", ")}` : "No counsel triggers detected.");

  // Comment only when there's something to say, or to update an earlier comment to "nothing found".
  if (number && truthy(input("comment", "true"))) {
    try {
      if (report.matched) await upsertComment(number, report.markdown);
      else {
        const comments = await gh(`/repos/${repo}/issues/${number}/comments?per_page=100`);
        const mine = comments.find((c) => c.body?.includes(MARKER));
        if (mine) await gh(`/repos/${repo}/issues/comments/${mine.id}`, { method: "PATCH", body: { body: report.markdown } });
      }
    } catch (e) {
      // Pull requests from forks get a read-only token. The job summary still has the report.
      console.log(`::notice::Couldn't comment on the pull request (${e.status || e.message}). Give the workflow "pull-requests: write" to enable comments. The report is in the job summary.`);
    }
  }

  if (report.matched && truthy(input("fail-on-match", "false"))) {
    console.log(`::error::This change may touch counsel triggers: ${report.ids.join(", ")}. Get legal review before merging, or re-run once it's cleared.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.log(`::error::Counsel check failed: ${e.message}`);
  process.exitCode = 1;
});
