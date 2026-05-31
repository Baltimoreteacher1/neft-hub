# Repo Ownership & Agent Coordination

To prevent the multi-agent collisions seen on 2026-05-31 (branch hijacking,
working-tree resets, deleted tags), each repo has ONE owning agent. Other
automated agents (Antigravity, Codex, additional Claude sessions) must NOT
auto-commit here — contribute via a branch + PR for the owner to integrate.

## Ownership map (recommended)
| Repo                            | Owner        | Others |
|---------------------------------|--------------|--------|
| neft-classroom-html-activities  | Claude Code  | branch/PR only — do NOT commit to main |
| neft-hub                        | Claude Code  | branch/PR only |
| neft-practice-engine            | Claude Code  | branch/PR only |
| neft-teacher-pipeline           | Claude Code  | branch/PR only |
| neft-teacher-dashboard          | Claude Code  | branch/PR only |
| fix-it-design-challenge         | Claude Code  | branch/PR only |

## Rule
- One agent commits to `main` per repo (the owner).
- Non-owners: create a feature branch and open a PR; never reset/move the
  owner's branches or delete tags.
- Reassign by editing this file in a single PR.
