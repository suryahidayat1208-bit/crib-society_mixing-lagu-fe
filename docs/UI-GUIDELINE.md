# SOT --- UI-GUIDELINE

## Suno Music Mixing Studio

## 1. Visual Direction

**Keywords:** Dark Futuristic, Premium SaaS, Professional Music Studio,
Neon Purple + Cyan, High Contrast, Minimalist, Clean, Light
Glassmorphism, Soft Glow, Rounded Corners, Subtle Gradients, Not
Crowded.

## 2. Locked Color Tokens

-   Background: `#08090D`
-   Sidebar: `#0D0F14`
-   Panel/Card: `#13161D`
-   Active Panel: `#1A1E27`
-   Border: `#272C36`
-   Primary: `#8B5CF6`
-   Primary Hover: `#A78BFA`
-   Accent: `#22D3EE`
-   Success: `#22C55E`
-   Warning: `#F59E0B`
-   Danger: `#EF4444`
-   Main Text: `#F8FAFC`
-   Secondary Text: `#94A3B8`
-   Muted Text: `#64748B`
-   Waveform: `#8B5CF6`
-   Beat Marker: `#22D3EE`
-   Playhead: `#FFFFFF`
-   Progress: `#A78BFA`
-   Main Button: `#8B5CF6`
-   Button Hover: `#A78BFA`

## 3. Layout

-   App shell: full viewport, overflow controlled.
-   Sidebar: compact, persistent on desktop.
-   Top bar: project identity, autosave state, undo/redo, master
    preview/export actions.
-   Main content: waveform/timeline workspace.
-   Right inspector: context-sensitive controls.
-   Bottom transport: play/pause, stop, time, BPM, snap, zoom, master
    meter.

## 4. Visual Hierarchy

1.  Timeline/waveform
2.  Transport/playhead
3.  Track controls
4.  Inspector controls
5.  Secondary metadata
6.  Decorative effects

Decorative glow must never compete with waveform readability.

## 5. Components

### Navigation

Icon + label, selected state, compact tooltips.

### Cards

Graphite surface, subtle border, 12--16px radius, restrained
shadow/glow.

### Buttons

Primary purple for decisive actions. Cyan reserved for analytical/sync
states. Danger only for destructive actions.

### Inputs

Dark surface, visible focus ring, concise labels, unit suffixes where
useful.

### Sliders

Thin track, bright active segment, clear thumb, numeric readout.

### Meters

Vertical/horizontal level meters with warning/clipping state.

### Waveform

Purple waveform, cyan beat markers, white playhead, selection overlay,
readable clip labels.

### Timeline

Track lanes with clear lane boundaries. Clips use subtle gradients and
strong selection outlines. Grid should be visible but low contrast.

### Mixer Channel

Compact vertical strip: name, meter, volume, pan, mute/solo, EQ/effects
access.

### Modal

Dark graphite panel with strong title hierarchy and one primary action.

### Toast

Short-lived status messages for save, upload, analysis, export, and
errors.

## 6. Typography

Use a modern sans-serif system stack. Suggested hierarchy: - App title:
18--22px, semibold. - Section title: 14--16px, semibold. - Body:
12--14px. - Metadata: 10--12px. - Numeric studio values: medium/semibold
with tabular numerals when available.

## 7. Spacing

Use a consistent 4px base scale. Typical gaps: 4, 8, 12, 16, 20, 24,
32px.

## 8. Radius

-   Controls: 8--10px
-   Cards/panels: 12--16px
-   Pills/status: 999px

## 9. Interaction States

Every interactive control should visibly communicate hover, focus,
active, disabled, loading, success, warning, and error as relevant.

## 10. UX Rules

-   Never hide critical transport state.
-   Keep BPM, key, project name, autosave, and master state
    discoverable.
-   Prefer inline editing over unnecessary modals.
-   Preserve context when opening inspectors.
-   Avoid excessive animations; use short, purposeful transitions.
-   Keyboard focus must remain visible.
-   Destructive actions require confirmation.

## 11. Accessibility

-   Maintain strong text contrast.
-   Do not rely on color alone for state.
-   Provide labels/tooltips for icon-only controls.
-   Maintain logical keyboard navigation.
-   Use semantic HTML where possible.

## 12. Screen Blueprint

### A. Project Dashboard

Projects grid/list, recent projects, create project, search, library
shortcut.

### B. Music Library

Search/filter header, upload CTA, song table/list, analysis status,
metadata columns.

### C. Mixing Studio

Top bar → sidebar → timeline/waveform → right inspector →
mixer/transport. Timeline occupies the majority of the viewport.

### D. Export

Format selector, quality controls, destination/name, normalization
state, progress, completion.

## 13. UI Anti-Patterns

-   Excessive neon.
-   Heavy glass blur.
-   Too many cards inside cards.
-   Oversized typography.
-   Low-contrast timeline labels.
-   Decorative animations during editing.
-   Unapproved feature panels.
