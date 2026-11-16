# Counsel Check

A GitHub Action that flags pull requests touching **counsel triggers**: product changes that can make a privacy policy or terms false, or create new legal obligations. Examples are a new AI model provider, an agent that charges a stored card, session replay, location or contacts access, health or bank data, ad SDKs, and features for minors.

When a pull request may match a trigger, the action adds one comment (kept up to date on each push) and a job summary listing the trigger, the file and line, and why it matched. Nothing is blocked unless you turn that on.

**Your code never leaves GitHub.** The scan runs on the GitHub Actions runner, reads the diff with the workflow's own token, and sends nothing to Mandate Law or anyone else.

## Use it

Add `.github/workflows/counsel-check.yml` to your repository:

```yaml
name: Counsel check
on: pull_request
permissions:
  contents: read
  pull-requests: write   # to post the comment; without it, the report is in the job summary
jobs:
  counsel-check:
    runs-on: ubuntu-latest
    steps:
      - uses: mandate-law/counsel-check@v1
```

No checkout step is needed.

## What it checks

- **Dependencies** added to manifests such as `package.json`, `requirements.txt`, `pyproject.toml`, `Podfile`, `build.gradle`, and `app.json`: AI provider SDKs, payments, analytics, session replay, ad and attribution SDKs, browser automation, telephony, marketing email and push, health and bank-data SDKs, and device-permission libraries.
- **Telltale code** on added lines: model calls, replay sample rates, stored-card charges (`off_session`), location, camera, microphone, and contacts permission strings, OAuth scopes for Gmail, Calendar, and Drive, fine-tuning jobs, and settings that remove confirmation steps.
- **The pull request's title and description** (or commit messages on push), screened for every trigger, including ones code can't show, like fundraising or a security incident.

Lock files, vendored and build folders, and removed lines are ignored. The full rules are in [`rules.mjs`](rules.mjs).

## Options

| Input | Default | What it does |
|---|---|---|
| `triggers-file` | `.counsel/triggers.json` | Your tailored trigger list. If the file doesn't exist, the bundled template is used. |
| `comment` | `true` | Post and update one pull request comment when something matches. |
| `scan-description` | `true` | Also screen the pull request's title and description. |
| `fail-on-match` | `false` | Fail the job on a match, so a required check holds the merge until someone reviews it. |
| `github-token` | the workflow token | Token used to read the diff and comment. |

Outputs: `matched` (`true` or `false`) and `trigger-ids` (comma-separated).

To tailor the triggers, copy [`triggers.json`](triggers.json) to `.counsel/triggers.json` in your repository and edit it, ideally with your counsel. The action uses your copy. Code rules apply to the trigger ids they know; your own triggers are still screened against the pull request's description and listed for a person to check.

## What a match means

A match means the matching part of the change should get legal review before it ships. The rest of the change can go ahead. This is a keyword and pattern screen, not legal advice: it can flag a change that turns out to be fine, and it can miss one that isn't. A clean result doesn't mean a change is compliant.

## About

The trigger template and this action are from [Mandate Law](https://mandatelaw.ai), the law practice of Allen Gibby, admitted in the District of Columbia only. Using them doesn't create an attorney-client relationship; that requires a signed engagement letter. This repository is attorney advertising. For a lawyer's review of a matching change, see [mandatelaw.ai](https://mandatelaw.ai). Coding agents can screen a change before writing it with the free [`check_change` tool](https://mandatelaw.ai/connector).

## License

Code: MIT (see [LICENSE](LICENSE)). The trigger template (`triggers.json`): CC BY 4.0.
