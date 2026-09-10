/**
 * Suno Music Mixing Studio — Phase 3 Application Controller
 * Reference: docs/PRD.md & docs/UI-GUIDELINE.md
 * 
 * Stack: HTML5, CSS3, Vanilla JavaScript (Zero external dependencies)
 * Phase 3 Deliverables:
 * - Audio Analysis UI: BPM detection, confidence, editable override, sync readiness
 * - Key detection: Camelot notation, confidence, key override, harmonic matches
 * - Energy detection: visual energy score, SVG dynamic energy curve representation
 * - Loudness summary: integrated LUFS, true peak dBTP, LRA, streaming target match
 * - Waveform generation state: buffer status, simulated re-analysis pipeline
 * - Audio Analysis Deep Report Modal
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. LocalStorage Keys & Seed Data
  // --------------------------------------------------------------------------
  const STORAGE_KEYS = {
    PROJECTS: 'suno_studio_projects_v1',
    LIBRARY: 'suno_studio_library_v1',
    ACTIVE_PROJ: 'suno_studio_active_project_id_v1',
    PRESETS: 'suno_studio_mix_presets_v1'
  };

  const DEFAULT_PROJECTS = [
    {
      id: 'proj-1',
      name: 'Cyberpunk Odyssey (Suno v3.5)',
      bpm: 128,
      key: 'A min',
      sig: '4 / 4',
      duration: 225,
      trackCount: 3,
      updatedAt: Date.now() - 1000 * 60 * 2,
      tags: ['Synthwave', 'Vocals']
    },
    {
      id: 'proj-2',
      name: 'Midnight Tokyo Chillwave',
      bpm: 95,
      key: 'F min',
      sig: '4 / 4',
      duration: 190,
      trackCount: 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 3,
      tags: ['Lo-Fi', 'Chill']
    },
    {
      id: 'proj-3',
      name: 'Hyperpop Overdrive 2099',
      bpm: 155,
      key: 'C maj',
      sig: '4 / 4',
      duration: 165,
      trackCount: 4,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24,
      tags: ['Hyperpop', 'Glitch']
    }
  ];

  const DEFAULT_LIBRARY = [
    {
      id: 'lib-1',
      title: 'Cyberpunk_Vocals_Stems.mp3',
      category: 'vocals',
      categoryLabel: 'Vocals',
      model: 'Suno v3.5',
      duration: '01:42.50',
      durationSec: 102.5,
      bpm: 128,
      key: 'A min',
      energy: '84% (High)',
      energyVal: 84,
      status: 'analyzed',
      dateAdded: 'Today'
    },
    {
      id: 'lib-2',
      title: 'Neon_Bass_Arp_128bpm.wav',
      category: 'bass',
      categoryLabel: 'Bass',
      model: 'Suno v3.5',
      duration: '02:10.00',
      durationSec: 130,
      bpm: 128,
      key: 'A min',
      energy: '72% (Med)',
      energyVal: 72,
      status: 'analyzed',
      dateAdded: 'Today'
    },
    {
      id: 'lib-3',
      title: 'Cyber_Drum_Stems.wav',
      category: 'beats',
      categoryLabel: 'Beats',
      model: 'Suno v3.5',
      duration: '02:30.00',
      durationSec: 150,
      bpm: 128,
      key: 'A min',
      energy: '90% (High)',
      energyVal: 90,
      status: 'analyzed',
      dateAdded: 'Yesterday'
    },
    {
      id: 'lib-4',
      title: 'Ethereal_Synth_Pad_Am.mp3',
      category: 'synths',
      categoryLabel: 'Synths',
      model: 'Suno v3.5',
      duration: '01:55.20',
      durationSec: 115.2,
      bpm: 128,
      key: 'A min',
      energy: '58% (Med)',
      energyVal: 58,
      status: 'analyzed',
      dateAdded: '2 days ago'
    },
    {
      id: 'lib-5',
      title: 'Glitch_Drop_FX_Transition.wav',
      category: 'fx',
      categoryLabel: 'FX',
      model: 'Suno v3.5',
      duration: '00:28.40',
      durationSec: 28.4,
      bpm: 128,
      key: 'A min',
      energy: '95% (High)',
      energyVal: 95,
      status: 'analyzed',
      dateAdded: '3 days ago'
    },
    {
      id: 'lib-6',
      title: 'NeoTokyo_Guitar_Lead.mp3',
      category: 'synths',
      categoryLabel: 'Melody',
      model: 'Suno v3.5',
      duration: '02:40.10',
      durationSec: 160.1,
      bpm: 128,
      key: 'A min',
      energy: '82% (High)',
      energyVal: 82,
      status: 'analyzed',
      dateAdded: 'Last week'
    }
  ];

  // --------------------------------------------------------------------------
  // 2. Audio Analysis Knowledge Profiles (Phase 3 DSP State Simulator)
  // --------------------------------------------------------------------------
  const CAMELOT_MAP = {
    'A min': { code: '8A', name: 'A Minor', relative: 'C maj', dom: 'E min', sub: 'D min' },
    'C maj': { code: '8B', name: 'C Major', relative: 'A min', dom: 'G maj', sub: 'F maj' },
    'E min': { code: '9A', name: 'E Minor', relative: 'G maj', dom: 'B min', sub: 'A min' },
    'G maj': { code: '9B', name: 'G Major', relative: 'E min', dom: 'D maj', sub: 'C maj' },
    'D min': { code: '7A', name: 'D Minor', relative: 'F maj', dom: 'A min', sub: 'G min' },
    'F maj': { code: '7B', name: 'F Major', relative: 'D min', dom: 'C maj', sub: 'Bb maj' },
    'B min': { code: '10A', name: 'B Minor', relative: 'D maj', dom: 'F# min', sub: 'E min' },
    'F# min': { code: '11A', name: 'F# Minor', relative: 'A maj', dom: 'C# min', sub: 'B min' }
  };

  const ANALYSIS_PROFILES = {
    'clip-1': {
      title: 'Cyberpunk_Vocals_Stems.mp3',
      bpm: 128.0,
      bpmConf: 98.5,
      key: 'A min',
      camelot: '8A',
      keyConf: 94.0,
      energy: 84,
      energyDesc: '84% Peak',
      lufsIntegrated: -14.2,
      truePeak: -0.8,
      lra: 6.8,
      lufsMax: -11.5,
      syncReady: true,
      svgArea: 'M0,45 Q35,38 70,30 T140,8 T210,18 T280,38 L280,54 L0,54 Z',
      svgLine: 'M0,45 Q35,38 70,30 T140,8 T210,18 T280,38'
    },
    'clip-2': {
      title: 'Neon_Bass_Arp_128bpm.wav',
      bpm: 128.0,
      bpmConf: 99.1,
      key: 'A min',
      camelot: '8A',
      keyConf: 96.5,
      energy: 72,
      energyDesc: '72% Driving',
      lufsIntegrated: -13.8,
      truePeak: -1.2,
      lra: 5.4,
      lufsMax: -11.0,
      syncReady: true,
      svgArea: 'M0,35 Q35,28 70,25 T140,15 T210,20 T280,30 L280,54 L0,54 Z',
      svgLine: 'M0,35 Q35,28 70,25 T140,15 T210,20 T280,30'
    },
    'clip-3': {
      title: 'Cyber_Drum_Stems.wav',
      bpm: 128.0,
      bpmConf: 99.8,
      key: 'A min',
      camelot: '8A',
      keyConf: 92.0,
      energy: 90,
      energyDesc: '90% Aggressive',
      lufsIntegrated: -12.5,
      truePeak: -0.4,
      lra: 4.2,
      lufsMax: -9.5,
      syncReady: true,
      svgArea: 'M0,40 Q35,15 70,8 T140,5 T210,10 T280,25 L280,54 L0,54 Z',
      svgLine: 'M0,40 Q35,15 70,8 T140,5 T210,10 T280,25'
    },
    'clip-4': {
      title: 'FX_Drop_Stems.wav',
      bpm: 128.0,
      bpmConf: 94.0,
      key: 'A min',
      camelot: '8A',
      keyConf: 89.0,
      energy: 95,
      energyDesc: '95% Climax',
      lufsIntegrated: -11.0,
      truePeak: -0.2,
      lra: 8.2,
      lufsMax: -8.5,
      syncReady: true,
      svgArea: 'M0,50 Q35,48 70,40 T140,2 T210,35 T280,50 L280,54 L0,54 Z',
      svgLine: 'M0,50 Q35,48 70,40 T140,2 T210,35 T280,50'
    }
  };

  const AUTO_MIX_PRESETS = {
    radio_pop: {
      name: 'Radio Pop Balance',
      tracks: {
        1: { vol: 0.0, pan: 0, gainTrim: 0.0, eq: { low: -1.0, mid: 1.5, high: 2.0 }, comp: { enabled: true, thresh: -16, ratio: 3.5, gain: 2.0 }, reverb: { enabled: true, decay: 1.6, mix: 20 } },
        2: { vol: -2.0, pan: -15, gainTrim: 0.0, eq: { low: 2.0, mid: -1.0, high: -0.5 }, comp: { enabled: true, thresh: -14, ratio: 4.0, gain: 1.5 }, reverb: { enabled: false, decay: 1.0, mix: 10 } },
        3: { vol: -1.0, pan: 10, gainTrim: 0.5, eq: { low: 2.5, mid: -1.5, high: 1.5 }, comp: { enabled: true, thresh: -12, ratio: 4.0, gain: 2.5 }, reverb: { enabled: false, decay: 0.8, mix: 5 } },
        4: { vol: -3.5, pan: 35, gainTrim: 0.0, eq: { low: -2.0, mid: 0.5, high: 2.5 }, comp: { enabled: false, thresh: -18, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 2.8, mix: 35 } }
      },
      bars: { 1: { pct: '85%', val: '0.0 dB' }, 2: { pct: '72%', val: '-2.0 dB' }, 3: { pct: '78%', val: '-1.0 dB' }, 4: { pct: '58%', val: '-3.5 dB' } }
    },
    club_bass: {
      name: 'Club & Bass Heavy',
      tracks: {
        1: { vol: -1.0, pan: 0, gainTrim: 0.0, eq: { low: -2.0, mid: 1.0, high: 2.5 }, comp: { enabled: true, thresh: -18, ratio: 4.0, gain: 2.5 }, reverb: { enabled: true, decay: 1.2, mix: 15 } },
        2: { vol: 1.5, pan: 0, gainTrim: 1.0, eq: { low: 4.5, mid: 0.5, high: -2.0 }, comp: { enabled: true, thresh: -10, ratio: 5.0, gain: 3.0 }, reverb: { enabled: false, decay: 0.8, mix: 5 } },
        3: { vol: 0.5, pan: 0, gainTrim: 0.5, eq: { low: 3.5, mid: -2.0, high: 2.0 }, comp: { enabled: true, thresh: -10, ratio: 4.5, gain: 3.0 }, reverb: { enabled: false, decay: 0.6, mix: 5 } },
        4: { vol: -2.0, pan: 40, gainTrim: 0.0, eq: { low: -3.0, mid: 1.5, high: 3.0 }, comp: { enabled: true, thresh: -15, ratio: 2.5, gain: 1.0 }, reverb: { enabled: true, decay: 2.2, mix: 30 } }
      },
      bars: { 1: { pct: '75%', val: '-1.0 dB' }, 2: { pct: '95%', val: '+1.5 dB' }, 3: { pct: '88%', val: '+0.5 dB' }, 4: { pct: '65%', val: '-2.0 dB' } }
    },
    vocal_lead: {
      name: 'Vocal-Forward Suno',
      tracks: {
        1: { vol: 2.0, pan: 0, gainTrim: 1.0, eq: { low: 0.5, mid: 3.0, high: 2.5 }, comp: { enabled: true, thresh: -14, ratio: 3.0, gain: 3.0 }, reverb: { enabled: true, decay: 2.0, mix: 25 } },
        2: { vol: -3.5, pan: -25, gainTrim: -0.5, eq: { low: 1.5, mid: -2.5, high: -1.0 }, comp: { enabled: true, thresh: -16, ratio: 3.5, gain: 1.0 }, reverb: { enabled: false, decay: 1.0, mix: 10 } },
        3: { vol: -2.5, pan: 15, gainTrim: 0.0, eq: { low: 1.5, mid: -2.0, high: 1.0 }, comp: { enabled: true, thresh: -14, ratio: 3.5, gain: 1.5 }, reverb: { enabled: false, decay: 0.8, mix: 5 } },
        4: { vol: -4.0, pan: 45, gainTrim: -1.0, eq: { low: -4.0, mid: 0.0, high: 2.0 }, comp: { enabled: false, thresh: -20, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 3.0, mix: 40 } }
      },
      bars: { 1: { pct: '98%', val: '+2.0 dB' }, 2: { pct: '60%', val: '-3.5 dB' }, 3: { pct: '68%', val: '-2.5 dB' }, 4: { pct: '52%', val: '-4.0 dB' } }
    },
    ambient_chill: {
      name: 'Ambient Chillout',
      tracks: {
        1: { vol: -0.5, pan: 0, gainTrim: 0.0, eq: { low: -1.0, mid: 0.5, high: -1.0 }, comp: { enabled: true, thresh: -20, ratio: 2.5, gain: 1.0 }, reverb: { enabled: true, decay: 3.5, mix: 45 } },
        2: { vol: -1.5, pan: -30, gainTrim: 0.0, eq: { low: 2.0, mid: 1.0, high: -1.5 }, comp: { enabled: false, thresh: -18, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 2.8, mix: 35 } },
        3: { vol: -3.0, pan: 20, gainTrim: -0.5, eq: { low: 0.5, mid: -1.0, high: -0.5 }, comp: { enabled: true, thresh: -16, ratio: 2.5, gain: 1.0 }, reverb: { enabled: true, decay: 2.0, mix: 25 } },
        4: { vol: -1.0, pan: 50, gainTrim: 0.0, eq: { low: -2.0, mid: 1.0, high: 1.5 }, comp: { enabled: false, thresh: -20, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 4.5, mix: 55 } }
      },
      bars: { 1: { pct: '78%', val: '-0.5 dB' }, 2: { pct: '74%', val: '-1.5 dB' }, 3: { pct: '62%', val: '-3.0 dB' }, 4: { pct: '76%', val: '-1.0 dB' } }
    }
  };

  function getCamelotRelationship(clipKey, projectKey) {
    const pKey = projectKey || (state.activeProject ? state.activeProject.key : 'A min');
    const cKey = clipKey || 'A min';

    const cInfo = CAMELOT_MAP[cKey] || { code: '8A' };
    const pInfo = CAMELOT_MAP[pKey] || { code: '8A' };

    if (cInfo.code === pInfo.code) {
      return {
        match: true,
        badgeText: `${cInfo.code} ⇄ ${pInfo.code} Perfect Match`,
        badgeClass: 'status-analyzed-pill',
        transpose: 'None required (Harmonically Locked)',
        semitones: 0
      };
    }

    const cNum = parseInt(cInfo.code, 10);
    const cLetter = cInfo.code.slice(-1);
    const pNum = parseInt(pInfo.code, 10);
    const pLetter = pInfo.code.slice(-1);

    if (cNum === pNum && cLetter !== pLetter) {
      return {
        match: true,
        badgeText: `${cInfo.code} ⇄ ${pInfo.code} Relative Key`,
        badgeClass: 'status-analyzed-pill',
        transpose: 'Compatible (No Transpose Needed)',
        semitones: 0
      };
    }

    const numDiff = Math.abs(cNum - pNum);
    if (numDiff === 1 || numDiff === 11) {
      const shiftDir = (cNum < pNum || (cNum === 12 && pNum === 1)) ? '+2' : '-2';
      return {
        match: true,
        badgeText: `${cInfo.code} ⇄ ${pInfo.code} Adjacent Key`,
        badgeClass: 'status-analyzed-pill',
        transpose: `Shift: ${shiftDir} semitones to match ${pKey}`,
        semitones: shiftDir === '+2' ? 2 : -2
      };
    }

    return {
      match: false,
      badgeText: `${cInfo.code} ⇄ ${pInfo.code} Harmonic Clash`,
      badgeClass: 'badge-clash',
      transpose: `Recommend transpose to ${pKey}`,
      semitones: 2
    };
  }

  // --------------------------------------------------------------------------
  // 3. Studio State
  // --------------------------------------------------------------------------
  const state = {
    language: (typeof localStorage !== 'undefined' && localStorage.getItem('suno_studio_lang')) ? localStorage.getItem('suno_studio_lang') : 'id',
    currentView: 'studio',
    activeProjectId: 'proj-1',
    activeProject: null,
    isPlaying: false,
    currentTime: 24.8,
    totalDuration: 225.0,
    timelineWidthPx: 2400,
    pxPerSecond: 2400 / 225.0,
    zoomLevel: 100,
    activeTool: 'select',
    snapSetting: 'quarter_beat',
    isLooping: false,
    selectedTrackId: 'track-1',
    selectedClipId: 'clip-1',
    activeAnalysisProfile: ANALYSIS_PROFILES['clip-1'],
    inspectorCollapsed: false,
    activeInspectorTab: 'clip',
    lastAutosaveTime: Date.now(),
    libraryFilter: 'all',
    librarySearch: '',
    projectSearch: '',
    pendingUploadItem: null,
    pendingDeleteProjId: null,
    pendingRenameProjId: null,
    isReanalyzing: false,
    tracks: {
      1: {
        name: '01 • Lead Vocals',
        color: 'cyan',
        mute: false,
        solo: false,
        vol: 0.0,
        gainTrim: 0.0,
        pan: 0,
        eq: { low: 1.5, mid: -0.5, high: 2.0 },
        fx: {
          comp: { enabled: true, thresh: -18, ratio: 3.5, gain: 2.0 },
          reverb: { enabled: true, decay: 1.8, mix: 25 },
          delay: { enabled: false, time: '1/8', feedback: 30, mix: 20 }
        },
        automation: {
          param: 'vol',
          mode: 'read',
          points: [{ t: 0, v: 0 }, { t: 30, v: 2 }, { t: 60, v: -2 }, { t: 90, v: 0 }]
        }
      },
      2: {
        name: '02 • Synth & Bass',
        color: 'purple',
        mute: false,
        solo: false,
        vol: -2.0,
        gainTrim: 0.0,
        pan: -15,
        eq: { low: 2.0, mid: 1.0, high: -1.0 },
        fx: {
          comp: { enabled: true, thresh: -14, ratio: 4.0, gain: 1.5 },
          reverb: { enabled: false, decay: 1.2, mix: 15 },
          delay: { enabled: false, time: '1/8', feedback: 25, mix: 15 }
        },
        automation: {
          param: 'vol',
          mode: 'read',
          points: [{ t: 0, v: 0 }, { t: 40, v: 1.5 }, { t: 80, v: 0 }]
        }
      },
      3: {
        name: '03 • Cyber Drums',
        color: 'emerald',
        mute: false,
        solo: false,
        vol: -1.0,
        gainTrim: 0.5,
        pan: 10,
        eq: { low: 3.0, mid: -2.0, high: 1.5 },
        fx: {
          comp: { enabled: true, thresh: -12, ratio: 4.5, gain: 3.0 },
          reverb: { enabled: false, decay: 0.8, mix: 10 },
          delay: { enabled: false, time: '1/16', feedback: 20, mix: 10 }
        },
        automation: {
          param: 'vol',
          mode: 'read',
          points: [{ t: 0, v: 0 }, { t: 50, v: 0 }]
        }
      },
      4: {
        name: '04 • FX & Drops',
        color: 'amber',
        mute: false,
        solo: false,
        vol: 0.0,
        gainTrim: 0.0,
        pan: 0,
        eq: { low: 0.0, mid: 0.0, high: 0.0 },
        fx: {
          comp: { enabled: false, thresh: -20, ratio: 2.0, gain: 0.0 },
          reverb: { enabled: true, decay: 2.5, mix: 40 },
          delay: { enabled: true, time: '1/4', feedback: 40, mix: 35 }
        },
        automation: {
          param: 'vol',
          mode: 'read',
          points: [{ t: 0, v: 0 }]
        }
      }
    },
    mixer: {
      consoleOpen: false,
      selectedTrackId: 1,
      master: {
        vol: 0.0,
        limiter: true,
        mono: false,
        clipping: false
      }
    },
    ai: {
      autoMixApplied: false,
      activePreset: 'radio_pop',
      previousMixSnapshot: null,
      activeTransitionStyle: 'energy',
      transitionDuration: 1.88
    },
    masterPreviewActive: false,
    export: {
      format: 'wav',
      sampleRate: 44100,
      bitDepth: 24,
      normalize: true,
      isExporting: false,
      blobUrl: null,
      downloadFilename: ''
    },
    presets: [],
    history: {
      past: [],
      future: [],
      maxHistory: 30
    },
    clips: [
      {
        id: 'clip-1',
        trackId: 1,
        title: 'Cyberpunk_Vocals_Stems.mp3',
        startSec: 4.0,
        durationSec: 58.0,
        fadeInSec: 0.5,
        fadeOutSec: 1.2,
        color: 'cyan',
        bpm: 128,
        key: 'A min',
        energy: '84% (High)',
        waveformSeed: 1
      },
      {
        id: 'clip-2',
        trackId: 2,
        title: 'Neon_Bass_Arp_128bpm.wav',
        startSec: 0.0,
        durationSec: 73.0,
        fadeInSec: 0.0,
        fadeOutSec: 2.0,
        color: 'purple',
        bpm: 128,
        key: 'A min',
        energy: '72% (Driving)',
        waveformSeed: 2
      },
      {
        id: 'clip-3',
        trackId: 3,
        title: 'Cyber_Drum_Stems.wav',
        startSec: 0.0,
        durationSec: 78.5,
        fadeInSec: 0.0,
        fadeOutSec: 1.0,
        color: 'emerald',
        bpm: 128,
        key: 'A min',
        energy: '90% (Aggressive)',
        waveformSeed: 3
      }
    ]
  };

  let animationFrameId = null;
  let lastTimestamp = 0;
  let meterAnimTimer = null;
  let autosaveTimer = null;

  // --------------------------------------------------------------------------
  // 4. DOM Elements Cache
  // --------------------------------------------------------------------------
  const elements = {
    // Views
    viewStudio: document.getElementById('viewStudio'),
    viewDashboard: document.getElementById('viewDashboard'),
    viewLibrary: document.getElementById('viewLibrary'),
    inspectorPanel: document.getElementById('inspectorPanel'),
    transportBar: document.getElementById('transportBar'),

    // Top Bar Identifiers
    projectTitle: document.getElementById('projectTitle'),
    autosaveIndicator: document.getElementById('autosaveIndicator'),
    quickDuration: document.getElementById('quickDuration'),
    quickBpm: document.getElementById('quickBpm'),
    quickKey: document.getElementById('quickKey'),
    btnMasterPreview: document.getElementById('btnMasterPreview'),
    btnExport: document.getElementById('btnExport'),
    btnUndo: document.getElementById('btnUndo'),
    btnRedo: document.getElementById('btnRedo'),
    btnLangToggle: document.getElementById('btnLangToggle'),
    langFlag: document.getElementById('langFlag'),
    langText: document.getElementById('langText'),

    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    navDashboard: document.getElementById('navDashboard'),
    navLibrary: document.getElementById('navLibrary'),
    navStudio: document.getElementById('navStudio'),

    // Timeline & Transport
    globalPlayhead: document.getElementById('globalPlayhead'),
    playheadHead: document.getElementById('playheadHead'),
    rulerContainer: document.getElementById('rulerContainer'),
    rulerTicks: document.getElementById('rulerTicks'),
    timelineViewport: document.getElementById('timelineViewport'),
    tracksContainer: document.getElementById('tracksContainer'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    playIcon: document.getElementById('playIcon'),
    btnStop: document.getElementById('btnStop'),
    btnReturnZero: document.getElementById('btnReturnZero'),
    btnRewind: document.getElementById('btnRewind'),
    btnFastForward: document.getElementById('btnFastForward'),
    btnLoop: document.getElementById('btnLoop'),
    timecodeCurrent: document.getElementById('timecodeCurrent'),
    timecodeTotal: document.getElementById('timecodeTotal'),
    tempoBpmValue: document.getElementById('tempoBpmValue'),
    tempoSigValue: document.getElementById('tempoSigValue'),
    tempoKeyValue: document.getElementById('tempoKeyValue'),

    // Meters & Master Fader
    meterL: document.getElementById('meterL'),
    meterR: document.getElementById('meterR'),
    masterVolumeSlider: document.getElementById('masterVolumeSlider'),
    masterDbReadout: document.getElementById('masterDbReadout'),

    // Tools & Zoom & Snap (Phase 4)
    toolBtns: document.querySelectorAll('.tool-btn'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomFit: document.getElementById('btnZoomFit'),
    zoomLevelText: document.getElementById('zoomLevelText'),
    snapSelect: document.getElementById('snapSelect'),

    // Phase 5 Mixer Console & Channel Strip Elements
    btnToggleMixerDock: document.getElementById('btnToggleMixerDock'),
    btnToggleMixerConsole: document.getElementById('btnToggleMixerConsole'),
    btnCloseMixerConsole: document.getElementById('btnCloseMixerConsole'),
    mixerConsoleDrawer: document.getElementById('mixerConsoleDrawer'),
    mixerStripsContainer: document.getElementById('mixerStripsContainer'),
    btnMasterMonoToggle: document.getElementById('btnMasterMonoToggle'),

    // Inspector Mixer Channel Header
    cardMixerTrackHeader: document.getElementById('cardMixerTrackHeader'),
    mixerTrackColorDot: document.getElementById('mixerTrackColorDot'),
    mixerTrackNameHeading: document.getElementById('mixerTrackNameHeading'),
    mixerTrackSelector: document.getElementById('mixerTrackSelector'),
    inputMixerGainTrim: document.getElementById('inputMixerGainTrim'),
    mixerGainTrimVal: document.getElementById('mixerGainTrimVal'),
    inputMixerPan: document.getElementById('inputMixerPan'),
    mixerPanVal: document.getElementById('mixerPanVal'),
    btnMixerMute: document.getElementById('btnMixerMute'),
    btnMixerSolo: document.getElementById('btnMixerSolo'),

    // Inspector Parametric EQ
    cardMixerEq: document.getElementById('cardMixerEq'),
    btnResetEq: document.getElementById('btnResetEq'),
    eqCurveSvg: document.getElementById('eqCurveSvg'),
    eqCurveLine: document.getElementById('eqCurveLine'),
    eqCurveArea: document.getElementById('eqCurveArea'),
    eqLowDot: document.getElementById('eqLowDot'),
    eqMidDot: document.getElementById('eqMidDot'),
    eqHighDot: document.getElementById('eqHighDot'),
    sliderEqLow: document.getElementById('sliderEqLow'),
    eqLowGainVal: document.getElementById('eqLowGainVal'),
    sliderEqMid: document.getElementById('sliderEqMid'),
    eqMidGainVal: document.getElementById('eqMidGainVal'),
    sliderEqHigh: document.getElementById('sliderEqHigh'),
    eqHighGainVal: document.getElementById('eqHighGainVal'),

    // Inspector Effects Rack
    cardMixerFxRack: document.getElementById('cardMixerFxRack'),
    fxActiveCountBadge: document.getElementById('fxActiveCountBadge'),
    fxSlotComp: document.getElementById('fxSlotComp'),
    btnToggleComp: document.getElementById('btnToggleComp'),
    compThresh: document.getElementById('compThresh'),
    compThreshVal: document.getElementById('compThreshVal'),
    compRatio: document.getElementById('compRatio'),
    compRatioVal: document.getElementById('compRatioVal'),
    compGain: document.getElementById('compGain'),
    compGainVal: document.getElementById('compGainVal'),

    fxSlotReverb: document.getElementById('fxSlotReverb'),
    btnToggleReverb: document.getElementById('btnToggleReverb'),
    revDecay: document.getElementById('revDecay'),
    revDecayVal: document.getElementById('revDecayVal'),
    revMix: document.getElementById('revMix'),
    revMixVal: document.getElementById('revMixVal'),

    fxSlotDelay: document.getElementById('fxSlotDelay'),
    btnToggleDelay: document.getElementById('btnToggleDelay'),
    delayTimeSelect: document.getElementById('delayTimeSelect'),
    delayTimeVal: document.getElementById('delayTimeVal'),
    delayFeedback: document.getElementById('delayFeedback'),
    delayFeedbackVal: document.getElementById('delayFeedbackVal'),
    delayMix: document.getElementById('delayMix'),
    delayMixVal: document.getElementById('delayMixVal'),

    // Inspector Automation
    cardMixerAutomation: document.getElementById('cardMixerAutomation'),
    autoModePills: document.getElementById('autoModePills'),
    autoParamSelect: document.getElementById('autoParamSelect'),
    autoCurveWrap: document.getElementById('autoCurveWrap'),
    autoCurveSvg: document.getElementById('autoCurveSvg'),
    autoCurvePath: document.getElementById('autoCurvePath'),
    btnClearAutomation: document.getElementById('btnClearAutomation'),
    autoPointCountLabel: document.getElementById('autoPointCountLabel'),

    // Inspector Elements & Audio Analysis (Phase 3 & 4)
    btnToggleInspector: document.getElementById('btnToggleInspector'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: {
      clip: document.getElementById('paneClip'),
      mixer: document.getElementById('paneMixer'),
      ai: document.getElementById('paneAi')
    },
    cardClipParams: document.getElementById('cardClipParams'),
    inspectorClipName: document.getElementById('inspectorClipName'),
    inspectorClipTrackBadge: document.getElementById('inspectorClipTrackBadge'),
    inspectorClipNameInput: document.getElementById('inspectorClipNameInput'),
    inspectorStartOffset: document.getElementById('inspectorStartOffset'),
    inspectorDuration: document.getElementById('inspectorDuration'),
    inspectorFadeIn: document.getElementById('inspectorFadeIn'),
    inspectorFadeOut: document.getElementById('inspectorFadeOut'),
    btnSplitAtPlayhead: document.getElementById('btnSplitAtPlayhead'),
    btnDuplicateClip: document.getElementById('btnDuplicateClip'),
    btnDeleteClip: document.getElementById('btnDeleteClip'),

    // Phase 3 Audio Analysis Controls
    btnReanalyzeTrack: document.getElementById('btnReanalyzeTrack'),
    reanalyzeProgressBox: document.getElementById('reanalyzeProgressBox'),
    reanalyzeStepText: document.getElementById('reanalyzeStepText'),
    reanalyzePercent: document.getElementById('reanalyzePercent'),
    reanalyzeProgressFill: document.getElementById('reanalyzeProgressFill'),
    btnOpenAnalysisModal: document.getElementById('btnOpenAnalysisModal'),
    syncReadyBadge: document.getElementById('syncReadyBadge'),
    analysisBpmReadout: document.getElementById('analysisBpmReadout'),
    bpmConfidenceText: document.getElementById('bpmConfidenceText'),
    bpmConfidenceFill: document.getElementById('bpmConfidenceFill'),
    inputBpmOverride: document.getElementById('inputBpmOverride'),
    btnBpmHalf: document.getElementById('btnBpmHalf'),
    btnBpmDouble: document.getElementById('btnBpmDouble'),
    btnApplyBpmOverride: document.getElementById('btnApplyBpmOverride'),

    analysisKeyReadout: document.getElementById('analysisKeyReadout'),
    analysisCamelotBadge: document.getElementById('analysisCamelotBadge'),
    keyConfidenceText: document.getElementById('keyConfidenceText'),
    keyConfidenceFill: document.getElementById('keyConfidenceFill'),
    selectKeyOverride: document.getElementById('selectKeyOverride'),
    harmonicMatchesWrap: document.getElementById('harmonicMatchesWrap'),

    energyScoreBadge: document.getElementById('energyScoreBadge'),
    energyPathArea: document.getElementById('energyPathArea'),
    energyPathLine: document.getElementById('energyPathLine'),

    lufsIntegratedVal: document.getElementById('lufsIntegratedVal'),
    truePeakVal: document.getElementById('truePeakVal'),
    lraVal: document.getElementById('lraVal'),
    lufsMaxVal: document.getElementById('lufsMaxVal'),

    // Phase 3 Analysis Modal Elements
    audioAnalysisModal: document.getElementById('audioAnalysisModal'),
    btnCloseAnalysisModal: document.getElementById('btnCloseAnalysisModal'),
    btnDismissAnalysisModal: document.getElementById('btnDismissAnalysisModal'),
    reportTrackTitle: document.getElementById('reportTrackTitle'),
    btnReportTabOverview: document.getElementById('btnReportTabOverview'),
    btnReportTabCamelot: document.getElementById('btnReportTabCamelot'),
    btnReportTabArrangement: document.getElementById('btnReportTabArrangement'),
    paneReportOverview: document.getElementById('paneReportOverview'),
    paneReportCamelot: document.getElementById('paneReportCamelot'),
    paneReportArrangement: document.getElementById('paneReportArrangement'),
    reportLufsIntegrated: document.getElementById('reportLufsIntegrated'),
    reportTruePeak: document.getElementById('reportTruePeak'),
    reportLra: document.getElementById('reportLra'),
    reportShortTerm: document.getElementById('reportShortTerm'),
    reportMomentary: document.getElementById('reportMomentary'),
    reportKeyName: document.getElementById('reportKeyName'),
    reportCamelotCode: document.getElementById('reportCamelotCode'),
    camelotTilesGrid: document.getElementById('camelotTilesGrid'),

    // Dashboard View Elements
    projectSearchInput: document.getElementById('projectSearchInput'),
    btnOpenNewProjectModal: document.getElementById('btnOpenNewProjectModal'),
    projectsGridContainer: document.getElementById('projectsGridContainer'),
    statProjectCount: document.getElementById('statProjectCount'),
    statLibraryCount: document.getElementById('statLibraryCount'),

    // Library View Elements
    libraryFilterGroup: document.getElementById('libraryFilterGroup'),
    librarySearchInput: document.getElementById('librarySearchInput'),
    libraryTableBody: document.getElementById('libraryTableBody'),
    btnOpenUploadModal: document.getElementById('btnOpenUploadModal'),

    // Modals
    shortcutsModal: document.getElementById('shortcutsModal'),
    btnOpenShortcuts: document.getElementById('btnOpenShortcuts'),
    btnCloseShortcuts: document.getElementById('btnCloseShortcuts'),

    // New Project Modal
    newProjectModal: document.getElementById('newProjectModal'),
    newProjectForm: document.getElementById('newProjectForm'),
    inputProjectName: document.getElementById('inputProjectName'),
    inputProjectBpm: document.getElementById('inputProjectBpm'),
    selectProjectKey: document.getElementById('selectProjectKey'),
    selectProjectSig: document.getElementById('selectProjectSig'),
    btnCancelNewProject: document.getElementById('btnCancelNewProject'),
    btnCloseNewProjectModal: document.getElementById('btnCloseNewProjectModal'),

    // Upload Modal
    uploadModal: document.getElementById('uploadModal'),
    uploadDropzone: document.getElementById('uploadDropzone'),
    audioFileInput: document.getElementById('audioFileInput'),
    btnBrowseFile: document.getElementById('btnBrowseFile'),
    uploadProgressBox: document.getElementById('uploadProgressBox'),
    uploadStatusText: document.getElementById('uploadStatusText'),
    uploadPercentText: document.getElementById('uploadPercentText'),
    uploadProgressFill: document.getElementById('uploadProgressFill'),
    uploadMetaPreview: document.getElementById('uploadMetaPreview'),
    previewSongTitle: document.getElementById('previewSongTitle'),
    previewBpm: document.getElementById('previewBpm'),
    previewKey: document.getElementById('previewKey'),
    previewDuration: document.getElementById('previewDuration'),
    previewEnergy: document.getElementById('previewEnergy'),
    btnCancelUpload: document.getElementById('btnCancelUpload'),
    btnCloseUploadModal: document.getElementById('btnCloseUploadModal'),
    btnConfirmAddToLibrary: document.getElementById('btnConfirmAddToLibrary'),

    // Rename Modal
    renameModal: document.getElementById('renameModal'),
    renameProjectForm: document.getElementById('renameProjectForm'),
    inputRenameProject: document.getElementById('inputRenameProject'),
    btnCancelRename: document.getElementById('btnCancelRename'),
    btnCloseRenameModal: document.getElementById('btnCloseRenameModal'),

    // Delete Modal
    deleteProjectModal: document.getElementById('deleteProjectModal'),
    deleteProjectTargetName: document.getElementById('deleteProjectTargetName'),
    btnCancelDelete: document.getElementById('btnCancelDelete'),
    btnCloseDeleteModal: document.getElementById('btnCloseDeleteModal'),
    btnConfirmDeleteProject: document.getElementById('btnConfirmDeleteProject'),

    // General
    toastContainer: document.getElementById('toastContainer'),
    btnAddTrack: document.getElementById('btnAddTrack'),
    emptyTrackDropzone: document.getElementById('emptyTrackDropzone'),

    // Phase 6 Intelligent Mixing & AI Tools
    btnQuickAutoMix: document.getElementById('btnQuickAutoMix'),
    cardAiSync: document.getElementById('cardAiSync'),
    aiClipBpmVal: document.getElementById('aiClipBpmVal'),
    aiProjectBpmVal: document.getElementById('aiProjectBpmVal'),
    aiStretchFactor: document.getElementById('aiStretchFactor'),
    btnMatchBpm: document.getElementById('btnMatchBpm'),
    aiCamelotBadge: document.getElementById('aiCamelotBadge'),
    aiCamelotText: document.getElementById('aiCamelotText'),
    aiTransposeSuggestion: document.getElementById('aiTransposeSuggestion'),
    btnHarmonizeKey: document.getElementById('btnHarmonizeKey'),
    aiDownbeatOffset: document.getElementById('aiDownbeatOffset'),
    btnSnapBeatGrid: document.getElementById('btnSnapBeatGrid'),
    cardAiTransitions: document.getElementById('cardAiTransitions'),
    aiTransitionContext: document.getElementById('aiTransitionContext'),
    aiTransitionStyles: document.getElementById('aiTransitionStyles'),
    aiTransitionDurationSelect: document.getElementById('aiTransitionDurationSelect'),
    btnApplySmartTransition: document.getElementById('btnApplySmartTransition'),
    cardAiCleanNormalize: document.getElementById('cardAiCleanNormalize'),
    aiSilenceDetectedText: document.getElementById('aiSilenceDetectedText'),
    btnAutoTrimSilence: document.getElementById('btnAutoTrimSilence'),
    aiCurrentLufsVal: document.getElementById('aiCurrentLufsVal'),
    aiTargetLufsSelect: document.getElementById('aiTargetLufsSelect'),
    aiLoudnessDeltaVal: document.getElementById('aiLoudnessDeltaVal'),
    btnNormalizeLoudness: document.getElementById('btnNormalizeLoudness'),
    cardAiAutoMixLauncher: document.getElementById('cardAiAutoMixLauncher'),
    aiAutoMixStatusBadge: document.getElementById('aiAutoMixStatusBadge'),
    aiAutoMixStatusText: document.getElementById('aiAutoMixStatusText'),
    btnOpenAutoMixModal: document.getElementById('btnOpenAutoMixModal'),
    btnRevertAutoMix: document.getElementById('btnRevertAutoMix'),

    // Auto Mix Modal Elements
    autoMixModal: document.getElementById('autoMixModal'),
    btnCloseAutoMixModal: document.getElementById('btnCloseAutoMixModal'),
    btnCancelAutoMix: document.getElementById('btnCancelAutoMix'),
    btnPreviewAutoMix: document.getElementById('btnPreviewAutoMix'),
    btnConfirmAutoMix: document.getElementById('btnConfirmAutoMix'),
    autoMixPresetsGrid: document.getElementById('autoMixPresetsGrid'),
    previewBar1: document.getElementById('previewBar1'),
    previewVal1: document.getElementById('previewVal1'),
    previewBar2: document.getElementById('previewBar2'),
    previewVal2: document.getElementById('previewVal2'),
    previewBar3: document.getElementById('previewBar3'),
    previewVal3: document.getElementById('previewVal3'),
    previewBar4: document.getElementById('previewBar4'),
    previewVal4: document.getElementById('previewVal4'),
    chkAutoEq: document.getElementById('chkAutoEq'),
    chkAutoDynamics: document.getElementById('chkAutoDynamics'),
    chkAutoStereo: document.getElementById('chkAutoStereo'),

    // Phase 7 Master Preview HUD Elements
    masterPreviewHud: document.getElementById('masterPreviewHud'),
    hudLufs: document.getElementById('hudLufs'),
    hudTruePeak: document.getElementById('hudTruePeak'),
    hudLimiterGr: document.getElementById('hudLimiterGr'),
    btnExitMasterPreview: document.getElementById('btnExitMasterPreview'),

    // Phase 7 Export Master Mix Elements
    exportModal: document.getElementById('exportModal'),
    btnCloseExportModal: document.getElementById('btnCloseExportModal'),
    btnCancelExport: document.getElementById('btnCancelExport'),
    btnStartExport: document.getElementById('btnStartExport'),
    exportConfigSection: document.getElementById('exportConfigSection'),
    exportFormatGroup: document.getElementById('exportFormatGroup'),
    formatWavCard: document.getElementById('formatWavCard'),
    formatMp3Card: document.getElementById('formatMp3Card'),
    exportSampleRate: document.getElementById('exportSampleRate'),
    exportBitDepth: document.getElementById('exportBitDepth'),
    chkExportNormalize: document.getElementById('chkExportNormalize'),
    inputExportTitle: document.getElementById('inputExportTitle'),
    inputExportArtist: document.getElementById('inputExportArtist'),
    inputExportAlbum: document.getElementById('inputExportAlbum'),
    exportProgressSection: document.getElementById('exportProgressSection'),
    exportStageText: document.getElementById('exportStageText'),
    exportProgressPct: document.getElementById('exportProgressPct'),
    exportProgressBar: document.getElementById('exportProgressBar'),
    nodeStage1: document.getElementById('nodeStage1'),
    nodeStage2: document.getElementById('nodeStage2'),
    nodeStage3: document.getElementById('nodeStage3'),
    nodeStage4: document.getElementById('nodeStage4'),
    exportCompleteSection: document.getElementById('exportCompleteSection'),
    completeFilename: document.getElementById('completeFilename'),
    completeFileMeta: document.getElementById('completeFileMeta'),
    btnDownloadMix: document.getElementById('btnDownloadMix'),
    btnCopyMixLink: document.getElementById('btnCopyMixLink'),
    exportModalFooter: document.getElementById('exportModalFooter'),

    // Phase 7 Mix Presets Manager Elements
    presetsModal: document.getElementById('presetsModal'),
    btnClosePresetsModal: document.getElementById('btnClosePresetsModal'),
    btnDismissPresetsModal: document.getElementById('btnDismissPresetsModal'),
    inputPresetName: document.getElementById('inputPresetName'),
    inputPresetDesc: document.getElementById('inputPresetDesc'),
    btnSaveCurrentPreset: document.getElementById('btnSaveCurrentPreset'),
    presetsListContainer: document.getElementById('presetsListContainer'),
    navPresets: document.getElementById('navPresets'),

    // Phase 8 Shortcuts & Presets Elements
    shortcutSearchInput: document.getElementById('shortcutSearchInput'),
    shortcutsListWrap: document.getElementById('shortcutsListWrap'),
    noShortcutsFound: document.getElementById('noShortcutsFound'),
    btnDismissShortcuts: document.getElementById('btnDismissShortcuts'),
    btnExportPresetsJson: document.getElementById('btnExportPresetsJson'),
    btnImportPresetsJson: document.getElementById('btnImportPresetsJson'),
    inputImportPresets: document.getElementById('inputImportPresets'),
    mixerQuickPresetSelect: document.getElementById('mixerQuickPresetSelect')
  };

  // --------------------------------------------------------------------------
  // 5. Persistence Store Helpers
  // --------------------------------------------------------------------------
  function getStoredProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not read projects from localStorage', e);
    }
    saveProjects(DEFAULT_PROJECTS);
    return DEFAULT_PROJECTS;
  }

  function saveProjects(projects) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not save projects to localStorage', e);
    }
  }

  function getStoredLibrary() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIBRARY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not read library from localStorage', e);
    }
    saveLibrary(DEFAULT_LIBRARY);
    return DEFAULT_LIBRARY;
  }

  function saveLibrary(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save library to localStorage', e);
    }
  }

  function getStoredActiveProjId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJ) || 'proj-1';
  }

  function setStoredActiveProjId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJ, id);
    state.activeProjectId = id;
  }

  // --------------------------------------------------------------------------
  // 6. Time & Format Utilities
  // --------------------------------------------------------------------------
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    const cc = String(ms).padStart(2, '0');

    return `${mm}:${ss}.${cc}`;
  }

  function formatRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 30) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --------------------------------------------------------------------------
  // 7. Phase 3: Audio Analysis UI Engine & DSP State Simulation
  // --------------------------------------------------------------------------
  function initAudioAnalysisModule() {
    // Initial Render of active profile
    updateAnalysisUI(state.activeAnalysisProfile);

    // BPM Modifiers: Half-time (/2) and Double-time (x2)
    if (elements.btnBpmHalf) {
      elements.btnBpmHalf.addEventListener('click', () => {
        const current = state.activeAnalysisProfile.bpm;
        const newBpm = Math.round((current / 2) * 10) / 10;
        applyBpmChange(newBpm, 'Half-Time (/2)');
      });
    }

    if (elements.btnBpmDouble) {
      elements.btnBpmDouble.addEventListener('click', () => {
        const current = state.activeAnalysisProfile.bpm;
        const newBpm = Math.round((current * 2) * 10) / 10;
        applyBpmChange(newBpm, 'Double-Time (x2)');
      });
    }

    if (elements.btnApplyBpmOverride) {
      elements.btnApplyBpmOverride.addEventListener('click', () => {
        const val = parseFloat(elements.inputBpmOverride.value);
        if (val && val >= 40 && val <= 240) {
          applyBpmChange(val, 'Manual Override');
        }
      });
    }

    // Key Override Dropdown
    if (elements.selectKeyOverride) {
      elements.selectKeyOverride.addEventListener('change', (e) => {
        const newKey = e.target.value;
        applyKeyChange(newKey);
      });
    }

    // Re-Analyze Action Button
    if (elements.btnReanalyzeTrack) {
      elements.btnReanalyzeTrack.addEventListener('click', () => {
        triggerReanalyzeProcess();
      });
    }

    // Analysis Modal Triggers
    if (elements.btnOpenAnalysisModal) {
      elements.btnOpenAnalysisModal.addEventListener('click', openAnalysisDeepReportModal);
    }
    if (elements.btnCloseAnalysisModal) {
      elements.btnCloseAnalysisModal.addEventListener('click', () => closeModal(elements.audioAnalysisModal));
    }
    if (elements.btnDismissAnalysisModal) {
      elements.btnDismissAnalysisModal.addEventListener('click', () => closeModal(elements.audioAnalysisModal));
    }

    // Modal Report Tab Switching
    if (elements.btnReportTabOverview) {
      elements.btnReportTabOverview.addEventListener('click', () => switchReportTab('overview'));
    }
    if (elements.btnReportTabCamelot) {
      elements.btnReportTabCamelot.addEventListener('click', () => switchReportTab('camelot'));
    }
    if (elements.btnReportTabArrangement) {
      elements.btnReportTabArrangement.addEventListener('click', () => switchReportTab('arrangement'));
    }
  }

  function updateAnalysisUI(profile) {
    if (!profile) return;
    state.activeAnalysisProfile = profile;

    // BPM Card
    if (elements.analysisBpmReadout) elements.analysisBpmReadout.textContent = Number(profile.bpm).toFixed(1);
    if (elements.bpmConfidenceText) elements.bpmConfidenceText.textContent = `${profile.bpmConf}% Conf.`;
    if (elements.bpmConfidenceFill) elements.bpmConfidenceFill.style.width = `${profile.bpmConf}%`;
    if (elements.inputBpmOverride) elements.inputBpmOverride.value = profile.bpm;

    // Key Card
    if (elements.analysisKeyReadout) elements.analysisKeyReadout.textContent = profile.key;
    if (elements.analysisCamelotBadge) elements.analysisCamelotBadge.textContent = `${profile.camelot} (${profile.key})`;
    if (elements.keyConfidenceText) elements.keyConfidenceText.textContent = `${profile.keyConf}% Conf.`;
    if (elements.keyConfidenceFill) elements.keyConfidenceFill.style.width = `${profile.keyConf}%`;
    if (elements.selectKeyOverride) elements.selectKeyOverride.value = profile.key;

    // Harmonic Matches
    renderHarmonicMatches(profile.key);

    // Energy Curve
    if (elements.energyScoreBadge) elements.energyScoreBadge.textContent = profile.energyDesc;
    if (elements.energyPathArea && profile.svgArea) elements.energyPathArea.setAttribute('d', profile.svgArea);
    if (elements.energyPathLine && profile.svgLine) elements.energyPathLine.setAttribute('d', profile.svgLine);

    // Loudness
    if (elements.lufsIntegratedVal) elements.lufsIntegratedVal.textContent = Number(profile.lufsIntegrated).toFixed(1);
    if (elements.truePeakVal) elements.truePeakVal.textContent = (profile.truePeak > 0 ? `+${profile.truePeak.toFixed(1)}` : `${profile.truePeak.toFixed(1)}`);
    if (elements.lraVal) elements.lraVal.textContent = Number(profile.lra).toFixed(1);
    if (elements.lufsMaxVal) elements.lufsMaxVal.textContent = Number(profile.lufsMax).toFixed(1);

    // Modal Report Details
    if (elements.reportTrackTitle) elements.reportTrackTitle.textContent = profile.title || 'Active Track';
    if (elements.reportLufsIntegrated) elements.reportLufsIntegrated.textContent = Number(profile.lufsIntegrated).toFixed(1);
    if (elements.reportTruePeak) elements.reportTruePeak.textContent = (profile.truePeak > 0 ? `+${profile.truePeak.toFixed(1)}` : `${profile.truePeak.toFixed(1)}`);
    if (elements.reportLra) elements.reportLra.textContent = Number(profile.lra).toFixed(1);
    if (elements.reportShortTerm) elements.reportShortTerm.textContent = Number(profile.lufsMax).toFixed(1);
    if (elements.reportMomentary) elements.reportMomentary.textContent = (Number(profile.lufsMax) + 1.7).toFixed(1);
    if (elements.reportKeyName) elements.reportKeyName.textContent = profile.key;
    if (elements.reportCamelotCode) elements.reportCamelotCode.textContent = profile.camelot;
  }

  function renderHarmonicMatches(keyName) {
    if (!elements.harmonicMatchesWrap) return;
    const info = CAMELOT_MAP[keyName] || CAMELOT_MAP['A min'];

    elements.harmonicMatchesWrap.innerHTML = `
      <span class="harmonic-chip perfect-match" title="Dominant harmonic match">${info.dom} (${getCamelotCode(info.dom)})</span>
      <span class="harmonic-chip perfect-match" title="Subdominant harmonic match">${info.sub} (${getCamelotCode(info.sub)})</span>
      <span class="harmonic-chip perfect-match" title="Relative scale match">${info.relative} (${getCamelotCode(info.relative)})</span>
      <span class="harmonic-chip" title="Parallel tonic match">${keyName.includes('min') ? keyName.replace('min', 'maj') : keyName.replace('maj', 'min')}</span>
    `;

    // Render Camelot Tiles in Modal
    if (elements.camelotTilesGrid) {
      elements.camelotTilesGrid.innerHTML = `
        <div class="camelot-tile compatible">
          <span class="camelot-code">${getCamelotCode(info.sub)}</span>
          <span class="camelot-name">${info.sub}</span>
        </div>
        <div class="camelot-tile active">
          <span class="camelot-code">${info.code}</span>
          <span class="camelot-name">${keyName} (Active)</span>
        </div>
        <div class="camelot-tile compatible">
          <span class="camelot-code">${getCamelotCode(info.dom)}</span>
          <span class="camelot-name">${info.dom}</span>
        </div>
        <div class="camelot-tile compatible">
          <span class="camelot-code">${getCamelotCode(info.relative)}</span>
          <span class="camelot-name">${info.relative}</span>
        </div>
      `;
    }
  }

  function getCamelotCode(key) {
    const found = CAMELOT_MAP[key];
    return found ? found.code : '8A';
  }

  function applyBpmChange(newBpm, source = 'Override') {
    state.activeAnalysisProfile.bpm = newBpm;
    state.activeAnalysisProfile.bpmConf = 100.0;
    if (elements.analysisBpmReadout) elements.analysisBpmReadout.textContent = Number(newBpm).toFixed(1);
    if (elements.inputBpmOverride) elements.inputBpmOverride.value = newBpm;
    if (elements.bpmConfidenceText) elements.bpmConfidenceText.textContent = 'Manual Override (100%)';
    if (elements.bpmConfidenceFill) elements.bpmConfidenceFill.style.width = '100%';

    showToast(`BPM Override (${source}): ${newBpm} BPM applied`);
    triggerAutosave();
  }

  function applyKeyChange(newKey) {
    const info = CAMELOT_MAP[newKey] || { code: '8A', name: newKey };
    state.activeAnalysisProfile.key = newKey;
    state.activeAnalysisProfile.camelot = info.code;
    state.activeAnalysisProfile.keyConf = 100.0;

    if (elements.analysisKeyReadout) elements.analysisKeyReadout.textContent = newKey;
    if (elements.analysisCamelotBadge) elements.analysisCamelotBadge.textContent = `${info.code} (${newKey})`;
    if (elements.keyConfidenceText) elements.keyConfidenceText.textContent = 'Manual Override (100%)';
    if (elements.keyConfidenceFill) elements.keyConfidenceFill.style.width = '100%';

    renderHarmonicMatches(newKey);
    showToast(`Key Override: ${newKey} (${info.code}) applied`);
    triggerAutosave();
  }

  function triggerReanalyzeProcess() {
    if (state.isReanalyzing) return;
    state.isReanalyzing = true;

    if (elements.reanalyzeProgressBox) elements.reanalyzeProgressBox.style.display = 'flex';
    if (elements.btnReanalyzeTrack) elements.btnReanalyzeTrack.disabled = true;

    const steps = [
      { pct: 25, text: 'Decompressing 44.1kHz PCM buffer...' },
      { pct: 55, text: 'Executing Fast Fourier Transform (FFT)...' },
      { pct: 85, text: 'Extracting transient envelope & LUFS...' },
      { pct: 100, text: 'DSP Analysis updated!' }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        const s = steps[stepIdx];
        if (elements.reanalyzeProgressFill) elements.reanalyzeProgressFill.style.width = `${s.pct}%`;
        if (elements.reanalyzePercent) elements.reanalyzePercent.textContent = `${s.pct}%`;
        if (elements.reanalyzeStepText) elements.reanalyzeStepText.textContent = s.text;
        stepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          state.isReanalyzing = false;
          if (elements.reanalyzeProgressBox) elements.reanalyzeProgressBox.style.display = 'none';
          if (elements.btnReanalyzeTrack) elements.btnReanalyzeTrack.disabled = false;

          // Subtle refresh simulation
          state.activeAnalysisProfile.bpmConf = 99.2;
          state.activeAnalysisProfile.keyConf = 96.0;
          updateAnalysisUI(state.activeAnalysisProfile);

          showToast(`Re-analysis complete for "${state.activeAnalysisProfile.title || 'Audio Clip'}"`);
          triggerAutosave();
        }, 300);
      }
    }, 280);
  }

  function openAnalysisDeepReportModal() {
    updateAnalysisUI(state.activeAnalysisProfile);
    switchReportTab('overview');
    openModal(elements.audioAnalysisModal);
  }

  function switchReportTab(tabKey) {
    if (elements.btnReportTabOverview) elements.btnReportTabOverview.classList.toggle('active', tabKey === 'overview');
    if (elements.btnReportTabCamelot) elements.btnReportTabCamelot.classList.toggle('active', tabKey === 'camelot');
    if (elements.btnReportTabArrangement) elements.btnReportTabArrangement.classList.toggle('active', tabKey === 'arrangement');

    if (elements.paneReportOverview) elements.paneReportOverview.style.display = tabKey === 'overview' ? 'flex' : 'none';
    if (elements.paneReportCamelot) elements.paneReportCamelot.style.display = tabKey === 'camelot' ? 'flex' : 'none';
    if (elements.paneReportArrangement) elements.paneReportArrangement.style.display = tabKey === 'arrangement' ? 'flex' : 'none';
  }

  // --------------------------------------------------------------------------
  // 8. View Navigation Management
  // --------------------------------------------------------------------------
  function switchView(viewName) {
    state.currentView = viewName;

    elements.navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    if (elements.viewStudio) elements.viewStudio.style.display = viewName === 'studio' ? 'flex' : 'none';
    if (elements.viewDashboard) elements.viewDashboard.style.display = viewName === 'dashboard' ? 'flex' : 'none';
    if (elements.viewLibrary) elements.viewLibrary.style.display = viewName === 'library' ? 'flex' : 'none';

    if (elements.inspectorPanel) {
      elements.inspectorPanel.style.display = viewName === 'studio' && !state.inspectorCollapsed ? 'flex' : 'none';
    }

    if (viewName === 'dashboard') {
      renderProjectsGrid(elements.projectSearchInput ? elements.projectSearchInput.value : '');
    } else if (viewName === 'library') {
      renderLibraryTable(state.libraryFilter, elements.librarySearchInput ? elements.librarySearchInput.value : '');
    }

    showToast(`View switched to ${capitalize(viewName)}`);
  }

  // --------------------------------------------------------------------------
  // 9. Project Management Module
  // --------------------------------------------------------------------------
  function initProjectModule() {
    const projects = getStoredProjects();
    const activeId = getStoredActiveProjId();
    let current = projects.find((p) => p.id === activeId);
    if (!current && projects.length > 0) {
      current = projects[0];
      setStoredActiveProjId(current.id);
    }
    state.activeProject = current;
    syncActiveProjectUI();

    if (elements.projectSearchInput) {
      elements.projectSearchInput.addEventListener('input', (e) => {
        renderProjectsGrid(e.target.value);
      });
    }

    if (elements.projectTitle) {
      elements.projectTitle.style.cursor = 'pointer';
      elements.projectTitle.addEventListener('click', () => {
        promptRenameProject(state.activeProjectId);
      });
    }

    if (elements.btnOpenNewProjectModal) {
      elements.btnOpenNewProjectModal.addEventListener('click', () => {
        openModal(elements.newProjectModal);
        if (elements.inputProjectName) {
          elements.inputProjectName.value = '';
          elements.inputProjectName.focus();
        }
      });
    }

    if (elements.btnCloseNewProjectModal) {
      elements.btnCloseNewProjectModal.addEventListener('click', () => closeModal(elements.newProjectModal));
    }
    if (elements.btnCancelNewProject) {
      elements.btnCancelNewProject.addEventListener('click', () => closeModal(elements.newProjectModal));
    }

    if (elements.newProjectForm) {
      elements.newProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = elements.inputProjectName.value.trim();
        const bpm = parseInt(elements.inputProjectBpm.value, 10) || 128;
        const key = elements.selectProjectKey.value;
        const sig = elements.selectProjectSig.value;

        if (!name) return;

        createProject(name, bpm, key, sig);
        closeModal(elements.newProjectModal);
      });
    }

    if (elements.renameProjectForm) {
      elements.renameProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = elements.inputRenameProject.value.trim();
        if (newName && state.pendingRenameProjId) {
          saveRenameProject(state.pendingRenameProjId, newName);
          closeModal(elements.renameModal);
        }
      });
    }
    if (elements.btnCloseRenameModal) elements.btnCloseRenameModal.addEventListener('click', () => closeModal(elements.renameModal));
    if (elements.btnCancelRename) elements.btnCancelRename.addEventListener('click', () => closeModal(elements.renameModal));

    if (elements.btnCloseDeleteModal) elements.btnCloseDeleteModal.addEventListener('click', () => closeModal(elements.deleteProjectModal));
    if (elements.btnCancelDelete) elements.btnCancelDelete.addEventListener('click', () => closeModal(elements.deleteProjectModal));
    if (elements.btnConfirmDeleteProject) {
      elements.btnConfirmDeleteProject.addEventListener('click', () => {
        if (state.pendingDeleteProjId) {
          executeDeleteProject(state.pendingDeleteProjId);
          closeModal(elements.deleteProjectModal);
        }
      });
    }
  }

  function syncActiveProjectUI() {
    if (!state.activeProject) return;
    const p = state.activeProject;

    if (elements.projectTitle) elements.projectTitle.textContent = p.name;
    if (elements.quickDuration) elements.quickDuration.textContent = formatTime(p.duration || 225).slice(0, 5);
    if (elements.quickBpm) elements.quickBpm.textContent = p.bpm;
    if (elements.quickKey) elements.quickKey.textContent = p.key;

    if (elements.tempoBpmValue) elements.tempoBpmValue.textContent = Number(p.bpm).toFixed(1);
    if (elements.tempoKeyValue) elements.tempoKeyValue.textContent = p.key;
    if (elements.tempoSigValue) elements.tempoSigValue.textContent = p.sig || '4 / 4';

    state.totalDuration = p.duration || 225;
    buildTimelineRuler();
    updatePlayheadPosition();
  }

  function renderProjectsGrid(filterText = '') {
    if (!elements.projectsGridContainer) return;

    const projects = getStoredProjects();
    const query = filterText.toLowerCase().trim();
    const filtered = projects.filter((p) => p.name.toLowerCase().includes(query) || (p.key && p.key.toLowerCase().includes(query)));

    if (elements.statProjectCount) elements.statProjectCount.textContent = projects.length;
    const library = getStoredLibrary();
    if (elements.statLibraryCount) elements.statLibraryCount.textContent = library.length;

    elements.projectsGridContainer.innerHTML = '';

    if (filtered.length === 0) {
      elements.projectsGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-muted); background: var(--panel-bg); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">No matching projects found</div>
          <div style="font-size: 11px; margin-top: 4px;">Try searching for a different keyword or create a new session.</div>
        </div>
      `;
      return;
    }

    filtered.forEach((proj) => {
      const isActive = proj.id === state.activeProjectId;
      const card = document.createElement('div');
      card.className = `project-card ${isActive ? 'active-project' : ''}`;
      card.dataset.id = proj.id;

      card.innerHTML = `
        <div>
          <div class="project-card-header">
            <div class="project-card-title-row">
              <span class="project-card-title">${escapeHtml(proj.name)}</span>
              ${isActive ? '<span class="project-active-badge">Active Studio</span>' : ''}
            </div>
            <button class="icon-btn btn-rename-proj" data-id="${proj.id}" title="Rename Project" style="width: 26px; height: 26px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>

          <div class="project-card-meta">
            <span class="project-meta-chip highlight tabular-nums">${proj.bpm} BPM</span>
            <span class="project-meta-chip">${proj.key}</span>
            <span class="project-meta-chip tabular-nums">${proj.trackCount || 3} Tracks</span>
            <span class="project-meta-chip tabular-nums">${formatTime(proj.duration || 225).slice(0, 5)}</span>
          </div>
        </div>

        <div class="project-card-footer">
          <div class="project-card-time">
            <span class="pulse-dot" style="width: 5px; height: 5px; background: ${isActive ? 'var(--success)' : 'var(--text-muted)'};"></span>
            <span>Saved ${formatRelativeTime(proj.updatedAt)}</span>
          </div>

          <div class="project-card-btns">
            <button class="btn btn-secondary btn-duplicate-proj" data-id="${proj.id}" title="Duplicate Project" style="height: 28px; padding: 0 10px; font-size: 11px;">
              Copy
            </button>
            <button class="btn btn-secondary btn-delete-proj" data-id="${proj.id}" title="Delete Project" style="height: 28px; width: 28px; padding: 0; color: var(--danger);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              </svg>
            </button>
            <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-open-proj" data-id="${proj.id}" style="height: 28px; padding: 0 12px; font-size: 11px;">
              ${isActive ? 'In Studio' : 'Open'}
            </button>
          </div>
        </div>
      `;

      elements.projectsGridContainer.appendChild(card);
    });

    elements.projectsGridContainer.querySelectorAll('.btn-open-proj').forEach((b) => {
      b.addEventListener('click', () => openProject(b.dataset.id));
    });
    elements.projectsGridContainer.querySelectorAll('.btn-duplicate-proj').forEach((b) => {
      b.addEventListener('click', () => duplicateProject(b.dataset.id));
    });
    elements.projectsGridContainer.querySelectorAll('.btn-rename-proj').forEach((b) => {
      b.addEventListener('click', () => promptRenameProject(b.dataset.id));
    });
    elements.projectsGridContainer.querySelectorAll('.btn-delete-proj').forEach((b) => {
      b.addEventListener('click', () => promptDeleteProject(b.dataset.id));
    });
  }

  function openProject(id) {
    const projects = getStoredProjects();
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    setStoredActiveProjId(target.id);
    state.activeProject = target;
    syncActiveProjectUI();
    switchView('studio');
    showToast(`Opened project "${target.name}"`);
    triggerAutosave();
  }

  function createProject(name, bpm, key, sig) {
    const projects = getStoredProjects();
    const newProj = {
      id: 'proj-' + Date.now(),
      name: name,
      bpm: bpm,
      key: key,
      sig: sig,
      duration: 225,
      trackCount: 3,
      updatedAt: Date.now(),
      tags: ['Suno v3.5']
    };

    projects.unshift(newProj);
    saveProjects(projects);
    setStoredActiveProjId(newProj.id);
    state.activeProject = newProj;
    syncActiveProjectUI();
    switchView('studio');
    showToast(`Created & opened new session "${name}"`);
    triggerAutosave();
  }

  function duplicateProject(id) {
    const projects = getStoredProjects();
    const source = projects.find((p) => p.id === id);
    if (!source) return;

    const copy = {
      ...source,
      id: 'proj-' + Date.now(),
      name: `${source.name} (Copy)`,
      updatedAt: Date.now()
    };

    projects.splice(projects.indexOf(source) + 1, 0, copy);
    saveProjects(projects);
    renderProjectsGrid(elements.projectSearchInput ? elements.projectSearchInput.value : '');
    showToast(`Duplicated project "${source.name}"`);
  }

  function promptRenameProject(id) {
    const projects = getStoredProjects();
    const p = projects.find((item) => item.id === id);
    if (!p) return;

    state.pendingRenameProjId = id;
    if (elements.inputRenameProject) elements.inputRenameProject.value = p.name;
    openModal(elements.renameModal);
    if (elements.inputRenameProject) elements.inputRenameProject.focus();
  }

  function saveRenameProject(id, newName) {
    const projects = getStoredProjects();
    const p = projects.find((item) => item.id === id);
    if (!p) return;

    p.name = newName;
    p.updatedAt = Date.now();
    saveProjects(projects);

    if (id === state.activeProjectId) {
      state.activeProject.name = newName;
      if (elements.projectTitle) elements.projectTitle.textContent = newName;
    }

    renderProjectsGrid(elements.projectSearchInput ? elements.projectSearchInput.value : '');
    showToast(`Project renamed to "${newName}"`);
    triggerAutosave();
  }

  function promptDeleteProject(id) {
    const projects = getStoredProjects();
    const p = projects.find((item) => item.id === id);
    if (!p) return;

    state.pendingDeleteProjId = id;
    if (elements.deleteProjectTargetName) elements.deleteProjectTargetName.textContent = `"${p.name}"`;
    openModal(elements.deleteProjectModal);
  }

  function executeDeleteProject(id) {
    let projects = getStoredProjects();
    if (projects.length <= 1) {
      showToast('Cannot delete the only remaining project');
      return;
    }

    const deleted = projects.find((p) => p.id === id);
    projects = projects.filter((p) => p.id !== id);
    saveProjects(projects);

    if (id === state.activeProjectId) {
      openProject(projects[0].id);
    } else {
      renderProjectsGrid(elements.projectSearchInput ? elements.projectSearchInput.value : '');
    }

    showToast(`Deleted project "${deleted ? deleted.name : id}"`);
  }

  // --------------------------------------------------------------------------
  // 10. Autosave Engine
  // --------------------------------------------------------------------------
  function triggerAutosave() {
    if (!elements.autosaveIndicator) return;

    elements.autosaveIndicator.innerHTML = `
      <span class="pulse-dot" style="background: var(--warning); box-shadow: 0 0 6px var(--warning);"></span>
      <span style="color: var(--warning);">Saving...</span>
    `;

    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      state.lastAutosaveTime = Date.now();
      if (state.activeProject) {
        state.activeProject.updatedAt = state.lastAutosaveTime;
        const projects = getStoredProjects();
        const idx = projects.findIndex((p) => p.id === state.activeProject.id);
        if (idx !== -1) {
          projects[idx] = { ...projects[idx], updatedAt: state.lastAutosaveTime };
          saveProjects(projects);
        }
      }

      elements.autosaveIndicator.innerHTML = `
        <span class="pulse-dot"></span>
        <span>Autosaved</span>
      `;
    }, 450);
  }

  setInterval(() => {
    if (!elements.autosaveIndicator || !state.lastAutosaveTime) return;
    const rel = formatRelativeTime(state.lastAutosaveTime);
    elements.autosaveIndicator.innerHTML = `
      <span class="pulse-dot"></span>
      <span>Autosaved ${rel}</span>
    `;
  }, 20000);

  // --------------------------------------------------------------------------
  // 11. Music Library & Upload Flow
  // --------------------------------------------------------------------------
  function initLibraryModule() {
    if (elements.libraryFilterGroup) {
      elements.libraryFilterGroup.querySelectorAll('.filter-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
          elements.libraryFilterGroup.querySelectorAll('.filter-pill').forEach((p) => {
            p.classList.remove('active');
            p.setAttribute('aria-checked', 'false');
          });
          pill.classList.add('active');
          pill.setAttribute('aria-checked', 'true');
          state.libraryFilter = pill.dataset.category;
          renderLibraryTable(state.libraryFilter, elements.librarySearchInput ? elements.librarySearchInput.value : '');
        });
      });
    }

    if (elements.librarySearchInput) {
      elements.librarySearchInput.addEventListener('input', (e) => {
        renderLibraryTable(state.libraryFilter, e.target.value);
      });
    }

    if (elements.btnOpenUploadModal) {
      elements.btnOpenUploadModal.addEventListener('click', openUploadModalDialog);
    }
    if (elements.btnCloseUploadModal) {
      elements.btnCloseUploadModal.addEventListener('click', () => closeModal(elements.uploadModal));
    }
    if (elements.btnCancelUpload) {
      elements.btnCancelUpload.addEventListener('click', () => closeModal(elements.uploadModal));
    }

    if (elements.uploadDropzone && elements.audioFileInput) {
      elements.btnBrowseFile.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.audioFileInput.click();
      });

      elements.uploadDropzone.addEventListener('click', () => {
        elements.audioFileInput.click();
      });

      elements.uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadDropzone.classList.add('dragover');
      });

      elements.uploadDropzone.addEventListener('dragleave', () => {
        elements.uploadDropzone.classList.remove('dragover');
      });

      elements.uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadDropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleIncomingFile(files[0]);
        }
      });

      elements.audioFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleIncomingFile(e.target.files[0]);
        }
      });
    }

    if (elements.btnConfirmAddToLibrary) {
      elements.btnConfirmAddToLibrary.addEventListener('click', () => {
        if (state.pendingUploadItem) {
          const library = getStoredLibrary();
          library.unshift(state.pendingUploadItem);
          saveLibrary(library);
          renderLibraryTable(state.libraryFilter, elements.librarySearchInput ? elements.librarySearchInput.value : '');
          closeModal(elements.uploadModal);
          showToast(`Added "${state.pendingUploadItem.title}" to Library`);
          triggerAutosave();
        }
      });
    }
  }

  function renderLibraryTable(category = 'all', searchQuery = '') {
    if (!elements.libraryTableBody) return;

    const library = getStoredLibrary();
    const query = searchQuery.toLowerCase().trim();

    const filtered = library.filter((item) => {
      const matchCat = category === 'all' || item.category === category;
      const matchQuery = !query || item.title.toLowerCase().includes(query) || (item.key && item.key.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    elements.libraryTableBody.innerHTML = '';

    if (filtered.length === 0) {
      elements.libraryTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="padding: 40px; text-align: center; color: var(--text-muted);">
            <div>No audio tracks matching your search or filter.</div>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="song-title-cell">
            <div class="song-type-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div>
              <div class="song-name-text">${escapeHtml(item.title)}</div>
              <span class="song-tag-badge">${item.model || 'Suno v3.5'}</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 11px; text-transform: capitalize; color: var(--text-secondary);">${item.categoryLabel || item.category}</span>
        </td>
        <td class="tabular-nums" style="color: var(--text-main); font-weight: 500;">
          ${item.duration}
        </td>
        <td class="tabular-nums" style="color: var(--accent); font-weight: 600;">
          ${item.bpm}
        </td>
        <td style="color: var(--text-main); font-weight: 600;">
          ${item.key}
        </td>
        <td>
          <div class="energy-meter-pill">
            <span>${item.energyVal}%</span>
            <div class="energy-micro-bar">
              <div class="energy-micro-fill" style="width: ${item.energyVal}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <span class="status-analyzed-pill">
            <span class="pulse-dot"></span>
            <span>Analyzed</span>
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-preview-track" data-id="${item.id}" title="Quick Preview" style="height: 28px; width: 28px; padding: 0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button class="btn btn-secondary btn-add-timeline" data-id="${item.id}" title="Insert into Studio Timeline" style="height: 28px; padding: 0 10px; font-size: 11px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>To Timeline</span>
            </button>
            <button class="btn btn-secondary btn-delete-track" data-id="${item.id}" title="Remove from Library" style="height: 28px; width: 28px; padding: 0; color: var(--danger);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      elements.libraryTableBody.appendChild(tr);
    });

    elements.libraryTableBody.querySelectorAll('.btn-add-timeline').forEach((btn) => {
      btn.addEventListener('click', () => {
        addSongToTimeline(btn.dataset.id);
      });
    });

    elements.libraryTableBody.querySelectorAll('.btn-preview-track').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lib = getStoredLibrary();
        const s = lib.find((i) => i.id === btn.dataset.id);
        if (s) {
          showToast(`Auditioning "${s.title}" (3s preview)`);
          startMeterSimulation();
          setTimeout(stopMeterSimulation, 3000);
        }
      });
    });

    elements.libraryTableBody.querySelectorAll('.btn-delete-track').forEach((btn) => {
      btn.addEventListener('click', () => {
        let lib = getStoredLibrary();
        const item = lib.find((i) => i.id === btn.dataset.id);
        lib = lib.filter((i) => i.id !== btn.dataset.id);
        saveLibrary(lib);
        renderLibraryTable(state.libraryFilter, elements.librarySearchInput ? elements.librarySearchInput.value : '');
        showToast(`Removed "${item ? item.title : 'Track'}" from Library`);
      });
    });
  }

  function addSongToTimeline(songId) {
    const library = getStoredLibrary();
    const song = library.find((s) => s.id === songId);
    if (!song) return;

    const newClip = {
      id: 'clip-' + Date.now(),
      trackId: 4,
      title: song.title,
      startSec: snapTime(state.currentTime || 0),
      durationSec: song.durationSec || 60.0,
      fadeInSec: 0.5,
      fadeOutSec: 1.0,
      color: 'amber',
      bpm: song.bpm || 128,
      key: song.key || 'A min',
      energy: song.energy || '80% (High)',
      waveformSeed: 4
    };

    ANALYSIS_PROFILES[newClip.id] = {
      title: song.title,
      bpm: song.bpm,
      bpmConf: 97.5,
      key: song.key,
      camelot: getCamelotCode(song.key),
      keyConf: 93.0,
      energy: song.energyVal || 80,
      energyDesc: `${song.energyVal || 80}% Energy`,
      lufsIntegrated: -13.5,
      truePeak: -0.6,
      lra: 6.2,
      lufsMax: -10.8,
      syncReady: true,
      svgArea: 'M0,45 Q35,38 70,30 T140,8 T210,18 T280,38 L280,54 L0,54 Z',
      svgLine: 'M0,45 Q35,38 70,30 T140,8 T210,18 T280,38'
    };

    state.clips.push(newClip);
    renderClips();
    selectClip(newClip.id);

    switchView('studio');
    showToast(`Added "${song.title}" to Track 4`);
    triggerAutosave();
  }

  function openUploadModalDialog() {
    state.pendingUploadItem = null;
    if (elements.uploadProgressBox) elements.uploadProgressBox.style.display = 'none';
    if (elements.uploadMetaPreview) elements.uploadMetaPreview.style.display = 'none';
    if (elements.btnConfirmAddToLibrary) elements.btnConfirmAddToLibrary.disabled = true;
    if (elements.uploadDropzone) elements.uploadDropzone.style.display = 'flex';
    openModal(elements.uploadModal);
  }

  function handleIncomingFile(file) {
    if (!file) return;

    const validExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
    const fileName = file.name || 'Suno_Audio_Track.mp3';
    const isAudio = validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext)) || (file.type && file.type.startsWith('audio/'));

    if (!isAudio) {
      showToast('Unsupported audio format. Please upload MP3, WAV, or FLAC.');
      return;
    }

    if (elements.uploadDropzone) elements.uploadDropzone.style.display = 'none';
    if (elements.uploadProgressBox) elements.uploadProgressBox.style.display = 'flex';
    if (elements.uploadMetaPreview) elements.uploadMetaPreview.style.display = 'none';
    if (elements.btnConfirmAddToLibrary) elements.btnConfirmAddToLibrary.disabled = true;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12;
      if (progress > 100) progress = 100;

      if (elements.uploadProgressFill) elements.uploadProgressFill.style.width = `${progress}%`;
      if (elements.uploadPercentText) elements.uploadPercentText.textContent = `${progress}%`;

      if (progress < 40 && elements.uploadStatusText) {
        elements.uploadStatusText.textContent = 'Reading audio stream buffer...';
      } else if (progress < 80 && elements.uploadStatusText) {
        elements.uploadStatusText.textContent = 'Analyzing BPM & musical key signatures...';
      } else if (progress < 100 && elements.uploadStatusText) {
        elements.uploadStatusText.textContent = 'Generating waveform envelope profile...';
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          finishUploadAnalysis(fileName, file.size);
        }, 300);
      }
    }, 120);
  }

  function finishUploadAnalysis(fileName, fileSize) {
    if (elements.uploadStatusText) elements.uploadStatusText.textContent = 'Analysis complete!';

    let detectedBpm = 128;
    if (fileName.includes('120')) detectedBpm = 120;
    else if (fileName.includes('130')) detectedBpm = 130;
    else if (fileName.includes('140')) detectedBpm = 140;
    else detectedBpm = 120 + Math.floor((fileName.charCodeAt(0) || 65) % 24);

    const keys = ['A min', 'C maj', 'F# min', 'D min', 'E min', 'G maj'];
    const detectedKey = keys[(fileName.length) % keys.length];

    const cleanTitle = fileName;
    const category = fileName.toLowerCase().includes('vocal') ? 'vocals' :
                     fileName.toLowerCase().includes('drum') || fileName.toLowerCase().includes('beat') ? 'beats' :
                     fileName.toLowerCase().includes('bass') ? 'bass' : 'synths';

    const energyVal = 70 + Math.floor((fileName.length * 3) % 26);
    const energyLabel = energyVal > 80 ? `${energyVal}% (High)` : `${energyVal}% (Med)`;

    state.pendingUploadItem = {
      id: 'lib-' + Date.now(),
      title: cleanTitle,
      category: category,
      categoryLabel: capitalize(category),
      model: 'Suno v3.5',
      duration: '02:35.00',
      durationSec: 155.0,
      bpm: detectedBpm,
      key: detectedKey,
      energy: energyLabel,
      energyVal: energyVal,
      status: 'analyzed',
      dateAdded: 'Just now'
    };

    if (elements.previewSongTitle) elements.previewSongTitle.textContent = cleanTitle;
    if (elements.previewBpm) elements.previewBpm.textContent = detectedBpm;
    if (elements.previewKey) elements.previewKey.textContent = detectedKey;
    if (elements.previewDuration) elements.previewDuration.textContent = '02:35';
    if (elements.previewEnergy) elements.previewEnergy.textContent = energyLabel;

    if (elements.uploadMetaPreview) elements.uploadMetaPreview.style.display = 'flex';
    if (elements.btnConfirmAddToLibrary) elements.btnConfirmAddToLibrary.disabled = false;
  }

  // --------------------------------------------------------------------------
  // 12. Modal Helper Functions
  // --------------------------------------------------------------------------
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('open');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('open');
  }

  // --------------------------------------------------------------------------
  // 13. Timeline Ruler Rendering & Playhead Positioning
  // --------------------------------------------------------------------------
  function buildTimelineRuler() {
    if (!elements.rulerTicks) return;
    elements.rulerTicks.innerHTML = '';

    const totalSeconds = state.totalDuration;
    const intervalSec = 15;

    for (let s = 0; s <= totalSeconds; s += intervalSec) {
      const leftPx = s * state.pxPerSecond;
      const marker = document.createElement('div');
      marker.className = 'ruler-marker major';
      marker.style.left = `${leftPx}px`;

      const m = Math.floor(s / 60);
      const sec = s % 60;
      marker.textContent = `${m}:${String(sec).padStart(2, '0')}`;
      elements.rulerTicks.appendChild(marker);

      if (s + 5 < totalSeconds) {
        const minorMarker = document.createElement('div');
        minorMarker.className = 'ruler-marker';
        minorMarker.style.left = `${(s + 5) * state.pxPerSecond}px`;
        minorMarker.style.height = '40%';
        elements.rulerTicks.appendChild(minorMarker);
      }
      if (s + 10 < totalSeconds) {
        const minorMarker2 = document.createElement('div');
        minorMarker2.className = 'ruler-marker';
        minorMarker2.style.left = `${(s + 10) * state.pxPerSecond}px`;
        minorMarker2.style.height = '40%';
        elements.rulerTicks.appendChild(minorMarker2);
      }
    }
  }

  function updatePlayheadPosition() {
    const headerWidth = 210;
    const scrollOffset = elements.timelineViewport ? elements.timelineViewport.scrollLeft : 0;
    const xPos = headerWidth + (state.currentTime * state.pxPerSecond) - scrollOffset;

    if (elements.globalPlayhead) {
      elements.globalPlayhead.style.left = `${xPos}px`;
    }

    if (elements.timecodeCurrent) {
      elements.timecodeCurrent.textContent = formatTime(state.currentTime);
    }
  }

  function seekTo(targetSeconds) {
    state.currentTime = Math.max(0, Math.min(state.totalDuration, targetSeconds));
    updatePlayheadPosition();
  }

  // --------------------------------------------------------------------------
  // 14. Playback Transport Engine
  // --------------------------------------------------------------------------
  function togglePlayPause() {
    if (state.isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    state.isPlaying = true;
    lastTimestamp = performance.now();
    if (elements.btnPlayPause) elements.btnPlayPause.classList.add('active');
    if (elements.playIcon) {
      elements.playIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16" rx="1"></rect>
        <rect x="14" y="4" width="4" height="16" rx="1"></rect>
      `;
    }

    animationFrameId = requestAnimationFrame(playbackLoop);
    startMeterSimulation();
    showToast('Playback started');
  }

  function pausePlayback() {
    state.isPlaying = false;
    if (elements.btnPlayPause) elements.btnPlayPause.classList.remove('active');
    if (elements.playIcon) {
      elements.playIcon.innerHTML = `
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      `;
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    stopMeterSimulation();
  }

  function stopPlayback() {
    pausePlayback();
    seekTo(0);
    showToast('Playback stopped');
  }

  function playbackLoop(timestamp) {
    if (!state.isPlaying) return;

    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    state.currentTime += delta;

    if (state.currentTime >= state.totalDuration) {
      if (state.isLooping) {
        state.currentTime = 0;
      } else {
        pausePlayback();
        state.currentTime = state.totalDuration;
      }
    }

    updatePlayheadPosition();
    animationFrameId = requestAnimationFrame(playbackLoop);
  }

  function startMeterSimulation() {
    if (meterAnimTimer) clearInterval(meterAnimTimer);
    meterAnimTimer = setInterval(() => {
      if (!state.isPlaying) return;

      // Master Bus Stereo VU Meters & Console Master Fader
      const masterVol = (state.mixer && state.mixer.master) ? state.mixer.master.vol : 0;
      const baseMaster = Math.max(0, Math.min(100, 58 + (masterVol * 4)));
      const leftMaster = Math.min(100, Math.max(0, baseMaster + (Math.random() * 26 - 13)));
      const rightMaster = Math.min(100, Math.max(0, baseMaster + (Math.random() * 24 - 12)));

      if (elements.meterL) elements.meterL.style.width = `${leftMaster}%`;
      if (elements.meterR) elements.meterR.style.width = `${rightMaster}%`;

      const mMeterL = document.getElementById('stripMeterL-master');
      const mMeterR = document.getElementById('stripMeterR-master');
      const mClipL = document.getElementById('stripClipL-master');
      const mClipR = document.getElementById('stripClipR-master');

      if (mMeterL) mMeterL.style.height = `${leftMaster}%`;
      if (mMeterR) mMeterR.style.height = `${rightMaster}%`;
      if (mClipL) mClipL.classList.toggle('clipping', leftMaster > 92 || masterVol > 3.0);
      if (mClipR) mClipR.classList.toggle('clipping', rightMaster > 92 || masterVol > 3.0);

      // Phase 7 Master Preview Live HUD dynamics
      if (state.masterPreviewActive) {
        updateMasterPreviewHudMetrics(leftMaster, rightMaster, masterVol);
      }

      // Track Console Strips (Tracks 1 to 4)
      [1, 2, 3, 4].forEach((id) => {
        const trk = state.tracks[id];
        const meterL = document.getElementById(`stripMeterL-${id}`);
        const meterR = document.getElementById(`stripMeterR-${id}`);
        const clipL = document.getElementById(`stripClipL-${id}`);
        const clipR = document.getElementById(`stripClipR-${id}`);

        if (!trk || trk.mute) {
          if (meterL) meterL.style.height = '0%';
          if (meterR) meterR.style.height = '0%';
          if (clipL) clipL.classList.remove('clipping');
          if (clipR) clipR.classList.remove('clipping');
          return;
        }

        const baseLevel = Math.max(0, Math.min(100, 50 + ((trk.vol + (trk.gainTrim || 0)) * 4.5)));
        const panShift = (trk.pan || 0) / 100; // -1 to +1
        const lLevel = Math.max(0, Math.min(100, (baseLevel * (1 - Math.max(0, panShift) * 0.65)) + (Math.random() * 20 - 10)));
        const rLevel = Math.max(0, Math.min(100, (baseLevel * (1 - Math.max(0, -panShift) * 0.65)) + (Math.random() * 20 - 10)));

        if (meterL) meterL.style.height = `${lLevel}%`;
        if (meterR) meterR.style.height = `${rLevel}%`;
        if (clipL) clipL.classList.toggle('clipping', lLevel > 92 || trk.vol > 3.0);
        if (clipR) clipR.classList.toggle('clipping', rLevel > 92 || trk.vol > 3.0);
      });
    }, 90);
  }

  function stopMeterSimulation() {
    if (meterAnimTimer) {
      clearInterval(meterAnimTimer);
      meterAnimTimer = null;
    }
    if (elements.meterL) elements.meterL.style.width = '12%';
    if (elements.meterR) elements.meterR.style.width = '10%';

    const mMeterL = document.getElementById('stripMeterL-master');
    const mMeterR = document.getElementById('stripMeterR-master');
    if (mMeterL) mMeterL.style.height = '12%';
    if (mMeterR) mMeterR.style.height = '10%';
    const mClipL = document.getElementById('stripClipL-master');
    const mClipR = document.getElementById('stripClipR-master');
    if (mClipL) mClipL.classList.remove('clipping');
    if (mClipR) mClipR.classList.remove('clipping');

    [1, 2, 3, 4].forEach((id) => {
      const meterL = document.getElementById(`stripMeterL-${id}`);
      const meterR = document.getElementById(`stripMeterR-${id}`);
      const clipL = document.getElementById(`stripClipL-${id}`);
      const clipR = document.getElementById(`stripClipR-${id}`);
      if (meterL) meterL.style.height = '6%';
      if (meterR) meterR.style.height = '6%';
      if (clipL) clipL.classList.remove('clipping');
      if (clipR) clipR.classList.remove('clipping');
    });

    if (state.masterPreviewActive) {
      resetMasterPreviewHudMetrics();
    }
  }

  // --------------------------------------------------------------------------
  // 15. Timeline Scrubbing Event Handlers
  // --------------------------------------------------------------------------
  function initScrubbing() {
    let isDragging = false;

    function handleScrub(e) {
      if (!elements.rulerContainer) return;
      const rect = elements.rulerContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const targetSec = clickX / state.pxPerSecond;
      seekTo(targetSec);
    }

    if (elements.rulerContainer) {
      elements.rulerContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleScrub(e);
      });
    }

    if (elements.playheadHead) {
      elements.playheadHead.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.stopPropagation();
      });
    }

    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleScrub(e);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) isDragging = false;
    });

    if (elements.timelineViewport) {
      elements.timelineViewport.addEventListener('scroll', () => {
        updatePlayheadPosition();
      });
    }
  }

  // --------------------------------------------------------------------------
  // Phase 4: Timeline & Waveform Engine
  // --------------------------------------------------------------------------

  function snapTime(sec) {
    if (state.snapSetting === 'off') return Math.max(0, sec);
    const bpm = state.activeProject ? state.activeProject.bpm : 128;
    const beatDuration = 60 / bpm;
    let snapInterval = beatDuration * 0.25;

    switch (state.snapSetting) {
      case '1_bar':
        snapInterval = beatDuration * 4;
        break;
      case 'half_beat':
        snapInterval = beatDuration * 0.5;
        break;
      case 'quarter_beat':
        snapInterval = beatDuration * 0.25;
        break;
      case 'eighth_beat':
        snapInterval = beatDuration * 0.125;
        break;
      default:
        snapInterval = beatDuration * 0.25;
    }

    const snapped = Math.round(sec / snapInterval) * snapInterval;
    return Math.max(0, Math.round(snapped * 1000) / 1000);
  }

  function getClipById(id) {
    return state.clips.find((c) => c.id === id);
  }

  function getAnalysisProfileForClip(clip) {
    if (!clip) return ANALYSIS_PROFILES['clip-1'];
    if (ANALYSIS_PROFILES[clip.id]) return ANALYSIS_PROFILES[clip.id];

    const fallbackKey = clip.key || 'A min';
    const fallbackBpm = clip.bpm || 128;
    const fallbackCamelot = CAMELOT_MAP[fallbackKey] ? CAMELOT_MAP[fallbackKey].code : '8A';

    return {
      title: clip.title,
      bpm: fallbackBpm,
      bpmConf: 98.0,
      key: fallbackKey,
      camelot: fallbackCamelot,
      keyConf: 94.0,
      energy: 82,
      energyDesc: clip.energy || '82% High',
      lufsIntegrated: -13.8,
      truePeak: -0.6,
      lra: 5.8,
      lufsMax: -10.5,
      syncReady: true,
      svgArea: ANALYSIS_PROFILES['clip-1'].svgArea,
      svgLine: ANALYSIS_PROFILES['clip-1'].svgLine
    };
  }

  function generateWaveformSvgPath(seed, width, height) {
    const midY = height / 2;
    const step = 16;
    const count = Math.max(6, Math.floor(width / step));
    const topPoints = [];
    const bottomPoints = [];

    let s = (seed || 1) * 9301 + 49297;
    function rand() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }

    topPoints.push(`0,${midY}`);
    for (let i = 1; i < count; i++) {
      const x = Math.round((i / count) * width);
      const burst = Math.sin((i / count) * Math.PI * 8);
      const amp = 0.28 + 0.52 * Math.abs(burst) + 0.2 * rand();
      const topY = Math.max(3, Math.round(midY - (midY - 5) * amp));
      topPoints.push(`${x},${topY}`);
    }
    topPoints.push(`${width},${midY}`);

    bottomPoints.push(`${width},${midY}`);
    for (let i = count - 1; i >= 1; i--) {
      const x = Math.round((i / count) * width);
      const burst = Math.sin((i / count) * Math.PI * 8);
      const amp = 0.28 + 0.52 * Math.abs(burst) + 0.2 * rand();
      const botY = Math.min(height - 3, Math.round(midY + (midY - 5) * amp));
      bottomPoints.push(`${x},${botY}`);
    }
    bottomPoints.push(`0,${midY}`);

    let path = `M${topPoints[0]}`;
    for (let i = 1; i < topPoints.length; i++) {
      const [px, py] = topPoints[i - 1].split(',').map(Number);
      const [cx, cy] = topPoints[i].split(',').map(Number);
      path += ` Q${(px + cx) / 2},${py} ${cx},${cy}`;
    }
    for (let i = 1; i < bottomPoints.length; i++) {
      const [px, py] = bottomPoints[i - 1].split(',').map(Number);
      const [cx, cy] = bottomPoints[i].split(',').map(Number);
      path += ` Q${(px + cx) / 2},${py} ${cx},${cy}`;
    }
    path += ' Z';
    return path;
  }

  function getWaveformGradientDef(clipId, colorType) {
    let stop1 = '#22D3EE', stop2 = '#8B5CF6', stop3 = '#22D3EE';
    if (colorType === 'purple') {
      stop1 = '#8B5CF6'; stop2 = '#A78BFA'; stop3 = '#8B5CF6';
    } else if (colorType === 'emerald') {
      stop1 = '#22C55E'; stop2 = '#22D3EE'; stop3 = '#22C55E';
    } else if (colorType === 'amber') {
      stop1 = '#F59E0B'; stop2 = '#EF4444'; stop3 = '#F59E0B';
    }
    return `
      <defs>
        <linearGradient id="waveGrad-${clipId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${stop1}" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="${stop2}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${stop3}" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
    `;
  }

  function generateBeatLinesHtml(clip) {
    const bpm = state.activeProject ? state.activeProject.bpm : 128;
    const beatSec = 60 / bpm;
    const numBeats = Math.floor(clip.durationSec / beatSec);
    let html = '';
    for (let b = 0; b <= numBeats; b++) {
      const offsetSec = b * beatSec;
      const leftPx = Math.round(offsetSec * state.pxPerSecond);
      const absoluteBeatIndex = Math.round((clip.startSec + offsetSec) / beatSec);
      const isBar = (absoluteBeatIndex % 4) === 0;
      html += `<div class="clip-beat-line ${isBar ? 'bar-marker' : ''}" style="left: ${leftPx}px;"></div>`;
    }
    return html;
  }

  function renderClips() {
    [1, 2, 3, 4].forEach((trackId) => {
      const lane = document.querySelector(`.track-lane[data-track="${trackId}"]`);
      if (!lane) return;

      const trackClips = state.clips.filter((c) => c.trackId === trackId);
      lane.innerHTML = '';

      if (trackClips.length === 0) {
        if (trackId === 4) {
          lane.innerHTML = `
            <div class="empty-track-dropzone" id="emptyTrackDropzone" title="Click to add Suno stem from Library">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Drop Suno stems or audio clip here</span>
            </div>
          `;
          const dropEl = lane.querySelector('#emptyTrackDropzone');
          if (dropEl) dropEl.addEventListener('click', openUploadModalDialog);
        }
        return;
      }

      trackClips.forEach((clip) => {
        const leftPx = Math.round(clip.startSec * state.pxPerSecond);
        const widthPx = Math.max(24, Math.round(clip.durationSec * state.pxPerSecond));
        const fadeInPx = Math.min(widthPx / 2, Math.round((clip.fadeInSec || 0) * state.pxPerSecond));
        const fadeOutPx = Math.min(widthPx / 2, Math.round((clip.fadeOutSec || 0) * state.pxPerSecond));
        const isSelected = clip.id === state.selectedClipId;
        const toolClass = state.activeTool === 'split' ? 'tool-split-mode' : (state.activeTool === 'trim' ? 'tool-trim-mode' : '');

        const clipEl = document.createElement('div');
        clipEl.className = `audio-clip ${isSelected ? 'selected' : ''} ${toolClass}`;
        clipEl.id = clip.id;
        clipEl.style.left = `${leftPx}px`;
        clipEl.style.width = `${widthPx}px`;
        clipEl.title = `${clip.title} (Click to inspect, drag to move, C to split, S to trim)`;

        clipEl.innerHTML = `
          <div class="clip-header">
            <span class="clip-title">${escapeHtml(clip.title)}</span>
            <span class="clip-badge">${clip.bpm} BPM • ${clip.key}</span>
          </div>
          <svg class="clip-waveform-svg" viewBox="0 0 ${widthPx} 54" preserveAspectRatio="none">
            ${getWaveformGradientDef(clip.id, clip.color)}
            <path d="${generateWaveformSvgPath(clip.waveformSeed, widthPx, 54)}" fill="url(#waveGrad-${clip.id})"/>
          </svg>
          ${generateBeatLinesHtml(clip)}
          <div class="clip-fade-overlay fade-in" style="width: ${fadeInPx}px;"></div>
          <div class="clip-fade-overlay fade-out" style="width: ${fadeOutPx}px;"></div>
          <div class="clip-fade-handle fade-in-handle" style="left: ${fadeInPx}px;" title="Drag to adjust Fade In"></div>
          <div class="clip-fade-handle fade-out-handle" style="right: ${fadeOutPx}px;" title="Drag to adjust Fade Out"></div>
          <div class="clip-handle-left" title="Trim Start"></div>
          <div class="clip-handle-right" title="Trim End"></div>
        `;

        wireClipInteractions(clipEl, clip);
        lane.appendChild(clipEl);
      });
    });
  }

  function wireClipInteractions(clipEl, clip) {
    // 1. Click on clip body: Select or Split
    clipEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.activeTool === 'split') {
        const rect = clipEl.getBoundingClientRect();
        const clickOffsetPx = e.clientX - rect.left;
        const clickSec = clip.startSec + (clickOffsetPx / state.pxPerSecond);
        const splitSec = snapTime(clickSec);
        splitClip(clip.id, splitSec);
      } else {
        selectClip(clip.id);
      }
    });

    // 2. Drag clip body horizontally (and vertically between tracks)
    clipEl.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('clip-handle-left') ||
          e.target.classList.contains('clip-handle-right') ||
          e.target.classList.contains('clip-fade-handle')) {
        return;
      }
      if (state.activeTool !== 'select') return;

      selectClip(clip.id);
      let isMoving = false;
      const startX = e.clientX;
      const initialStartSec = clip.startSec;
      let targetTrackId = clip.trackId;

      function onMouseMove(moveEvent) {
        if (!isMoving) {
          isMoving = true;
          clipEl.classList.add('dragging');
        }
        const deltaSec = (moveEvent.clientX - startX) / state.pxPerSecond;
        const rawNewStart = Math.max(0, initialStartSec + deltaSec);
        const snappedStart = snapTime(rawNewStart);

        clipEl.style.left = `${Math.round(snappedStart * state.pxPerSecond)}px`;

        const elemBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const laneBelow = elemBelow ? elemBelow.closest('.track-lane') : null;
        if (laneBelow && laneBelow.dataset.track) {
          targetTrackId = parseInt(laneBelow.dataset.track, 10);
        }

        if (elements.inspectorStartOffset) {
          elements.inspectorStartOffset.value = snappedStart.toFixed(2);
        }
      }

      function onMouseUp(upEvent) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (isMoving) {
          clipEl.classList.remove('dragging');
          const deltaSec = (upEvent.clientX - startX) / state.pxPerSecond;
          const finalStart = snapTime(Math.max(0, initialStartSec + deltaSec));
          clip.startSec = finalStart;

          if (targetTrackId !== clip.trackId) {
            const oldTrack = clip.trackId;
            clip.trackId = targetTrackId;
            showToast(`Moved "${clip.title}" from Track ${oldTrack} to Track ${targetTrackId}`);
          }
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // 3. Trim Left Handle
    const handleLeft = clipEl.querySelector('.clip-handle-left');
    if (handleLeft) {
      handleLeft.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectClip(clip.id);
        const startX = e.clientX;
        const initialStart = clip.startSec;
        const initialEnd = clip.startSec + clip.durationSec;

        function onMouseMove(moveEvent) {
          const deltaSec = (moveEvent.clientX - startX) / state.pxPerSecond;
          const rawStart = initialStart + deltaSec;
          const snappedStart = snapTime(rawStart);
          const clampedStart = Math.max(0, Math.min(initialEnd - 0.5, snappedStart));
          const newDuration = Math.round((initialEnd - clampedStart) * 1000) / 1000;

          clipEl.style.left = `${Math.round(clampedStart * state.pxPerSecond)}px`;
          clipEl.style.width = `${Math.round(newDuration * state.pxPerSecond)}px`;

          if (elements.inspectorStartOffset) elements.inspectorStartOffset.value = clampedStart.toFixed(2);
          if (elements.inspectorDuration) elements.inspectorDuration.value = newDuration.toFixed(2);
        }

        function onMouseUp(upEvent) {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);

          const deltaSec = (upEvent.clientX - startX) / state.pxPerSecond;
          const finalStart = Math.max(0, Math.min(initialEnd - 0.5, snapTime(initialStart + deltaSec)));
          clip.startSec = finalStart;
          clip.durationSec = Math.round((initialEnd - finalStart) * 1000) / 1000;
          clip.fadeInSec = Math.min(clip.fadeInSec, clip.durationSec / 2);
          clip.fadeOutSec = Math.min(clip.fadeOutSec, clip.durationSec / 2);

          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // 4. Trim Right Handle
    const handleRight = clipEl.querySelector('.clip-handle-right');
    if (handleRight) {
      handleRight.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectClip(clip.id);
        const startX = e.clientX;
        const initialDuration = clip.durationSec;

        function onMouseMove(moveEvent) {
          const deltaSec = (moveEvent.clientX - startX) / state.pxPerSecond;
          const rawEnd = clip.startSec + initialDuration + deltaSec;
          const snappedEnd = snapTime(rawEnd);
          const newDuration = Math.max(0.5, Math.round((snappedEnd - clip.startSec) * 1000) / 1000);

          clipEl.style.width = `${Math.round(newDuration * state.pxPerSecond)}px`;
          if (elements.inspectorDuration) elements.inspectorDuration.value = newDuration.toFixed(2);
        }

        function onMouseUp(upEvent) {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);

          const deltaSec = (upEvent.clientX - startX) / state.pxPerSecond;
          const snappedEnd = snapTime(clip.startSec + initialDuration + deltaSec);
          clip.durationSec = Math.max(0.5, Math.round((snappedEnd - clip.startSec) * 1000) / 1000);
          clip.fadeInSec = Math.min(clip.fadeInSec, clip.durationSec / 2);
          clip.fadeOutSec = Math.min(clip.fadeOutSec, clip.durationSec / 2);

          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // 5. Fade In Handle
    const fadeInHandle = clipEl.querySelector('.clip-fade-handle.fade-in-handle');
    const fadeInOverlay = clipEl.querySelector('.clip-fade-overlay.fade-in');
    if (fadeInHandle && fadeInOverlay) {
      fadeInHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectClip(clip.id);
        const startX = e.clientX;
        const initialFadeIn = clip.fadeInSec || 0;

        function onMouseMove(moveEvent) {
          const deltaSec = (moveEvent.clientX - startX) / state.pxPerSecond;
          const newFadeIn = Math.max(0, Math.min(clip.durationSec / 2, initialFadeIn + deltaSec));
          const newFadePx = Math.round(newFadeIn * state.pxPerSecond);

          fadeInOverlay.style.width = `${newFadePx}px`;
          fadeInHandle.style.left = `${newFadePx}px`;
          if (elements.inspectorFadeIn) elements.inspectorFadeIn.value = newFadeIn.toFixed(2);
        }

        function onMouseUp(upEvent) {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);

          const deltaSec = (upEvent.clientX - startX) / state.pxPerSecond;
          clip.fadeInSec = Math.max(0, Math.min(clip.durationSec / 2, Math.round((initialFadeIn + deltaSec) * 100) / 100));
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // 6. Fade Out Handle
    const fadeOutHandle = clipEl.querySelector('.clip-fade-handle.fade-out-handle');
    const fadeOutOverlay = clipEl.querySelector('.clip-fade-overlay.fade-out');
    if (fadeOutHandle && fadeOutOverlay) {
      fadeOutHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectClip(clip.id);
        const startX = e.clientX;
        const initialFadeOut = clip.fadeOutSec || 0;

        function onMouseMove(moveEvent) {
          const deltaSec = (startX - moveEvent.clientX) / state.pxPerSecond;
          const newFadeOut = Math.max(0, Math.min(clip.durationSec / 2, initialFadeOut + deltaSec));
          const newFadePx = Math.round(newFadeOut * state.pxPerSecond);

          fadeOutOverlay.style.width = `${newFadePx}px`;
          fadeOutHandle.style.right = `${newFadePx}px`;
          if (elements.inspectorFadeOut) elements.inspectorFadeOut.value = newFadeOut.toFixed(2);
        }

        function onMouseUp(upEvent) {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);

          const deltaSec = (startX - upEvent.clientX) / state.pxPerSecond;
          clip.fadeOutSec = Math.max(0, Math.min(clip.durationSec / 2, Math.round((initialFadeOut + deltaSec) * 100) / 100));
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  function selectClip(clipId) {
    const clip = getClipById(clipId);
    if (!clip) return;

    state.selectedClipId = clip.id;
    state.selectedTrackId = `track-${clip.trackId}`;

    document.querySelectorAll('.audio-clip').forEach((el) => {
      el.classList.toggle('selected', el.id === clip.id);
    });

    document.querySelectorAll('.track-row').forEach((row) => {
      row.classList.toggle('selected', row.dataset.trackId === `track-${clip.trackId}`);
    });

    updateInspectorClipValues(clip);

    const profile = getAnalysisProfileForClip(clip);
    updateAnalysisUI(profile);

    // Sync mixer channel selection
    if (typeof selectMixerTrack === 'function') {
      selectMixerTrack(clip.trackId);
    }

    // Sync AI Inspector values
    if (typeof updateAiInspectorUI === 'function') {
      updateAiInspectorUI(clip);
    }
  }

  function updateInspectorClipValues(clip) {
    if (!clip) return;
    if (elements.inspectorClipName) elements.inspectorClipName.textContent = clip.title;
    if (elements.inspectorClipNameInput) elements.inspectorClipNameInput.value = clip.title;
    if (elements.inspectorClipTrackBadge) elements.inspectorClipTrackBadge.textContent = `Track ${clip.trackId}`;
    if (elements.inspectorStartOffset) elements.inspectorStartOffset.value = clip.startSec.toFixed(2);
    if (elements.inspectorDuration) elements.inspectorDuration.value = clip.durationSec.toFixed(2);
    if (elements.inspectorFadeIn) elements.inspectorFadeIn.value = clip.fadeInSec.toFixed(2);
    if (elements.inspectorFadeOut) elements.inspectorFadeOut.value = clip.fadeOutSec.toFixed(2);
  }

  function splitClip(clipId, splitSec) {
    const clip = getClipById(clipId);
    if (!clip) return;

    if (splitSec <= clip.startSec + 0.2 || splitSec >= clip.startSec + clip.durationSec - 0.2) {
      showToast('Split position too close to clip edge (min 0.2s required)');
      return;
    }

    pushHistorySnapshot('Split Clip');

    const originalEnd = clip.startSec + clip.durationSec;
    const clipADuration = Math.round((splitSec - clip.startSec) * 1000) / 1000;
    const clipBDuration = Math.round((originalEnd - splitSec) * 1000) / 1000;

    clip.durationSec = clipADuration;
    clip.fadeOutSec = Math.min(clip.fadeOutSec, 0.2);

    const clipB = {
      id: 'clip-' + Date.now(),
      trackId: clip.trackId,
      title: clip.title.includes('(Split)') ? clip.title : `${clip.title} (Split)`,
      startSec: splitSec,
      durationSec: clipBDuration,
      fadeInSec: 0.2,
      fadeOutSec: Math.min(clip.fadeOutSec, clipBDuration / 2),
      color: clip.color,
      bpm: clip.bpm,
      key: clip.key,
      energy: clip.energy,
      waveformSeed: (clip.waveformSeed || 1) + 1
    };

    ANALYSIS_PROFILES[clipB.id] = getAnalysisProfileForClip(clipB);
    state.clips.push(clipB);

    renderClips();
    selectClip(clipB.id);
    showToast(`Razor Cut: Split clip at ${formatTime(splitSec)}`);
    triggerAutosave();
  }

  function splitClipAtPlayhead() {
    const clip = getClipById(state.selectedClipId);
    if (!clip) {
      showToast('Select a clip first to split at playhead');
      return;
    }
    const current = state.currentTime;
    if (current > clip.startSec + 0.2 && current < clip.startSec + clip.durationSec - 0.2) {
      splitClip(clip.id, current);
    } else {
      showToast(`Playhead (${formatTime(current)}) is outside selected clip`);
    }
  }

  function duplicateClip(clipId) {
    const clip = getClipById(clipId);
    if (!clip) return;

    let newStart = snapTime(clip.startSec + clip.durationSec + 0.5);
    if (newStart + clip.durationSec > state.totalDuration) {
      newStart = Math.max(0, snapTime(clip.startSec + 2.0));
    }

    pushHistorySnapshot('Duplicate Clip');

    const dupClip = {
      id: 'clip-' + Date.now(),
      trackId: clip.trackId,
      title: `${clip.title} (Copy)`,
      startSec: newStart,
      durationSec: clip.durationSec,
      fadeInSec: clip.fadeInSec,
      fadeOutSec: clip.fadeOutSec,
      color: clip.color,
      bpm: clip.bpm,
      key: clip.key,
      energy: clip.energy,
      waveformSeed: (clip.waveformSeed || 1) + 2
    };

    ANALYSIS_PROFILES[dupClip.id] = getAnalysisProfileForClip(dupClip);
    state.clips.push(dupClip);

    renderClips();
    selectClip(dupClip.id);
    showToast(`Duplicated: "${dupClip.title}"`);
    triggerAutosave();
  }

  function deleteClip(clipId) {
    const idx = state.clips.findIndex((c) => c.id === clipId);
    if (idx === -1) return;

    pushHistorySnapshot(`Delete Clip`);
    const deleted = state.clips.splice(idx, 1)[0];
    showToast(`Deleted "${deleted.title}"`);

    if (state.clips.length > 0) {
      const nextClip = state.clips[Math.min(idx, state.clips.length - 1)];
      state.selectedClipId = nextClip.id;
      renderClips();
      selectClip(nextClip.id);
    } else {
      state.selectedClipId = null;
      renderClips();
      if (elements.inspectorClipName) elements.inspectorClipName.textContent = 'No Clip Selected';
      if (elements.inspectorClipNameInput) elements.inspectorClipNameInput.value = '';
      if (elements.inspectorClipTrackBadge) elements.inspectorClipTrackBadge.textContent = 'None';
    }
    triggerAutosave();
  }

  function updateToolCursorModes() {
    const clips = document.querySelectorAll('.audio-clip');
    clips.forEach((c) => {
      c.classList.remove('tool-split-mode', 'tool-trim-mode');
      if (state.activeTool === 'split') {
        c.classList.add('tool-split-mode');
      } else if (state.activeTool === 'trim') {
        c.classList.add('tool-trim-mode');
      }
    });

    const guide = document.getElementById('razorGuideLine');
    if (guide && state.activeTool !== 'split') {
      guide.style.display = 'none';
    }
  }

  function initTimelineClipInteractions() {
    let guide = document.getElementById('razorGuideLine');
    if (!guide && elements.tracksContainer) {
      guide = document.createElement('div');
      guide.className = 'razor-guide-line';
      guide.id = 'razorGuideLine';
      guide.style.display = 'none';
      elements.tracksContainer.appendChild(guide);
    }

    if (elements.tracksContainer) {
      elements.tracksContainer.addEventListener('mousemove', (e) => {
        if (state.activeTool !== 'split') {
          if (guide) guide.style.display = 'none';
          return;
        }

        const lane = e.target.closest('.track-lane');
        if (!lane) {
          if (guide) guide.style.display = 'none';
          return;
        }

        const laneRect = lane.getBoundingClientRect();
        const containerRect = elements.tracksContainer.getBoundingClientRect();
        const offsetPx = e.clientX - laneRect.left;
        const timeSec = offsetPx / state.pxPerSecond;
        const snappedSec = snapTime(timeSec);
        const snappedOffsetPx = snappedSec * state.pxPerSecond;

        const leftPos = (laneRect.left - containerRect.left) + snappedOffsetPx + elements.tracksContainer.scrollLeft;
        guide.style.left = `${leftPos}px`;
        guide.style.display = 'block';
      });

      elements.tracksContainer.addEventListener('mouseleave', () => {
        if (guide) guide.style.display = 'none';
      });

      elements.tracksContainer.addEventListener('click', (e) => {
        const lane = e.target.closest('.track-lane');
        if (!lane) return;

        if (e.target === lane || e.target.closest('.empty-track-dropzone')) {
          const laneRect = lane.getBoundingClientRect();
          const clickOffsetPx = e.clientX - laneRect.left;
          const targetSec = snapTime(clickOffsetPx / state.pxPerSecond);
          seekTo(targetSec);

          const trackId = lane.dataset.track;
          if (trackId) {
            state.selectedTrackId = `track-${trackId}`;
            document.querySelectorAll('.track-row').forEach((r) => {
              r.classList.toggle('selected', r.dataset.trackId === `track-${trackId}`);
            });
          }
        }
      });
    }

    if (elements.snapSelect) {
      elements.snapSelect.addEventListener('change', (e) => {
        state.snapSetting = e.target.value;
        const text = e.target.options[e.target.selectedIndex].text;
        showToast(`Grid Quantize: ${text}`);
      });
    }
  }

  function initClipInspectorEvents() {
    if (elements.inspectorClipNameInput) {
      elements.inspectorClipNameInput.addEventListener('input', (e) => {
        const clip = getClipById(state.selectedClipId);
        if (clip) {
          clip.title = e.target.value;
          if (elements.inspectorClipName) elements.inspectorClipName.textContent = clip.title;
          const clipEl = document.getElementById(clip.id);
          if (clipEl) {
            const titleEl = clipEl.querySelector('.clip-title');
            if (titleEl) titleEl.textContent = clip.title;
          }
          triggerAutosave();
        }
      });
    }

    if (elements.inspectorStartOffset) {
      elements.inspectorStartOffset.addEventListener('change', (e) => {
        const clip = getClipById(state.selectedClipId);
        if (clip) {
          const val = Math.max(0, parseFloat(e.target.value) || 0);
          clip.startSec = val;
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }
      });
    }

    if (elements.inspectorDuration) {
      elements.inspectorDuration.addEventListener('change', (e) => {
        const clip = getClipById(state.selectedClipId);
        if (clip) {
          const val = Math.max(0.5, parseFloat(e.target.value) || 0.5);
          clip.durationSec = val;
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }
      });
    }

    if (elements.inspectorFadeIn) {
      elements.inspectorFadeIn.addEventListener('change', (e) => {
        const clip = getClipById(state.selectedClipId);
        if (clip) {
          const val = Math.max(0, Math.min(clip.durationSec / 2, parseFloat(e.target.value) || 0));
          clip.fadeInSec = val;
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }
      });
    }

    if (elements.inspectorFadeOut) {
      elements.inspectorFadeOut.addEventListener('change', (e) => {
        const clip = getClipById(state.selectedClipId);
        if (clip) {
          const val = Math.max(0, Math.min(clip.durationSec / 2, parseFloat(e.target.value) || 0));
          clip.fadeOutSec = val;
          renderClips();
          selectClip(clip.id);
          triggerAutosave();
        }
      });
    }

    if (elements.btnSplitAtPlayhead) {
      elements.btnSplitAtPlayhead.addEventListener('click', splitClipAtPlayhead);
    }

    if (elements.btnDuplicateClip) {
      elements.btnDuplicateClip.addEventListener('click', () => {
        if (state.selectedClipId) duplicateClip(state.selectedClipId);
      });
    }

    if (elements.btnDeleteClip) {
      elements.btnDeleteClip.addEventListener('click', () => {
        if (state.selectedClipId) deleteClip(state.selectedClipId);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 16. Track Controls & Multi-Track Mixer Engine (Phase 5)
  // --------------------------------------------------------------------------
  function toggleMixerConsole(forceState) {
    state.mixer.consoleOpen = (typeof forceState === 'boolean') ? forceState : !state.mixer.consoleOpen;
    if (elements.mixerConsoleDrawer) {
      elements.mixerConsoleDrawer.style.display = state.mixer.consoleOpen ? 'flex' : 'none';
    }
    if (elements.btnToggleMixerDock) {
      elements.btnToggleMixerDock.classList.toggle('active', state.mixer.consoleOpen);
    }
    if (elements.btnToggleMixerConsole) {
      elements.btnToggleMixerConsole.classList.toggle('active', state.mixer.consoleOpen);
    }
  }

  function syncTrackVolume(trackId, val, source) {
    const id = Number(trackId);
    if (!state.tracks[id]) return;
    val = Math.max(-60, Math.min(6, isNaN(val) ? 0 : val));
    state.tracks[id].vol = val;
    const formatted = val > 0 ? `+${val.toFixed(1)} dB` : `${val.toFixed(1)} dB`;

    // Timeline Header
    if (source !== 'timeline') {
      const tlSlider = document.querySelector(`.track-volume[data-track="${id}"]`);
      if (tlSlider) tlSlider.value = val;
    }
    const tlReadout = document.getElementById(`volReadout-${id}`);
    if (tlReadout) tlReadout.textContent = formatted;

    // Console Strip
    if (source !== 'console') {
      const consoleFader = document.getElementById(`stripVol-${id}`);
      if (consoleFader) consoleFader.value = val;
    }
    const consoleReadout = document.getElementById(`stripVolVal-${id}`);
    if (consoleReadout) consoleReadout.textContent = formatted;

    triggerAutosave();
  }

  function syncTrackPan(trackId, val, source) {
    const id = Number(trackId);
    if (!state.tracks[id]) return;
    val = Math.max(-50, Math.min(50, isNaN(val) ? 0 : val));
    state.tracks[id].pan = val;
    const formatted = val === 0 ? 'C' : (val < 0 ? `L${Math.abs(val)}` : `R${val}`);

    // Timeline Header
    if (source !== 'timeline') {
      const tlSlider = document.querySelector(`.track-pan[data-track="${id}"]`);
      if (tlSlider) tlSlider.value = val;
    }
    const tlReadout = document.getElementById(`panReadout-${id}`);
    if (tlReadout) tlReadout.textContent = formatted;

    // Console Strip
    if (source !== 'console') {
      const consolePan = document.getElementById(`stripPan-${id}`);
      if (consolePan) consolePan.value = val;
    }
    const consoleReadout = document.getElementById(`stripPanVal-${id}`);
    if (consoleReadout) consoleReadout.textContent = formatted;

    // Inspector Channel Header (if active track)
    if (source !== 'inspector' && state.mixer.selectedTrackId === id) {
      if (elements.inputMixerPan) elements.inputMixerPan.value = val;
      if (elements.mixerPanVal) elements.mixerPanVal.textContent = formatted;
    }

    triggerAutosave();
  }

  function syncTrackMute(trackId) {
    const id = Number(trackId);
    if (!state.tracks[id]) return;
    state.tracks[id].mute = !state.tracks[id].mute;
    const isMuted = state.tracks[id].mute;

    // Timeline Header
    const tlBtn = document.querySelector(`.mini-toggle-btn.mute[data-track="${id}"]`);
    if (tlBtn) tlBtn.classList.toggle('active', isMuted);

    // Console Strip
    const stripBtn = document.getElementById(`stripMute-${id}`);
    if (stripBtn) stripBtn.classList.toggle('active', isMuted);

    // Inspector Channel Header (if active track)
    if (state.mixer.selectedTrackId === id) {
      if (elements.btnMixerMute) elements.btnMixerMute.classList.toggle('active', isMuted);
    }

    showToast(`Track ${id} ${isMuted ? 'Muted' : 'Unmuted'}`);
    triggerAutosave();
  }

  function syncTrackSolo(trackId) {
    const id = Number(trackId);
    if (!state.tracks[id]) return;
    state.tracks[id].solo = !state.tracks[id].solo;
    const isSolo = state.tracks[id].solo;

    // Timeline Header
    const tlBtn = document.querySelector(`.mini-toggle-btn.solo[data-track="${id}"]`);
    if (tlBtn) tlBtn.classList.toggle('active', isSolo);

    // Console Strip
    const stripBtn = document.getElementById(`stripSolo-${id}`);
    if (stripBtn) stripBtn.classList.toggle('active', isSolo);

    // Inspector Channel Header (if active track)
    if (state.mixer.selectedTrackId === id) {
      if (elements.btnMixerSolo) elements.btnMixerSolo.classList.toggle('active', isSolo);
    }

    showToast(`Track ${id} ${isSolo ? 'Soloed' : 'Unsoloed'}`);
    triggerAutosave();
  }

  function selectMixerTrack(trackId) {
    const id = Number(trackId);
    if (!state.tracks[id]) return;
    state.mixer.selectedTrackId = id;
    state.selectedTrackId = `track-${id}`;

    // Highlight in Timeline
    document.querySelectorAll('.track-row').forEach((row) => {
      row.classList.toggle('selected', row.dataset.trackId === `track-${id}`);
    });

    // Highlight in Mixer Console
    document.querySelectorAll('.mixer-strip').forEach((strip) => {
      strip.classList.toggle('selected', strip.dataset.track === String(id));
    });

    // Update Inspector
    if (elements.mixerTrackSelector) elements.mixerTrackSelector.value = String(id);
    updateMixerUI(id);
  }

  function renderEqCurve(trackId) {
    const t = state.tracks[trackId];
    if (!t || !t.eq) return;

    const lowGain = t.eq.low || 0;
    const midGain = t.eq.mid || 0;
    const highGain = t.eq.high || 0;

    // Map -12dB to +12dB to pixel range [80, 10] centered at 45 (0 dB)
    const lowY = (45 - (lowGain / 12) * 35).toFixed(1);
    const midY = (45 - (midGain / 12) * 35).toFixed(1);
    const highY = (45 - (highGain / 12) * 35).toFixed(1);

    // Cubic Bezier Spline through (50, lowY), (140, midY), (230, highY)
    const lineD = `M 0,${lowY} C 40,${lowY} 90,${midY} 140,${midY} C 190,${midY} 240,${highY} 280,${highY}`;
    const areaD = `${lineD} L 280,90 L 0,90 Z`;

    if (elements.eqCurveLine) elements.eqCurveLine.setAttribute('d', lineD);
    if (elements.eqCurveArea) elements.eqCurveArea.setAttribute('d', areaD);

    if (elements.eqLowDot) elements.eqLowDot.setAttribute('cy', lowY);
    if (elements.eqMidDot) elements.eqMidDot.setAttribute('cy', midY);
    if (elements.eqHighDot) elements.eqHighDot.setAttribute('cy', highY);
  }

  function renderAutomationCurve(trackId) {
    const t = state.tracks[trackId];
    if (!t || !t.automation || !elements.autoCurveSvg) return;

    const pts = t.automation.points || [];
    const svg = elements.autoCurveSvg;

    // Clear existing dynamic circles
    const oldCircles = svg.querySelectorAll('.auto-breakpoint-dot');
    oldCircles.forEach((c) => c.remove());

    if (pts.length === 0) {
      if (elements.autoCurvePath) elements.autoCurvePath.setAttribute('d', 'M0,30 L280,30');
      if (elements.autoPointCountLabel) elements.autoPointCountLabel.textContent = '0 Breakpoint Nodes';
      return;
    }

    const maxTime = Math.max(state.totalDuration, 60);
    const coords = pts.map((pt) => {
      const x = Math.min(280, Math.max(0, (pt.t / maxTime) * 280));
      const y = Math.min(55, Math.max(5, 30 - (pt.v / 6) * 20));
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    });

    coords.sort((a, b) => a.x - b.x);

    let pathD = `M 0,${coords[0].y}`;
    coords.forEach((coord) => {
      pathD += ` L ${coord.x},${coord.y}`;
    });
    pathD += ` L 280,${coords[coords.length - 1].y}`;

    if (elements.autoCurvePath) elements.autoCurvePath.setAttribute('d', pathD);

    coords.forEach((coord) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.classList.add('auto-breakpoint-dot');
      circle.setAttribute('cx', coord.x);
      circle.setAttribute('cy', coord.y);
      circle.setAttribute('r', '4.5');
      circle.setAttribute('fill', '#22D3EE');
      circle.setAttribute('stroke', '#FFFFFF');
      circle.setAttribute('stroke-width', '1.5');
      circle.style.cursor = 'grab';
      svg.appendChild(circle);
    });

    if (elements.autoPointCountLabel) {
      elements.autoPointCountLabel.textContent = `${pts.length} Breakpoint Node${pts.length === 1 ? '' : 's'}`;
    }
  }

  function updateMixerUI(trackId) {
    const t = state.tracks[trackId];
    if (!t) return;

    // Header
    if (elements.mixerTrackNameHeading) {
      elements.mixerTrackNameHeading.textContent = t.name;
    }
    if (elements.mixerTrackColorDot) {
      elements.mixerTrackColorDot.className = `track-color-pill ${t.color}`;
    }
    if (elements.mixerTrackSelector) {
      elements.mixerTrackSelector.value = String(trackId);
    }

    // Gain Trim
    if (elements.inputMixerGainTrim) elements.inputMixerGainTrim.value = t.gainTrim || 0;
    if (elements.mixerGainTrimVal) {
      const g = t.gainTrim || 0;
      elements.mixerGainTrimVal.textContent = g > 0 ? `+${g.toFixed(1)} dB` : `${g.toFixed(1)} dB`;
    }

    // Stereo Pan
    if (elements.inputMixerPan) elements.inputMixerPan.value = t.pan || 0;
    if (elements.mixerPanVal) {
      const p = t.pan || 0;
      elements.mixerPanVal.textContent = p === 0 ? 'C' : (p < 0 ? `L${Math.abs(p)}` : `R${p}`);
    }

    // Mute / Solo buttons
    if (elements.btnMixerMute) elements.btnMixerMute.classList.toggle('active', !!t.mute);
    if (elements.btnMixerSolo) elements.btnMixerSolo.classList.toggle('active', !!t.solo);

    // EQ Sliders & Curve
    if (elements.sliderEqLow) elements.sliderEqLow.value = t.eq.low;
    if (elements.eqLowGainVal) elements.eqLowGainVal.textContent = `${t.eq.low > 0 ? '+' : ''}${t.eq.low.toFixed(1)} dB`;
    if (elements.sliderEqMid) elements.sliderEqMid.value = t.eq.mid;
    if (elements.eqMidGainVal) elements.eqMidGainVal.textContent = `${t.eq.mid > 0 ? '+' : ''}${t.eq.mid.toFixed(1)} dB`;
    if (elements.sliderEqHigh) elements.sliderEqHigh.value = t.eq.high;
    if (elements.eqHighGainVal) elements.eqHighGainVal.textContent = `${t.eq.high > 0 ? '+' : ''}${t.eq.high.toFixed(1)} dB`;
    renderEqCurve(trackId);

    // FX Rack
    // Compressor
    if (elements.fxSlotComp) elements.fxSlotComp.classList.toggle('active', t.fx.comp.enabled);
    if (elements.btnToggleComp) {
      elements.btnToggleComp.classList.toggle('active', t.fx.comp.enabled);
      elements.btnToggleComp.textContent = t.fx.comp.enabled ? 'ON' : 'OFF';
    }
    if (elements.compThresh) elements.compThresh.value = t.fx.comp.thresh;
    if (elements.compThreshVal) elements.compThreshVal.textContent = `${t.fx.comp.thresh} dB`;
    if (elements.compRatio) elements.compRatio.value = t.fx.comp.ratio;
    if (elements.compRatioVal) elements.compRatioVal.textContent = `${t.fx.comp.ratio}:1`;
    if (elements.compGain) elements.compGain.value = t.fx.comp.gain;
    if (elements.compGainVal) elements.compGainVal.textContent = `+${t.fx.comp.gain.toFixed(1)} dB`;

    // Reverb
    if (elements.fxSlotReverb) elements.fxSlotReverb.classList.toggle('active', t.fx.reverb.enabled);
    if (elements.btnToggleReverb) {
      elements.btnToggleReverb.classList.toggle('active', t.fx.reverb.enabled);
      elements.btnToggleReverb.textContent = t.fx.reverb.enabled ? 'ON' : 'OFF';
    }
    if (elements.revDecay) elements.revDecay.value = t.fx.reverb.decay;
    if (elements.revDecayVal) elements.revDecayVal.textContent = `${t.fx.reverb.decay.toFixed(1)}s`;
    if (elements.revMix) elements.revMix.value = t.fx.reverb.mix;
    if (elements.revMixVal) elements.revMixVal.textContent = `${t.fx.reverb.mix}%`;

    // Delay
    if (elements.fxSlotDelay) elements.fxSlotDelay.classList.toggle('active', t.fx.delay.enabled);
    if (elements.btnToggleDelay) {
      elements.btnToggleDelay.classList.toggle('active', t.fx.delay.enabled);
      elements.btnToggleDelay.textContent = t.fx.delay.enabled ? 'ON' : 'OFF';
    }
    if (elements.delayTimeSelect) elements.delayTimeSelect.value = t.fx.delay.time;
    if (elements.delayTimeVal) elements.delayTimeVal.textContent = t.fx.delay.time;
    if (elements.delayFeedback) elements.delayFeedback.value = t.fx.delay.feedback;
    if (elements.delayFeedbackVal) elements.delayFeedbackVal.textContent = `${t.fx.delay.feedback}%`;
    if (elements.delayMix) elements.delayMix.value = t.fx.delay.mix;
    if (elements.delayMixVal) elements.delayMixVal.textContent = `${t.fx.delay.mix}%`;

    // Active FX Badge Count
    const activeFxCount = (t.fx.comp.enabled ? 1 : 0) + (t.fx.reverb.enabled ? 1 : 0) + (t.fx.delay.enabled ? 1 : 0);
    if (elements.fxActiveCountBadge) {
      elements.fxActiveCountBadge.textContent = `${activeFxCount} Active`;
    }

    // Automation
    if (elements.autoParamSelect) elements.autoParamSelect.value = t.automation.param;
    document.querySelectorAll('.auto-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.mode === t.automation.mode);
    });
    renderAutomationCurve(trackId);
  }

  function updateFxBadges(trackId) {
    const t = state.tracks[trackId];
    if (!t) return;
    const activeFxCount = (t.fx.comp.enabled ? 1 : 0) + (t.fx.reverb.enabled ? 1 : 0) + (t.fx.delay.enabled ? 1 : 0);
    if (elements.fxActiveCountBadge) {
      elements.fxActiveCountBadge.textContent = `${activeFxCount} Active`;
    }
    const strip = document.querySelector(`.mixer-strip[data-track="${trackId}"]`);
    if (strip) {
      const badges = strip.querySelectorAll('.mini-fx-badge');
      if (badges.length >= 3) {
        badges[0].classList.toggle('active', t.fx.comp.enabled);
        badges[1].classList.toggle('active', t.fx.reverb.enabled);
        badges[2].classList.toggle('active', t.fx.delay.enabled);
      }
    }
  }

  function renderMixerConsoleStrips() {
    if (!elements.mixerStripsContainer) return;

    let html = '';
    // 4 Channel Strips
    [1, 2, 3, 4].forEach((id) => {
      const track = state.tracks[id];
      if (!track) return;
      const isSelected = state.mixer.selectedTrackId === id;
      const panStr = track.pan === 0 ? 'C' : (track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`);
      const volStr = track.vol > 0 ? `+${track.vol.toFixed(1)}` : track.vol.toFixed(1);

      html += `
        <div class="mixer-strip ${isSelected ? 'selected' : ''}" data-track="${id}">
          <div class="strip-top">
            <div class="strip-title-badge">
              <div class="track-color-pill ${track.color}"></div>
              <span class="strip-name" title="${track.name}">${track.name}</span>
            </div>
            <div class="strip-badges-row">
              <span class="mini-fx-badge ${track.fx.comp.enabled ? 'active' : ''}">C</span>
              <span class="mini-fx-badge ${track.fx.reverb.enabled ? 'active' : ''}">R</span>
              <span class="mini-fx-badge ${track.fx.delay.enabled ? 'active' : ''}">D</span>
            </div>
          </div>

          <div class="strip-pan-row">
            <span class="strip-pan-label">PAN</span>
            <input type="range" class="slider-input strip-pan-slider" id="stripPan-${id}" data-track="${id}" min="-100" max="100" value="${track.pan}" step="1" aria-label="Track ${id} Pan">
            <span class="strip-pan-val tabular-nums" id="stripPanVal-${id}">${panStr}</span>
          </div>

          <div class="strip-mute-solo-row">
            <button class="strip-btn mute ${track.mute ? 'active' : ''}" data-track="${id}" id="stripMute-${id}" title="Mute Track ${id}">M</button>
            <button class="strip-btn solo ${track.solo ? 'active' : ''}" data-track="${id}" id="stripSolo-${id}" title="Solo Track ${id}">S</button>
          </div>

          <div class="strip-fader-meter-row">
            <input type="range" class="strip-vertical-fader" id="stripVol-${id}" data-track="${id}" min="-60" max="6" value="${track.vol}" step="0.5" orient="vertical" aria-label="Track ${id} Volume Fader">
            <div class="strip-stereo-meters">
              <div class="strip-meter-channel">
                <div class="strip-clip-led" id="stripClipL-${id}"></div>
                <div class="strip-meter-track">
                  <div class="strip-meter-fill" id="stripMeterL-${id}" style="height: 6%;"></div>
                </div>
              </div>
              <div class="strip-meter-channel">
                <div class="strip-clip-led" id="stripClipR-${id}"></div>
                <div class="strip-meter-track">
                  <div class="strip-meter-fill" id="stripMeterR-${id}" style="height: 6%;"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="strip-vol-readout tabular-nums" id="stripVolVal-${id}">${volStr} dB</div>
        </div>
      `;
    });

    // Master Bus Strip
    const masterVol = state.mixer.master.vol || 0;
    const masterVolStr = masterVol > 0 ? `+${masterVol.toFixed(1)}` : masterVol.toFixed(1);
    html += `
      <div class="mixer-strip master" data-track="master">
        <div class="strip-top">
          <div class="strip-title-badge">
            <div class="track-color-pill" style="background: var(--primary);"></div>
            <span class="strip-name" style="color: var(--primary); font-weight: 700;">MASTER BUS</span>
          </div>
          <div class="strip-badges-row">
            <span class="mini-fx-badge active" title="Brickwall Peak Limiter">LIM</span>
          </div>
        </div>

        <div class="strip-pan-row">
          <span class="strip-pan-label">BAL</span>
          <input type="range" class="slider-input strip-pan-slider" id="stripPan-master" data-track="master" min="-100" max="100" value="0" step="1" aria-label="Master Balance">
          <span class="strip-pan-val tabular-nums" id="stripPanVal-master">C</span>
        </div>

        <div class="strip-mute-solo-row">
          <button class="strip-btn" id="stripLimiterToggle" style="background: rgba(139, 92, 246, 0.2); color: #C4B5FD; border-color: rgba(139, 92, 246, 0.4);" title="Brickwall Limiter Active">LIMITER</button>
        </div>

        <div class="strip-fader-meter-row">
          <input type="range" class="strip-vertical-fader" id="stripVol-master" data-track="master" min="-60" max="6" value="${masterVol}" step="0.5" orient="vertical" aria-label="Master Volume Fader">
          <div class="strip-stereo-meters">
            <div class="strip-meter-channel">
              <div class="strip-clip-led" id="stripClipL-master"></div>
              <div class="strip-meter-track">
                <div class="strip-meter-fill" id="stripMeterL-master" style="height: 12%;"></div>
              </div>
            </div>
            <div class="strip-meter-channel">
              <div class="strip-clip-led" id="stripClipR-master"></div>
              <div class="strip-meter-track">
                <div class="strip-meter-fill" id="stripMeterR-master" style="height: 10%;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="strip-vol-readout tabular-nums" id="stripVolVal-master">${masterVolStr} dB</div>
      </div>
    `;

    elements.mixerStripsContainer.innerHTML = html;
    wireMixerConsoleEvents();
  }

  function wireMixerConsoleEvents() {
    document.querySelectorAll('.mixer-strip').forEach((strip) => {
      strip.addEventListener('click', (e) => {
        if (['INPUT', 'BUTTON', 'SELECT'].includes(e.target.tagName)) return;
        const trackId = strip.dataset.track;
        if (trackId && trackId !== 'master') {
          selectMixerTrack(trackId);
        }
      });
    });

    document.querySelectorAll('.strip-vertical-fader').forEach((fader) => {
      fader.addEventListener('input', (e) => {
        const trackId = e.target.dataset.track;
        const val = parseFloat(e.target.value);
        if (trackId === 'master') {
          state.mixer.master.vol = val;
          const readout = document.getElementById('stripVolVal-master');
          if (readout) readout.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
          if (elements.masterVolumeSlider) elements.masterVolumeSlider.value = val;
          if (elements.masterDbReadout) elements.masterDbReadout.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
          triggerAutosave();
        } else {
          syncTrackVolume(trackId, val, 'console');
        }
      });
    });

    document.querySelectorAll('.strip-pan-slider').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const trackId = e.target.dataset.track;
        const val = parseInt(e.target.value, 10);
        if (trackId === 'master') {
          const readout = document.getElementById('stripPanVal-master');
          if (readout) readout.textContent = val === 0 ? 'C' : (val < 0 ? `L${Math.abs(val)}` : `R${val}`);
        } else {
          syncTrackPan(trackId, val, 'console');
        }
      });
    });

    document.querySelectorAll('.strip-btn.mute').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.dataset.track;
        if (trackId) syncTrackMute(trackId);
      });
    });

    document.querySelectorAll('.strip-btn.solo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.dataset.track;
        if (trackId) syncTrackSolo(trackId);
      });
    });

    const limiterBtn = document.getElementById('stripLimiterToggle');
    if (limiterBtn) {
      limiterBtn.addEventListener('click', () => {
        state.mixer.master.limiter = !state.mixer.master.limiter;
        limiterBtn.style.opacity = state.mixer.master.limiter ? '1' : '0.4';
        showToast(state.mixer.master.limiter ? 'Master Limiter: Engaged (0 dBFS Ceiling)' : 'Master Limiter: Bypassed');
      });
    }
  }

  function initTrackControls() {
    document.querySelectorAll('.track-volume').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const trackId = e.target.dataset.track;
        const val = parseFloat(e.target.value);
        syncTrackVolume(trackId, val, 'timeline');
      });
    });

    document.querySelectorAll('.track-pan').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const trackId = e.target.dataset.track;
        const val = parseInt(e.target.value, 10);
        syncTrackPan(trackId, val, 'timeline');
      });
    });

    document.querySelectorAll('.mini-toggle-btn.mute').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.dataset.track;
        if (trackId) syncTrackMute(trackId);
      });
    });

    document.querySelectorAll('.mini-toggle-btn.solo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.dataset.track;
        if (trackId) syncTrackSolo(trackId);
      });
    });

    if (elements.masterVolumeSlider) {
      elements.masterVolumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.mixer.master.vol = val;
        if (elements.masterDbReadout) {
          elements.masterDbReadout.textContent = val > 0 ? `+${val.toFixed(1)} dB` : `${val.toFixed(1)} dB`;
        }
        const stripVol = document.getElementById('stripVol-master');
        if (stripVol) stripVol.value = val;
        const stripReadout = document.getElementById('stripVolVal-master');
        if (stripReadout) stripReadout.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
        triggerAutosave();
      });
    }

    document.querySelectorAll('.track-row').forEach((row) => {
      row.addEventListener('click', () => {
        const trackId = row.dataset.trackId;
        if (trackId) {
          const numId = parseInt(trackId.replace('track-', ''), 10);
          selectMixerTrack(numId);
        }
      });
    });
  }

  function initMixerModule() {
    renderMixerConsoleStrips();

    if (elements.btnToggleMixerDock) {
      elements.btnToggleMixerDock.addEventListener('click', () => toggleMixerConsole());
    }
    if (elements.btnToggleMixerConsole) {
      elements.btnToggleMixerConsole.addEventListener('click', () => toggleMixerConsole());
    }
    if (elements.btnCloseMixerConsole) {
      elements.btnCloseMixerConsole.addEventListener('click', () => toggleMixerConsole(false));
    }

    if (elements.btnMasterMonoToggle) {
      elements.btnMasterMonoToggle.addEventListener('click', () => {
        state.mixer.master.mono = !state.mixer.master.mono;
        elements.btnMasterMonoToggle.classList.toggle('active', state.mixer.master.mono);
        elements.btnMasterMonoToggle.textContent = state.mixer.master.mono ? 'Mono (Active)' : 'Stereo';
        showToast(state.mixer.master.mono ? 'Master Output: Summed Mono' : 'Master Output: Normal Stereo');
      });
    }

    if (elements.mixerTrackSelector) {
      elements.mixerTrackSelector.addEventListener('change', (e) => {
        selectMixerTrack(e.target.value);
      });
    }

    if (elements.inputMixerGainTrim) {
      elements.inputMixerGainTrim.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        val = Math.max(-24, Math.min(24, isNaN(val) ? 0 : val));
        const trackId = state.mixer.selectedTrackId;
        if (state.tracks[trackId]) {
          state.tracks[trackId].gainTrim = val;
          if (elements.mixerGainTrimVal) {
            elements.mixerGainTrimVal.textContent = val > 0 ? `+${val.toFixed(1)} dB` : `${val.toFixed(1)} dB`;
          }
          triggerAutosave();
        }
      });
    }

    if (elements.inputMixerPan) {
      elements.inputMixerPan.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        val = Math.max(-50, Math.min(50, isNaN(val) ? 0 : val));
        const trackId = state.mixer.selectedTrackId;
        syncTrackPan(trackId, val, 'inspector');
      });
    }

    if (elements.btnMixerMute) {
      elements.btnMixerMute.addEventListener('click', () => {
        syncTrackMute(state.mixer.selectedTrackId);
      });
    }
    if (elements.btnMixerSolo) {
      elements.btnMixerSolo.addEventListener('click', () => {
        syncTrackSolo(state.mixer.selectedTrackId);
      });
    }

    const handleEqChange = () => {
      const trackId = state.mixer.selectedTrackId;
      if (!state.tracks[trackId]) return;
      const low = parseFloat(elements.sliderEqLow.value);
      const mid = parseFloat(elements.sliderEqMid.value);
      const high = parseFloat(elements.sliderEqHigh.value);
      state.tracks[trackId].eq = { low, mid, high };
      if (elements.eqLowGainVal) elements.eqLowGainVal.textContent = `${low > 0 ? '+' : ''}${low.toFixed(1)} dB`;
      if (elements.eqMidGainVal) elements.eqMidGainVal.textContent = `${mid > 0 ? '+' : ''}${mid.toFixed(1)} dB`;
      if (elements.eqHighGainVal) elements.eqHighGainVal.textContent = `${high > 0 ? '+' : ''}${high.toFixed(1)} dB`;
      renderEqCurve(trackId);
      triggerAutosave();
    };

    if (elements.sliderEqLow) elements.sliderEqLow.addEventListener('input', handleEqChange);
    if (elements.sliderEqMid) elements.sliderEqMid.addEventListener('input', handleEqChange);
    if (elements.sliderEqHigh) elements.sliderEqHigh.addEventListener('input', handleEqChange);

    if (elements.btnResetEq) {
      elements.btnResetEq.addEventListener('click', () => {
        const trackId = state.mixer.selectedTrackId;
        if (!state.tracks[trackId]) return;
        state.tracks[trackId].eq = { low: 0, mid: 0, high: 0 };
        if (elements.sliderEqLow) elements.sliderEqLow.value = 0;
        if (elements.sliderEqMid) elements.sliderEqMid.value = 0;
        if (elements.sliderEqHigh) elements.sliderEqHigh.value = 0;
        if (elements.eqLowGainVal) elements.eqLowGainVal.textContent = '0.0 dB';
        if (elements.eqMidGainVal) elements.eqMidGainVal.textContent = '0.0 dB';
        if (elements.eqHighGainVal) elements.eqHighGainVal.textContent = '0.0 dB';
        renderEqCurve(trackId);
        showToast('EQ curve set to Flat');
        triggerAutosave();
      });
    }

    // FX Compressor
    if (elements.btnToggleComp) {
      elements.btnToggleComp.addEventListener('click', () => {
        const t = state.tracks[state.mixer.selectedTrackId];
        if (!t) return;
        t.fx.comp.enabled = !t.fx.comp.enabled;
        elements.btnToggleComp.classList.toggle('active', t.fx.comp.enabled);
        elements.btnToggleComp.textContent = t.fx.comp.enabled ? 'ON' : 'OFF';
        if (elements.fxSlotComp) elements.fxSlotComp.classList.toggle('active', t.fx.comp.enabled);
        updateFxBadges(state.mixer.selectedTrackId);
        triggerAutosave();
      });
    }
    if (elements.compThresh) {
      elements.compThresh.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.comp.thresh = val;
        if (elements.compThreshVal) elements.compThreshVal.textContent = `${val} dB`;
        triggerAutosave();
      });
    }
    if (elements.compRatio) {
      elements.compRatio.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.comp.ratio = val;
        if (elements.compRatioVal) elements.compRatioVal.textContent = `${val}:1`;
        triggerAutosave();
      });
    }
    if (elements.compGain) {
      elements.compGain.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.comp.gain = val;
        if (elements.compGainVal) elements.compGainVal.textContent = `+${val.toFixed(1)} dB`;
        triggerAutosave();
      });
    }

    // FX Reverb
    if (elements.btnToggleReverb) {
      elements.btnToggleReverb.addEventListener('click', () => {
        const t = state.tracks[state.mixer.selectedTrackId];
        if (!t) return;
        t.fx.reverb.enabled = !t.fx.reverb.enabled;
        elements.btnToggleReverb.classList.toggle('active', t.fx.reverb.enabled);
        elements.btnToggleReverb.textContent = t.fx.reverb.enabled ? 'ON' : 'OFF';
        if (elements.fxSlotReverb) elements.fxSlotReverb.classList.toggle('active', t.fx.reverb.enabled);
        updateFxBadges(state.mixer.selectedTrackId);
        triggerAutosave();
      });
    }
    if (elements.revDecay) {
      elements.revDecay.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.reverb.decay = val;
        if (elements.revDecayVal) elements.revDecayVal.textContent = `${val.toFixed(1)}s`;
        triggerAutosave();
      });
    }
    if (elements.revMix) {
      elements.revMix.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.reverb.mix = val;
        if (elements.revMixVal) elements.revMixVal.textContent = `${val}%`;
        triggerAutosave();
      });
    }

    // FX Delay
    if (elements.btnToggleDelay) {
      elements.btnToggleDelay.addEventListener('click', () => {
        const t = state.tracks[state.mixer.selectedTrackId];
        if (!t) return;
        t.fx.delay.enabled = !t.fx.delay.enabled;
        elements.btnToggleDelay.classList.toggle('active', t.fx.delay.enabled);
        elements.btnToggleDelay.textContent = t.fx.delay.enabled ? 'ON' : 'OFF';
        if (elements.fxSlotDelay) elements.fxSlotDelay.classList.toggle('active', t.fx.delay.enabled);
        updateFxBadges(state.mixer.selectedTrackId);
        triggerAutosave();
      });
    }
    if (elements.delayTimeSelect) {
      elements.delayTimeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.delay.time = val;
        if (elements.delayTimeVal) elements.delayTimeVal.textContent = val;
        triggerAutosave();
      });
    }
    if (elements.delayFeedback) {
      elements.delayFeedback.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.delay.feedback = val;
        if (elements.delayFeedbackVal) elements.delayFeedbackVal.textContent = `${val}%`;
        triggerAutosave();
      });
    }
    if (elements.delayMix) {
      elements.delayMix.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t) t.fx.delay.mix = val;
        if (elements.delayMixVal) elements.delayMixVal.textContent = `${val}%`;
        triggerAutosave();
      });
    }

    // Automation Mode Pills
    document.querySelectorAll('.auto-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const mode = pill.dataset.mode;
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t && t.automation) {
          t.automation.mode = mode;
          document.querySelectorAll('.auto-pill').forEach((p) => p.classList.toggle('active', p.dataset.mode === mode));
          showToast(`Automation Mode: ${mode.toUpperCase()}`);
          triggerAutosave();
        }
      });
    });

    // Automation Parameter dropdown
    if (elements.autoParamSelect) {
      elements.autoParamSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t && t.automation) {
          t.automation.param = val;
          renderAutomationCurve(state.mixer.selectedTrackId);
          triggerAutosave();
        }
      });
    }

    // Automation Curve Click to Add Node
    if (elements.autoCurveWrap) {
      elements.autoCurveWrap.addEventListener('click', (e) => {
        const rect = elements.autoCurveWrap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const ratioX = Math.max(0, Math.min(1, clickX / rect.width));
        const ratioY = Math.max(0, Math.min(1, clickY / rect.height));

        const t = state.tracks[state.mixer.selectedTrackId];
        if (t && t.automation) {
          const timeSec = Math.round(ratioX * state.totalDuration);
          const val = Math.round((0.5 - ratioY) * 12 * 10) / 10;
          t.automation.points.push({ t: timeSec, v: val });
          renderAutomationCurve(state.mixer.selectedTrackId);
          showToast(`Added breakpoint at ${timeSec}s (${val > 0 ? '+' : ''}${val} dB)`);
          triggerAutosave();
        }
      });
    }

    // Clear Automation Nodes
    if (elements.btnClearAutomation) {
      elements.btnClearAutomation.addEventListener('click', () => {
        const t = state.tracks[state.mixer.selectedTrackId];
        if (t && t.automation) {
          t.automation.points = [{ t: 0, v: 0 }];
          renderAutomationCurve(state.mixer.selectedTrackId);
          showToast('Automation nodes cleared');
          triggerAutosave();
        }
      });
    }

    // Initial render of mixer UI
    updateMixerUI(state.mixer.selectedTrackId);
  }

  // --------------------------------------------------------------------------
  // 17. Phase 6: Intelligent Mixing Tools Engine
  // --------------------------------------------------------------------------
  function updateAiInspectorUI(clip) {
    const currentClip = clip || getClipById(state.selectedClipId) || state.clips[0];
    if (!currentClip) return;

    const projectBpm = state.activeProject ? state.activeProject.bpm : 128.0;
    const projectKey = state.activeProject ? state.activeProject.key : 'A min';

    // BPM Match section
    const clipBpm = currentClip.bpm || 128.0;
    if (elements.aiClipBpmVal) elements.aiClipBpmVal.textContent = `${clipBpm.toFixed(1)} BPM`;
    if (elements.aiProjectBpmVal) elements.aiProjectBpmVal.textContent = `${projectBpm.toFixed(1)} BPM`;

    const bpmDelta = clipBpm - projectBpm;
    const stretchPct = ((projectBpm / clipBpm - 1) * 100).toFixed(1);
    if (elements.aiStretchFactor) {
      if (Math.abs(bpmDelta) < 0.1) {
        elements.aiStretchFactor.textContent = 'Tempo Shift: 0.0% (In Sync)';
        if (elements.btnMatchBpm) {
          elements.btnMatchBpm.textContent = 'Synced';
          elements.btnMatchBpm.classList.add('active');
        }
      } else {
        elements.aiStretchFactor.textContent = `Shift: ${stretchPct > 0 ? '+' : ''}${stretchPct}% (${clipBpm > projectBpm ? '-' : '+'}${Math.abs(bpmDelta).toFixed(1)} BPM)`;
        if (elements.btnMatchBpm) {
          elements.btnMatchBpm.textContent = 'Match BPM';
          elements.btnMatchBpm.classList.remove('active');
        }
      }
    }

    // Harmonic Key Match section
    const clipKey = currentClip.key || 'A min';
    const camelotRel = getCamelotRelationship(clipKey, projectKey);
    if (elements.aiCamelotBadge && elements.aiCamelotText) {
      elements.aiCamelotText.textContent = camelotRel.badgeText;
    }
    if (elements.aiTransposeSuggestion) {
      elements.aiTransposeSuggestion.textContent = camelotRel.transpose;
    }
    if (elements.btnHarmonizeKey) {
      elements.btnHarmonizeKey.textContent = camelotRel.semitones === 0 ? 'Harmonized' : 'Harmonize';
      elements.btnHarmonizeKey.classList.toggle('active', camelotRel.semitones === 0);
    }

    // Beat Alignment section
    const barLength = (60 / projectBpm) * 4;
    const currentStart = currentClip.startSec;
    const nearestBarIdx = Math.round(currentStart / barLength);
    const targetBarSec = nearestBarIdx * barLength;
    const offsetDiff = (currentStart - targetBarSec);
    if (elements.aiDownbeatOffset) {
      if (Math.abs(offsetDiff) < 0.05) {
        elements.aiDownbeatOffset.textContent = `Aligned to Bar ${nearestBarIdx + 1}.1 (0.00s offset)`;
      } else {
        elements.aiDownbeatOffset.textContent = `${offsetDiff > 0 ? '+' : ''}${offsetDiff.toFixed(2)}s to Bar ${nearestBarIdx + 1}.1`;
      }
    }

    // Smart Transition section
    const nextClip = state.clips.find((c) => c.id !== currentClip.id && Math.abs(c.startSec - (currentClip.startSec + currentClip.durationSec)) < 8.0);
    if (elements.aiTransitionContext) {
      if (nextClip) {
        elements.aiTransitionContext.textContent = `Context: ${currentClip.title.slice(0, 18)}... → ${nextClip.title.slice(0, 18)}...`;
      } else {
        elements.aiTransitionContext.textContent = `Context: ${currentClip.title.slice(0, 24)} (Track ${currentClip.trackId})`;
      }
    }

    // Silence Detection section
    const silenceSec = (currentClip.waveformSeed % 2 === 0) ? 0.35 : 0.22;
    if (elements.aiSilenceDetectedText) {
      elements.aiSilenceDetectedText.textContent = `${silenceSec}s leading low-signal onset detected`;
    }

    // Loudness Normalization section
    const profile = ANALYSIS_PROFILES[currentClip.id] || { lufsIntegrated: -14.2 };
    const currentLufs = profile.lufsIntegrated || -14.0;
    if (elements.aiCurrentLufsVal) {
      elements.aiCurrentLufsVal.textContent = `${currentLufs.toFixed(1)} LUFS`;
    }
    const targetLufs = elements.aiTargetLufsSelect ? parseFloat(elements.aiTargetLufsSelect.value) : -14.0;
    const lufsDelta = (targetLufs - currentLufs).toFixed(1);
    if (elements.aiLoudnessDeltaVal) {
      elements.aiLoudnessDeltaVal.textContent = `Required Offset: ${lufsDelta > 0 ? '+' : ''}${lufsDelta} dB`;
    }
  }

  function matchClipBpmToProject(clipId) {
    const clip = getClipById(clipId || state.selectedClipId);
    if (!clip) return;
    const projectBpm = state.activeProject ? state.activeProject.bpm : 128.0;
    clip.bpm = projectBpm;
    showToast(`BPM Matched: ${clip.title} locked to ${projectBpm.toFixed(1)} BPM`);
    updateAiInspectorUI(clip);
    renderClips();
    triggerAutosave();
  }

  function matchClipKeyToProject(clipId) {
    const clip = getClipById(clipId || state.selectedClipId);
    if (!clip) return;
    const projectKey = state.activeProject ? state.activeProject.key : 'A min';
    clip.key = projectKey;
    showToast(`Harmonic Key Matched: Transposed ${clip.title} to ${projectKey}`);
    updateAiInspectorUI(clip);
    renderClips();
    triggerAutosave();
  }

  function syncClipToNearestBar(clipId) {
    const clip = getClipById(clipId || state.selectedClipId);
    if (!clip) return;
    const projectBpm = state.activeProject ? state.activeProject.bpm : 128.0;
    const barLength = (60 / projectBpm) * 4;
    const nearestBarIdx = Math.round(clip.startSec / barLength);
    clip.startSec = Math.max(0, Math.round(nearestBarIdx * barLength * 1000) / 1000);
    showToast(`Beat Sync: Aligned downbeat to Bar ${nearestBarIdx + 1}.1 (${clip.startSec.toFixed(2)}s)`);
    updateAiInspectorUI(clip);
    renderClips();
    triggerAutosave();
  }

  function autoTrimSilence(clipId) {
    const clip = getClipById(clipId || state.selectedClipId);
    if (!clip) return;
    const trimSec = 0.35;
    if (clip.durationSec <= trimSec + 0.5) {
      showToast('Clip duration too short for silence trimming');
      return;
    }
    pushHistorySnapshot('Intelligent Trim');
    clip.startSec = Math.round((clip.startSec + trimSec) * 100) / 100;
    clip.durationSec = Math.round((clip.durationSec - trimSec) * 100) / 100;
    clip.fadeInSec = Math.max(clip.fadeInSec, 0.05);
    showToast(`Intelligent Trim: Removed ${trimSec}s leading silence`);
    updateAiInspectorUI(clip);
    renderClips();
    triggerAutosave();
  }

  function normalizeClipLoudness(clipId, targetLufs) {
    const clip = getClipById(clipId || state.selectedClipId);
    if (!clip) return;
    const profile = ANALYSIS_PROFILES[clip.id] || { lufsIntegrated: -14.2 };
    const target = (typeof targetLufs === 'number') ? targetLufs : (elements.aiTargetLufsSelect ? parseFloat(elements.aiTargetLufsSelect.value) : -14.0);
    const delta = Math.round((target - profile.lufsIntegrated) * 10) / 10;

    pushHistorySnapshot('Loudness Normalization');

    if (state.tracks[clip.trackId]) {
      state.tracks[clip.trackId].gainTrim = delta;
      if (elements.inputMixerGainTrim && state.mixer.selectedTrackId === clip.trackId) {
        elements.inputMixerGainTrim.value = delta;
        if (elements.mixerGainTrimVal) elements.mixerGainTrimVal.textContent = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} dB`;
      }
    }
    showToast(`Loudness Normalized: Track ${clip.trackId} Gain Trim adjusted by ${delta > 0 ? '+' : ''}${delta} dB`);
    updateAiInspectorUI(clip);
    triggerAutosave();
  }

  function applySmartTransition(style, durationSec) {
    const clip = getClipById(state.selectedClipId);
    if (!clip) {
      showToast('Select a clip to apply transition');
      return;
    }
    const dur = (typeof durationSec === 'number') ? durationSec : (elements.aiTransitionDurationSelect ? parseFloat(elements.aiTransitionDurationSelect.value) : 1.88);
    const st = style || state.ai.activeTransitionStyle;

    pushHistorySnapshot('Smart Transition');

    if (st === 'energy') {
      clip.fadeOutSec = dur;
      showToast(`Smart Transition: Applied ${dur}s Energy Drop Crossfade to ${clip.title}`);
    } else if (st === 'filter') {
      clip.fadeOutSec = dur / 2;
      if (state.tracks[clip.trackId]) {
        state.tracks[clip.trackId].eq.high = 3.0;
        state.tracks[clip.trackId].eq.low = -4.0;
        renderEqCurve(clip.trackId);
      }
      showToast(`Smart Transition: Applied HPF Filter Sweep Transition (${dur}s)`);
    } else if (st === 'echo') {
      clip.fadeOutSec = dur;
      if (state.tracks[clip.trackId]) {
        state.tracks[clip.trackId].fx.reverb.enabled = true;
        state.tracks[clip.trackId].fx.reverb.decay = 3.5;
        state.tracks[clip.trackId].fx.reverb.mix = 50;
        updateFxBadges(clip.trackId);
      }
      showToast(`Smart Transition: Applied Echo & Reverb Tail Wash (${dur}s)`);
    } else if (st === 'cut') {
      clip.fadeOutSec = 0.02;
      showToast(`Smart Transition: Applied Hard Beat Cut at ${(clip.startSec + clip.durationSec).toFixed(2)}s`);
    }

    renderClips();
    triggerAutosave();
  }

  function openAutoMixModal() {
    if (elements.autoMixModal) {
      elements.autoMixModal.classList.add('open');
      selectAutoMixPreset(state.ai.activePreset || 'radio_pop');
    }
  }

  function closeAutoMixModal() {
    if (elements.autoMixModal) {
      elements.autoMixModal.classList.remove('open');
    }
  }

  function selectAutoMixPreset(presetKey) {
    state.ai.activePreset = presetKey;
    const p = AUTO_MIX_PRESETS[presetKey];
    if (!p) return;

    document.querySelectorAll('.auto-mix-preset-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.preset === presetKey);
    });

    if (elements.previewBar1 && p.bars[1]) elements.previewBar1.style.width = p.bars[1].pct;
    if (elements.previewVal1 && p.bars[1]) elements.previewVal1.textContent = p.bars[1].val;
    if (elements.previewBar2 && p.bars[2]) elements.previewBar2.style.width = p.bars[2].pct;
    if (elements.previewVal2 && p.bars[2]) elements.previewVal2.textContent = p.bars[2].val;
    if (elements.previewBar3 && p.bars[3]) elements.previewBar3.style.width = p.bars[3].pct;
    if (elements.previewVal3 && p.bars[3]) elements.previewVal3.textContent = p.bars[3].val;
    if (elements.previewBar4 && p.bars[4]) elements.previewBar4.style.width = p.bars[4].pct;
    if (elements.previewVal4 && p.bars[4]) elements.previewVal4.textContent = p.bars[4].val;
  }

  function applyAutoMix() {
    const p = AUTO_MIX_PRESETS[state.ai.activePreset || 'radio_pop'];
    if (!p) return;

    pushHistorySnapshot(`Auto Mix: ${p.name}`);
    state.ai.previousMixSnapshot = JSON.parse(JSON.stringify(state.tracks));

    [1, 2, 3, 4].forEach((id) => {
      const target = p.tracks[id];
      if (state.tracks[id] && target) {
        syncTrackVolume(id, target.vol, 'ai');
        syncTrackPan(id, target.pan, 'ai');
        state.tracks[id].gainTrim = target.gainTrim;

        if (!elements.chkAutoEq || elements.chkAutoEq.checked) {
          state.tracks[id].eq = { ...target.eq };
        }
        if (!elements.chkAutoDynamics || elements.chkAutoDynamics.checked) {
          state.tracks[id].fx.comp = { ...state.tracks[id].fx.comp, ...target.comp };
          state.tracks[id].fx.reverb = { ...state.tracks[id].fx.reverb, ...target.reverb };
        }
      }
    });

    state.ai.autoMixApplied = true;

    if (elements.aiAutoMixStatusText) elements.aiAutoMixStatusText.textContent = `Applied (${p.name})`;
    if (elements.btnRevertAutoMix) elements.btnRevertAutoMix.style.display = 'inline-flex';

    updateMixerUI(state.mixer.selectedTrackId);
    renderMixerConsoleStrips();
    closeAutoMixModal();
    showToast(`Auto Mix Applied: Configured 4 stem channels for ${p.name}`);
    triggerAutosave();
  }

  function revertAutoMix() {
    if (!state.ai.previousMixSnapshot) return;
    state.tracks = JSON.parse(JSON.stringify(state.ai.previousMixSnapshot));
    state.ai.autoMixApplied = false;

    [1, 2, 3, 4].forEach((id) => {
      syncTrackVolume(id, state.tracks[id].vol, 'ai');
      syncTrackPan(id, state.tracks[id].pan, 'ai');
    });

    if (elements.aiAutoMixStatusText) elements.aiAutoMixStatusText.textContent = 'Ready';
    if (elements.btnRevertAutoMix) elements.btnRevertAutoMix.style.display = 'none';

    updateMixerUI(state.mixer.selectedTrackId);
    renderMixerConsoleStrips();
    showToast('Reverted to previous manual mix configuration');
    triggerAutosave();
  }

  function initAiModule() {
    if (elements.btnMatchBpm) {
      elements.btnMatchBpm.addEventListener('click', () => matchClipBpmToProject());
    }
    if (elements.btnHarmonizeKey) {
      elements.btnHarmonizeKey.addEventListener('click', () => matchClipKeyToProject());
    }
    if (elements.btnSnapBeatGrid) {
      elements.btnSnapBeatGrid.addEventListener('click', () => syncClipToNearestBar());
    }
    if (elements.btnAutoTrimSilence) {
      elements.btnAutoTrimSilence.addEventListener('click', () => autoTrimSilence());
    }
    if (elements.btnNormalizeLoudness) {
      elements.btnNormalizeLoudness.addEventListener('click', () => normalizeClipLoudness());
    }
    if (elements.aiTargetLufsSelect) {
      elements.aiTargetLufsSelect.addEventListener('change', () => updateAiInspectorUI());
    }

    // Transition styles
    document.querySelectorAll('.transition-style-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.transition-style-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.ai.activeTransitionStyle = btn.dataset.style;
      });
    });

    if (elements.btnApplySmartTransition) {
      elements.btnApplySmartTransition.addEventListener('click', () => applySmartTransition());
    }

    // Auto Mix Modal Triggers
    if (elements.btnOpenAutoMixModal) {
      elements.btnOpenAutoMixModal.addEventListener('click', openAutoMixModal);
    }
    if (elements.btnQuickAutoMix) {
      elements.btnQuickAutoMix.addEventListener('click', openAutoMixModal);
    }
    if (elements.btnCloseAutoMixModal) {
      elements.btnCloseAutoMixModal.addEventListener('click', closeAutoMixModal);
    }
    if (elements.btnCancelAutoMix) {
      elements.btnCancelAutoMix.addEventListener('click', closeAutoMixModal);
    }

    // Auto Mix Presets
    document.querySelectorAll('.auto-mix-preset-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectAutoMixPreset(card.dataset.preset);
      });
    });

    if (elements.btnPreviewAutoMix) {
      elements.btnPreviewAutoMix.addEventListener('click', () => {
        const p = AUTO_MIX_PRESETS[state.ai.activePreset || 'radio_pop'];
        showToast(`Previewing ${p ? p.name : 'Auto Mix'} balance profile`);
      });
    }

    if (elements.btnConfirmAutoMix) {
      elements.btnConfirmAutoMix.addEventListener('click', applyAutoMix);
    }
    if (elements.btnRevertAutoMix) {
      elements.btnRevertAutoMix.addEventListener('click', revertAutoMix);
    }

    // Initial populate
    updateAiInspectorUI();
  }

  // --------------------------------------------------------------------------
  // 17. Inspector Panel Tabs & Collapse Toggle
  // --------------------------------------------------------------------------
  function initInspector() {
    elements.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabKey = btn.dataset.tab;
        state.activeInspectorTab = tabKey;

        elements.tabBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        Object.keys(elements.tabPanes).forEach((key) => {
          if (elements.tabPanes[key]) {
            elements.tabPanes[key].style.display = key === tabKey ? 'flex' : 'none';
          }
        });

        if (tabKey === 'mixer') {
          updateMixerUI(state.mixer.selectedTrackId);
        } else if (tabKey === 'ai') {
          updateAiInspectorUI(getClipById(state.selectedClipId));
        }
      });
    });

    if (elements.btnToggleInspector && elements.inspectorPanel) {
      elements.btnToggleInspector.addEventListener('click', () => {
        state.inspectorCollapsed = !state.inspectorCollapsed;
        elements.inspectorPanel.classList.toggle('collapsed', state.inspectorCollapsed);
        elements.btnToggleInspector.title = state.inspectorCollapsed ? 'Expand Inspector' : 'Collapse Inspector';
        const icon = elements.btnToggleInspector.querySelector('svg');
        if (icon) {
          icon.style.transform = state.inspectorCollapsed ? 'rotate(180deg)' : 'none';
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 18. Tools & Zoom Controls
  // --------------------------------------------------------------------------
  function initToolsAndZoom() {
    elements.toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        elements.toolBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        state.activeTool = btn.id.replace('tool', '').toLowerCase();
        updateToolCursorModes();
        showToast(`Active Tool: ${state.activeTool.toUpperCase()}`);
      });
    });

    if (elements.btnZoomIn) {
      elements.btnZoomIn.addEventListener('click', () => {
        state.zoomLevel = Math.min(200, state.zoomLevel + 25);
        updateZoomDisplay();
      });
    }

    if (elements.btnZoomOut) {
      elements.btnZoomOut.addEventListener('click', () => {
        state.zoomLevel = Math.max(50, state.zoomLevel - 25);
        updateZoomDisplay();
      });
    }

    if (elements.btnZoomFit) {
      elements.btnZoomFit.addEventListener('click', () => {
        state.zoomLevel = 100;
        updateZoomDisplay();
        showToast('Timeline zoom reset to 100%');
      });
    }
  }

  function updateZoomDisplay() {
    if (elements.zoomLevelText) {
      elements.zoomLevelText.textContent = `${state.zoomLevel}%`;
    }
    const newWidth = Math.round(2400 * (state.zoomLevel / 100));
    state.timelineWidthPx = newWidth;
    state.pxPerSecond = newWidth / state.totalDuration;

    if (elements.rulerTicks) {
      elements.rulerTicks.style.width = `${newWidth}px`;
    }
    document.querySelectorAll('.track-lane').forEach((lane) => {
      lane.style.width = `${newWidth}px`;
    });

    buildTimelineRuler();
    renderClips();
    updatePlayheadPosition();
  }

  // --------------------------------------------------------------------------
  // 19. Navigation & General Modals
  // --------------------------------------------------------------------------
  function initNavigationAndModals() {
    elements.navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view === 'dashboard' || view === 'library' || view === 'studio') {
          switchView(view);
        } else if (view === 'presets') {
          openPresetsModal();
        } else {
          showToast(`${item.querySelector('.nav-text').textContent} (Phase 8 Preview)`);
        }
      });
    });

    if (elements.btnOpenShortcuts) {
      elements.btnOpenShortcuts.addEventListener('click', () => openModal(elements.shortcutsModal));
    }
    if (elements.btnCloseShortcuts) {
      elements.btnCloseShortcuts.addEventListener('click', () => closeModal(elements.shortcutsModal));
    }
    if (elements.shortcutsModal) {
      elements.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === elements.shortcutsModal) closeModal(elements.shortcutsModal);
      });
    }

    if (elements.btnMasterPreview) {
      elements.btnMasterPreview.addEventListener('click', () => {
        toggleMasterPreview();
      });
    }
    if (elements.btnExitMasterPreview) {
      elements.btnExitMasterPreview.addEventListener('click', () => {
        toggleMasterPreview(false);
      });
    }
    if (elements.btnExport) {
      elements.btnExport.addEventListener('click', () => {
        openExportModal();
      });
    }
    if (elements.btnAddTrack) {
      elements.btnAddTrack.addEventListener('click', () => {
        switchView('library');
        showToast('Select a Suno stem from your Library to add to Timeline');
      });
    }
    if (elements.emptyTrackDropzone) {
      elements.emptyTrackDropzone.addEventListener('click', () => {
        openUploadModalDialog();
      });
    }

    if (elements.btnPlayPause) elements.btnPlayPause.addEventListener('click', togglePlayPause);
    if (elements.btnStop) elements.btnStop.addEventListener('click', stopPlayback);
    if (elements.btnReturnZero) elements.btnReturnZero.addEventListener('click', () => seekTo(0));
    if (elements.btnRewind) elements.btnRewind.addEventListener('click', () => seekTo(state.currentTime - 5));
    if (elements.btnFastForward) elements.btnFastForward.addEventListener('click', () => seekTo(state.currentTime + 5));
    if (elements.btnLoop) {
      elements.btnLoop.addEventListener('click', () => {
        state.isLooping = !state.isLooping;
        elements.btnLoop.classList.toggle('active', state.isLooping);
        showToast(`Loop Mode: ${state.isLooping ? 'Enabled' : 'Disabled'}`);
      });
    }
  }

  function showToast(message) {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  // --------------------------------------------------------------------------
  // 20. Phase 7: Master Preview, Audio Export & Mix Presets Engine
  // --------------------------------------------------------------------------
  const BUILTIN_MIX_PRESETS = [
    {
      id: 'preset_cyberpunk_master',
      name: 'Cyberpunk Club Master',
      desc: 'Aggressive sidechain bass, punchy synth transients, -14.0 LUFS brickwall limiter.',
      isBuiltIn: true,
      tracks: {
        1: { vol: 0.0, pan: 0, gainTrim: 0.0, eq: { low: -1.0, mid: 1.0, high: 2.5 }, fx: { comp: { enabled: true, thresh: -16, ratio: 3.5, gain: 2.0 }, reverb: { enabled: true, decay: 1.8, mix: 20 }, delay: { enabled: false, time: '1/8', feedback: 25, mix: 15 } } },
        2: { vol: 1.0, pan: -10, gainTrim: 0.5, eq: { low: 4.0, mid: 0.5, high: -1.5 }, fx: { comp: { enabled: true, thresh: -12, ratio: 4.5, gain: 2.5 }, reverb: { enabled: false, decay: 1.0, mix: 10 }, delay: { enabled: false, time: '1/8', feedback: 20, mix: 10 } } },
        3: { vol: 0.5, pan: 10, gainTrim: 0.5, eq: { low: 3.0, mid: -2.0, high: 2.0 }, fx: { comp: { enabled: true, thresh: -10, ratio: 4.5, gain: 3.0 }, reverb: { enabled: false, decay: 0.8, mix: 5 }, delay: { enabled: false, time: '1/16', feedback: 15, mix: 10 } } },
        4: { vol: -2.0, pan: 35, gainTrim: 0.0, eq: { low: -2.5, mid: 1.0, high: 2.5 }, fx: { comp: { enabled: false, thresh: -18, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 2.5, mix: 35 }, delay: { enabled: true, time: '1/4', feedback: 35, mix: 30 } } }
      }
    },
    {
      id: 'preset_radio_pop_punch',
      name: 'Radio Pop Balance',
      desc: 'Clean vocal-forward presence, controlled bass, wide stereo air, streaming ready.',
      isBuiltIn: true,
      tracks: {
        1: { vol: 1.5, pan: 0, gainTrim: 0.5, eq: { low: -0.5, mid: 2.5, high: 3.0 }, fx: { comp: { enabled: true, thresh: -15, ratio: 3.0, gain: 2.5 }, reverb: { enabled: true, decay: 1.6, mix: 22 }, delay: { enabled: false, time: '1/8', feedback: 20, mix: 15 } } },
        2: { vol: -2.5, pan: -15, gainTrim: 0.0, eq: { low: 2.0, mid: -1.0, high: -0.5 }, fx: { comp: { enabled: true, thresh: -14, ratio: 3.5, gain: 1.5 }, reverb: { enabled: false, decay: 1.0, mix: 10 }, delay: { enabled: false, time: '1/8', feedback: 20, mix: 10 } } },
        3: { vol: -1.0, pan: 10, gainTrim: 0.0, eq: { low: 2.5, mid: -1.5, high: 1.5 }, fx: { comp: { enabled: true, thresh: -12, ratio: 4.0, gain: 2.0 }, reverb: { enabled: false, decay: 0.8, mix: 5 }, delay: { enabled: false, time: '1/16', feedback: 15, mix: 10 } } },
        4: { vol: -3.5, pan: 40, gainTrim: 0.0, eq: { low: -2.0, mid: 0.5, high: 2.0 }, fx: { comp: { enabled: false, thresh: -20, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 2.2, mix: 30 }, delay: { enabled: true, time: '1/4', feedback: 30, mix: 25 } } }
      }
    },
    {
      id: 'preset_vocal_acoustic',
      name: 'Vocal Acoustic Intimate',
      desc: 'Warm organic tones, transparent dynamics, gentle plate reverb decay.',
      isBuiltIn: true,
      tracks: {
        1: { vol: 2.0, pan: 0, gainTrim: 1.0, eq: { low: 1.0, mid: 1.5, high: 1.5 }, fx: { comp: { enabled: true, thresh: -18, ratio: 2.5, gain: 1.5 }, reverb: { enabled: true, decay: 2.2, mix: 30 }, delay: { enabled: false, time: '1/8', feedback: 20, mix: 10 } } },
        2: { vol: -4.0, pan: -25, gainTrim: -0.5, eq: { low: 1.0, mid: 0.0, high: -1.0 }, fx: { comp: { enabled: false, thresh: -16, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 1.8, mix: 20 }, delay: { enabled: false, time: '1/8', feedback: 15, mix: 10 } } },
        3: { vol: -3.0, pan: 20, gainTrim: -0.5, eq: { low: 1.0, mid: -1.0, high: 0.5 }, fx: { comp: { enabled: true, thresh: -16, ratio: 2.5, gain: 1.0 }, reverb: { enabled: false, decay: 0.8, mix: 5 }, delay: { enabled: false, time: '1/16', feedback: 10, mix: 5 } } },
        4: { vol: -5.0, pan: 45, gainTrim: -1.0, eq: { low: -3.0, mid: 0.5, high: 1.0 }, fx: { comp: { enabled: false, thresh: -22, ratio: 2.0, gain: 0.0 }, reverb: { enabled: true, decay: 3.2, mix: 45 }, delay: { enabled: true, time: '1/4', feedback: 25, mix: 20 } } }
      }
    },
    {
      id: 'preset_club_sub_drop',
      name: 'Club Sub & Drop Impact',
      desc: 'Massive sub-bass weight, scooped mids, ultra-wide atmospheric FX sweeps.',
      isBuiltIn: true,
      tracks: {
        1: { vol: -1.5, pan: 0, gainTrim: 0.0, eq: { low: -2.0, mid: 1.0, high: 3.0 }, fx: { comp: { enabled: true, thresh: -16, ratio: 4.0, gain: 2.0 }, reverb: { enabled: true, decay: 1.4, mix: 15 }, delay: { enabled: false, time: '1/8', feedback: 20, mix: 10 } } },
        2: { vol: 2.5, pan: 0, gainTrim: 1.5, eq: { low: 5.5, mid: 1.0, high: -2.5 }, fx: { comp: { enabled: true, thresh: -8, ratio: 5.5, gain: 3.5 }, reverb: { enabled: false, decay: 0.6, mix: 5 }, delay: { enabled: false, time: '1/8', feedback: 15, mix: 5 } } },
        3: { vol: 1.0, pan: 0, gainTrim: 1.0, eq: { low: 4.0, mid: -2.5, high: 2.5 }, fx: { comp: { enabled: true, thresh: -9, ratio: 5.0, gain: 3.5 }, reverb: { enabled: false, decay: 0.5, mix: 5 }, delay: { enabled: false, time: '1/16', feedback: 15, mix: 5 } } },
        4: { vol: -1.0, pan: 45, gainTrim: 0.5, eq: { low: -3.0, mid: 1.5, high: 3.5 }, fx: { comp: { enabled: true, thresh: -14, ratio: 3.0, gain: 1.5 }, reverb: { enabled: true, decay: 2.8, mix: 40 }, delay: { enabled: true, time: '1/4', feedback: 45, mix: 35 } } }
      }
    }
  ];

  let exportAnimationTimer = null;

  function initMasterExportModule() {
    // Format card selection
    if (elements.formatWavCard) {
      elements.formatWavCard.addEventListener('click', () => selectExportFormat('wav'));
    }
    if (elements.formatMp3Card) {
      elements.formatMp3Card.addEventListener('click', () => selectExportFormat('mp3'));
    }

    // Export Modal buttons
    if (elements.btnCloseExportModal) {
      elements.btnCloseExportModal.addEventListener('click', closeExportModal);
    }
    if (elements.btnCancelExport) {
      elements.btnCancelExport.addEventListener('click', closeExportModal);
    }
    if (elements.btnStartExport) {
      elements.btnStartExport.addEventListener('click', startExportProcess);
    }
    if (elements.exportModal) {
      elements.exportModal.addEventListener('click', (e) => {
        if (e.target === elements.exportModal) closeExportModal();
      });
    }

    // Presets Modal buttons
    if (elements.navPresets) {
      elements.navPresets.addEventListener('click', openPresetsModal);
    }
    if (elements.btnClosePresetsModal) {
      elements.btnClosePresetsModal.addEventListener('click', closePresetsModal);
    }
    if (elements.btnDismissPresetsModal) {
      elements.btnDismissPresetsModal.addEventListener('click', closePresetsModal);
    }
    if (elements.btnSaveCurrentPreset) {
      elements.btnSaveCurrentPreset.addEventListener('click', () => {
        const name = elements.inputPresetName ? elements.inputPresetName.value : '';
        const desc = elements.inputPresetDesc ? elements.inputPresetDesc.value : '';
        saveCurrentMixPreset(name, desc);
      });
    }
    if (elements.presetsModal) {
      elements.presetsModal.addEventListener('click', (e) => {
        if (e.target === elements.presetsModal) closePresetsModal();
      });
    }

    // Phase 8: Presets JSON Backup & Restore
    if (elements.btnExportPresetsJson) {
      elements.btnExportPresetsJson.addEventListener('click', exportPresetsToJson);
    }
    if (elements.btnImportPresetsJson) {
      elements.btnImportPresetsJson.addEventListener('click', () => {
        if (elements.inputImportPresets) elements.inputImportPresets.click();
      });
    }
    if (elements.inputImportPresets) {
      elements.inputImportPresets.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          importPresetsFromJson(e.target.files[0]);
          e.target.value = '';
        }
      });
    }

    // Phase 8: Mixer Console Quick Preset Switcher
    if (elements.mixerQuickPresetSelect) {
      elements.mixerQuickPresetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          loadMixPreset(e.target.value);
        }
      });
    }

    // Phase 8: Shortcuts Modal Dismiss & Live Search
    if (elements.btnDismissShortcuts) {
      elements.btnDismissShortcuts.addEventListener('click', () => closeModal(elements.shortcutsModal));
    }
    initShortcutsSearch();
    populateMixerQuickPresetSelect();
  }

  // --- Master Preview Mode ---
  function toggleMasterPreview(forceState) {
    state.masterPreviewActive = (typeof forceState === 'boolean') ? forceState : !state.masterPreviewActive;

    if (state.masterPreviewActive) {
      if (elements.masterPreviewHud) elements.masterPreviewHud.style.display = 'flex';
      if (elements.btnMasterPreview) {
        elements.btnMasterPreview.classList.add('active');
        elements.btnMasterPreview.style.borderColor = '#22C55E';
        elements.btnMasterPreview.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.4)';
      }
      if (state.mixer && state.mixer.master) {
        state.mixer.master.limiter = true;
      }
      resetMasterPreviewHudMetrics();
      showToast('Master Preview Engaged • 44.1 kHz 24-bit Stereo Audition');
    } else {
      if (elements.masterPreviewHud) elements.masterPreviewHud.style.display = 'none';
      if (elements.btnMasterPreview) {
        elements.btnMasterPreview.classList.remove('active');
        elements.btnMasterPreview.style.borderColor = '';
        elements.btnMasterPreview.style.boxShadow = '';
      }
      showToast('Exited Master Preview Mode');
    }
  }

  function updateMasterPreviewHudMetrics(leftMeter, rightMeter, masterVol) {
    if (!elements.hudLufs || !elements.hudTruePeak || !elements.hudLimiterGr) return;

    // Integrated LUFS around -14.0 LUFS with small natural fluctuation
    const lufsFluctuation = ((leftMeter + rightMeter) / 200) * 0.4 - 0.2;
    const lufs = (-14.0 + lufsFluctuation).toFixed(1);
    elements.hudLufs.textContent = `${lufs} LUFS`;

    // True Peak clamped safely below or at -0.1 dBTP with brickwall limiter
    const rawPeak = -0.5 + (masterVol * 0.2) + (((leftMeter + rightMeter) / 200) * 0.4);
    const truePeak = Math.min(-0.1, rawPeak).toFixed(1);
    elements.hudTruePeak.textContent = `${truePeak} dBTP`;

    // Limiter Gain Reduction
    const gr = Math.max(0.2, (((leftMeter + rightMeter) / 200) * 1.5 + Math.max(0, masterVol * 0.6))).toFixed(1);
    elements.hudLimiterGr.textContent = `-${gr} dB`;
  }

  function resetMasterPreviewHudMetrics() {
    if (elements.hudLufs) elements.hudLufs.textContent = '-14.0 LUFS';
    if (elements.hudTruePeak) elements.hudTruePeak.textContent = '-0.1 dBTP';
    if (elements.hudLimiterGr) elements.hudLimiterGr.textContent = '-0.0 dB';
  }

  // --- Audio Export Engine ---
  function openExportModal() {
    const projName = state.activeProject ? state.activeProject.name : 'Cyberpunk Drift';
    if (elements.inputExportTitle) {
      elements.inputExportTitle.value = `${projName.replace(/\s*\(.*?\)\s*/g, '')} (Final Master Mix)`;
    }

    selectExportFormat(state.export.format || 'wav');

    if (elements.exportConfigSection) elements.exportConfigSection.style.display = 'block';
    if (elements.exportProgressSection) elements.exportProgressSection.style.display = 'none';
    if (elements.exportCompleteSection) elements.exportCompleteSection.style.display = 'none';
    if (elements.exportModalFooter) elements.exportModalFooter.style.display = 'flex';

    resetExportPipelineNodes();
    openModal(elements.exportModal);
  }

  function closeExportModal() {
    if (exportAnimationTimer) {
      clearInterval(exportAnimationTimer);
      exportAnimationTimer = null;
    }
    state.export.isExporting = false;
    closeModal(elements.exportModal);
  }

  function selectExportFormat(format) {
    state.export.format = format;
    if (elements.formatWavCard) {
      elements.formatWavCard.classList.toggle('selected', format === 'wav');
      elements.formatWavCard.setAttribute('aria-checked', String(format === 'wav'));
    }
    if (elements.formatMp3Card) {
      elements.formatMp3Card.classList.toggle('selected', format === 'mp3');
      elements.formatMp3Card.setAttribute('aria-checked', String(format === 'mp3'));
    }

    // Adjust bit depth / quality dropdown options according to format
    if (elements.exportBitDepth) {
      if (format === 'wav') {
        elements.exportBitDepth.innerHTML = `
          <option value="24" selected>24-bit PCM (High Dynamic Range)</option>
          <option value="16">16-bit PCM (Standard CD Dithered)</option>
        `;
      } else {
        elements.exportBitDepth.innerHTML = `
          <option value="320" selected>320 kbps CBR (Studio Highest Quality)</option>
          <option value="256">256 kbps VBR (Standard Quality)</option>
        `;
      }
    }
  }

  function resetExportPipelineNodes() {
    [elements.nodeStage1, elements.nodeStage2, elements.nodeStage3, elements.nodeStage4].forEach((node) => {
      if (node) {
        node.classList.remove('active', 'done');
      }
    });
    if (elements.nodeStage1) elements.nodeStage1.classList.add('active');
    if (elements.exportProgressBar) elements.exportProgressBar.style.width = '0%';
    if (elements.exportProgressPct) elements.exportProgressPct.textContent = '0%';
  }

  function startExportProcess() {
    state.export.isExporting = true;
    const format = state.export.format || 'wav';
    const sampleRate = elements.exportSampleRate ? parseInt(elements.exportSampleRate.value, 10) : 44100;
    const bitDepth = elements.exportBitDepth ? elements.exportBitDepth.value : (format === 'wav' ? '24' : '320');
    const trackTitle = elements.inputExportTitle ? elements.inputExportTitle.value.trim() : 'Suno_Master_Mix';

    if (elements.exportConfigSection) elements.exportConfigSection.style.display = 'none';
    if (elements.exportModalFooter) elements.exportModalFooter.style.display = 'none';
    if (elements.exportProgressSection) elements.exportProgressSection.style.display = 'block';

    let currentPct = 0;
    resetExportPipelineNodes();

    if (exportAnimationTimer) clearInterval(exportAnimationTimer);

    exportAnimationTimer = setInterval(() => {
      currentPct += 4;
      if (currentPct > 100) currentPct = 100;

      if (elements.exportProgressBar) elements.exportProgressBar.style.width = `${currentPct}%`;
      if (elements.exportProgressPct) elements.exportProgressPct.textContent = `${currentPct}%`;

      // Update multi-stage text & nodes
      if (currentPct < 25) {
        if (elements.exportStageText) elements.exportStageText.textContent = 'Summing 4 Stem Tracks (1/4)...';
        if (elements.nodeStage1) elements.nodeStage1.classList.add('active');
      } else if (currentPct < 60) {
        if (elements.exportStageText) elements.exportStageText.textContent = 'Master DSP, Parametric EQ & Brickwall Limiter (2/4)...';
        if (elements.nodeStage1) { elements.nodeStage1.classList.remove('active'); elements.nodeStage1.classList.add('done'); }
        if (elements.nodeStage2) elements.nodeStage2.classList.add('active');
      } else if (currentPct < 85) {
        if (elements.exportStageText) elements.exportStageText.textContent = 'EBU R128 Streaming Target Normalization (-14.0 LUFS) (3/4)...';
        if (elements.nodeStage2) { elements.nodeStage2.classList.remove('active'); elements.nodeStage2.classList.add('done'); }
        if (elements.nodeStage3) elements.nodeStage3.classList.add('active');
      } else {
        if (elements.exportStageText) elements.exportStageText.textContent = `Encoding ${format.toUpperCase()} Stream Container & ID3 Tags (4/4)...`;
        if (elements.nodeStage3) { elements.nodeStage3.classList.remove('active'); elements.nodeStage3.classList.add('done'); }
        if (elements.nodeStage4) elements.nodeStage4.classList.add('active');
      }

      if (currentPct >= 100) {
        clearInterval(exportAnimationTimer);
        exportAnimationTimer = null;
        if (elements.nodeStage4) { elements.nodeStage4.classList.remove('active'); elements.nodeStage4.classList.add('done'); }

        setTimeout(() => {
          completeExportProcess(trackTitle, format, sampleRate, bitDepth);
        }, 300);
      }
    }, 60);
  }

  function completeExportProcess(trackTitle, format, sampleRate, bitDepth) {
    const cleanBaseName = trackTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanBaseName}_Master.${format}`;
    const fileSizeStr = (format === 'wav') ? '42.5 MB' : '7.2 MB';
    const rateKhz = (sampleRate / 1000).toFixed(1);
    const depthUnit = (format === 'wav') ? `${bitDepth}-bit` : `${bitDepth} kbps`;
    const metaStr = `${depthUnit} / ${rateKhz} kHz • ${fileSizeStr} • EBU -14.0 LUFS Master`;

    if (elements.exportProgressSection) elements.exportProgressSection.style.display = 'none';
    if (elements.exportCompleteSection) elements.exportCompleteSection.style.display = 'block';

    if (elements.completeFilename) elements.completeFilename.textContent = filename;
    if (elements.completeFileMeta) elements.completeFileMeta.textContent = metaStr;

    // Generate genuine client-side audio blob (WAV header & preview audio synthesis)
    const audioBlob = generateWavAudioBlob(2.0, sampleRate);
    if (state.export.blobUrl) {
      URL.revokeObjectURL(state.export.blobUrl);
    }
    state.export.blobUrl = URL.createObjectURL(audioBlob);
    state.export.downloadFilename = filename;

    // Configure Download Button
    if (elements.btnDownloadMix) {
      elements.btnDownloadMix.onclick = () => {
        const link = document.createElement('a');
        link.href = state.export.blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloading: ${filename}`);
      };
    }

    // Configure Copy Share Link Button
    if (elements.btnCopyMixLink) {
      elements.btnCopyMixLink.onclick = () => {
        const shareUrl = `https://suno.studio/mix/${encodeURIComponent(cleanBaseName.toLowerCase())}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Shareable master mix link copied to clipboard!');
          }).catch(() => {
            showToast(`Mix link: ${shareUrl}`);
          });
        } else {
          showToast(`Mix link: ${shareUrl}`);
        }
      };
    }

    showToast(`Master export completed: ${filename}`);
    state.export.isExporting = false;
  }

  function generateWavAudioBlob(durationSec = 2.0, sampleRate = 44100) {
    const numChannels = 2;
    const bitsPerSample = 16;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const dataSize = totalSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeStr(offset, str) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    // RIFF chunk descriptor
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');

    // "fmt " sub-chunk
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    // Synthesize harmonic A-minor chord preview (A4: 440Hz, C5: 523.25Hz, E5: 659.25Hz)
    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 1.8);
      const sA = Math.sin(2 * Math.PI * 440 * t);
      const sC = Math.sin(2 * Math.PI * 523.25 * t);
      const sE = Math.sin(2 * Math.PI * 659.25 * t);
      const mix = (sA * 0.4 + sC * 0.35 + sE * 0.35) * decay * 0.75;
      const sampleInt = Math.max(-32768, Math.min(32767, Math.floor(mix * 32767)));

      view.setInt16(offset, sampleInt, true);
      view.setInt16(offset + 2, sampleInt, true);
      offset += 4;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  // --- Mix Presets Manager Engine ---
  function getStoredPresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not read presets from localStorage', e);
    }
    return [];
  }

  function saveStoredPresets(presets) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.warn('Could not save presets to localStorage', e);
    }
  }

  function getAllPresets() {
    return [...BUILTIN_MIX_PRESETS, ...getStoredPresets()];
  }

  function openPresetsModal() {
    renderPresetsList();
    openModal(elements.presetsModal);
  }

  function closePresetsModal() {
    closeModal(elements.presetsModal);
  }

  function renderPresetsList() {
    if (!elements.presetsListContainer) return;
    elements.presetsListContainer.innerHTML = '';

    const allPresets = getAllPresets();

    allPresets.forEach((preset) => {
      const card = document.createElement('div');
      card.className = 'preset-item-card';

      const badgeHtml = preset.isBuiltIn
        ? '<span class="brand-badge" style="background: rgba(34, 211, 238, 0.15); color: #22D3EE; font-size: 9px;">Factory Preset</span>'
        : '<span class="brand-badge" style="background: rgba(168, 85, 247, 0.15); color: #C084FC; font-size: 9px;">User Saved</span>';

      card.innerHTML = `
        <div class="preset-item-info">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="preset-item-name">${escapeHtml(preset.name)}</span>
            ${badgeHtml}
          </div>
          <span class="preset-item-desc">${escapeHtml(preset.desc || 'Studio mix configuration')}</span>
        </div>
        <div class="preset-item-actions">
          <button class="btn btn-primary btn-xs btn-load-preset" data-id="${preset.id}" title="Apply this preset to all studio tracks">
            Load Mix
          </button>
          ${!preset.isBuiltIn ? `
            <button class="btn btn-secondary btn-xs btn-delete-preset" data-id="${preset.id}" title="Delete this custom preset" style="color: var(--danger); padding: 0 6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              </svg>
            </button>
          ` : ''}
        </div>
      `;

      elements.presetsListContainer.appendChild(card);
    });

    elements.presetsListContainer.querySelectorAll('.btn-load-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        loadMixPreset(btn.dataset.id);
      });
    });

    elements.presetsListContainer.querySelectorAll('.btn-delete-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteMixPreset(btn.dataset.id);
      });
    });
  }

  function loadMixPreset(presetId) {
    const allPresets = getAllPresets();
    const target = allPresets.find((p) => p.id === presetId);
    if (!target || !target.tracks) return;

    pushHistorySnapshot(`Preset: ${target.name}`);

    [1, 2, 3, 4].forEach((id) => {
      const pTrk = target.tracks[id];
      const curTrk = state.tracks[id];
      if (!pTrk || !curTrk) return;

      curTrk.vol = pTrk.vol;
      curTrk.pan = pTrk.pan;
      curTrk.gainTrim = pTrk.gainTrim || 0;
      if (pTrk.eq) curTrk.eq = JSON.parse(JSON.stringify(pTrk.eq));
      if (pTrk.fx) curTrk.fx = JSON.parse(JSON.stringify(pTrk.fx));

      // Update Track row sliders
      const volSlider = document.querySelector(`.track-volume[data-track="${id}"]`);
      const panSlider = document.querySelector(`.track-pan[data-track="${id}"]`);
      const volReadout = document.getElementById(`volReadout-${id}`);
      const panReadout = document.getElementById(`panReadout-${id}`);

      if (volSlider) volSlider.value = curTrk.vol;
      if (panSlider) panSlider.value = curTrk.pan;
      if (volReadout) volReadout.textContent = `${curTrk.vol > 0 ? '+' : ''}${curTrk.vol.toFixed(1)} dB`;
      if (panReadout) {
        panReadout.textContent = curTrk.pan === 0 ? 'C' : (curTrk.pan < 0 ? `L${Math.abs(curTrk.pan)}` : `R${curTrk.pan}`);
      }
    });

    // Re-render Console Channel Strips & Active Inspector Strip
    renderMixerConsoleStrips();
    updateMixerUI(state.mixer.selectedTrackId);
    populateMixerQuickPresetSelect(presetId);

    showToast(`Mix Preset Applied: "${target.name}"`);
    triggerAutosave();
  }

  function saveCurrentMixPreset(name, desc) {
    if (!name || !name.trim()) {
      showToast('Please enter a name for the new mix preset');
      return;
    }

    const trimmedName = name.trim();
    const trimmedDesc = desc ? desc.trim() : 'User custom mixing setup';
    const userPresets = getStoredPresets();

    const newPreset = {
      id: 'user_preset_' + Date.now(),
      name: trimmedName,
      desc: trimmedDesc,
      isBuiltIn: false,
      createdAt: Date.now(),
      tracks: JSON.parse(JSON.stringify(state.tracks))
    };

    userPresets.unshift(newPreset);
    saveStoredPresets(userPresets);

    if (elements.inputPresetName) elements.inputPresetName.value = '';
    if (elements.inputPresetDesc) elements.inputPresetDesc.value = '';

    renderPresetsList();
    populateMixerQuickPresetSelect(newPreset.id);
    showToast(`Saved preset "${trimmedName}" successfully`);
  }

  function deleteMixPreset(presetId) {
    let userPresets = getStoredPresets();
    const deleted = userPresets.find((p) => p.id === presetId);
    userPresets = userPresets.filter((p) => p.id !== presetId);
    saveStoredPresets(userPresets);

    renderPresetsList();
    populateMixerQuickPresetSelect();
    showToast(`Deleted preset "${deleted ? deleted.name : 'Custom Preset'}"`);
  }

  // --- Phase 8: Presets Backup & Restore JSON ---
  function exportPresetsToJson() {
    const userPresets = getStoredPresets();
    const exportData = {
      app: 'Suno Music Mixing Studio',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      presetCount: userPresets.length,
      presets: userPresets
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suno_mix_presets.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${userPresets.length} presets to suno_mix_presets.json`);
  }

  function importPresetsFromJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const importedPresets = Array.isArray(parsed) ? parsed : (parsed.presets || []);
        if (!Array.isArray(importedPresets) || importedPresets.length === 0) {
          showToast('No valid presets found in JSON file');
          return;
        }

        let existing = getStoredPresets();
        let addedCount = 0;
        importedPresets.forEach((p) => {
          if (p && p.name && p.tracks) {
            const cleanPreset = {
              id: 'user_preset_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
              name: String(p.name).trim(),
              desc: p.desc ? String(p.desc).trim() : 'Imported preset',
              isBuiltIn: false,
              createdAt: Date.now(),
              tracks: p.tracks
            };
            existing.unshift(cleanPreset);
            addedCount++;
          }
        });

        saveStoredPresets(existing);
        renderPresetsList();
        populateMixerQuickPresetSelect();
        showToast(`Imported ${addedCount} presets successfully!`);
      } catch (err) {
        console.error('Failed to parse imported presets JSON', err);
        showToast('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  }

  // --- Phase 8: Mixer Console Quick Preset Switcher ---
  function populateMixerQuickPresetSelect(activePresetId) {
    if (!elements.mixerQuickPresetSelect) return;
    const allPresets = getAllPresets();

    let html = '<option value="" disabled selected>Preset: Select...</option>';
    allPresets.forEach((p) => {
      const isSelected = (activePresetId && activePresetId === p.id) ? 'selected' : '';
      html += `<option value="${p.id}" ${isSelected}>${p.isBuiltIn ? '★ ' : ''}${escapeHtml(p.name)}</option>`;
    });

    elements.mixerQuickPresetSelect.innerHTML = html;
  }

  // --- Phase 8: Shortcuts Modal Live Search ---
  function initShortcutsSearch() {
    if (!elements.shortcutSearchInput || !elements.shortcutsListWrap) return;

    elements.shortcutSearchInput.addEventListener('input', (e) => {
      filterShortcuts(e.target.value);
    });
  }

  function filterShortcuts(query) {
    const q = (query || '').toLowerCase().trim();
    const categories = elements.shortcutsListWrap.querySelectorAll('.shortcut-category-group');
    let totalVisible = 0;

    categories.forEach((cat) => {
      const rows = cat.querySelectorAll('.shortcut-row');
      let catVisibleCount = 0;

      rows.forEach((row) => {
        const searchKeywords = (row.dataset.search || '').toLowerCase();
        const textDesc = row.textContent.toLowerCase();
        const isMatch = !q || searchKeywords.includes(q) || textDesc.includes(q);

        row.classList.toggle('hidden', !isMatch);
        if (isMatch) catVisibleCount++;
      });

      cat.classList.toggle('hidden', catVisibleCount === 0);
      totalVisible += catVisibleCount;
    });

    if (elements.noShortcutsFound) {
      elements.noShortcutsFound.style.display = totalVisible === 0 ? 'block' : 'none';
    }
  }

  // --------------------------------------------------------------------------
  // 20.5. History & Undo/Redo Engine (Phase 9 QA & Polish)
  // --------------------------------------------------------------------------
  function pushHistorySnapshot(actionName = 'Edit') {
    try {
      if (!state.history) {
        state.history = { past: [], future: [], maxHistory: 30 };
      }
      const snapshot = {
        actionName,
        tracks: JSON.parse(JSON.stringify(state.tracks)),
        clips: JSON.parse(JSON.stringify(state.clips)),
        mixer: JSON.parse(JSON.stringify(state.mixer))
      };
      state.history.past.push(snapshot);
      if (state.history.past.length > state.history.maxHistory) {
        state.history.past.shift();
      }
      state.history.future = [];
      updateUndoRedoButtons();
    } catch (e) {
      console.warn('History snapshot error:', e);
    }
  }

  function undo() {
    if (!state.history || !state.history.past || state.history.past.length === 0) {
      showToast('Nothing to undo', 'info');
      return;
    }
    try {
      const previousState = state.history.past.pop();
      const currentSnapshot = {
        actionName: previousState.actionName,
        tracks: JSON.parse(JSON.stringify(state.tracks)),
        clips: JSON.parse(JSON.stringify(state.clips)),
        mixer: JSON.parse(JSON.stringify(state.mixer))
      };
      state.history.future.push(currentSnapshot);

      state.tracks = JSON.parse(JSON.stringify(previousState.tracks));
      state.clips = JSON.parse(JSON.stringify(previousState.clips));
      state.mixer = JSON.parse(JSON.stringify(previousState.mixer));

      applyRestoredState();
      updateUndoRedoButtons();
      showToast(`Undid: ${previousState.actionName}`);
      triggerAutosave();
    } catch (err) {
      console.error('Undo error:', err);
    }
  }

  function redo() {
    if (!state.history || !state.history.future || state.history.future.length === 0) {
      showToast('Nothing to redo', 'info');
      return;
    }
    try {
      const nextState = state.history.future.pop();
      const currentSnapshot = {
        actionName: nextState.actionName,
        tracks: JSON.parse(JSON.stringify(state.tracks)),
        clips: JSON.parse(JSON.stringify(state.clips)),
        mixer: JSON.parse(JSON.stringify(state.mixer))
      };
      state.history.past.push(currentSnapshot);

      state.tracks = JSON.parse(JSON.stringify(nextState.tracks));
      state.clips = JSON.parse(JSON.stringify(nextState.clips));
      state.mixer = JSON.parse(JSON.stringify(nextState.mixer));

      applyRestoredState();
      updateUndoRedoButtons();
      showToast(`Redid: ${nextState.actionName}`);
      triggerAutosave();
    } catch (err) {
      console.error('Redo error:', err);
    }
  }

  function applyRestoredState() {
    renderClips();
    [1, 2, 3, 4].forEach((id) => {
      updateMixerUI(id);
      const t = state.tracks[id];
      if (t) {
        syncTrackVolume(id, t.vol, 'history');
        syncTrackPan(id, t.pan, 'history');
      }
    });
    renderMixerConsoleStrips();
  }

  function updateUndoRedoButtons() {
    if (elements.btnUndo) {
      elements.btnUndo.disabled = !state.history || state.history.past.length === 0;
    }
    if (elements.btnRedo) {
      elements.btnRedo.disabled = !state.history || state.history.future.length === 0;
    }
  }

  function initHistoryModule() {
    if (elements.btnUndo) {
      elements.btnUndo.addEventListener('click', () => undo());
    }
    if (elements.btnRedo) {
      elements.btnRedo.addEventListener('click', () => redo());
    }
    updateUndoRedoButtons();
  }

  // --------------------------------------------------------------------------
  // 21. Keyboard Shortcuts
  // --------------------------------------------------------------------------
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Home':
        case 'Enter':
          e.preventDefault();
          seekTo(0);
          break;
        case 'Escape':
          [
            elements.shortcutsModal,
            elements.newProjectModal,
            elements.uploadModal,
            elements.renameModal,
            elements.deleteProjectModal,
            elements.audioAnalysisModal,
            elements.autoMixModal,
            elements.exportModal,
            elements.presetsModal
          ].forEach((m) => {
            if (m && m.classList.contains('open')) closeModal(m);
          });
          stopPlayback();
          break;
        case 'KeyV':
          selectToolById('toolSelect');
          break;
        case 'KeyC':
          selectToolById('toolSplit');
          break;
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            triggerAutosave();
            showToast('Session snapshot saved manually (Ctrl+S)');
          } else {
            selectToolById('toolTrim');
          }
          break;
        case 'KeyZ':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          } else {
            selectToolById('toolZoom');
          }
          break;
        case 'KeyY':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 'KeyE':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            openExportModal();
          }
          break;
        case 'KeyR':
          if (elements.btnLoop) elements.btnLoop.click();
          break;
        case 'KeyJ':
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(state.currentTime - 5);
          break;
        case 'KeyL':
        case 'ArrowRight':
          e.preventDefault();
          seekTo(state.currentTime + 5);
          break;
        case 'Equal':
          if (elements.btnZoomIn) elements.btnZoomIn.click();
          break;
        case 'Minus':
          if (elements.btnZoomOut) elements.btnZoomOut.click();
          break;
        case 'KeyF':
        case 'Digit0':
          if (elements.btnZoomFit) elements.btnZoomFit.click();
          break;
        case 'KeyP':
          if (e.shiftKey || e.altKey) {
            e.preventDefault();
            openPresetsModal();
          } else {
            toggleMasterPreview();
          }
          break;
        case 'KeyA':
          openAutoMixModal();
          break;
        case 'Delete':
        case 'Backspace':
          if (state.selectedClipId) {
            e.preventDefault();
            deleteClip(state.selectedClipId);
          }
          break;
        case 'KeyD':
          if ((e.ctrlKey || e.metaKey) && state.selectedClipId) {
            e.preventDefault();
            duplicateClip(state.selectedClipId);
          }
          break;
        case 'Slash':
          if (e.shiftKey || e.key === '?') {
            e.preventDefault();
            if (elements.shortcutsModal) {
              if (elements.shortcutsModal.classList.contains('open')) {
                closeModal(elements.shortcutsModal);
              } else {
                openModal(elements.shortcutsModal);
                if (elements.shortcutSearchInput) {
                  elements.shortcutSearchInput.value = '';
                  filterShortcuts('');
                  elements.shortcutSearchInput.focus();
                }
              }
            }
          }
          break;
        case 'KeyI':
          if (elements.btnToggleInspector) elements.btnToggleInspector.click();
          break;
        case 'KeyM':
          toggleMixerConsole();
          break;
      }
    });
  }

  function selectToolById(id) {
    const btn = document.getElementById(id);
    if (btn) btn.click();
  }

  // --------------------------------------------------------------------------
  // 23. Bilingual Localization Engine (i18n: Bahasa Indonesia & English)
  // --------------------------------------------------------------------------
  const TRANSLATIONS = {
    en: {
      'topbar.autosaved': 'Autosaved',
      'topbar.master_preview': 'Master Preview',
      'topbar.export': 'Export Mix',
      'nav.navigation': 'Navigation',
      'nav.dashboard': 'Dashboard',
      'nav.library': 'Music Library',
      'nav.studio': 'Mixer Studio',
      'nav.presets': 'Presets',
      'nav.settings': 'Settings',
      'nav.project_memory': 'Project Memory',
      'nav.shortcuts': 'Shortcuts (?)',
      'toolbar.select': 'Select Tool (V)',
      'toolbar.split': 'Razor Tool (C)',
      'toolbar.trim': 'Trim Tool (S)',
      'toolbar.zoom': 'Zoom Tool (Z)',
      'toolbar.mixer': 'Mixer',
      'toolbar.auto_mix': 'Auto Mix',
      'mixer.console_title': 'MULTI-CHANNEL MIXER CONSOLE',
      'mixer.quick_preset_placeholder': 'Preset: Select...',
      'inspector.tab_clip': 'Clip',
      'inspector.tab_mixer': 'Mixer',
      'inspector.tab_ai': 'AI Tools',
      'dashboard.title': 'Projects Dashboard',
      'dashboard.subtitle': 'Create, organize, and open your Suno music mixing sessions',
      'dashboard.new_project': 'New Project',
      'dashboard.search_placeholder': 'Search projects...',
      'library.title': 'Music Library',
      'library.subtitle': 'Imported Suno tracks, stem extractions, and sound assets',
      'library.upload_btn': 'Upload Suno Track',
      'export.modal_title': 'Export Studio Master Mix',
      'export.wav_title': 'WAV Lossless Master',
      'export.mp3_title': 'MP3 320 kbps High Quality',
      'export.btn_start': 'Start Master Export',
      'export.btn_download': 'Download Master File',
      'shortcuts.title': 'Keyboard Shortcuts Reference',
      'shortcuts.search_placeholder': 'Search shortcuts (e.g. play, zoom, split, export)...',
      'toast.switched_id': 'Bahasa antarmuka diubah ke Bahasa Indonesia 🇮🇩',
      'toast.switched_en': 'Studio interface switched to English 🇺🇸'
    },
    id: {
      'topbar.autosaved': 'Tersimpan Otomatis',
      'topbar.master_preview': 'Pratinjau Master',
      'topbar.export': 'Ekspor Audio',
      'nav.navigation': 'Navigasi',
      'nav.dashboard': 'Dashboard',
      'nav.library': 'Pustaka Musik',
      'nav.studio': 'Studio Mixer',
      'nav.presets': 'Preset Studio',
      'nav.settings': 'Pengaturan',
      'nav.project_memory': 'Memori Proyek',
      'nav.shortcuts': 'Pintasan (?)',
      'toolbar.select': 'Alat Pilih (V)',
      'toolbar.split': 'Pisah / Gunting (C)',
      'toolbar.trim': 'Pangkas Tepi (S)',
      'toolbar.zoom': 'Alat Zoom (Z)',
      'toolbar.mixer': 'Konsol Mixer',
      'toolbar.auto_mix': 'Campur Otomatis',
      'mixer.console_title': 'KONSOL MIXER MULTI-SALURAN',
      'mixer.quick_preset_placeholder': 'Pilih Preset...',
      'inspector.tab_clip': 'Klip',
      'inspector.tab_mixer': 'Mixer',
      'inspector.tab_ai': 'Alat AI',
      'dashboard.title': 'Dashboard Proyek',
      'dashboard.subtitle': 'Buat, atur, dan buka sesi mixing musik Suno Anda',
      'dashboard.new_project': 'Proyek Baru',
      'dashboard.search_placeholder': 'Cari proyek musik...',
      'library.title': 'Pustaka Musik',
      'library.subtitle': 'Lagu hasil Suno AI, ekstraksi stem, dan aset audio',
      'library.upload_btn': 'Unggah Lagu Suno',
      'export.modal_title': 'Ekspor Master Hasil Mix',
      'export.wav_title': 'WAV Master Tanpa Kompresi',
      'export.mp3_title': 'MP3 320 kbps Kualitas Tinggi',
      'export.btn_start': 'Mulai Proses Ekspor',
      'export.btn_download': 'Unduh File Master',
      'shortcuts.title': 'Panduan Pintasan Tombol Keyboard',
      'shortcuts.search_placeholder': 'Cari pintasan (misal: spasi, zoom, pisah, ekspor)...',
      'toast.switched_id': 'Bahasa antarmuka diubah ke Bahasa Indonesia 🇮🇩',
      'toast.switched_en': 'Studio interface switched to English 🇺🇸'
    }
  };

  function setLanguage(lang) {
    const targetLang = (lang === 'en') ? 'en' : 'id';
    state.language = targetLang;
    try {
      localStorage.setItem('suno_studio_lang', targetLang);
    } catch (e) {}

    const dict = TRANSLATIONS[targetLang] || TRANSLATIONS.id;

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // Update titles / tooltips
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.dataset.i18nTitle;
      if (dict[key]) {
        el.title = dict[key];
      }
    });

    // Update switcher button
    if (elements.langFlag && elements.langText) {
      if (targetLang === 'id') {
        elements.langFlag.textContent = '🇮🇩';
        elements.langText.textContent = 'ID';
        if (elements.btnLangToggle) elements.btnLangToggle.title = 'Bahasa: Indonesia (Klik untuk beralih ke English)';
      } else {
        elements.langFlag.textContent = '🇺🇸';
        elements.langText.textContent = 'EN';
        if (elements.btnLangToggle) elements.btnLangToggle.title = 'Language: English (Click to switch to Bahasa Indonesia)';
      }
    }
  }

  function toggleLanguage() {
    const next = state.language === 'id' ? 'en' : 'id';
    setLanguage(next);
    const dict = TRANSLATIONS[next] || TRANSLATIONS.id;
    showToast(next === 'id' ? dict['toast.switched_id'] : dict['toast.switched_en']);
  }

  function initI18nModule() {
    if (elements.btnLangToggle) {
      elements.btnLangToggle.addEventListener('click', toggleLanguage);
    }
    setLanguage(state.language || 'id');
  }

  // --------------------------------------------------------------------------
  // 22. Master Initialization
  // --------------------------------------------------------------------------
  function init() {
    buildTimelineRuler();
    updatePlayheadPosition();
    initScrubbing();
    initTimelineClipInteractions();
    initClipInspectorEvents();
    renderClips();
    selectClip('clip-1');
    initTrackControls();
    initInspector();
    initToolsAndZoom();
    initNavigationAndModals();
    initHistoryModule();
    initKeyboardShortcuts();
    initI18nModule();

    // Module Initializations
    initProjectModule();
    initLibraryModule();
    initAudioAnalysisModule();
    initMixerModule();
    initAiModule();
    initMasterExportModule();

    // Initial render
    renderProjectsGrid();
    renderLibraryTable();

    setTimeout(() => {
      showToast(state.language === 'id' ? 'Suno Studio Siap: Bahasa Indonesia Aktif 🇮🇩' : 'Suno Studio Ready: English Active 🇺🇸');
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
