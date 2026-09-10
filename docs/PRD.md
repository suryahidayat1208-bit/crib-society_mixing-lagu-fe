# SOT --- PRD

## Suno Music Mixing Studio

**Document status:** SOT v1.0 --- Planning/Approval Gate\
**Product type:** Browser-based music mixing studio\
**Frontend:** HTML5, CSS3, Vanilla JavaScript\
**Primary UX:** Modern futuristic premium SaaS, dark studio UI

## 1. Product Vision

Suno Music Mixing Studio is a browser-based workspace for organizing,
analyzing, editing, synchronizing, mixing, previewing, and exporting
songs generated with Suno. The product should feel like a professional
music-production environment while remaining approachable and focused on
waveform/timeline workflows.

## 2. Core Goals

-   Import and manage a personal music library.
-   Analyze BPM, musical key, and energy.
-   Edit and arrange multiple tracks on a timeline.
-   Mix tracks with volume/gain, EQ, fades, crossfades, automation, and
    effects.
-   Assist BPM/key matching and beat synchronization.
-   Provide Smart Transition, Intelligent Trimming, Loudness
    Normalization, and Auto Mix.
-   Preview the master mix before export.
-   Export MP3 and WAV.
-   Save projects, presets, keyboard shortcuts, and autosave state.

## 3. Non-Goals for Initial Frontend Phase

-   Server-side audio rendering.
-   User authentication/payment systems.
-   Cloud storage implementation.
-   Third-party API integrations.
-   Full DAW-grade DSP engine beyond what can be reasonably represented
    in the browser.
-   Any feature outside the approved feature list.

## 4. Information Architecture

Primary application shell: 1. Top Bar 2. Left Sidebar 3. Main Workspace
4. Right Inspector/Control Panel 5. Bottom Transport + Timeline/Status
Area

Primary navigation: - Dashboard / Projects - Music Library - Mixer
Studio - Presets - Settings

## 5. Approved Feature Scope

### Project Management

Create, rename, duplicate, open, save, autosave, delete, and recover
projects.

### Music Library

Browse imported songs, search/filter, sort, view metadata, BPM, key,
energy, duration, and project usage.

### Upload Lagu Suno

Drag-and-drop and file picker upload flow with validation, progress
state, metadata preview, and library insertion.

### Audio Analysis

Analysis status, duration, waveform generation state, BPM, key, energy,
and loudness summary.

### BPM Detection

Display detected BPM, confidence/state, editable BPM override, and sync
readiness.

### Key Detection

Display detected key, confidence/state, editable key override, and
compatibility indicator.

### Energy Detection

Visual energy score/level and energy curve representation.

### Waveform Editor

Zoom, pan, selection, trim, split, fade handles, playhead, beat markers,
and region operations.

### Multi-Track Timeline

Multiple tracks, clips, lane headers, snapping, playhead, markers,
scrolling, zoom, and track controls.

### Track Mixer

Per-track channel strip with mute, solo, volume, gain, pan, meter, EQ,
effects, and automation access.

### Volume & Gain

Independent clip/track level controls with visual meters.

### EQ

Three-band minimum UI: low, mid, high; frequency/gain controls may be
represented with compact controls and a visual EQ curve.

### Fade In / Fade Out

Clip-level fade handles and numeric/visual duration controls.

### Crossfade

Overlap-based crossfade with adjustable curve/duration.

### BPM Matching

Suggested target BPM and adjustment state.

### Key Matching

Compatibility indicator and suggested compatible key.

### Beat Synchronization

Grid/beat marker alignment and snap-to-beat behavior.

### Smart Transition

Suggested transition between adjacent clips based on BPM, key, energy,
and timing.

### Loudness Normalization

Target loudness control and normalization preview/status.

### Intelligent Trimming

Detect low-signal/silence-like regions and suggest trim boundaries.

### Auto Mix

One-click assisted balance workflow with preview and non-destructive
application.

### Audio Effects

Effect rack UI with approved lightweight effect slots and enable/bypass
state.

### Automation

Track/clip parameter automation lanes with points and curves.

### Master Preview

Master transport, stereo level meter, loudness summary, clipping
warning, and final listening state.

### MP3 Export / WAV Export

Export modal with format, quality/sample-rate controls appropriate to
the frontend prototype, progress, and completion state.

### Mix Presets

Save/load/delete mixing presets.

### Keyboard Shortcuts

Shortcut reference overlay and core transport/editing shortcuts.

### Autosave

Visible autosave state, timestamp, saving indicator, and recovery state.

### Modern Futuristic UI

Premium dark SaaS studio with restrained neon accents, glass-like
surfaces, soft glow, rounded corners, and high information density
without visual clutter.

## 6. Primary User Flow

Open/Create Project → Upload Suno Songs → Analyze → Review
BPM/Key/Energy → Add to Timeline → Edit/Trim → Arrange → BPM/Key Match →
Beat Sync → Crossfade/Smart Transition → Mix → Effects/Automation →
Master Preview → Normalize → Export MP3/WAV → Save Project.

## 7. Responsive Behavior

Desktop-first. Minimum supported composition should remain usable at
approximately 1280px width. At narrower widths, secondary inspectors may
collapse into drawers; the timeline remains the dominant workspace.

## 8. State Requirements

Every major feature must have: default, hover, active, selected,
disabled, loading, success, warning, and error states where applicable.

## 9. Acceptance Criteria

-   All 29 approved feature areas are represented in the product UI.
-   No unapproved feature is introduced.
-   Timeline and waveform remain visually dominant.
-   UI uses the approved color system consistently.
-   HTML/CSS/JS only.
-   Interactions are modular and understandable.
-   Prototype must be runnable locally without a build system.
