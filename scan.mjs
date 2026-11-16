// The counsel check's logic, kept free of GitHub API calls so it can be tested on its own.
//   parseDiff(text)                 -> [{ file, lines: [{ n, text }] }]   (added lines only)
//   scanDiff(files, triggerIds)     -> Map(id -> [{ file, line, why }])
//   scanText(text, triggerIds)      -> Map(id -> [{ why }])                (PR title and description)
//   buildReport(triggers, code, prose, opts) -> { matched, ids, markdown }

import { CODE_RULES, MANIFEST_FILES, SKIP_FILES } from "./rules.mjs";
import { matchTriggers } from "./change-check.mjs";

export const MARKER = "<!-- mandate-law-counsel-check -->";
const MAX_EVIDENCE = 3;

export function parseDiff(text) {
  const files = [];
  let cur = null, n = 0;
  for (const raw of String(text || "").split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("diff --git ")) { cur = null; continue; }
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).trim();
      cur = path === "/dev/null" ? null : { file: path.replace(/^b\//, ""), lines: [] };
      if (cur) files.push(cur);
      continue;
    }
    if (line.startsWith("--- ")) continue;
    const h = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { n = Number(h[1]); continue; }
    if (!cur) continue;
    if (line.startsWith("+")) { cur.lines.push({ n, text: line.slice(1) }); n++; }
    else if (line.startsWith("-") || line.startsWith("\\")) { /* removed line or "no newline" marker */ }
    else n++;
  }
  return files;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DEP_REGEX = Object.fromEntries(
  Object.entries(CODE_RULES).map(([id, r]) => [id, (r.deps || []).map((d) => [d, new RegExp(`(^|["'\\s=:,(\\[])${escape(d)}(?=["'\\s=<>~!^@:,;)\\]\\[]|$)`, "i")])]),
);

export function scanDiff(files, triggerIds) {
  const found = new Map();
  const add = (id, hit) => {
    if (!found.has(id)) found.set(id, []);
    const list = found.get(id);
    if (!list.some((h) => h.file === hit.file && h.why === hit.why)) list.push(hit);
  };
  const ids = triggerIds.filter((id) => CODE_RULES[id]);
  for (const f of files) {
    if (SKIP_FILES.some((re) => re.test(f.file))) continue;
    const manifest = MANIFEST_FILES.some((re) => re.test(f.file));
    for (const { n, text } of f.lines) {
      if (text.length > 2000) continue; // minified or generated line
      for (const id of ids) {
        if (manifest) for (const [dep, re] of DEP_REGEX[id]) if (re.test(text)) add(id, { file: f.file, line: n, why: `adds the \`${dep}\` package` });
        for (const re of CODE_RULES[id].patterns || []) {
          const m = text.match(re);
          if (m) add(id, { file: f.file, line: n, why: `\`${m[0].trim().slice(0, 60)}\`` });
        }
      }
    }
  }
  return found;
}

export function scanText(text, triggerIds) {
  const found = new Map();
  for (const m of matchTriggers(text, triggerIds)) found.set(m.id, m.matched_terms.map((t) => ({ why: `mentions “${t}”` })));
  return found;
}

const md = (s) => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

export function buildReport(triggers, code, prose, { source = "", siteUrl = "https://mandatelaw.ai" } = {}) {
  const list = triggers.triggers || [];
  const ids = list.map((t) => t.id).filter((id) => code.has(id) || prose.has(id));
  const out = [MARKER, "### Counsel check", ""];
  if (!ids.length) {
    out.push("No counsel triggers detected in this change's code or description.", "");
  } else {
    out.push(`This change may touch **${ids.length}** counsel trigger${ids.length === 1 ? "" : "s"}. A match means legal review is recommended before the matching part ships; the rest of the change can go ahead.`, "");
    out.push("| Trigger | What it covers | Found |", "|---|---|---|");
    for (const t of list) {
      if (!ids.includes(t.id)) continue;
      const ev = [...(code.get(t.id) || []).map((h) => `${h.why} in \`${h.file}:${h.line}\``), ...(prose.get(t.id) || []).map((h) => `the description ${h.why}`)];
      const shown = ev.slice(0, MAX_EVIDENCE).join("<br>") + (ev.length > MAX_EVIDENCE ? `<br>and ${ev.length - MAX_EVIDENCE} more` : "");
      out.push(`| \`${t.id}\` | ${md(t.trigger)} | ${md(shown)} |`);
    }
    out.push("");
    if (ids.includes("incident")) out.push("> **Possible security incident or unauthorized agent action.** Contact counsel now, not at the next release.", "");
  }
  const unseen = list.filter((t) => !CODE_RULES[t.id] && !prose.has(t.id));
  if (unseen.length) {
    out.push("<details><summary>Triggers code can't show: check these by hand</summary>", "");
    for (const t of unseen) out.push(`- \`${t.id}\`: ${t.trigger}`);
    out.push("", "</details>", "");
  }
  if (triggers.catch_all?.length) out.push(`Also ask of any change: ${triggers.catch_all.map((q) => q.replace(/\.$/, "")).join("; ")}.`, "");
  out.push(`<sub>A keyword and pattern screen, not legal advice: it can flag a change that's fine and miss one that isn't. Triggers from ${source || "the template"}. The scan runs inside GitHub Actions and sends nothing outside GitHub. Template by [Mandate Law](${siteUrl}) (attorney advertising).</sub>`);
  return { matched: ids.length > 0, ids, markdown: out.join("\n") };
}
