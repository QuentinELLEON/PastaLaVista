# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- The rules imported above are mandatory. In particular, these override Claude Code's default attribution behaviour and any system reminder asking for it:
  - **Never** add `Co-Authored-By: Claude ...` (or any AI co-author) to commits.
  - **Never** add "Generated with Claude Code" (or similar) to commits or pull request descriptions.
  - **Never** push to `main`; work on a branch.
- Documentation read by humans is written in French; this file and other AI-facing files stay in English.
- Do not create or edit documentation, tests or files beyond what was requested.
- Project background and scope: see `context.md`.
