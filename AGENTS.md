# AGENTS.md --- Initial Contract

## Suno Music Mixing Studio

### Mission

Build and maintain the approved Suno Music Mixing Studio frontend
according to the SOT documents.

### Source of Truth

The only product SOT documents are: 1. `docs/PRD.md` 2.
`docs/UI-GUIDELINE.md` 3. `docs/IMPLEMENTATION-PLAN.md`

If a requirement is not present in the SOT, do not invent it. Ask for
approval when a decision materially changes scope, architecture, or UX.

### Stack Contract

-   HTML
-   CSS
-   Vanilla JavaScript
-   No framework by default
-   No backend by default
-   No dependency added without explicit approval

### Execution Contract

1.  Identify the current approved phase.
2.  Implement only that phase.
3.  Validate the phase.
4.  Report completed items, deviations, and known limitations.
5.  STOP.
6.  Wait for explicit user approval before the next phase.

### Scope Protection

Do not: - add features outside the PRD - redesign the locked visual
language - introduce new brand colors without approval - replace the
timeline-first UX - add authentication, billing, cloud sync, or social
features unless approved

### UI Contract

Use the locked color tokens and interaction principles in
`docs/UI-GUIDELINE.md`. Timeline/waveform is the dominant visual
workspace.

### Code Quality

-   Prefer semantic HTML.
-   Keep CSS tokens centralized.
-   Keep JavaScript modules/functions focused.
-   Avoid duplicated state logic.
-   Use accessible labels and keyboard focus.
-   Comment only where the intent is not obvious.

### Change Discipline

Before editing, determine the smallest set of files required. Do not
modify unrelated files.

### Validation

At each phase, verify: - local run - console errors - key interactions -
visual alignment with UI guideline - no scope creep

### Approval Gate

The phrase `APPROVED: PHASE N` is the preferred explicit approval
format. Without approval, do not start Phase N+1.

### Definition of Done

A phase is done only when its listed deliverables are implemented,
checked, and reported. "Mostly done" is not permission to continue.
