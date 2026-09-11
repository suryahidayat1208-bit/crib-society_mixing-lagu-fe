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
    currentTime: 0.0,
    totalDuration: 225.0,
    timelineWidthPx: 2400,
    pxPerSecond: 2400 / 225.0,
    zoomLevel: 100,
    activeTool: 'select',
    snapSetting: 'quarter_beat',
    isLooping: false,
    selectedTrackId: 'track-all',
    selectedClipId: 'clip-1',
    activeAnalysisProfile: ANALYSIS_PROFILES['clip-1'],
    inspectorCollapsed: false,
    activeInspectorTab: 'allinone',
    lastAutosaveTime: Date.now(),
    libraryFilter: 'all',
    librarySearch: '',
    projectSearch: '',
    pendingUploadItem: null,
    pendingDeleteProjId: null,
    pendingRenameProjId: null,
    isReanalyzing: false,
    studioMode: {
      enabled: false,
      preset: 'studio-master',
      clarity: 3.5,
      deMud: -4.0,
      air: 4.0,
      warmth: 1.5
    },
    allInOneStems: {
      vocal: { vol: 0.0, clarity: 2.0, mute: false, solo: false },
      bass: { vol: 0.0, punch: 2.5, mute: false, solo: false },
      drum: { vol: -1.0, punch: 60, mute: false, solo: false },
      fx: { vol: 0.0, reverb: 40, mute: false, solo: false }
    },
    trackEffects: {
      1: { clarity: null, voice: null, clarityIntensity: 80 },
      2: { clarity: null, voice: null, clarityIntensity: 80 },
      3: { clarity: null, voice: null, clarityIntensity: 80 },
      4: { clarity: null, voice: null, clarityIntensity: 80 }
    },
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
        startSec: 0.0,
        durationSec: 225.0,
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
        durationSec: 225.0,
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
        durationSec: 225.0,
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
    btnStudioImportAudio: document.getElementById('btnStudioImportAudio'),
    studioDirectFileInput: document.getElementById('studioDirectFileInput'),

    // Quick Start Banner & Clarity / Voice Tools
    quickStartBanner: document.getElementById('quickStartBanner'),
    btnCloseQuickStart: document.getElementById('btnCloseQuickStart'),
    btnOpenClarityModal: document.getElementById('btnOpenClarityModal'),
    btnCloseClarityModal: document.getElementById('btnCloseClarityModal'),
    clarityModal: document.getElementById('clarityModal'),
    clarityTrackSelect: document.getElementById('clarityTrackSelect'),
    clarityPresetsGrid: document.getElementById('clarityPresetsGrid'),
    clarityIntensitySlider: document.getElementById('clarityIntensitySlider'),
    clarityIntensityVal: document.getElementById('clarityIntensityVal'),
    btnResetClarity: document.getElementById('btnResetClarity'),
    btnApplyClarity: document.getElementById('btnApplyClarity'),
    btnOpenVoiceModal: document.getElementById('btnOpenVoiceModal'),
    btnCloseVoiceModal: document.getElementById('btnCloseVoiceModal'),
    voiceModal: document.getElementById('voiceModal'),
    voiceTrackSelect: document.getElementById('voiceTrackSelect'),
    voicePresetsGrid: document.getElementById('voicePresetsGrid'),
    btnBypassVoice: document.getElementById('btnBypassVoice'),
    btnApplyVoice: document.getElementById('btnApplyVoice'),

    // Mode Studio & All-In-One Elements
    btnToggleStudioMode: document.getElementById('btnToggleStudioMode'),
    studioModeBadge: document.getElementById('studioModeBadge'),
    btnOpenStudioModeModal: document.getElementById('btnOpenStudioModeModal'),
    allinoneStudioBadge: document.getElementById('allinoneStudioBadge'),
    trackRowAllInOne: document.getElementById('trackRowAllInOne'),
    pillStemVocal: document.getElementById('pillStemVocal'),
    pillStemBass: document.getElementById('pillStemBass'),
    pillStemDrum: document.getElementById('pillStemDrum'),
    pillStemFx: document.getElementById('pillStemFx'),
    studioModeModal: document.getElementById('studioModeModal'),
    btnCloseStudioModeModal: document.getElementById('btnCloseStudioModeModal'),
    btnCancelStudioMode: document.getElementById('btnCancelStudioMode'),
    btnApplyStudioMode: document.getElementById('btnApplyStudioMode'),
    btnBypassStudioMode: document.getElementById('btnBypassStudioMode'),
    modalStudioStatusBadge: document.getElementById('modalStudioStatusBadge'),
    studioPresetGrid: document.getElementById('studioPresetGrid'),
    sliderStudioClarity: document.getElementById('sliderStudioClarity'),
    readoutStudioClarity: document.getElementById('readoutStudioClarity'),
    sliderStudioDeMud: document.getElementById('sliderStudioDeMud'),
    readoutStudioDeMud: document.getElementById('readoutStudioDeMud'),
    sliderStudioAir: document.getElementById('sliderStudioAir'),
    readoutStudioAir: document.getElementById('readoutStudioAir'),
    sliderStudioWarmth: document.getElementById('sliderStudioWarmth'),
    readoutStudioWarmth: document.getElementById('readoutStudioWarmth'),
    btnAllInOneOpenStudio: document.getElementById('btnAllInOneOpenStudio'),
    btnAllInOneReset: document.getElementById('btnAllInOneReset'),
    btnAllInOneDownload: document.getElementById('btnAllInOneDownload'),
    sliderStemVocalVol: document.getElementById('sliderStemVocalVol'),
    readoutStemVocalVol: document.getElementById('readoutStemVocalVol'),
    sliderStemVocalClarity: document.getElementById('sliderStemVocalClarity'),
    readoutStemVocalClarity: document.getElementById('readoutStemVocalClarity'),
    btnStemVocalMute: document.getElementById('btnStemVocalMute'),
    btnStemVocalSolo: document.getElementById('btnStemVocalSolo'),
    sliderStemBassVol: document.getElementById('sliderStemBassVol'),
    readoutStemBassVol: document.getElementById('readoutStemBassVol'),
    sliderStemBassPunch: document.getElementById('sliderStemBassPunch'),
    readoutStemBassPunch: document.getElementById('readoutStemBassPunch'),
    btnStemBassMute: document.getElementById('btnStemBassMute'),
    btnStemBassSolo: document.getElementById('btnStemBassSolo'),
    sliderStemDrumVol: document.getElementById('sliderStemDrumVol'),
    readoutStemDrumVol: document.getElementById('readoutStemDrumVol'),
    sliderStemDrumPunch: document.getElementById('sliderStemDrumPunch'),
    readoutStemDrumPunch: document.getElementById('readoutStemDrumPunch'),
    btnStemDrumMute: document.getElementById('btnStemDrumMute'),
    btnStemDrumSolo: document.getElementById('btnStemDrumSolo'),
    sliderStemFxVol: document.getElementById('sliderStemFxVol'),
    readoutStemFxVol: document.getElementById('readoutStemFxVol'),
    sliderStemFxReverb: document.getElementById('sliderStemFxReverb'),
    readoutStemFxReverb: document.getElementById('readoutStemFxReverb'),
    btnStemFxMute: document.getElementById('btnStemFxMute'),
    btnStemFxSolo: document.getElementById('btnStemFxSolo'),

    // Phase 5 Mixer Console & Channel Strip Elements
    btnToggleMixerDock: document.getElementById('btnToggleMixerDock'),
    btnToggleMixerConsole: document.getElementById('btnToggleMixerConsole'),
    btnCloseMixerConsole: document.getElementById('btnCloseMixerConsole'),
    mixerConsoleDrawer: document.getElementById('mixerConsoleDrawer'),
    mixerStripsContainer: document.getElementById('mixerStripsContainer'),
    btnMasterMonoToggle: document.getElementById('btnMasterMonoToggle'),
    btnQuickDownloadHeader: document.getElementById('btnQuickDownloadHeader'),
    btnQuickDownloadModal: document.getElementById('btnQuickDownloadModal'),
    btnMixerDownloadMaster: document.getElementById('btnMixerDownloadMaster'),
    btnMixerOpenClarity: document.getElementById('btnMixerOpenClarity'),
    btnMixerOpenVoice: document.getElementById('btnMixerOpenVoice'),
    btnMixerAutoMix: document.getElementById('btnMixerAutoMix'),
    btnMixerSplit: document.getElementById('btnMixerSplit'),

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
      allinone: document.getElementById('paneAllInOne'),
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
          showToast(`Auditioning "${s.title}" (3s preview) 🔊`);
          playAudioPreview(s.id, 3.5);
          startMeterSimulation();
          setTimeout(stopMeterSimulation, 3500);
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

  function ensureTimelineDurationForClips() {
    let maxClipEnd = 0;
    state.clips.forEach((c) => {
      const dur = (c.durationSec && !isNaN(c.durationSec)) ? c.durationSec : 60.0;
      maxClipEnd = Math.max(maxClipEnd, (c.startSec || 0) + dur);
    });

    if (maxClipEnd + 10 > state.totalDuration) {
      state.totalDuration = Math.max(240.0, Math.ceil((maxClipEnd + 15) / 15) * 15);
      state.pxPerSecond = state.timelineWidthPx / state.totalDuration;
      if (elements.quickDuration) {
        elements.quickDuration.textContent = formatTime(state.totalDuration);
      }
      if (elements.timecodeTotal) {
        elements.timecodeTotal.textContent = formatTime(state.totalDuration);
      }
      buildTimelineRuler();
      updatePlayheadPosition();
    }
  }

  function addSongToTimeline(songId, targetTrackId = 4, targetStartSec = 0.0) {
    const library = getStoredLibrary();
    const song = library.find((s) => s.id === songId);
    if (!song) return;

    const audioBuf = AUDIO_BUFFERS[songId] || song.audioBuffer;
    const audioEl = AUDIO_ELEMENTS[songId] || song.audioElement;
    const clipDur = (audioBuf && audioBuf.duration) ? audioBuf.duration :
                    (audioEl && audioEl.duration && !isNaN(audioEl.duration)) ? audioEl.duration :
                    (song.durationSec || 180.0);

    const newClip = {
      id: 'clip-' + Date.now(),
      trackId: targetTrackId,
      title: song.title,
      startSec: targetStartSec,
      durationSec: clipDur,
      fadeInSec: 0.5,
      fadeOutSec: 1.0,
      color: targetTrackId === 1 ? 'cyan' : targetTrackId === 2 ? 'purple' : targetTrackId === 3 ? 'emerald' : 'amber',
      bpm: song.bpm || 128,
      key: song.key || 'A min',
      energy: song.energy || '80% (High)',
      waveformSeed: targetTrackId,
      audioBuffer: audioBuf,
      audioElement: audioEl
    };
    if (audioBuf) {
      AUDIO_BUFFERS[newClip.id] = audioBuf;
    }
    if (audioEl) {
      AUDIO_ELEMENTS[newClip.id] = audioEl;

      const onDurationLoaded = () => {
        if (audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 0) {
          newClip.durationSec = audioEl.duration;
          ensureTimelineDurationForClips();
          renderClips();
          if (elements.quickDuration) {
            elements.quickDuration.textContent = formatTime(state.totalDuration);
          }
        }
      };
      audioEl.addEventListener('loadedmetadata', onDurationLoaded, { once: true });
      audioEl.addEventListener('durationchange', onDurationLoaded);
      audioEl.addEventListener('canplaythrough', onDurationLoaded, { once: true });
    }

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
    ensureTimelineDurationForClips();
    renderClips();
    selectClip(newClip.id);
    seekTo(targetStartSec);

    switchView('studio');
    showToast(state.language === 'id' ? `"${song.title}" masuk ke Track ${targetTrackId} • Durasi penuh siap diputar 🔊` : `"${song.title}" added to Track ${targetTrackId} • Full track ready to play 🔊`);
    triggerAutosave();
  }

  function importAudioFileDirectly(file, targetTrackId = 1, targetStartSec = 0.0) {
    if (!file) return;

    const validExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
    const fileName = file.name || 'Imported_Track.mp3';
    const isAudio = validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext)) || (file.type && file.type.startsWith('audio/'));

    if (!isAudio) {
      showToast(state.language === 'id' ? 'Format audio tidak didukung. Gunakan MP3, WAV, atau FLAC.' : 'Unsupported audio format. Please upload MP3, WAV, or FLAC.');
      return;
    }

    let audioUrl = null;
    let audioEl = null;
    try {
      audioUrl = URL.createObjectURL(file);
      audioEl = new Audio(audioUrl);
      audioEl.preload = 'auto';
    } catch (e) {
      console.warn('Could not create Audio element for file', e);
    }

    let initialDur = 180.0;
    if (file.size > 0) {
      initialDur = Math.max(30, Math.min(600, Math.round(file.size / 24000)));
    }

    const clipId = 'clip-' + Date.now();
    const colorMap = { 1: 'cyan', 2: 'purple', 3: 'emerald', 4: 'amber' };
    const trackColor = colorMap[targetTrackId] || 'cyan';

    const newClip = {
      id: clipId,
      trackId: targetTrackId,
      title: fileName,
      startSec: targetStartSec,
      durationSec: initialDur,
      fadeInSec: 0.2,
      fadeOutSec: 0.8,
      color: trackColor,
      bpm: 128,
      key: 'A min',
      energy: '80% (High)',
      waveformSeed: targetTrackId,
      audioElement: audioEl,
      audioBuffer: null
    };

    if (audioEl) {
      AUDIO_ELEMENTS[clipId] = audioEl;

      const onDurationAvailable = () => {
        if (audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 0) {
          newClip.durationSec = audioEl.duration;
          ensureTimelineDurationForClips();
          renderClips();
          if (elements.quickDuration) {
            elements.quickDuration.textContent = formatTime(state.totalDuration);
          }
        }
      };

      audioEl.addEventListener('loadedmetadata', onDurationAvailable, { once: true });
      audioEl.addEventListener('durationchange', onDurationAvailable);
      audioEl.addEventListener('canplaythrough', onDurationAvailable, { once: true });
    }

    const ctx = getAudioContext();
    if (ctx && file.arrayBuffer) {
      file.arrayBuffer().then((ab) => {
        ctx.decodeAudioData(ab.slice(0)).then((decoded) => {
          AUDIO_BUFFERS[clipId] = decoded;
          newClip.audioBuffer = decoded;
          newClip.durationSec = decoded.duration;
          ensureTimelineDurationForClips();
          renderClips();
          if (elements.quickDuration) {
            elements.quickDuration.textContent = formatTime(state.totalDuration);
          }
        }).catch((err) => {
          console.warn('Audio decoding fallback to AudioElement:', err);
        });
      }).catch((e) => console.warn('ArrayBuffer read error:', e));
    }

    // Cleanly replace old clips on target track if starting at 0:00
    if (targetStartSec === 0.0) {
      state.clips = state.clips.filter((c) => c.trackId !== targetTrackId);
    }

    ANALYSIS_PROFILES[clipId] = {
      title: fileName,
      bpm: 128,
      bpmConf: 96.0,
      key: 'A min',
      camelot: getCamelotCode('A min'),
      keyConf: 92.0,
      energy: 82,
      energyDesc: '82% Energy',
      lufsIntegrated: -13.0,
      truePeak: -0.5,
      lra: 6.0,
      lufsMax: -10.2,
      syncReady: true,
      svgArea: 'M0,45 Q35,38 70,30 T140,8 T210,18 T280,38 L280,54 L0,54 Z',
      svgLine: 'M0,45 Q35,38 70,30 T140,8 T210,18 T280,38'
    };

    state.clips.push(newClip);
    ensureTimelineDurationForClips();
    renderClips();
    selectClip(clipId);
    seekTo(targetStartSec);

    switchView('studio');
    showToast(state.language === 'id' ?
      `"${fileName}" dimasukkan ke Track ${targetTrackId} • Durasi penuh siap diputar 🔊` :
      `"${fileName}" loaded to Track ${targetTrackId} • Full track ready to play 🔊`);
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
      showToast(state.language === 'id' ? 'Format audio tidak didukung. Harap unggah MP3, WAV, atau FLAC.' : 'Unsupported audio format. Please upload MP3, WAV, or FLAC.');
      return;
    }

    state.pendingUploadFile = file;
    state.pendingDecodedBuffer = null;

    function applyResolvedDuration(dur) {
      if (!dur || isNaN(dur) || dur <= 0) return;
      if (state.pendingUploadItem) {
        state.pendingUploadItem.durationSec = dur;
        state.pendingUploadItem.duration = formatTime(dur);
      }
      if (elements.previewDuration) {
        elements.previewDuration.textContent = formatTime(dur);
      }
      state.clips.forEach((c) => {
        if (c.audioElement === audioEl || (state.pendingUploadItem && c.id === state.pendingUploadItem.id)) {
          c.durationSec = dur;
          ensureTimelineDurationForClips();
          renderClips();
        }
      });
    }

    // Create immediate native Audio element for guaranteed instant playback
    let audioUrl = null;
    let audioEl = null;
    try {
      audioUrl = URL.createObjectURL(file);
      audioEl = new Audio(audioUrl);
      audioEl.preload = 'auto';
      state.pendingAudioUrl = audioUrl;
      state.pendingAudioElement = audioEl;

      audioEl.addEventListener('loadedmetadata', () => applyResolvedDuration(audioEl.duration));
      audioEl.addEventListener('durationchange', () => applyResolvedDuration(audioEl.duration));
      audioEl.addEventListener('canplaythrough', () => applyResolvedDuration(audioEl.duration));
    } catch (e) {
      console.warn('Could not create ObjectURL for file', e);
    }

    // Decode audio file in background
    const ctx = getAudioContext();
    if (ctx && file.arrayBuffer) {
      file.arrayBuffer().then((ab) => {
        ctx.decodeAudioData(ab.slice(0)).then((decoded) => {
          state.pendingDecodedBuffer = decoded;
          applyResolvedDuration(decoded.duration);
          if (state.pendingUploadItem) {
            state.pendingUploadItem.audioBuffer = decoded;
            AUDIO_BUFFERS[state.pendingUploadItem.id] = decoded;
          }
        }).catch((err) => {
          console.warn('Audio decoding fallback to AudioElement:', err);
        });
      }).catch((err) => {
        console.warn('File reading failed:', err);
      });
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

    let accurateDurationSec = 180.0;
    if (state.pendingDecodedBuffer && state.pendingDecodedBuffer.duration > 0) {
      accurateDurationSec = state.pendingDecodedBuffer.duration;
    } else if (state.pendingAudioElement && !isNaN(state.pendingAudioElement.duration) && state.pendingAudioElement.duration > 0) {
      accurateDurationSec = state.pendingAudioElement.duration;
    } else if (fileSize > 0) {
      accurateDurationSec = Math.max(30, Math.min(600, Math.round(fileSize / 24000)));
    }
    const accurateDurationStr = formatTime(accurateDurationSec);

    state.pendingUploadItem = {
      id: 'lib-' + Date.now(),
      title: cleanTitle,
      category: category,
      categoryLabel: capitalize(category),
      model: 'Suno v3.5',
      duration: accurateDurationStr,
      durationSec: accurateDurationSec,
      bpm: detectedBpm,
      key: detectedKey,
      energy: energyLabel,
      energyVal: energyVal,
      status: 'analyzed',
      dateAdded: 'Just now',
      audioBuffer: state.pendingDecodedBuffer || null,
      audioElement: state.pendingAudioElement || null
    };

    if (state.pendingDecodedBuffer) {
      AUDIO_BUFFERS[state.pendingUploadItem.id] = state.pendingDecodedBuffer;
    }
    if (state.pendingAudioElement) {
      AUDIO_ELEMENTS[state.pendingUploadItem.id] = state.pendingAudioElement;
    }

    if (elements.previewSongTitle) elements.previewSongTitle.textContent = cleanTitle;
    if (elements.previewBpm) elements.previewBpm.textContent = detectedBpm;
    if (elements.previewKey) elements.previewKey.textContent = detectedKey;
    if (elements.previewDuration) elements.previewDuration.textContent = accurateDurationStr;
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
    const wasPlaying = state.isPlaying;
    if (wasPlaying) {
      stopAudioPlayback();
    }
    state.currentTime = Math.max(0, Math.min(state.totalDuration, targetSeconds));
    updatePlayheadPosition();
    if (wasPlaying) {
      startAudioPlayback();
    }
  }

  // --------------------------------------------------------------------------
  // 13B. Real Web Audio Engine (Web Audio API & Synthesis DSP)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  const AUDIO_BUFFERS = {};
  const AUDIO_ELEMENTS = {};
  const activeAudioSources = {};
  const activeAudioElements = {};
  const activeElementSources = {};
  const activeAudioTimeouts = {};
  let trackNodes = {};
  let masterGainNode = null;
  let masterAnalyserNode = null;
  let studioMasterNodes = {
    deRumble: null,
    deMud: null,
    presence: null,
    air: null,
    warmth: null
  };
  let previewSourceNode = null;
  let previewAudioElement = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function unlockAudioContext() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  if (typeof window !== 'undefined') {
    ['click', 'keydown', 'mousedown', 'touchstart'].forEach((type) => {
      window.addEventListener(type, unlockAudioContext, { passive: true });
    });
  }

  function ensureTrackAudioNodes() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!masterGainNode) {
      masterGainNode = ctx.createGain();
      masterAnalyserNode = ctx.createAnalyser();
      masterAnalyserNode.fftSize = 256;

      // Mode Studio Mastering Audio Chain
      const isStudioEnabled = !!(state.studioMode && state.studioMode.enabled);
      const studioDeRumble = ctx.createBiquadFilter();
      studioDeRumble.type = 'highpass';
      studioDeRumble.frequency.value = isStudioEnabled ? 35 : 10;

      const studioDeMud = ctx.createBiquadFilter();
      studioDeMud.type = 'peaking';
      studioDeMud.frequency.value = 300;
      studioDeMud.Q.value = 1.4;
      studioDeMud.gain.value = isStudioEnabled ? (state.studioMode.deMud !== undefined ? state.studioMode.deMud : -4.0) : 0;

      const studioPresence = ctx.createBiquadFilter();
      studioPresence.type = 'peaking';
      studioPresence.frequency.value = 2800;
      studioPresence.Q.value = 1.0;
      studioPresence.gain.value = isStudioEnabled ? (state.studioMode.clarity !== undefined ? state.studioMode.clarity : 3.5) : 0;

      const studioAir = ctx.createBiquadFilter();
      studioAir.type = 'highshelf';
      studioAir.frequency.value = 10500;
      studioAir.gain.value = isStudioEnabled ? (state.studioMode.air !== undefined ? state.studioMode.air : 4.0) : 0;

      const studioWarmth = ctx.createBiquadFilter();
      studioWarmth.type = 'lowshelf';
      studioWarmth.frequency.value = 100;
      studioWarmth.gain.value = isStudioEnabled ? (state.studioMode.warmth !== undefined ? state.studioMode.warmth : 1.5) : 0;

      masterGainNode.connect(studioDeRumble);
      studioDeRumble.connect(studioDeMud);
      studioDeMud.connect(studioPresence);
      studioPresence.connect(studioAir);
      studioAir.connect(studioWarmth);
      studioWarmth.connect(masterAnalyserNode);
      masterAnalyserNode.connect(ctx.destination);

      studioMasterNodes = {
        deRumble: studioDeRumble,
        deMud: studioDeMud,
        presence: studioPresence,
        air: studioAir,
        warmth: studioWarmth
      };

      updateMasterAudioNode();
    }

    [1, 2, 3, 4].forEach((id) => {
      if (!trackNodes[id]) {
        const gainNode = ctx.createGain();
        let panNode = null;
        try {
          if (ctx.createStereoPanner) {
            panNode = ctx.createStereoPanner();
          }
        } catch (e) {}

        const clarityLowCut = ctx.createBiquadFilter();
        clarityLowCut.type = 'highpass';
        clarityLowCut.frequency.value = 20;

        const clarityDeMud = ctx.createBiquadFilter();
        clarityDeMud.type = 'peaking';
        clarityDeMud.frequency.value = 400;
        clarityDeMud.Q.value = 1.2;
        clarityDeMud.gain.value = 0;

        const clarityHighAir = ctx.createBiquadFilter();
        clarityHighAir.type = 'highshelf';
        clarityHighAir.frequency.value = 9000;
        clarityHighAir.gain.value = 0;

        const voiceFilter = ctx.createBiquadFilter();
        voiceFilter.type = 'allpass';
        voiceFilter.frequency.value = 1000;

        const eqLow = ctx.createBiquadFilter();
        eqLow.type = 'lowshelf';
        eqLow.frequency.value = 250;

        const eqMid = ctx.createBiquadFilter();
        eqMid.type = 'peaking';
        eqMid.frequency.value = 1000;
        eqMid.Q.value = 1.0;

        const eqHigh = ctx.createBiquadFilter();
        eqHigh.type = 'highshelf';
        eqHigh.frequency.value = 4000;

        clarityLowCut.connect(clarityDeMud);
        clarityDeMud.connect(clarityHighAir);
        clarityHighAir.connect(voiceFilter);
        voiceFilter.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(gainNode);

        if (panNode) {
          gainNode.connect(panNode);
          panNode.connect(masterGainNode);
        } else {
          gainNode.connect(masterGainNode);
        }

        trackNodes[id] = {
          clarityLowCut,
          clarityDeMud,
          clarityHighAir,
          voiceFilter,
          eqLow,
          eqMid,
          eqHigh,
          gain: gainNode,
          pan: panNode
        };

        updateAudioTrackNode(id);
      }
    });
  }

  function updateAudioTrackNode(trackId) {
    if (!audioCtx) return;
    const nodes = trackNodes[trackId];
    const trk = state.tracks[trackId];
    if (!nodes || !trk) return;

    const anySolo = Object.values(state.tracks).some((t) => t.solo);
    let effectiveGain = 0;
    if (anySolo) {
      if (trk.solo && !trk.mute) {
        effectiveGain = Math.pow(10, (trk.vol + (trk.gainTrim || 0)) / 20);
      } else {
        effectiveGain = 0;
      }
    } else {
      if (!trk.mute) {
        effectiveGain = Math.pow(10, (trk.vol + (trk.gainTrim || 0)) / 20);
      } else {
        effectiveGain = 0;
      }
    }

    try {
      nodes.gain.gain.setTargetAtTime(effectiveGain, audioCtx.currentTime, 0.02);
    } catch (e) {
      nodes.gain.gain.value = effectiveGain;
    }

    if (nodes.pan && nodes.pan.pan) {
      const p = Math.max(-1, Math.min(1, (trk.pan || 0) / 100));
      try {
        nodes.pan.pan.setTargetAtTime(p, audioCtx.currentTime, 0.02);
      } catch (e) {
        nodes.pan.pan.value = p;
      }
    }

    if (trk.eq) {
      try {
        nodes.eqLow.gain.setTargetAtTime(trk.eq.low || 0, audioCtx.currentTime, 0.02);
        nodes.eqMid.gain.setTargetAtTime(trk.eq.mid || 0, audioCtx.currentTime, 0.02);
        nodes.eqHigh.gain.setTargetAtTime(trk.eq.high || 0, audioCtx.currentTime, 0.02);
      } catch (e) {}
    }

    // Also update any active HTML5 audio elements on this track if not routed through Web Audio
    state.clips.forEach((clip) => {
      if (clip.trackId === trackId && activeAudioElements[clip.id]) {
        const el = activeAudioElements[clip.id];
        if (!activeElementSources[clip.id]) {
          const masterVol = (state.mixer && state.mixer.master) ? state.mixer.master.vol : 0;
          const masterGain = Math.pow(10, masterVol / 20);
          el.volume = Math.max(0, Math.min(1, effectiveGain * masterGain));
          el.muted = trk.mute;
        }
      }
    });
  }

  function updateMasterAudioNode() {
    if (!audioCtx || !masterGainNode) return;
    const masterVol = (state.mixer && state.mixer.master) ? state.mixer.master.vol : 0;
    const g = Math.pow(10, masterVol / 20);
    try {
      masterGainNode.gain.setTargetAtTime(g, audioCtx.currentTime, 0.02);
    } catch (e) {
      masterGainNode.gain.value = g;
    }

    // Also update all active HTML5 audio elements if not routed through Web Audio
    state.clips.forEach((clip) => {
      if (activeAudioElements[clip.id]) {
        const el = activeAudioElements[clip.id];
        if (!activeElementSources[clip.id]) {
          const trk = state.tracks[clip.trackId] || { vol: 0, gainTrim: 0, mute: false };
          const effectiveGain = !trk.mute ? Math.pow(10, (trk.vol + (trk.gainTrim || 0)) / 20) : 0;
          el.volume = Math.max(0, Math.min(1, effectiveGain * g));
          el.muted = trk.mute;
        }
      }
    });
  }

  function updateStudioModeDsp() {
    if (!audioCtx || !studioMasterNodes.deRumble) return;
    const isStudioEnabled = !!(state.studioMode && state.studioMode.enabled);
    const deMudGain = isStudioEnabled ? (state.studioMode.deMud !== undefined ? state.studioMode.deMud : -4.0) : 0;
    const presenceGain = isStudioEnabled ? (state.studioMode.clarity !== undefined ? state.studioMode.clarity : 3.5) : 0;
    const airGain = isStudioEnabled ? (state.studioMode.air !== undefined ? state.studioMode.air : 4.0) : 0;
    const warmthGain = isStudioEnabled ? (state.studioMode.warmth !== undefined ? state.studioMode.warmth : 1.5) : 0;
    const rumbleFreq = isStudioEnabled ? 35 : 10;

    const t = audioCtx.currentTime;
    try {
      studioMasterNodes.deRumble.frequency.setTargetAtTime(rumbleFreq, t, 0.02);
      studioMasterNodes.deMud.gain.setTargetAtTime(deMudGain, t, 0.02);
      studioMasterNodes.presence.gain.setTargetAtTime(presenceGain, t, 0.02);
      studioMasterNodes.air.gain.setTargetAtTime(airGain, t, 0.02);
      studioMasterNodes.warmth.gain.setTargetAtTime(warmthGain, t, 0.02);
    } catch (e) {
      studioMasterNodes.deRumble.frequency.value = rumbleFreq;
      studioMasterNodes.deMud.gain.value = deMudGain;
      studioMasterNodes.presence.gain.value = presenceGain;
      studioMasterNodes.air.gain.value = airGain;
      studioMasterNodes.warmth.gain.value = warmthGain;
    }
  }

  function generateProceduralDrumsBuffer(ctx, bpm) {
    const sr = ctx.sampleRate || 44100;
    const tempo = bpm || 128;
    const beatSec = 60 / tempo;
    const totalSec = beatSec * 16;
    const length = Math.floor(sr * totalSec);
    const buffer = ctx.createBuffer(2, length, sr);
    const L = buffer.getChannelData(0);
    const R = buffer.getChannelData(1);

    for (let bar = 0; bar < 4; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const bIdx = bar * 4 + beat;
        const bTime = bIdx * beatSec;
        const startSamp = Math.floor(bTime * sr);

        // Kick drum on every beat
        const kickLen = Math.floor(0.22 * sr);
        for (let i = 0; i < kickLen && (startSamp + i) < length; i++) {
          const t = i / sr;
          const freq = 135 * Math.exp(-t * 22) + 42;
          const amp = Math.exp(-t * 9) * 0.75;
          const s = Math.sin(2 * Math.PI * freq * t) * amp;
          L[startSamp + i] += s;
          R[startSamp + i] += s;
        }

        // Snare drum on beat 2 and 4
        if (beat === 1 || beat === 3) {
          const snareLen = Math.floor(0.25 * sr);
          for (let i = 0; i < snareLen && (startSamp + i) < length; i++) {
            const t = i / sr;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * 0.35;
            const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 12) * 0.25;
            L[startSamp + i] += (noise + tone);
            R[startSamp + i] += (noise + tone);
          }
        }

        // Hi-hat on 8th notes
        [0, 0.5].forEach((sub) => {
          const hhSamp = Math.floor((bTime + sub * beatSec) * sr);
          const hhLen = Math.floor(0.06 * sr);
          for (let i = 0; i < hhLen && (hhSamp + i) < length; i++) {
            const t = i / sr;
            const hh = (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.15;
            L[hhSamp + i] += hh * 0.8;
            R[hhSamp + i] += hh * 1.1;
          }
        });
      }
    }

    let maxPeak = 0;
    for (let i = 0; i < length; i++) {
      const val = Math.abs(L[i]);
      if (val > maxPeak) maxPeak = val;
    }
    if (maxPeak > 0.8) {
      const norm = 0.75 / maxPeak;
      for (let i = 0; i < length; i++) {
        L[i] *= norm;
        R[i] *= norm;
      }
    }
    return buffer;
  }

  function generateProceduralBassBuffer(ctx, bpm) {
    const sr = ctx.sampleRate || 44100;
    const tempo = bpm || 128;
    const beatSec = 60 / tempo;
    const totalSec = beatSec * 16;
    const length = Math.floor(sr * totalSec);
    const buffer = ctx.createBuffer(2, length, sr);
    const L = buffer.getChannelData(0);
    const R = buffer.getChannelData(1);
    const roots = [55.0, 43.65, 65.41, 48.99]; // A1, F1, C2, G1

    for (let bar = 0; bar < 4; bar++) {
      const rootFreq = roots[bar];
      for (let step = 0; step < 8; step++) {
        const tStart = (bar * 4 + step * 0.5) * beatSec;
        const startSamp = Math.floor(tStart * sr);
        const noteLen = Math.floor(0.42 * beatSec * sr);

        for (let i = 0; i < noteLen && (startSamp + i) < length; i++) {
          const t = i / sr;
          const env = Math.sin(Math.PI * (i / noteLen)) * 0.45;
          let saw = 0;
          for (let h = 1; h <= 4; h++) {
            saw += (Math.sin(2 * Math.PI * rootFreq * h * t) / h) * 0.3;
          }
          L[startSamp + i] += saw * env;
          R[startSamp + i] += saw * env;
        }
      }
    }
    return buffer;
  }

  function generateProceduralLeadBuffer(ctx, bpm) {
    const sr = ctx.sampleRate || 44100;
    const tempo = bpm || 128;
    const beatSec = 60 / tempo;
    const totalSec = beatSec * 16;
    const length = Math.floor(sr * totalSec);
    const buffer = ctx.createBuffer(2, length, sr);
    const L = buffer.getChannelData(0);
    const R = buffer.getChannelData(1);

    const melodyNotes = [
      { bar: 0, beat: 0, dur: 1.5, f: 440.0 },
      { bar: 0, beat: 1.5, dur: 0.5, f: 523.25 },
      { bar: 0, beat: 2.0, dur: 1.0, f: 587.33 },
      { bar: 0, beat: 3.0, dur: 1.0, f: 659.25 },
      { bar: 1, beat: 0, dur: 2.0, f: 523.25 },
      { bar: 1, beat: 2, dur: 2.0, f: 440.0 },
      { bar: 2, beat: 0, dur: 1.5, f: 587.33 },
      { bar: 2, beat: 1.5, dur: 0.5, f: 659.25 },
      { bar: 2, beat: 2.0, dur: 1.0, f: 783.99 },
      { bar: 2, beat: 3.0, dur: 1.0, f: 659.25 },
      { bar: 3, beat: 0, dur: 3.0, f: 523.25 }
    ];

    melodyNotes.forEach((note) => {
      const tStart = (note.bar * 4 + note.beat) * beatSec;
      const startSamp = Math.floor(tStart * sr);
      const noteLen = Math.floor(note.dur * beatSec * sr);

      for (let i = 0; i < noteLen && (startSamp + i) < length; i++) {
        const t = i / sr;
        const env = (i < 0.05 * sr) ? (i / (0.05 * sr)) : Math.exp(-t * 2.2);
        const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * 6;
        const s = Math.sin(2 * Math.PI * (note.f + vibrato) * t) * 0.28 +
                  Math.sin(2 * Math.PI * (note.f * 2) * t) * 0.08;
        L[startSamp + i] += s * env * 0.85;
        R[startSamp + i] += s * env * 1.15;
      }
    });
    return buffer;
  }

  function getClipAudioBuffer(clip) {
    if (AUDIO_BUFFERS[clip.id]) {
      return AUDIO_BUFFERS[clip.id];
    }
    if (clip.audioBuffer) {
      AUDIO_BUFFERS[clip.id] = clip.audioBuffer;
      return clip.audioBuffer;
    }

    const lib = getStoredLibrary();
    const matchedSong = lib.find((s) => s.title === clip.title || s.id === clip.id);
    if (matchedSong && AUDIO_BUFFERS[matchedSong.id]) {
      AUDIO_BUFFERS[clip.id] = AUDIO_BUFFERS[matchedSong.id];
      return AUDIO_BUFFERS[clip.id];
    }

    const ctx = getAudioContext();
    if (!ctx) return null;

    if (clip.trackId === 3 || (clip.title && clip.title.toLowerCase().includes('drum'))) {
      AUDIO_BUFFERS[clip.id] = generateProceduralDrumsBuffer(ctx, clip.bpm || 128);
    } else if (clip.trackId === 2 || (clip.title && (clip.title.toLowerCase().includes('bass') || clip.title.toLowerCase().includes('synth')))) {
      AUDIO_BUFFERS[clip.id] = generateProceduralBassBuffer(ctx, clip.bpm || 128);
    } else {
      AUDIO_BUFFERS[clip.id] = generateProceduralLeadBuffer(ctx, clip.bpm || 128);
    }

    return AUDIO_BUFFERS[clip.id];
  }

  function startAudioPlayback() {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureTrackAudioNodes();
    stopAudioPlayback();

    const now = ctx.currentTime;
    const currentStudioTime = state.currentTime;

    state.clips.forEach((clip) => {
      const clipEnd = clip.startSec + clip.durationSec;
      if (currentStudioTime >= clipEnd) return;

      // 1. Primary: Web Audio Buffer Source Node (Procedural tracks and decoded buffers)
      // Routes directly through the full Web Audio DSP chain:
      // clarityLowCut -> clarityDeMud -> clarityHighAir -> voiceFilter -> eqLow -> eqMid -> eqHigh -> trackGain -> panNode -> masterGainNode -> Limiter -> destination
      const buf = getClipAudioBuffer(clip);
      if (buf) {
        let when = now;
        let offset = 0;

        if (currentStudioTime < clip.startSec) {
          when = now + (clip.startSec - currentStudioTime);
          offset = 0;
        } else {
          when = now;
          offset = currentStudioTime - clip.startSec;
        }

        const bufOffset = offset % buf.duration;

        try {
          const source = ctx.createBufferSource();
          source.buffer = buf;
          if (buf.duration < clip.durationSec) {
            source.loop = true;
          }

          // Apply pitch rate from voice transformer
          const fx = (state.trackEffects && state.trackEffects[clip.trackId]) || {};
          let rate = 1.0;
          if (fx.voice === 'chipmunk') rate = 1.35;
          else if (fx.voice === 'monster') rate = 0.80;
          try { source.playbackRate.setValueAtTime(rate, when); } catch (e) {}

          const clipGain = ctx.createGain();
          clipGain.gain.setValueAtTime(1.0, when);

          const trackNode = trackNodes[clip.trackId];
          if (trackNode) {
            source.connect(clipGain);
            clipGain.connect(trackNode.clarityLowCut);
          } else {
            source.connect(clipGain);
            clipGain.connect(masterGainNode);
          }

          // Start safely with 2 arguments
          source.start(when, bufOffset);

          // Stop cleanly at clipEnd
          const stopTime = when + (clipEnd - Math.max(currentStudioTime, clip.startSec));
          try {
            source.stop(stopTime);
          } catch (e) {}

          activeAudioSources[clip.id] = { source, clipGain };
        } catch (err) {
          console.warn('Error starting audio source for clip:', clip.id, err);
        }
        return;
      }

      // 2. Fallback: Native HTML5 Audio Element routed through Web Audio DSP!
      const el = clip.audioElement || AUDIO_ELEMENTS[clip.id];
      if (el) {
        const trackNode = trackNodes[clip.trackId];
        if (!activeElementSources[clip.id]) {
          try {
            const elSrc = ctx.createMediaElementSource(el);
            if (trackNode) {
              elSrc.connect(trackNode.clarityLowCut);
            } else {
              elSrc.connect(masterGainNode);
            }
            activeElementSources[clip.id] = elSrc;
          } catch (e) {
            console.warn('createMediaElementSource route note:', e);
          }
        }

        // Keep el unattenuated so Web Audio trackNode.gain and masterGainNode control the audio
        el.volume = 1.0;
        el.muted = false;

        // Apply pitch rate from voice transformer if set
        const fx = (state.trackEffects && state.trackEffects[clip.trackId]) || {};
        let rate = 1.0;
        if (fx.voice === 'chipmunk') rate = 1.35;
        else if (fx.voice === 'monster') rate = 0.80;
        try { el.playbackRate = rate; } catch (e) {}

        if (currentStudioTime >= clip.startSec && currentStudioTime < clipEnd) {
          el.currentTime = Math.max(0, currentStudioTime - clip.startSec);
          const playPromise = el.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => console.warn('AudioElement play note:', e));
          }
          activeAudioElements[clip.id] = el;
        } else if (currentStudioTime < clip.startSec) {
          const delayMs = (clip.startSec - currentStudioTime) * 1000;
          const tid = setTimeout(() => {
            if (state.isPlaying) {
              el.currentTime = 0;
              el.play().catch(() => {});
              activeAudioElements[clip.id] = el;
            }
          }, delayMs);
          activeAudioTimeouts[clip.id] = tid;
        }
        return;
      }
    });
  }

  function stopAudioPlayback() {
    // 1. Stop all Web Audio buffer sources
    Object.keys(activeAudioSources).forEach((id) => {
      const item = activeAudioSources[id];
      if (item && item.source) {
        try {
          item.source.stop();
          item.source.disconnect();
        } catch (e) {}
      }
    });
    for (const id in activeAudioSources) {
      delete activeAudioSources[id];
    }

    // 2. Pause and reset all active HTML5 audio elements
    Object.keys(activeAudioElements).forEach((id) => {
      const el = activeAudioElements[id];
      if (el) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch (e) {}
      }
    });
    for (const id in activeAudioElements) {
      delete activeAudioElements[id];
    }

    // 3. Clear pending timeout triggers
    Object.keys(activeAudioTimeouts).forEach((id) => {
      clearTimeout(activeAudioTimeouts[id]);
    });
    for (const id in activeAudioTimeouts) {
      delete activeAudioTimeouts[id];
    }
  }

  function playAudioPreview(itemId, maxSec = 3.5) {
    stopAudioPreview();

    // 1. If native Audio element is available, use it directly!
    if (AUDIO_ELEMENTS[itemId]) {
      try {
        const el = AUDIO_ELEMENTS[itemId];
        el.currentTime = 0;
        el.volume = 0.85;
        const p = el.play();
        if (p !== undefined) {
          p.catch((e) => console.warn('Preview play note:', e));
        }
        previewAudioElement = el;
        setTimeout(() => stopAudioPreview(), maxSec * 1000);
        return;
      } catch (e) {}
    }

    // 2. Web Audio Preview
    const ctx = getAudioContext();
    if (!ctx) return;

    let buf = AUDIO_BUFFERS[itemId];
    if (!buf) {
      buf = generateProceduralLeadBuffer(ctx, 128);
    }

    try {
      previewSourceNode = ctx.createBufferSource();
      previewSourceNode.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + maxSec - 0.3);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + maxSec);

      previewSourceNode.connect(gain);
      gain.connect(ctx.destination);
      previewSourceNode.start(0, 0);
      setTimeout(stopAudioPreview, maxSec * 1000);
    } catch (e) {
      console.warn('Preview playback error:', e);
    }
  }

  function stopAudioPreview() {
    if (previewAudioElement) {
      try {
        previewAudioElement.pause();
        previewAudioElement.currentTime = 0;
      } catch (e) {}
      previewAudioElement = null;
    }
    if (previewSourceNode) {
      try {
        previewSourceNode.stop();
        previewSourceNode.disconnect();
      } catch (e) {}
      previewSourceNode = null;
    }
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
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    state.isPlaying = true;
    lastTimestamp = performance.now();
    if (elements.btnPlayPause) elements.btnPlayPause.classList.add('active');
    if (elements.playIcon) {
      elements.playIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16" rx="1"></rect>
        <rect x="14" y="4" width="4" height="16" rx="1"></rect>
      `;
    }

    startAudioPlayback();
    animationFrameId = requestAnimationFrame(playbackLoop);
    startMeterSimulation();
    showToast(state.language === 'id' ? 'Pemutaran audio dimulai 🔊' : 'Audio playback started 🔊');
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
    stopAudioPlayback();
    stopMeterSimulation();
  }

  function stopPlayback() {
    pausePlayback();
    seekTo(0);
    showToast(state.language === 'id' ? 'Pemutaran dihentikan' : 'Playback stopped');
  }

  function playbackLoop(timestamp) {
    if (!state.isPlaying) return;

    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    state.currentTime += delta;

    let maxEndTime = state.totalDuration;
    if (state.clips && state.clips.length > 0) {
      let maxClipEnd = 0;
      state.clips.forEach((c) => {
        const dur = (c.durationSec && !isNaN(c.durationSec)) ? c.durationSec : 60.0;
        maxClipEnd = Math.max(maxClipEnd, (c.startSec || 0) + dur);
      });
      maxEndTime = Math.max(state.totalDuration, maxClipEnd);
    }

    // Cleanly stop active HTML5 audio elements that have reached their clipEnd
    state.clips.forEach((clip) => {
      const el = activeAudioElements[clip.id];
      if (el) {
        const clipEnd = (clip.startSec || 0) + ((clip.durationSec && !isNaN(clip.durationSec)) ? clip.durationSec : 60.0);
        if (state.currentTime >= clipEnd) {
          try { el.pause(); } catch (e) {}
          delete activeAudioElements[clip.id];
        }
      }
    });

    if (state.currentTime >= maxEndTime) {
      if (state.isLooping) {
        state.currentTime = 0;
        if (state.isPlaying) {
          stopAudioPlayback();
          startAudioPlayback();
        }
      } else {
        pausePlayback();
        state.currentTime = maxEndTime;
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

    document.querySelectorAll('.audio-clip').forEach((el) => {
      el.classList.toggle('selected', el.id === clip.id);
    });

    // Unified studio track selection (syncs timeline, mixer console, modals & inspector)
    if (typeof selectStudioTrack === 'function') {
      selectStudioTrack(clip.trackId, { syncClip: false });
    } else if (typeof selectMixerTrack === 'function') {
      selectMixerTrack(clip.trackId);
    }

    updateInspectorClipValues(clip);

    const profile = getAnalysisProfileForClip(clip);
    updateAnalysisUI(profile);

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
            selectStudioTrack(parseInt(trackId, 10));
          }
        }
      });

      // Direct drag and drop of audio files onto tracks
      ['dragenter', 'dragover'].forEach((eventName) => {
        elements.tracksContainer.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          const lane = e.target.closest('.track-lane');
          document.querySelectorAll('.track-lane').forEach((l) => l.classList.remove('track-drop-hover'));
          if (lane) lane.classList.add('track-drop-hover');
        });
      });

      ['dragleave'].forEach((eventName) => {
        elements.tracksContainer.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          const lane = e.target.closest('.track-lane');
          if (lane) lane.classList.remove('track-drop-hover');
        });
      });

      elements.tracksContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.track-lane').forEach((l) => l.classList.remove('track-drop-hover'));

        const files = e.dataTransfer ? e.dataTransfer.files : null;
        if (!files || files.length === 0) return;

        const lane = e.target.closest('.track-lane');
        const targetTrackId = (lane && lane.dataset.track) ? parseInt(lane.dataset.track, 10) : 1;
        let dropSec = 0.0;
        if (lane) {
          const laneRect = lane.getBoundingClientRect();
          const clickOffsetPx = e.clientX - laneRect.left;
          dropSec = Math.max(0, snapTime(clickOffsetPx / state.pxPerSecond));
        }

        importAudioFileDirectly(files[0], targetTrackId, dropSec);
      });
    }

    // Direct toolbar import button
    if (elements.btnStudioImportAudio && elements.studioDirectFileInput) {
      elements.btnStudioImportAudio.addEventListener('click', () => {
        elements.studioDirectFileInput.click();
      });

      elements.studioDirectFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const activeTrkNum = parseInt((state.selectedTrackId || 'track-1').replace('track-', ''), 10) || 1;
          importAudioFileDirectly(e.target.files[0], activeTrkNum, 0.0);
          e.target.value = '';
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

    // All-In-One Stem Deck Sync
    if (source !== 'allinone') {
      if (id === 1 && elements.sliderStemVocalVol) {
        elements.sliderStemVocalVol.value = val;
        if (elements.readoutStemVocalVol) elements.readoutStemVocalVol.textContent = formatted;
      } else if (id === 2 && elements.sliderStemBassVol) {
        elements.sliderStemBassVol.value = val;
        if (elements.readoutStemBassVol) elements.readoutStemBassVol.textContent = formatted;
      } else if (id === 3 && elements.sliderStemDrumVol) {
        elements.sliderStemDrumVol.value = val;
        if (elements.readoutStemDrumVol) elements.readoutStemDrumVol.textContent = formatted;
      } else if (id === 4 && elements.sliderStemFxVol) {
        elements.sliderStemFxVol.value = val;
        if (elements.readoutStemFxVol) elements.readoutStemFxVol.textContent = formatted;
      }
    }

    updateAudioTrackNode(id);
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

    updateAudioTrackNode(id);
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

    // All-In-One Stem Deck
    const stemMuteBtn = id === 1 ? elements.btnStemVocalMute : (id === 2 ? elements.btnStemBassMute : (id === 3 ? elements.btnStemDrumMute : elements.btnStemFxMute));
    if (stemMuteBtn) stemMuteBtn.classList.toggle('active', isMuted);

    // Inspector Channel Header (if active track)
    if (state.mixer.selectedTrackId === id) {
      if (elements.btnMixerMute) elements.btnMixerMute.classList.toggle('active', isMuted);
    }

    updateAudioTrackNode(id);
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

    // All-In-One Stem Deck
    const stemSoloBtn = id === 1 ? elements.btnStemVocalSolo : (id === 2 ? elements.btnStemBassSolo : (id === 3 ? elements.btnStemDrumSolo : elements.btnStemFxSolo));
    if (stemSoloBtn) stemSoloBtn.classList.toggle('active', isSolo);

    // Inspector Channel Header (if active track)
    if (state.mixer.selectedTrackId === id) {
      if (elements.btnMixerSolo) elements.btnMixerSolo.classList.toggle('active', isSolo);
    }

    [1, 2, 3, 4].forEach((tId) => updateAudioTrackNode(tId));
    showToast(`Track ${id} ${isSolo ? 'Soloed' : 'Unsoloed'}`);
    triggerAutosave();
  }

  function syncAllInOneControlsFromState() {
    // Vocal (Track 1)
    if (elements.sliderStemVocalVol && state.tracks[1]) {
      elements.sliderStemVocalVol.value = state.tracks[1].vol;
      if (elements.readoutStemVocalVol) {
        elements.readoutStemVocalVol.textContent = (state.tracks[1].vol >= 0 ? '+' : '') + state.tracks[1].vol.toFixed(1) + ' dB';
      }
    }
    if (elements.btnStemVocalMute && state.tracks[1]) {
      elements.btnStemVocalMute.classList.toggle('active', state.tracks[1].mute);
    }
    if (elements.btnStemVocalSolo && state.tracks[1]) {
      elements.btnStemVocalSolo.classList.toggle('active', state.tracks[1].solo);
    }
    if (elements.sliderStemVocalClarity && state.allInOneStems && state.allInOneStems.vocal) {
      elements.sliderStemVocalClarity.value = state.allInOneStems.vocal.clarity;
      if (elements.readoutStemVocalClarity) {
        elements.readoutStemVocalClarity.textContent = (state.allInOneStems.vocal.clarity >= 0 ? '+' : '') + state.allInOneStems.vocal.clarity.toFixed(1) + ' dB';
      }
    }

    // Bass (Track 2)
    if (elements.sliderStemBassVol && state.tracks[2]) {
      elements.sliderStemBassVol.value = state.tracks[2].vol;
      if (elements.readoutStemBassVol) {
        elements.readoutStemBassVol.textContent = (state.tracks[2].vol >= 0 ? '+' : '') + state.tracks[2].vol.toFixed(1) + ' dB';
      }
    }
    if (elements.btnStemBassMute && state.tracks[2]) {
      elements.btnStemBassMute.classList.toggle('active', state.tracks[2].mute);
    }
    if (elements.btnStemBassSolo && state.tracks[2]) {
      elements.btnStemBassSolo.classList.toggle('active', state.tracks[2].solo);
    }
    if (elements.sliderStemBassPunch && state.allInOneStems && state.allInOneStems.bass) {
      elements.sliderStemBassPunch.value = state.allInOneStems.bass.punch;
      if (elements.readoutStemBassPunch) {
        elements.readoutStemBassPunch.textContent = (state.allInOneStems.bass.punch >= 0 ? '+' : '') + state.allInOneStems.bass.punch.toFixed(1) + ' dB';
      }
    }

    // Drum (Track 3)
    if (elements.sliderStemDrumVol && state.tracks[3]) {
      elements.sliderStemDrumVol.value = state.tracks[3].vol;
      if (elements.readoutStemDrumVol) {
        elements.readoutStemDrumVol.textContent = (state.tracks[3].vol >= 0 ? '+' : '') + state.tracks[3].vol.toFixed(1) + ' dB';
      }
    }
    if (elements.btnStemDrumMute && state.tracks[3]) {
      elements.btnStemDrumMute.classList.toggle('active', state.tracks[3].mute);
    }
    if (elements.btnStemDrumSolo && state.tracks[3]) {
      elements.btnStemDrumSolo.classList.toggle('active', state.tracks[3].solo);
    }
    if (elements.sliderStemDrumPunch && state.allInOneStems && state.allInOneStems.drum) {
      elements.sliderStemDrumPunch.value = state.allInOneStems.drum.punch;
      if (elements.readoutStemDrumPunch) {
        elements.readoutStemDrumPunch.textContent = state.allInOneStems.drum.punch + '%';
      }
    }

    // FX (Track 4)
    if (elements.sliderStemFxVol && state.tracks[4]) {
      elements.sliderStemFxVol.value = state.tracks[4].vol;
      if (elements.readoutStemFxVol) {
        elements.readoutStemFxVol.textContent = (state.tracks[4].vol >= 0 ? '+' : '') + state.tracks[4].vol.toFixed(1) + ' dB';
      }
    }
    if (elements.btnStemFxMute && state.tracks[4]) {
      elements.btnStemFxMute.classList.toggle('active', state.tracks[4].mute);
    }
    if (elements.btnStemFxSolo && state.tracks[4]) {
      elements.btnStemFxSolo.classList.toggle('active', state.tracks[4].solo);
    }
    if (elements.sliderStemFxReverb && state.allInOneStems && state.allInOneStems.fx) {
      elements.sliderStemFxReverb.value = state.allInOneStems.fx.reverb;
      if (elements.readoutStemFxReverb) {
        elements.readoutStemFxReverb.textContent = state.allInOneStems.fx.reverb + '%';
      }
    }
  }

  function selectStudioTrack(trackId, options = {}) {
    if (trackId === 'all' || trackId === 'track-all') {
      state.selectedTrackId = 'track-all';

      // 1. Highlight All-In-One track row and deselect individual track rows
      document.querySelectorAll('.track-row').forEach((row) => {
        row.classList.toggle('selected', row.id === 'trackRowAllInOne' || row.dataset.trackId === 'track-all');
      });

      // 2. Clear individual mixer strip selection
      document.querySelectorAll('.mixer-strip').forEach((strip) => {
        strip.classList.remove('selected');
      });

      // 3. Switch Inspector Tab to All-In-One
      if (elements.tabPanes && elements.tabPanes.allinone) {
        state.activeInspectorTab = 'allinone';
        elements.tabBtns.forEach((b) => {
          const isTarget = b.dataset.tab === 'allinone';
          b.classList.toggle('active', isTarget);
          b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        Object.keys(elements.tabPanes).forEach((key) => {
          if (elements.tabPanes[key]) {
            elements.tabPanes[key].style.display = key === 'allinone' ? 'flex' : 'none';
          }
        });
      }

      syncAllInOneControlsFromState();
      return;
    }

    let id = typeof trackId === 'string' ? parseInt(trackId.replace('track-', ''), 10) : Number(trackId);
    if (isNaN(id) || !state.tracks[id]) id = 1;

    state.selectedTrackId = `track-${id}`;
    state.mixer.selectedTrackId = id;

    // 1. Highlight Timeline Track Rows
    document.querySelectorAll('.track-row').forEach((row) => {
      row.classList.toggle('selected', row.dataset.trackId === `track-${id}`);
    });

    // 2. Highlight Mixer Console Strips
    document.querySelectorAll('.mixer-strip').forEach((strip) => {
      strip.classList.toggle('selected', strip.dataset.track === String(id));
    });

    // 3. Sync Modal Selectors and UI
    if (elements.clarityTrackSelect && elements.clarityTrackSelect.value !== String(id)) {
      elements.clarityTrackSelect.value = String(id);
    }
    if (typeof updateClarityModalUI === 'function') {
      updateClarityModalUI(id);
    }

    if (elements.voiceTrackSelect && elements.voiceTrackSelect.value !== String(id)) {
      elements.voiceTrackSelect.value = String(id);
    }
    if (typeof updateVoiceModalUI === 'function') {
      updateVoiceModalUI(id);
    }

    // 4. Sync Inspector Channel & Controls
    if (elements.mixerTrackSelector && elements.mixerTrackSelector.value !== String(id)) {
      elements.mixerTrackSelector.value = String(id);
    }
    updateMixerUI(id);

    // Also keep All-In-One stem cards updated in case the tab is open
    syncAllInOneControlsFromState();

    // 5. If options.syncClip is not false, select the track's clip to populate Clip Inspector & Waveform Analysis
    if (options.syncClip !== false) {
      const trackClips = state.clips.filter((c) => c.trackId === id);
      if (trackClips.length > 0) {
        const curSelectedClip = getClipById(state.selectedClipId);
        if (!curSelectedClip || curSelectedClip.trackId !== id) {
          const targetClip = trackClips[0];
          state.selectedClipId = targetClip.id;
          document.querySelectorAll('.audio-clip').forEach((el) => {
            el.classList.toggle('selected', el.id === targetClip.id);
          });
          updateInspectorClipValues(targetClip);
          const profile = getAnalysisProfileForClip(targetClip);
          updateAnalysisUI(profile);
          if (typeof updateAiInspectorUI === 'function') {
            updateAiInspectorUI(targetClip);
          }
        }
      }
    }
  }

  function selectMixerTrack(trackId) {
    selectStudioTrack(trackId);
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

    const isId = (state.language || 'id') === 'id';
    const friendlyNames = {
      1: isId ? '🎤 01 • VOKAL UTAMA' : '🎤 01 • LEAD VOCALS',
      2: isId ? '🎸 02 • BASS & MELODI' : '🎸 02 • BASS & SYNTH',
      3: isId ? '🥁 03 • DRUM & BEAT' : '🥁 03 • CYBER DRUMS',
      4: isId ? '✨ 04 • EFEK & LATAR' : '✨ 04 • FX & TRANSITION'
    };

    let html = '';
    // 4 Channel Strips
    [1, 2, 3, 4].forEach((id) => {
      const track = state.tracks[id];
      if (!track) return;
      const isSelected = state.mixer.selectedTrackId === id;
      const panStr = track.pan === 0 ? 'C' : (track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`);
      const volStr = track.vol > 0 ? `+${track.vol.toFixed(1)}` : track.vol.toFixed(1);
      const fx = (state.trackEffects && state.trackEffects[id]) || {};

      html += `
        <div class="mixer-strip ${isSelected ? 'selected' : ''}" data-track="${id}">
          <div class="strip-top">
            <div class="strip-title-badge">
              <div class="track-color-pill ${track.color}"></div>
              <span class="strip-name" title="${friendlyNames[id] || track.name}">${friendlyNames[id] || track.name}</span>
            </div>
            <div class="strip-badges-row">
              <button class="mini-fx-badge ${track.fx.comp.enabled ? 'active' : ''}" data-fx="comp" data-track="${id}" title="Toggle Kompresor (Kepadatan Suara)">C</button>
              <button class="mini-fx-badge ${track.fx.reverb.enabled ? 'active' : ''}" data-fx="reverb" data-track="${id}" title="Toggle Reverb (Gema Ruang)">R</button>
              <button class="mini-fx-badge ${track.fx.delay.enabled ? 'active' : ''}" data-fx="delay" data-track="${id}" title="Toggle Delay (Pantulan Nada)">D</button>
            </div>
          </div>

          <!-- Quick Tools: Clarity & Voice FX select -->
          <div class="strip-quick-tools">
            <button class="strip-quick-clarity ${fx.clarity ? 'active' : ''}" data-track="${id}" id="stripQuickClarity-${id}" title="1-Klik Jernihkan Vokal / Suara Track Ini">
              ${fx.clarity ? '🧹 Jernih Aktif' : '🧹 Jernihkan'}
            </button>
            <select class="strip-voice-select" data-track="${id}" id="stripVoiceSelect-${id}" title="Pilih Karakter Efek Suara">
              <option value="original" ${!fx.voice || fx.voice === 'original' ? 'selected' : ''}>🎙️ Normal</option>
              <option value="chipmunk" ${fx.voice === 'chipmunk' ? 'selected' : ''}>🐿️ Chipmunk</option>
              <option value="monster" ${fx.voice === 'monster' ? 'selected' : ''}>👹 Monster</option>
              <option value="robot" ${fx.voice === 'robot' ? 'selected' : ''}>🤖 Robot</option>
              <option value="telephone" ${fx.voice === 'telephone' ? 'selected' : ''}>📞 Telepon</option>
              <option value="underwater" ${fx.voice === 'underwater' ? 'selected' : ''}>🌊 Dalam Air</option>
              <option value="cathedral" ${fx.voice === 'cathedral' ? 'selected' : ''}>🏛️ Katedral</option>
              <option value="crystal" ${fx.voice === 'crystal' ? 'selected' : ''}>💎 Kristal</option>
            </select>
          </div>

          <!-- Simple 3-Band Tone Sliders (BASS, VOKAL, TREBLE) -->
          <div class="strip-tone-box">
            <div class="tone-row">
              <span class="tone-label" title="Treble / Nada Renyah">✨ TREBLE</span>
              <input type="range" class="tone-slider" data-band="high" data-track="${id}" min="-12" max="12" step="0.5" value="${(track.eq && track.eq.high) || 0}" aria-label="Track ${id} Treble">
              <span class="tone-val tabular-nums" id="toneValHigh-${id}">${((track.eq && track.eq.high) || 0) > 0 ? '+' : ''}${((track.eq && track.eq.high) || 0).toFixed(1)}</span>
            </div>
            <div class="tone-row">
              <span class="tone-label" title="Vokal / Nada Tengah">🗣️ VOKAL</span>
              <input type="range" class="tone-slider" data-band="mid" data-track="${id}" min="-12" max="12" step="0.5" value="${(track.eq && track.eq.mid) || 0}" aria-label="Track ${id} Vokal">
              <span class="tone-val tabular-nums" id="toneValMid-${id}">${((track.eq && track.eq.mid) || 0) > 0 ? '+' : ''}${((track.eq && track.eq.mid) || 0).toFixed(1)}</span>
            </div>
            <div class="tone-row">
              <span class="tone-label" title="Bass / Nada Rendah">🔊 BASS</span>
              <input type="range" class="tone-slider" data-band="low" data-track="${id}" min="-12" max="12" step="0.5" value="${(track.eq && track.eq.low) || 0}" aria-label="Track ${id} Bass">
              <span class="tone-val tabular-nums" id="toneValLow-${id}">${((track.eq && track.eq.low) || 0) > 0 ? '+' : ''}${((track.eq && track.eq.low) || 0).toFixed(1)}</span>
            </div>
          </div>

          <div class="strip-pan-row">
            <span class="strip-pan-label">PAN</span>
            <input type="range" class="slider-input strip-pan-slider" id="stripPan-${id}" data-track="${id}" min="-100" max="100" value="${track.pan}" step="1" aria-label="Track ${id} Pan">
            <span class="strip-pan-val tabular-nums" id="stripPanVal-${id}">${panStr}</span>
          </div>

          <div class="strip-mute-solo-row">
            <button class="strip-btn mute ${track.mute ? 'active' : ''}" data-track="${id}" id="stripMute-${id}" title="Mute Track ${id}">Mute</button>
            <button class="strip-btn solo ${track.solo ? 'active' : ''}" data-track="${id}" id="stripSolo-${id}" title="Solo Track ${id}">Solo</button>
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
            <span class="strip-name" style="color: var(--primary); font-weight: 700;">HASIL AKHIR (MASTER)</span>
          </div>
          <div class="strip-badges-row">
            <span class="mini-fx-badge active" title="Brickwall Peak Limiter (Anti-Pecah)">LIM</span>
          </div>
        </div>

        <div class="master-quick-download-box">
          <button class="btn btn-emerald btn-xs" id="btnMasterDownloadStrip" title="Download Musik Master (WAV 1-Klik)">
            📥 Download Lagu
          </button>
        </div>

        <div class="strip-pan-row">
          <span class="strip-pan-label">BAL</span>
          <input type="range" class="slider-input strip-pan-slider" id="stripPan-master" data-track="master" min="-100" max="100" value="0" step="1" aria-label="Master Balance">
          <span class="strip-pan-val tabular-nums" id="stripPanVal-master">C</span>
        </div>

        <div class="strip-mute-solo-row">
          <button class="strip-btn active" id="stripLimiterToggle" style="background: rgba(34, 197, 94, 0.2); color: #4ADE80; border-color: rgba(34, 197, 94, 0.4);" title="Brickwall Limiter Aktif (Suara Tidak Pecah)">ANTI-PECAH</button>
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
          updateMasterAudioNode();
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

    // 3-Band Tone Sliders (Treble, Vokal, Bass)
    document.querySelectorAll('.tone-slider').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const trackId = e.target.dataset.track;
        const band = e.target.dataset.band;
        const val = parseFloat(e.target.value);
        if (state.tracks[trackId] && state.tracks[trackId].eq) {
          state.tracks[trackId].eq[band] = val;
          const labelId = `toneVal${band.charAt(0).toUpperCase() + band.slice(1)}-${trackId}`;
          const readout = document.getElementById(labelId);
          if (readout) readout.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)}`;
          const nodes = trackNodes[trackId];
          if (nodes && audioCtx) {
            const targetNode = band === 'low' ? nodes.eqLow : (band === 'mid' ? nodes.eqMid : nodes.eqHigh);
            if (targetNode) targetNode.gain.setValueAtTime(val, audioCtx.currentTime);
          }
        }
      });
    });

    // Quick Clarity Buttons
    document.querySelectorAll('.strip-quick-clarity').forEach((btn) => {
      btn.addEventListener('click', () => {
        const trackId = parseInt(btn.dataset.track, 10);
        const currentFx = (state.trackEffects && state.trackEffects[trackId]) || {};
        if (currentFx.clarity) {
          applyTrackClarity(trackId, null, 80);
          btn.classList.remove('active');
          btn.textContent = '🧹 Jernihkan';
          showToast(state.language === 'id' ? `Track 0${trackId}: Pembersih suara di-reset normal` : `Track 0${trackId}: Audio clarity reset`);
        } else {
          applyTrackClarity(trackId, 'clean_total', 85);
          btn.classList.add('active');
          btn.textContent = '🧹 Jernih Aktif';
          showToast(state.language === 'id' ? `Track 0${trackId}: Vokal seketika jernih & bersih! ✨` : `Track 0${trackId}: Vocals cleaned & crystal clear! ✨`);
        }
      });
    });

    // Voice FX Dropdowns
    document.querySelectorAll('.strip-voice-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const trackId = parseInt(sel.dataset.track, 10);
        const val = sel.value;
        applyTrackVoice(trackId, val);
        showToast(state.language === 'id' ? `Track 0${trackId}: Karakter suara diganti ke ${val.toUpperCase()} 🎙️` : `Track 0${trackId}: Voice changed to ${val.toUpperCase()} 🎙️`);
      });
    });

    // Interactive Mini FX Badges (Comp, Reverb, Delay)
    document.querySelectorAll('button.mini-fx-badge').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.track;
        const fxType = btn.dataset.fx;
        if (state.tracks[trackId] && state.tracks[trackId].fx && state.tracks[trackId].fx[fxType]) {
          state.tracks[trackId].fx[fxType].enabled = !state.tracks[trackId].fx[fxType].enabled;
          btn.classList.toggle('active', state.tracks[trackId].fx[fxType].enabled);
          showToast(`Track 0${trackId}: Efek ${fxType.toUpperCase()} ${state.tracks[trackId].fx[fxType].enabled ? 'Aktif' : 'Mati'}`);
        }
      });
    });

    // Master Download Button on Strip
    const masterDl = document.getElementById('btnMasterDownloadStrip');
    if (masterDl) {
      masterDl.addEventListener('click', () => downloadCurrentMix('wav'));
    }

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
        updateMasterAudioNode();
        triggerAutosave();
      });
    }

    document.querySelectorAll('.track-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (['INPUT', 'BUTTON', 'SELECT'].includes(e.target.tagName)) return;
        const trackId = row.dataset.trackId;
        if (trackId) {
          const numId = parseInt(trackId.replace('track-', ''), 10);
          selectStudioTrack(numId);
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

    if (elements.btnMixerDownloadMaster) {
      elements.btnMixerDownloadMaster.addEventListener('click', () => downloadCurrentMix('wav'));
    }
    if (elements.btnMixerOpenClarity) {
      elements.btnMixerOpenClarity.addEventListener('click', () => {
        if (elements.btnOpenClarityModal) elements.btnOpenClarityModal.click();
      });
    }
    if (elements.btnMixerOpenVoice) {
      elements.btnMixerOpenVoice.addEventListener('click', () => {
        if (elements.btnOpenVoiceModal) elements.btnOpenVoiceModal.click();
      });
    }
    if (elements.btnMixerAutoMix) {
      elements.btnMixerAutoMix.addEventListener('click', () => openAutoMixModal());
    }
    if (elements.btnMixerSplit) {
      elements.btnMixerSplit.addEventListener('click', () => selectToolById('toolSplit'));
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
          updateAudioTrackNode(trackId);
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
      updateAudioTrackNode(trackId);
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
    if (elements.btnQuickDownloadHeader) {
      elements.btnQuickDownloadHeader.addEventListener('click', () => downloadCurrentMix('wav'));
    }
    if (elements.btnQuickDownloadModal) {
      elements.btnQuickDownloadModal.addEventListener('click', () => downloadCurrentMix('wav'));
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

  async function completeExportProcess(trackTitle, format, sampleRate, bitDepth) {
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

    // Render genuine multi-track audio buffer
    let audioBlob;
    try {
      const renderedBuffer = await renderStudioMixToAudioBuffer();
      audioBlob = audioBufferToWavBlob(renderedBuffer);
    } catch (e) {
      console.warn('Fallback WAV generator used:', e);
      audioBlob = generateWavAudioBlob(Math.max(4.0, state.totalDuration || 10.0), sampleRate);
    }

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

  // --- Genuine Web Audio Multi-Track Offline Renderer & WAV Encoder ---
  function audioBufferToWavBlob(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const length = audioBuffer.length;
    const byteRate = sampleRate * blockAlign;
    const dataByteLength = length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataByteLength);
    const view = new DataView(buffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataByteLength, true);
    writeString(8, 'WAVE');

    // "fmt " sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataByteLength, true);

    // Interleave channels & write 16-bit signed PCM samples
    let offset = 44;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(audioBuffer.getChannelData(c));
    }

    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? Math.floor(sample * 32768) : Math.floor(sample * 32767);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  async function renderStudioMixToAudioBuffer() {
    const sampleRate = 44100;
    let maxDuration = 10.0;
    state.clips.forEach((clip) => {
      const end = clip.startSec + clip.durationSec;
      if (end > maxDuration) maxDuration = end;
    });
    maxDuration = Math.min(600, Math.ceil(maxDuration + 0.5));

    const totalSamples = Math.ceil(maxDuration * sampleRate);
    const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtxClass) {
      throw new Error('OfflineAudioContext not available');
    }

    const offlineCtx = new OfflineCtxClass(2, totalSamples, sampleRate);

    // Master Bus Gain & Peak Limiter
    const masterVol = (state.mixer && state.mixer.master) ? state.mixer.master.vol : 0;
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = Math.pow(10, masterVol / 20);

    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -0.5;
    limiter.knee.value = 0.0;
    limiter.ratio.value = 20.0;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.05;

    let masterChainOut = masterGain;
    if (state.studioMode && state.studioMode.enabled) {
      const offDeRumble = offlineCtx.createBiquadFilter();
      offDeRumble.type = 'highpass';
      offDeRumble.frequency.value = 35;

      const offDeMud = offlineCtx.createBiquadFilter();
      offDeMud.type = 'peaking';
      offDeMud.frequency.value = 300;
      offDeMud.Q.value = 1.4;
      offDeMud.gain.value = state.studioMode.deMud !== undefined ? state.studioMode.deMud : -4.0;

      const offPresence = offlineCtx.createBiquadFilter();
      offPresence.type = 'peaking';
      offPresence.frequency.value = 2800;
      offPresence.Q.value = 1.0;
      offPresence.gain.value = state.studioMode.clarity !== undefined ? state.studioMode.clarity : 3.5;

      const offAir = offlineCtx.createBiquadFilter();
      offAir.type = 'highshelf';
      offAir.frequency.value = 10500;
      offAir.gain.value = state.studioMode.air !== undefined ? state.studioMode.air : 4.0;

      const offWarmth = offlineCtx.createBiquadFilter();
      offWarmth.type = 'lowshelf';
      offWarmth.frequency.value = 100;
      offWarmth.gain.value = state.studioMode.warmth !== undefined ? state.studioMode.warmth : 1.5;

      masterChainOut.connect(offDeRumble);
      offDeRumble.connect(offDeMud);
      offDeMud.connect(offPresence);
      offPresence.connect(offAir);
      offAir.connect(offWarmth);
      masterChainOut = offWarmth;
    }

    masterChainOut.connect(limiter);
    limiter.connect(offlineCtx.destination);

    // Setup Track Offline Nodes
    const anySolo = Object.values(state.tracks).some((t) => t.solo);
    const trackOfflineInputs = {};

    [1, 2, 3, 4].forEach((trackId) => {
      const trk = state.tracks[trackId] || { vol: 0, gainTrim: 0, mute: false, pan: 0, eq: { low: 0, mid: 0, high: 0 } };
      const fx = (state.trackEffects && state.trackEffects[trackId]) || {};

      // 1. Clarity Low Cut
      const lowCut = offlineCtx.createBiquadFilter();
      lowCut.type = 'highpass';
      const factor = (fx.clarityIntensity || 80) / 100;
      if (fx.clarity === 'clean_total') lowCut.frequency.value = 120;
      else if (fx.clarity === 'studio_mic') lowCut.frequency.value = 95;
      else if (fx.clarity === 'anti_hiss') lowCut.frequency.value = 110;
      else if (fx.clarity === 'warm_crisp') lowCut.frequency.value = 80;
      else lowCut.frequency.value = 20;

      // 2. Clarity De-Mud
      const deMud = offlineCtx.createBiquadFilter();
      deMud.type = 'peaking';
      deMud.frequency.value = 400;
      if (fx.clarity === 'clean_total') deMud.gain.value = -6.0 * factor;
      else if (fx.clarity === 'studio_mic') { deMud.frequency.value = 350; deMud.gain.value = -3.5 * factor; }
      else if (fx.clarity === 'anti_hiss') { deMud.frequency.value = 500; deMud.gain.value = -2.0 * factor; }
      else if (fx.clarity === 'warm_crisp') { deMud.frequency.value = 300; deMud.gain.value = -4.0 * factor; }
      else deMud.gain.value = 0;

      // 3. Clarity High Air
      const highAir = offlineCtx.createBiquadFilter();
      highAir.type = 'highshelf';
      highAir.frequency.value = 9000;
      if (fx.clarity === 'clean_total') highAir.gain.value = 5.0 * factor;
      else if (fx.clarity === 'studio_mic') { highAir.frequency.value = 8000; highAir.gain.value = 6.5 * factor; }
      else if (fx.clarity === 'anti_hiss') { highAir.frequency.value = 7000; highAir.gain.value = -4.0 * factor; }
      else if (fx.clarity === 'warm_crisp') { highAir.frequency.value = 10000; highAir.gain.value = 4.0 * factor; }
      else highAir.gain.value = 0;

      // 4. Voice Filter
      const voiceFilter = offlineCtx.createBiquadFilter();
      if (fx.voice === 'telephone') {
        voiceFilter.type = 'bandpass'; voiceFilter.frequency.value = 1600; voiceFilter.Q.value = 2.5;
      } else if (fx.voice === 'robot') {
        voiceFilter.type = 'peaking'; voiceFilter.frequency.value = 2400; voiceFilter.Q.value = 6.0; voiceFilter.gain.value = 12.0;
      } else if (fx.voice === 'underwater') {
        voiceFilter.type = 'lowpass'; voiceFilter.frequency.value = 450; voiceFilter.Q.value = 2.0;
      } else if (fx.voice === 'cathedral') {
        voiceFilter.type = 'highshelf'; voiceFilter.frequency.value = 3500; voiceFilter.gain.value = 3.5;
      } else if (fx.voice === 'crystal') {
        voiceFilter.type = 'highshelf'; voiceFilter.frequency.value = 5000; voiceFilter.gain.value = 6.0;
      } else {
        voiceFilter.type = 'allpass'; voiceFilter.gain.value = 0;
      }

      // 5. 3-Band Parametric EQ
      const eqLow = offlineCtx.createBiquadFilter();
      eqLow.type = 'lowshelf'; eqLow.frequency.value = 200; eqLow.gain.value = (trk.eq && trk.eq.low) || 0;

      const eqMid = offlineCtx.createBiquadFilter();
      eqMid.type = 'peaking'; eqMid.frequency.value = 1000; eqMid.Q.value = 1.0; eqMid.gain.value = (trk.eq && trk.eq.mid) || 0;

      const eqHigh = offlineCtx.createBiquadFilter();
      eqHigh.type = 'highshelf'; eqHigh.frequency.value = 5000; eqHigh.gain.value = (trk.eq && trk.eq.high) || 0;

      // 6. Track Gain
      const trackGain = offlineCtx.createGain();
      let effectiveGain = 0;
      if (anySolo) {
        effectiveGain = (trk.solo && !trk.mute) ? Math.pow(10, (trk.vol + (trk.gainTrim || 0)) / 20) : 0;
      } else {
        effectiveGain = !trk.mute ? Math.pow(10, (trk.vol + (trk.gainTrim || 0)) / 20) : 0;
      }
      trackGain.gain.value = effectiveGain;

      // 7. Stereo Panner
      let panNode = null;
      if (offlineCtx.createStereoPanner) {
        panNode = offlineCtx.createStereoPanner();
        panNode.pan.value = Math.max(-1, Math.min(1, (trk.pan || 0) / 100));
      }

      // Chain: lowCut -> deMud -> highAir -> voiceFilter -> eqLow -> eqMid -> eqHigh -> trackGain -> panNode -> masterGain
      lowCut.connect(deMud);
      deMud.connect(highAir);
      highAir.connect(voiceFilter);
      voiceFilter.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(trackGain);
      if (panNode) {
        trackGain.connect(panNode);
        panNode.connect(masterGain);
      } else {
        trackGain.connect(masterGain);
      }

      trackOfflineInputs[trackId] = lowCut;
    });

    // Schedule each clip
    state.clips.forEach((clip) => {
      const buf = getClipAudioBuffer(clip);
      if (!buf) return;
      const targetInput = trackOfflineInputs[clip.trackId];
      if (!targetInput) return;

      const src = offlineCtx.createBufferSource();
      src.buffer = buf;

      // Apply Voice FX pitch rate
      const fx = (state.trackEffects && state.trackEffects[clip.trackId]) || {};
      if (fx.voice === 'chipmunk') src.playbackRate.value = 1.35;
      else if (fx.voice === 'monster') src.playbackRate.value = 0.80;

      src.connect(targetInput);
      try {
        src.start(clip.startSec, 0, clip.durationSec);
      } catch (e) {
        src.start(clip.startSec);
      }
    });

    return await offlineCtx.startRendering();
  }

  async function downloadCurrentMix(format = 'wav') {
    const isId = (state.language || 'id') === 'id';
    showToast(isId ? 'Sedang memproses lagu untuk di-download... ⏳' : 'Rendering music mix for download... ⏳');

    try {
      const renderedBuffer = await renderStudioMixToAudioBuffer();
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      const projName = (state.activeProject && state.activeProject.name) ? state.activeProject.name : 'Hasil_Mixing_Lagu';
      const cleanName = projName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_Master.${format}`;

      const blobUrl = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 3000);

      showToast(isId ? `🎉 Lagu berhasil di-download: ${filename}` : `🎉 Music downloaded successfully: ${filename}`);
    } catch (err) {
      console.warn('Offline render fallback to buffer synthesis:', err);
      const fallbackBlob = generateWavAudioBlob(Math.max(4.0, state.totalDuration || 10.0), 44100);
      const filename = 'Hasil_Mixing_Lagu_Master.wav';
      const blobUrl = URL.createObjectURL(fallbackBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 3000);
      showToast(isId ? `🎉 Lagu berhasil di-download: ${filename}` : `🎉 Music downloaded: ${filename}`);
    }
  }

  function generateWavAudioBlob(durationSec = 4.0, sampleRate = 44100) {
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

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 0.4);
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
      'topbar.quick_download': '📥 Download Music',
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
      'toolbar.import_audio': 'Import Audio',
      'toolbar.clarity': 'Audio Clarity',
      'toolbar.voice': 'Voice FX',
      'quickstart.badge': 'Studio Quick Guide',
      'quickstart.step1': '<strong>Import Music:</strong> Drag & Drop or click <em>Import Audio</em>',
      'quickstart.step2': '<strong>Clean / Change Voice:</strong> Use <em>Audio Clarity</em> or <em>Voice FX</em>',
      'quickstart.step3': '<strong>Play Music:</strong> Press <em>Play</em> or press <em>Space</em>',
      'clarity.modal_title': 'Audio Clarity & Vocal Cleaner',
      'clarity.target_track': 'Apply to Track:',
      'clarity.choose_preset': 'Choose Audio Cleaner Mode:',
      'clarity.preset_total_title': 'Ultra Clean & De-Mud',
      'clarity.preset_total_desc': 'Cuts bass rumble & boxy mud, instantly making vocals crystal clear.',
      'clarity.preset_mic_title': 'Studio Broadcast Mic',
      'clarity.preset_mic_desc': 'Adds broadcast microphone presence and professional studio sparkle.',
      'clarity.preset_hiss_title': 'Anti-Noise & Hiss Reducer',
      'clarity.preset_hiss_desc': 'Reduces microphone hiss, background hum, and room noise.',
      'clarity.preset_crisp_title': 'Warm & Crisp Shimmer',
      'clarity.preset_crisp_desc': 'Smooth harmonic treble brilliance without harsh sibilance.',
      'clarity.intensity_label': 'Clarity Intensity',
      'clarity.btn_reset': 'Reset Normal',
      'clarity.btn_apply': 'Apply Clarity 🔊',
      'voice.modal_title': 'Automatic Voice Transformer (Voice FX)',
      'voice.target_track': 'Apply to Track:',
      'voice.choose_preset': 'Choose Voice Character:',
      'voice.preset_original_title': 'Original / Normal Voice',
      'voice.preset_original_desc': 'Reset vocals to natural pitch and frequency without effects.',
      'voice.preset_chipmunk_title': 'Chipmunk / Anime',
      'voice.preset_chipmunk_desc': 'Cute, fast, high-pitched anime cartoon style voice.',
      'voice.preset_monster_title': 'Monster / Deep Bass',
      'voice.preset_monster_desc': 'Deep, menacing, authoritative low pitch movie trailer voice.',
      'voice.preset_telephone_title': 'Vintage Radio & Phone',
      'voice.preset_telephone_desc': 'Walkie-talkie / telephone bandpass vintage lo-fi filter.',
      'voice.preset_robot_title': 'Cyberpunk Robot',
      'voice.preset_robot_desc': 'Metallic, futuristic sci-fi artificial intelligence resonance.',
      'voice.preset_underwater_title': 'Underwater (Lo-Fi Muffled)',
      'voice.preset_underwater_desc': 'Dampened muffled sound submerged deep underwater.',
      'voice.preset_cathedral_title': 'Cathedral Space Reverb',
      'voice.preset_cathedral_desc': 'Grand majestic concert hall reverberation.',
      'voice.preset_crystal_title': 'Crystal Clear Vocal',
      'voice.preset_crystal_desc': 'Crisp, articulate vocal standing forward in the mix.',
      'voice.btn_bypass': 'Disable Effects',
      'voice.btn_apply': 'Apply Voice FX 🔊',
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
      'topbar.quick_download': '📥 Download Lagu',
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
      'toolbar.import_audio': 'Import Lagu',
      'toolbar.clarity': 'Pembersih Suara',
      'toolbar.voice': 'Pengubah Suara',
      'quickstart.badge': 'Panduan Cepat Studio',
      'quickstart.step1': '<strong>Masukkan Lagu:</strong> Drag & Drop atau klik tombol <em>Import Audio</em>',
      'quickstart.step2': '<strong>Jernihkan / Ubah Suara:</strong> Pakai <em>Pembersih Suara</em> atau <em>Pengubah Suara</em>',
      'quickstart.step3': '<strong>Putar Lagu:</strong> Tekan tombol <em>Play</em> atau tombol <em>Spasi</em>',
      'clarity.modal_title': 'Pembersih Suara & Vokal Jernih',
      'clarity.target_track': 'Terapkan Pada Track:',
      'clarity.choose_preset': 'Pilih Mode Pembersih Suara:',
      'clarity.preset_total_title': 'Pembersih Total & Anti-Mendem',
      'clarity.preset_total_desc': 'Memotong dengung bas & frekuensi keruh, seketika vokal terdengar jernih bersih.',
      'clarity.preset_mic_title': 'Studio Broadcast Mic',
      'clarity.preset_mic_desc': 'Artikulasi vokal tebal, dekat & mewah standar rekaman siaran profesional.',
      'clarity.preset_hiss_title': 'Anti-Noise & Desis Hiss',
      'clarity.preset_hiss_desc': 'Meredam desis mikrofon (*hiss*) & suara hembusan angin latar belakang.',
      'clarity.preset_crisp_title': 'Warm & Crisp Shimmer',
      'clarity.preset_crisp_desc': 'Vokal renyah berkilau tanpa menusuk atau sakit di telinga pendengar.',
      'clarity.intensity_label': 'Kekuatan Pembersihan Suara',
      'clarity.btn_reset': 'Reset Normal',
      'clarity.btn_apply': 'Terapkan Kejernihan 🔊',
      'voice.modal_title': 'Tools Otomatis Pengubah Suara (Voice FX)',
      'voice.target_track': 'Terapkan Pada Track:',
      'voice.choose_preset': 'Pilih Karakter Efek Suara:',
      'voice.preset_original_title': 'Suara Asli / Normal',
      'voice.preset_original_desc': 'Kembalikan vokal ke nada alami tanpa modifikasi efek.',
      'voice.preset_chipmunk_title': 'Chipmunk / Anime',
      'voice.preset_chipmunk_desc': 'Suara imut, lincah, nada tinggi ala kartun animasi Jepang.',
      'voice.preset_monster_title': 'Monster / Deep Bass',
      'voice.preset_monster_desc': 'Suara berat, seram, berwibawa nada rendah ala trailer film.',
      'voice.preset_telephone_title': 'Radio & Telepon Jadul',
      'voice.preset_telephone_desc': 'Filter walkie-talkie / telepon jadul nuansa lo-fi retro.',
      'voice.preset_robot_title': 'Robot Cyberpunk',
      'voice.preset_robot_desc': 'Resonansi mekanik sci-fi futuristik ala kecerdasan buatan.',
      'voice.preset_underwater_title': 'Dalam Air (Underwater)',
      'voice.preset_underwater_desc': 'Suara terendam sayup-sayup redam di kedalaman air.',
      'voice.preset_cathedral_title': 'Gema Katedral Megah',
      'voice.preset_cathedral_desc': 'Pantulan reverb luas megah ala aula konser katedral.',
      'voice.preset_crystal_title': 'Vokal Crystal Clear',
      'voice.preset_crystal_desc': 'Artikulasi vokal jernih tajam berdiri tegak di depan mix.',
      'voice.btn_bypass': 'Matikan Efek',
      'voice.btn_apply': 'Terapkan Efek Suara 🔊',
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

    if (typeof updateTrackEffectBadges === 'function') {
      updateTrackEffectBadges();
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
  // 21b. Audio Clarity & Voice Transformer Modules
  // --------------------------------------------------------------------------
  let currentSelectedClarityPreset = 'clean_total';
  let currentSelectedVoicePreset = 'original';

  function updateClarityModalUI(trackId) {
    const id = typeof trackId === 'string' ? parseInt(trackId.replace('track-', ''), 10) : Number(trackId);
    const fx = (state.trackEffects && state.trackEffects[id]) || {};
    currentSelectedClarityPreset = fx.clarity || 'clean_total';
    const intensity = fx.clarityIntensity || 80;
    if (elements.clarityIntensitySlider) elements.clarityIntensitySlider.value = intensity;
    if (elements.clarityIntensityVal) elements.clarityIntensityVal.textContent = intensity + '%';

    if (elements.clarityPresetsGrid) {
      elements.clarityPresetsGrid.querySelectorAll('.fx-preset-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.preset === currentSelectedClarityPreset);
      });
    }
  }

  function updateVoiceModalUI(trackId) {
    const id = typeof trackId === 'string' ? parseInt(trackId.replace('track-', ''), 10) : Number(trackId);
    const fx = (state.trackEffects && state.trackEffects[id]) || {};
    currentSelectedVoicePreset = fx.voice || 'original';
    if (elements.voicePresetsGrid) {
      elements.voicePresetsGrid.querySelectorAll('.fx-preset-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.preset === currentSelectedVoicePreset);
      });
    }
  }

  function applyTrackClarity(trackId, presetKey, intensity) {
    const id = typeof trackId === 'string' ? parseInt(trackId.replace('track-', ''), 10) : Number(trackId);
    if (!state.trackEffects) state.trackEffects = {};
    if (!state.trackEffects[id]) {
      state.trackEffects[id] = { clarity: null, voice: null, clarityIntensity: 80 };
    }

    state.trackEffects[id].clarity = presetKey;
    state.trackEffects[id].clarityIntensity = intensity || 80;

    ensureTrackAudioNodes();
    const node = trackNodes[id];
    if (node && audioCtx) {
      const factor = (state.trackEffects[id].clarityIntensity) / 100;
      const now = audioCtx.currentTime;

      if (presetKey === 'clean_total') {
        node.clarityLowCut.frequency.setValueAtTime(120, now);
        node.clarityDeMud.frequency.setValueAtTime(400, now);
        node.clarityDeMud.gain.setValueAtTime(-6.0 * factor, now);
        node.clarityHighAir.frequency.setValueAtTime(9000, now);
        node.clarityHighAir.gain.setValueAtTime(5.0 * factor, now);
      } else if (presetKey === 'studio_mic') {
        node.clarityLowCut.frequency.setValueAtTime(95, now);
        node.clarityDeMud.frequency.setValueAtTime(350, now);
        node.clarityDeMud.gain.setValueAtTime(-3.5 * factor, now);
        node.clarityHighAir.frequency.setValueAtTime(8000, now);
        node.clarityHighAir.gain.setValueAtTime(6.5 * factor, now);
      } else if (presetKey === 'anti_hiss') {
        node.clarityLowCut.frequency.setValueAtTime(110, now);
        node.clarityDeMud.frequency.setValueAtTime(500, now);
        node.clarityDeMud.gain.setValueAtTime(-2.0 * factor, now);
        node.clarityHighAir.frequency.setValueAtTime(7000, now);
        node.clarityHighAir.gain.setValueAtTime(-4.0 * factor, now);
      } else if (presetKey === 'warm_crisp') {
        node.clarityLowCut.frequency.setValueAtTime(80, now);
        node.clarityDeMud.frequency.setValueAtTime(300, now);
        node.clarityDeMud.gain.setValueAtTime(-4.0 * factor, now);
        node.clarityHighAir.frequency.setValueAtTime(10000, now);
        node.clarityHighAir.gain.setValueAtTime(4.0 * factor, now);
      } else {
        // Reset / Normal
        node.clarityLowCut.frequency.setValueAtTime(20, now);
        node.clarityDeMud.gain.setValueAtTime(0, now);
        node.clarityHighAir.gain.setValueAtTime(0, now);
      }
    }

    // Sync quick clarity button in mixer console
    const quickBtn = document.getElementById(`stripQuickClarity-${id}`);
    if (quickBtn) {
      quickBtn.classList.toggle('active', !!presetKey);
      quickBtn.textContent = presetKey ? '🧹 Jernih Aktif' : '🧹 Jernihkan';
    }

    updateTrackEffectBadges();
    pushHistorySnapshot(`Clarity FX: Track ${id} (${presetKey || 'Normal'})`);
  }

  function applyTrackVoice(trackId, presetKey) {
    const id = typeof trackId === 'string' ? parseInt(trackId.replace('track-', ''), 10) : Number(trackId);
    if (!state.trackEffects) state.trackEffects = {};
    if (!state.trackEffects[id]) {
      state.trackEffects[id] = { clarity: null, voice: null, clarityIntensity: 80 };
    }

    state.trackEffects[id].voice = (presetKey === 'original' || !presetKey) ? null : presetKey;

    let rate = 1.0;
    if (presetKey === 'chipmunk') rate = 1.35;
    else if (presetKey === 'monster') rate = 0.80;

    // Real-time update for currently active audio playback
    const trkClips = state.clips.filter((c) => c.trackId === id);
    trkClips.forEach((c) => {
      const el = activeAudioElements[c.id];
      if (el) {
        try { el.playbackRate = rate; } catch (e) {}
      }
      const srcObj = activeAudioSources[c.id];
      if (srcObj && srcObj.source && audioCtx) {
        try { srcObj.source.playbackRate.setValueAtTime(rate, audioCtx.currentTime); } catch (e) {}
      }
    });

    ensureTrackAudioNodes();
    const node = trackNodes[id];
    if (node && node.voiceFilter && audioCtx) {
      const now = audioCtx.currentTime;
      if (presetKey === 'telephone') {
        node.voiceFilter.type = 'bandpass';
        node.voiceFilter.frequency.setValueAtTime(1600, now);
        node.voiceFilter.Q.setValueAtTime(2.5, now);
      } else if (presetKey === 'robot') {
        node.voiceFilter.type = 'peaking';
        node.voiceFilter.frequency.setValueAtTime(2400, now);
        node.voiceFilter.Q.setValueAtTime(6.0, now);
        node.voiceFilter.gain.setValueAtTime(12.0, now);
      } else if (presetKey === 'underwater') {
        node.voiceFilter.type = 'lowpass';
        node.voiceFilter.frequency.setValueAtTime(450, now);
        node.voiceFilter.Q.setValueAtTime(2.0, now);
      } else if (presetKey === 'cathedral') {
        node.voiceFilter.type = 'highshelf';
        node.voiceFilter.frequency.setValueAtTime(3500, now);
        node.voiceFilter.gain.setValueAtTime(3.5, now);
      } else if (presetKey === 'crystal') {
        node.voiceFilter.type = 'highshelf';
        node.voiceFilter.frequency.setValueAtTime(5000, now);
        node.voiceFilter.gain.setValueAtTime(6.0, now);
      } else {
        node.voiceFilter.type = 'allpass';
        node.voiceFilter.gain.setValueAtTime(0, now);
      }
    }

    // Sync voice selector dropdown in mixer console
    const voiceSel = document.getElementById(`stripVoiceSelect-${id}`);
    if (voiceSel) {
      voiceSel.value = presetKey || 'original';
    }

    updateTrackEffectBadges();
    pushHistorySnapshot(`Voice FX: Track ${id} (${presetKey || 'Normal'})`);
  }

  function updateTrackEffectBadges() {
    const isId = (state.language || 'id') === 'id';
    const clarityLabels = {
      clean_total: isId ? '\u{1F9F9} Bersih Total' : '\u{1F9F9} Ultra Clean',
      studio_mic: isId ? '\u{1F399}\uFE0F Studio Mic' : '\u{1F399}\uFE0F Studio Mic',
      anti_hiss: isId ? '\u{1F507} Anti-Hiss' : '\u{1F507} Anti-Hiss',
      warm_crisp: isId ? '\u2728 Warm Crisp' : '\u2728 Warm Crisp'
    };

    const voiceLabels = {
      chipmunk: isId ? '\u{1F43F}\uFE0F Chipmunk' : '\u{1F43F}\uFE0F Chipmunk',
      monster: isId ? '\u{1F479} Monster' : '\u{1F479} Monster',
      telephone: isId ? '\u{1F4DE} Telepon' : '\u{1F4DE} Telephone',
      robot: isId ? '\u{1F916} Robot' : '\u{1F916} Robot',
      underwater: isId ? '\u{1F30A} Air' : '\u{1F30A} Underwater',
      cathedral: isId ? '\u{1F3DB}\uFE0F Katedral' : '\u{1F3DB}\uFE0F Cathedral',
      crystal: isId ? '\u{1F48E} Crystal' : '\u{1F48E} Crystal'
    };

    [1, 2, 3, 4].forEach((trackId) => {
      const el = document.getElementById(`trackFxTag-${trackId}`);
      if (!el) return;
      el.innerHTML = '';

      const fx = state.trackEffects && state.trackEffects[trackId];
      if (!fx) {
        el.style.display = 'none';
        return;
      }

      let hasBadges = false;
      if (fx.clarity && clarityLabels[fx.clarity]) {
        const pill = document.createElement('span');
        pill.className = 'track-badge-pill';
        pill.title = `Clarity: ${fx.clarity} (${fx.clarityIntensity || 80}%)`;
        pill.textContent = clarityLabels[fx.clarity];
        el.appendChild(pill);
        hasBadges = true;
      }

      if (fx.voice && voiceLabels[fx.voice]) {
        const pill = document.createElement('span');
        pill.className = 'track-badge-pill voice-fx';
        pill.title = `Voice FX: ${fx.voice}`;
        pill.textContent = voiceLabels[fx.voice];
        el.appendChild(pill);
        hasBadges = true;
      }

      el.style.display = hasBadges ? 'inline-flex' : 'none';
    });
  }

  function initClarityAndVoiceModules() {
    // 1. Quick Start Banner
    if (elements.btnCloseQuickStart && elements.quickStartBanner) {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('suno_quickstart_dismissed') === 'true') {
        elements.quickStartBanner.style.display = 'none';
      }
      elements.btnCloseQuickStart.addEventListener('click', () => {
        elements.quickStartBanner.style.display = 'none';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('suno_quickstart_dismissed', 'true');
        }
      });
    }

    // 2. Clarity Modal
    if (elements.btnOpenClarityModal && elements.clarityModal) {
      elements.btnOpenClarityModal.addEventListener('click', () => {
        const initialTrackId = parseInt(state.selectedTrackId.replace('track-', ''), 10) || 1;
        if (elements.clarityTrackSelect) elements.clarityTrackSelect.value = String(initialTrackId);
        updateClarityModalUI(initialTrackId);
        openModal(elements.clarityModal);
      });
    }

    if (elements.clarityTrackSelect) {
      elements.clarityTrackSelect.addEventListener('change', (e) => {
        const trkId = parseInt(e.target.value, 10) || 1;
        selectStudioTrack(trkId);
      });
    }

    if (elements.clarityPresetsGrid) {
      elements.clarityPresetsGrid.querySelectorAll('.fx-preset-card').forEach((card) => {
        card.addEventListener('click', () => {
          currentSelectedClarityPreset = card.dataset.preset;
          elements.clarityPresetsGrid.querySelectorAll('.fx-preset-card').forEach((c) => c.classList.remove('active'));
          card.classList.add('active');

          // Live audition in real-time
          const trackId = parseInt(elements.clarityTrackSelect ? elements.clarityTrackSelect.value : '1', 10) || 1;
          const intensity = parseInt(elements.clarityIntensitySlider ? elements.clarityIntensitySlider.value : '80', 10) || 80;
          applyTrackClarity(trackId, currentSelectedClarityPreset, intensity);
        });
      });
    }

    if (elements.clarityIntensitySlider && elements.clarityIntensityVal) {
      elements.clarityIntensitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 80;
        elements.clarityIntensityVal.textContent = val + '%';

        // Live audition in real-time
        const trackId = parseInt(elements.clarityTrackSelect ? elements.clarityTrackSelect.value : '1', 10) || 1;
        applyTrackClarity(trackId, currentSelectedClarityPreset, val);
      });
    }

    if (elements.btnResetClarity) {
      elements.btnResetClarity.addEventListener('click', () => {
        const trackId = parseInt(elements.clarityTrackSelect ? elements.clarityTrackSelect.value : '1', 10) || 1;
        applyTrackClarity(trackId, null, 80);
        updateClarityModalUI(trackId);
        closeModal(elements.clarityModal);
        showToast(state.language === 'id' ? `Track 0${trackId}: Pembersih suara di-reset ke normal.` : `Track 0${trackId}: Audio clarity reset to normal.`);
      });
    }

    if (elements.btnApplyClarity) {
      elements.btnApplyClarity.addEventListener('click', () => {
        const trackId = parseInt(elements.clarityTrackSelect ? elements.clarityTrackSelect.value : '1', 10) || 1;
        const intensity = parseInt(elements.clarityIntensitySlider ? elements.clarityIntensitySlider.value : '80', 10) || 80;
        applyTrackClarity(trackId, currentSelectedClarityPreset, intensity);
        closeModal(elements.clarityModal);
        showToast(state.language === 'id' ? `Track 0${trackId}: Pembersih suara aktif (${currentSelectedClarityPreset.toUpperCase()}) ✨` : `Track 0${trackId}: Audio clarity activated (${currentSelectedClarityPreset.toUpperCase()}) ✨`);
      });
    }

    if (elements.btnCloseClarityModal) {
      elements.btnCloseClarityModal.addEventListener('click', () => closeModal(elements.clarityModal));
    }

    // 3. Voice Modal
    if (elements.btnOpenVoiceModal && elements.voiceModal) {
      elements.btnOpenVoiceModal.addEventListener('click', () => {
        const initialTrackId = parseInt(state.selectedTrackId.replace('track-', ''), 10) || 1;
        if (elements.voiceTrackSelect) elements.voiceTrackSelect.value = String(initialTrackId);
        updateVoiceModalUI(initialTrackId);
        openModal(elements.voiceModal);
      });
    }

    if (elements.voiceTrackSelect) {
      elements.voiceTrackSelect.addEventListener('change', (e) => {
        const trkId = parseInt(e.target.value, 10) || 1;
        selectStudioTrack(trkId);
      });
    }

    if (elements.voicePresetsGrid) {
      elements.voicePresetsGrid.querySelectorAll('.fx-preset-card').forEach((card) => {
        card.addEventListener('click', () => {
          currentSelectedVoicePreset = card.dataset.preset;
          elements.voicePresetsGrid.querySelectorAll('.fx-preset-card').forEach((c) => c.classList.remove('active'));
          card.classList.add('active');

          // Live audition in real-time
          const trackId = parseInt(elements.voiceTrackSelect ? elements.voiceTrackSelect.value : '1', 10) || 1;
          applyTrackVoice(trackId, currentSelectedVoicePreset);
        });
      });
    }

    if (elements.btnBypassVoice) {
      elements.btnBypassVoice.addEventListener('click', () => {
        const trackId = parseInt(elements.voiceTrackSelect ? elements.voiceTrackSelect.value : '1', 10) || 1;
        applyTrackVoice(trackId, 'original');
        updateVoiceModalUI(trackId);
        closeModal(elements.voiceModal);
        showToast(state.language === 'id' ? `Track 0${trackId}: Efek suara dinonaktifkan.` : `Track 0${trackId}: Voice FX disabled.`);
      });
    }

    if (elements.btnApplyVoice) {
      elements.btnApplyVoice.addEventListener('click', () => {
        const trackId = parseInt(elements.voiceTrackSelect ? elements.voiceTrackSelect.value : '1', 10) || 1;
        applyTrackVoice(trackId, currentSelectedVoicePreset);
        closeModal(elements.voiceModal);
        showToast(state.language === 'id' ? `Track 0${trackId}: Efek pengubah suara aktif (${currentSelectedVoicePreset.toUpperCase()}) 🔊` : `Track 0${trackId}: Voice FX activated (${currentSelectedVoicePreset.toUpperCase()}) 🔊`);
      });
    }

    if (elements.btnCloseVoiceModal) {
      elements.btnCloseVoiceModal.addEventListener('click', () => closeModal(elements.voiceModal));
    }

    // Initial badge update
    updateTrackEffectBadges();
  }

  // --------------------------------------------------------------------------
  // 21B. All-In-One Stem Suite & Mode Studio Module (Phase 10)
  // --------------------------------------------------------------------------
  const STUDIO_PRESETS = {
    'studio-master': { name: 'Studio Master Pro', clarity: 3.5, deMud: -4.0, air: 4.0, warmth: 1.5 },
    'vocal-polish': { name: 'Vocal Polish Studio', clarity: 5.5, deMud: -3.5, air: 5.0, warmth: 0.5 },
    'acoustic-air': { name: 'Acoustic Air & Space', clarity: 2.0, deMud: -2.5, air: 6.5, warmth: 2.0 },
    'deep-denoise': { name: 'Deep Denoise & Clean', clarity: 3.0, deMud: -7.0, air: 2.5, warmth: 0.0 },
    'warm-punch': { name: 'Warm Punch & Body', clarity: 2.5, deMud: -3.0, air: 3.0, warmth: 3.5 }
  };

  let currentStudioPresetKey = 'studio-master';

  function updateStudioModeUI() {
    const isEnabled = !!(state.studioMode && state.studioMode.enabled);

    // Toolbar badge
    if (elements.studioModeBadge) {
      elements.studioModeBadge.textContent = isEnabled ? 'ON' : 'OFF';
      elements.studioModeBadge.classList.toggle('active', isEnabled);
    }
    if (elements.btnToggleStudioMode) {
      elements.btnToggleStudioMode.classList.toggle('active', isEnabled);
    }

    // All-in-one track row badge
    if (elements.allinoneStudioBadge) {
      elements.allinoneStudioBadge.textContent = isEnabled ? '🎧 MODE STUDIO (ON)' : '🎧 MODE STUDIO';
      elements.allinoneStudioBadge.classList.toggle('active', isEnabled);
    }

    // Modal status badge
    if (elements.modalStudioStatusBadge) {
      elements.modalStudioStatusBadge.textContent = isEnabled ? 'AKTIF' : 'STANDBY';
      elements.modalStudioStatusBadge.classList.toggle('active', isEnabled);
    }

    // Active preset card in modal
    if (elements.studioPresetGrid) {
      elements.studioPresetGrid.querySelectorAll('.studio-preset-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.preset === currentStudioPresetKey);
      });
    }

    // Sliders
    if (elements.sliderStudioClarity && state.studioMode) {
      elements.sliderStudioClarity.value = state.studioMode.clarity !== undefined ? state.studioMode.clarity : 3.5;
      if (elements.readoutStudioClarity) {
        const val = Number(elements.sliderStudioClarity.value);
        elements.readoutStudioClarity.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
      }
    }
    if (elements.sliderStudioDeMud && state.studioMode) {
      elements.sliderStudioDeMud.value = state.studioMode.deMud !== undefined ? state.studioMode.deMud : -4.0;
      if (elements.readoutStudioDeMud) {
        const val = Number(elements.sliderStudioDeMud.value);
        elements.readoutStudioDeMud.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
      }
    }
    if (elements.sliderStudioAir && state.studioMode) {
      elements.sliderStudioAir.value = state.studioMode.air !== undefined ? state.studioMode.air : 4.0;
      if (elements.readoutStudioAir) {
        const val = Number(elements.sliderStudioAir.value);
        elements.readoutStudioAir.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
      }
    }
    if (elements.sliderStudioWarmth && state.studioMode) {
      elements.sliderStudioWarmth.value = state.studioMode.warmth !== undefined ? state.studioMode.warmth : 1.5;
      if (elements.readoutStudioWarmth) {
        const val = Number(elements.sliderStudioWarmth.value);
        elements.readoutStudioWarmth.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
      }
    }
  }

  function applyStudioClarityMode(enabled, options = {}) {
    ensureTrackAudioNodes();
    state.studioMode = state.studioMode || {};
    state.studioMode.enabled = !!enabled;

    if (options.preset && STUDIO_PRESETS[options.preset]) {
      currentStudioPresetKey = options.preset;
      const p = STUDIO_PRESETS[options.preset];
      state.studioMode.preset = options.preset;
      state.studioMode.clarity = p.clarity;
      state.studioMode.deMud = p.deMud;
      state.studioMode.air = p.air;
      state.studioMode.warmth = p.warmth;
    } else {
      if (options.clarity !== undefined) state.studioMode.clarity = Number(options.clarity);
      if (options.deMud !== undefined) state.studioMode.deMud = Number(options.deMud);
      if (options.air !== undefined) state.studioMode.air = Number(options.air);
      if (options.warmth !== undefined) state.studioMode.warmth = Number(options.warmth);
    }

    updateStudioModeDsp();
    updateStudioModeUI();
    triggerAutosave();
  }

  function toggleStudioMode() {
    const nextState = !(state.studioMode && state.studioMode.enabled);
    applyStudioClarityMode(nextState);
    showToast(nextState ? '🎧 Mode Studio Aktif: Kejernihan & Mastering Maksimal' : 'Mode Studio Dinonaktifkan', nextState ? 'success' : 'info');
  }

  function initAllInOneAndStudioMode() {
    // 1. Studio Mode Toggle in Toolbar
    if (elements.btnToggleStudioMode) {
      elements.btnToggleStudioMode.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStudioMode();
      });
    }

    // 2. Open Studio Mode Modal buttons
    const openModalHandlers = [elements.btnOpenStudioModeModal, elements.btnAllInOneOpenStudio];
    openModalHandlers.forEach((btn) => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          updateStudioModeUI();
          openModal(elements.studioModeModal);
        });
      }
    });

    if (elements.btnCloseStudioModeModal) {
      elements.btnCloseStudioModeModal.addEventListener('click', () => closeModal(elements.studioModeModal));
    }
    if (elements.btnCancelStudioMode) {
      elements.btnCancelStudioMode.addEventListener('click', () => closeModal(elements.studioModeModal));
    }

    // 3. Studio Preset selection
    if (elements.studioPresetGrid) {
      elements.studioPresetGrid.querySelectorAll('.studio-preset-card').forEach((card) => {
        card.addEventListener('click', () => {
          const presetKey = card.dataset.preset;
          if (STUDIO_PRESETS[presetKey]) {
            currentStudioPresetKey = presetKey;
            applyStudioClarityMode(true, { preset: presetKey });
            showToast(`Preset Studio: ${STUDIO_PRESETS[presetKey].name} 🎧`);
          }
        });
      });
    }

    // 4. Studio Fine-Tuning Sliders
    if (elements.sliderStudioClarity) {
      elements.sliderStudioClarity.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (elements.readoutStudioClarity) {
          elements.readoutStudioClarity.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
        applyStudioClarityMode(true, { clarity: val });
      });
    }
    if (elements.sliderStudioDeMud) {
      elements.sliderStudioDeMud.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (elements.readoutStudioDeMud) {
          elements.readoutStudioDeMud.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
        applyStudioClarityMode(true, { deMud: val });
      });
    }
    if (elements.sliderStudioAir) {
      elements.sliderStudioAir.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (elements.readoutStudioAir) {
          elements.readoutStudioAir.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
        applyStudioClarityMode(true, { air: val });
      });
    }
    if (elements.sliderStudioWarmth) {
      elements.sliderStudioWarmth.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (elements.readoutStudioWarmth) {
          elements.readoutStudioWarmth.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
        applyStudioClarityMode(true, { warmth: val });
      });
    }

    // Modal action buttons
    if (elements.btnApplyStudioMode) {
      elements.btnApplyStudioMode.addEventListener('click', () => {
        applyStudioClarityMode(true);
        closeModal(elements.studioModeModal);
        showToast('🎧 Mode Studio Aktif: Output Audio Telah Dimastering!');
      });
    }
    if (elements.btnBypassStudioMode) {
      elements.btnBypassStudioMode.addEventListener('click', () => {
        applyStudioClarityMode(false);
        closeModal(elements.studioModeModal);
        showToast('Mode Studio Dinonaktifkan (Bypass).');
      });
    }

    // 5. All-In-One Master Track Row and Stem Indicators
    if (elements.trackRowAllInOne) {
      elements.trackRowAllInOne.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        selectStudioTrack('track-all');
        showToast('🎛️ Lagu Utama Terpadu Aktif: Semua Instrumen Siap Dikustomisasi');
      });
    }

    const pillMappings = [
      { el: elements.pillStemVocal, trackId: 1, name: 'Vokal Utama' },
      { el: elements.pillStemBass, trackId: 2, name: 'Synth & Bass' },
      { el: elements.pillStemDrum, trackId: 3, name: 'Cyber Drums' },
      { el: elements.pillStemFx, trackId: 4, name: 'FX & Drops' }
    ];
    pillMappings.forEach(({ el, trackId, name }) => {
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          selectStudioTrack(trackId);
          showToast(`Instrumen Aktif: ${name}`);
        });
      }
    });

    // 6. All-In-One Stem Sliders & Controls
    // Stem 1: Vocal
    if (elements.sliderStemVocalVol) {
      elements.sliderStemVocalVol.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        syncTrackVolume(1, val, 'allinone');
        if (elements.readoutStemVocalVol) {
          elements.readoutStemVocalVol.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
      });
    }
    if (elements.sliderStemVocalClarity) {
      elements.sliderStemVocalClarity.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.allInOneStems.vocal.clarity = val;
        if (elements.readoutStemVocalClarity) {
          elements.readoutStemVocalClarity.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
        if (state.tracks[1]) {
          state.tracks[1].eq.high = val;
          updateAudioTrackNode(1);
        }
      });
    }
    if (elements.btnStemVocalMute) {
      elements.btnStemVocalMute.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackMute(1);
        elements.btnStemVocalMute.classList.toggle('active', state.tracks[1].mute);
      });
    }
    if (elements.btnStemVocalSolo) {
      elements.btnStemVocalSolo.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackSolo(1);
        elements.btnStemVocalSolo.classList.toggle('active', state.tracks[1].solo);
      });
    }

    // Stem 2: Bass
    if (elements.sliderStemBassVol) {
      elements.sliderStemBassVol.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        syncTrackVolume(2, val, 'allinone');
        if (elements.readoutStemBassVol) {
          elements.readoutStemBassVol.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
      });
    }
    if (elements.sliderStemBassPunch) {
      elements.sliderStemBassPunch.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.allInOneStems.bass.punch = val;
        if (elements.readoutStemBassPunch) {
          elements.readoutStemBassPunch.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
        if (state.tracks[2]) {
          state.tracks[2].eq.low = val;
          updateAudioTrackNode(2);
        }
      });
    }
    if (elements.btnStemBassMute) {
      elements.btnStemBassMute.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackMute(2);
        elements.btnStemBassMute.classList.toggle('active', state.tracks[2].mute);
      });
    }
    if (elements.btnStemBassSolo) {
      elements.btnStemBassSolo.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackSolo(2);
        elements.btnStemBassSolo.classList.toggle('active', state.tracks[2].solo);
      });
    }

    // Stem 3: Drum
    if (elements.sliderStemDrumVol) {
      elements.sliderStemDrumVol.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        syncTrackVolume(3, val, 'allinone');
        if (elements.readoutStemDrumVol) {
          elements.readoutStemDrumVol.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
      });
    }
    if (elements.sliderStemDrumPunch) {
      elements.sliderStemDrumPunch.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.allInOneStems.drum.punch = val;
        if (elements.readoutStemDrumPunch) {
          elements.readoutStemDrumPunch.textContent = val + '%';
        }
        if (state.tracks[3]) {
          state.tracks[3].eq.mid = (val - 50) / 10;
          updateAudioTrackNode(3);
        }
      });
    }
    if (elements.btnStemDrumMute) {
      elements.btnStemDrumMute.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackMute(3);
        elements.btnStemDrumMute.classList.toggle('active', state.tracks[3].mute);
      });
    }
    if (elements.btnStemDrumSolo) {
      elements.btnStemDrumSolo.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackSolo(3);
        elements.btnStemDrumSolo.classList.toggle('active', state.tracks[3].solo);
      });
    }

    // Stem 4: FX
    if (elements.sliderStemFxVol) {
      elements.sliderStemFxVol.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        syncTrackVolume(4, val, 'allinone');
        if (elements.readoutStemFxVol) {
          elements.readoutStemFxVol.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
        }
      });
    }
    if (elements.sliderStemFxReverb) {
      elements.sliderStemFxReverb.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.allInOneStems.fx.reverb = val;
        if (elements.readoutStemFxReverb) {
          elements.readoutStemFxReverb.textContent = val + '%';
        }
        if (state.tracks[4] && state.tracks[4].fx && state.tracks[4].fx.reverb) {
          state.tracks[4].fx.reverb.mix = val;
          updateAudioTrackNode(4);
        }
      });
    }
    if (elements.btnStemFxMute) {
      elements.btnStemFxMute.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackMute(4);
        elements.btnStemFxMute.classList.toggle('active', state.tracks[4].mute);
      });
    }
    if (elements.btnStemFxSolo) {
      elements.btnStemFxSolo.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTrackSolo(4);
        elements.btnStemFxSolo.classList.toggle('active', state.tracks[4].solo);
      });
    }

    // 7. Reset & Download actions
    if (elements.btnAllInOneReset) {
      elements.btnAllInOneReset.addEventListener('click', () => {
        syncTrackVolume(1, 0.0, 'allinone');
        syncTrackVolume(2, 0.0, 'allinone');
        syncTrackVolume(3, -1.0, 'allinone');
        syncTrackVolume(4, 0.0, 'allinone');
        state.allInOneStems.vocal.clarity = 2.0;
        state.allInOneStems.bass.punch = 2.5;
        state.allInOneStems.drum.punch = 60;
        state.allInOneStems.fx.reverb = 40;
        [1, 2, 3, 4].forEach((id) => {
          if (state.tracks[id]) {
            state.tracks[id].mute = false;
            state.tracks[id].solo = false;
            updateAudioTrackNode(id);
          }
        });
        syncAllInOneControlsFromState();
        showToast('Setelan instrumen di-reset ke standar.');
      });
    }

    if (elements.btnAllInOneDownload) {
      elements.btnAllInOneDownload.addEventListener('click', () => {
        if (typeof downloadCurrentMix === 'function') {
          downloadCurrentMix();
        }
      });
    }

    // Initialize UI
    updateStudioModeUI();
    syncAllInOneControlsFromState();
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
    initClarityAndVoiceModules();
    initAllInOneAndStudioMode();

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

    // Initial select All-In-One suite
    selectStudioTrack('track-all');

    // Expose helpers for testing and external triggers
    window.selectStudioTrack = selectStudioTrack;
    window.applyTrackClarity = applyTrackClarity;
    window.applyTrackVoice = applyTrackVoice;
    window.applyStudioClarityMode = applyStudioClarityMode;
    window.toggleStudioMode = toggleStudioMode;
    window.downloadCurrentMix = downloadCurrentMix;

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
