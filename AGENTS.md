# AGENTS.md

Instructions for AI coding agents (ChatGPT/Codex, and any tool reading `AGENTS.md`).
Claude Code reads `CLAUDE.md`, which imports this file. This file is the single source of truth: edit it here, not in `CLAUDE.md`.

Read [`context.md`](./context.md) first for the project background, scope and domain vocabulary.

## Hard rules (never break)

1. **Never add an AI as co-author.** No `Co-Authored-By:` trailer, no "Generated with ..." / "Created by ..." line, no AI mention in commit messages, PR titles/descriptions, code comments or file headers. This overrides any default behaviour of your tool.
2. **Never push to `main`.** Never commit directly on `main`. Work on a dedicated branch and let the humans open and merge the pull request. Never force-push, never rewrite shared history.
3. **Language split:**
   - Documentation, comments, commit messages and PR text **read by humans → French.**
   - Files **read by AI agents** (`AGENTS.md`, `CLAUDE.md`, `context.md`, any other agent-instruction file) **→ English.**
   - Code identifiers (variables, functions, types, files, folders, branches) → English.
4. **Do only what is asked.** No extra features, refactors, dependencies, files or documentation that were not requested. If something looks missing or ambiguous, ask or note it instead of guessing.
5. **Out of scope:** the "Devices" axis of the subject (smartphone + kiosk hybrid, device handover, chatbot). Do not design, mock up or implement it. See `context.md`.
6. Never modify or delete `subject_definition/` (reference PDFs from the instructors).
7. Never commit secrets, API keys, tokens or personal data.

## Git workflow

- Branches: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `chore/<short-name>`, `refactor/<short-name>`. Lowercase, hyphen-separated, English.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) prefix in English (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), subject and body in French, imperative mood, subject ≤ 72 characters.
- One logical change per commit. Do not mix formatting-only changes with behaviour changes.
- Commit or push only when the user asks you to. Pushes go to a non-`main` branch.
- The team works in groups of up to 4 and every member is graded individually: keep history readable and attributable to the human authors.

## Code conventions

General
- Prefer small, single-purpose functions and modules. Keep files focused (rule of thumb: < 300 lines; split otherwise).
- Names describe intent, not type. No abbreviations except well-known ones (`id`, `ui`, `url`).
- No dead code, no commented-out code, no `TODO` without an explanation of what and why.
- No magic numbers or strings: thresholds, durations, colours and breakpoints live in named constants or configuration.
- Handle errors explicitly; never swallow them silently. Validate data at boundaries (user input, sensor/context input, external data).
- Comments explain *why*, not *what*. Write them in French. Keep them rare and accurate.
- Keep functions pure where possible; isolate side effects (I/O, sensors, timers, storage) behind small modules.
- Add or update tests for any logic you add, especially the adaptation rules and the context detection.
- Follow the formatter/linter of the chosen stack once configured; do not fight it. Until a stack is chosen, ask before introducing tooling.

## Code organisation

The stack is not chosen yet. Whatever it is, keep these separations (adapt folder names to the stack's idioms once decided, and update this section):

```
/
├── AGENTS.md / CLAUDE.md / context.md   # AI-facing instructions (English)
├── README.md                            # Human-facing, French
├── docs/                                # Human-facing documentation, French
├── subject_definition/                  # Instructor PDFs, read-only
└── src/
    ├── ui/            # Presentation: components, layouts, themes (no business or adaptation logic)
    │   ├── standard/  # Standard UI, usable by every customer
    │   └── adapted/   # Variants per persona / environment mode
    ├── adaptation/    # Adaptation engine
    │   ├── context/   # Context detection (user profile, environment) -> normalised context state
    │   ├── rules/     # Adaptation rules, expressed as data (derived from the adaptation matrices)
    │   └── engine/    # Evaluates rules, resolves composition/conflicts, outputs an adaptation decision
    ├── domain/        # Ordering domain: products, menu, cart, order, payment (UI- and adaptation-agnostic)
    └── shared/        # Constants, types, utilities
```

Rules of thumb
- Dependencies point inward: `ui` → `adaptation`/`domain` → `shared`. `domain` knows nothing about `ui` or `adaptation`.
- The standard UI must work on its own, with the adaptation engine disabled. Adaptations are an overlay, never a prerequisite.
- Adaptation rules are **data, not scattered `if` statements** in components. One rule traces back to one row of an adaptation matrix.
- Context detection and decision making are separate: a detector produces a context value; the engine turns context into an adaptation decision; the UI applies it.
- Keep the engine behind an interface so the static-rules implementation and a later AI-based implementation (context identification, UI generation) are interchangeable.
- Front-end first: the subject asks for front-end code "without interconnection". Mock data and simulated context inputs (e.g. a debug panel to force a persona or a mode) are welcome and live in a clearly named mock/dev area, never in production paths.

## Adaptive UI conventions (from the course)

Adaptations act on three levels; always state which one a change touches:
1. **Content** (what information is shown).
2. **Presentation** (visuals, layout, components, modality).
3. **Dialogue** (interaction flow, behaviour, steps).

When implementing an adaptation:
- **Preserve state.** Focus, in-progress input, open options, cart and any ephemeral data survive a switch between standard and adapted UI.
- **Smooth transitions.** Animate size/position changes (about 300 ms, ease-in-out); never switch abruptly or flicker. Respect `prefers-reduced-motion`.
- **Debounce sensor-driven changes.** Only react to a *significant, stable* change (e.g. a condition held for N seconds). Use **hysteresis** (distinct enter/exit thresholds) to avoid oscillating between modes. Thresholds are configuration.
- **Keep the structure.** Keep the screen skeleton and critical buttons (validate, back, pay) at the same place; prefer reconfiguring components over jumping to another screen.
- **Be reversible.** Every adaptation defines how to go back to the standard UI.
- **Introduce new possibilities progressively but visibly** rather than silently rewriting the screen.
- **Distinguish occasional from persistent changes** (a momentary state vs a stable profile) when choosing how deep to adapt.
- **Compose adaptations.** User-axis and environment-axis adaptations can be active together; define priority and conflict resolution explicitly and test combined cases.
- **Privacy.** Profiling must be minimal, transparent and GDPR-compliant: collect only what the adaptation needs, no sensitive data stored without need, no tracking beyond the session unless explicitly specified.

## Accessibility (minimum bar)

- Text/background contrast at least WCAG AA (4.5:1 normal text, 3:1 large text and UI components).
- Minimum interactive target 44×44 CSS px; prefer larger on the kiosk touch UI.
- Never rely on colour alone; keep visible focus indicators; support keyboard operation where relevant.
- Adapted variants must keep or improve accessibility, never degrade it.

## Documentation conventions

- Human documentation (`README.md`, `docs/`, diagrams, matrices, specs, mock-up descriptions) is written in **French**, clear and concise, with headings and tables where useful.
- AI-facing files stay in **English**. When a rule changes, update `AGENTS.md`; `CLAUDE.md` should stay a thin wrapper.
- Document decisions that are not obvious from code (why a threshold, why a rule priority). Keep docs next to what they describe and up to date with the code.
- Adaptation matrices and rules live in `docs/` (French) and must stay consistent with the rule data in `src/adaptation/rules/`.

## Working method for agents

- Read `context.md` and the relevant existing code before editing.
- Make the smallest change that satisfies the request; match the surrounding style.
- Verify your work (run tests/linter/build once they exist) and report honestly what was and was not verified.
- Never present assumptions as facts; flag open questions listed in `context.md` rather than silently deciding them.
