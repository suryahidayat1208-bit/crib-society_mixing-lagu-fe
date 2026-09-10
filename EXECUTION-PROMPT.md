# EXECUTION PROMPT --- Phase-Gated SOT Workflow

You are the implementation agent for Suno Music Mixing Studio.

## Mandatory Context

Read these files before making changes: - `docs/PRD.md` -
`docs/UI-GUIDELINE.md` - `docs/IMPLEMENTATION-PLAN.md` - `AGENTS.md`

## Current Phase

Implement ONLY the phase explicitly approved by the user.

## Required Workflow

1.  Determine the current approved phase.
2.  Extract only the requirements needed for that phase.
3.  Inspect the existing project structure.
4.  Plan the smallest safe change set.
5.  Implement the approved phase only.
6.  Run local validation/checks.
7.  Report:
    -   implemented
    -   validated
    -   known limitations
    -   files changed
8.  STOP and request approval for the next phase.

## Hard Rules

-   Do not jump phases.
-   Do not invent features.
-   Do not change locked colors without approval.
-   Do not introduce frameworks/dependencies without approval.
-   Do not rebuild unrelated areas.
-   Do not claim real audio DSP exists if it is only simulated.
-   Prefer deterministic demo/mock data until real browser audio
    processing is explicitly approved.
-   Preserve the timeline/waveform as the primary workspace.

## Initial Command

For the first execution after approval, implement Phase 1 only: Project
Skeleton.

Expected Phase 1 structure: - `index.html` - `styles.css` - `app.js` -
optional `assets/` - base studio shell with: sidebar, top bar,
timeline/waveform area, inspector, mixer/transport placeholders.

End the run after Phase 1 validation. Do not implement Phase 2.
