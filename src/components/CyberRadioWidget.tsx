import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Volume2, VolumeX, Play, Square, Activity, Music, 
  Sparkles, RadioTower, Disc, Sliders, ChevronLeft, ChevronRight, 
  Shuffle, Wifi, Database, Info, Loader2, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Band types
type RadioBand = 'FM' | 'AM' | 'SW';

interface RadioStation {
  frequency: number; // MHz for FM, kHz for AM, MHz for SW
  name: string;
  genre: string;
  streamUrl?: string;
  isSynthesized?: boolean; // synthesized locally via Web Audio API
  desc: string;
}

const STATIONS: Record<RadioBand, RadioStation[]> = {
  FM: [
    { frequency: 89.9, name: 'SomaFM Synthzone', genre: 'Synthwave / Retro', streamUrl: 'https://ice1.somafm.com/synthzone-128-mp3', desc: 'Cyberpunk beats, pulsing arpeggios, and futuristic synthscapes from San Francisco.' },
    { frequency: 95.3, name: 'SomaFM Groove Salad', genre: 'Lofi Ambient', streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3', desc: 'A chilled-out plate of ambient lofi and future beats for deep concentration.' },
    { frequency: 101.5, name: 'Radio Paradise', genre: 'Eclectic Mix', streamUrl: 'https://stream.radioparadise.com/mp3-128', desc: 'A legendary listener-supported blend of rock, indie, electronic, and folk.' },
    { frequency: 106.7, name: 'SomaFM Deep Space One', genre: 'Deep Space Drone', streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3', desc: 'Extremely deep ambient drone music for interstellar telemetric navigation.' }
  ],
  AM: [
    { frequency: 620, name: 'OTR Drama Classics', genre: 'Retro Drama', streamUrl: 'http://198.58.106.133:8131/stream', desc: 'Classic golden age radio serials, vintage detective shows, and historical ads.' },
    { frequency: 810, name: 'KEXP Radio Seattle', genre: 'Alternative/Indie', streamUrl: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', desc: 'A champion of alternative music, live broadcasts, and curatorial radio art.' },
    { frequency: 1010, name: 'Slay Radio', genre: 'C64 Chiptunes', streamUrl: 'https://www.slayradio.org/tune_in.php/128/slayradio.mp3', desc: 'Amiga and Commodore 64 remix chip-telemetry streamed direct to your console.' }
  ],
  SW: [
    { frequency: 4.625, name: 'UVB-76 (The Buzzer)', genre: 'Military Beacon', isSynthesized: true, desc: 'Mysterious Russian shortwave station transmitting a repeating buzz signal since the 1970s.' },
    { frequency: 9.111, name: 'Lincolnshire Poacher', genre: 'Spy Numbers Station', isSynthesized: true, desc: 'Cryptographic spy transmission station broadcasting pipe organ chimes and voice coordinates.' },
    { frequency: 11.530, name: 'SomaFM Drone Zone', genre: 'Atmospheric Noise', streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3', desc: 'Subterranean ambient drones filtered through Shortwave ionospheric models.' },
    { frequency: 15.000, name: 'WWV Time Signal', genre: 'Atomic Metrology', isSynthesized: true, desc: 'Atomic clock time broadcast, seconds ticking, and high-frequency coordinate sync markers.' }
  ]
};

// Band Limits
const BAND_LIMITS = {
  FM: { min: 87.5, max: 108.0, step: 0.1, unit: 'MHz', range: 0.4 },
  AM: { min: 530, max: 1700, step: 10, unit: 'kHz', range: 20 },
  SW: { min: 3.2, max: 22.0, step: 0.005, unit: 'MHz', range: 0.15 }
};

function useLocalRadioStations(initialStations: Record<RadioBand, RadioStation[]>, searchQuery: string = '') {
  const [stations, setStations] = useState<Record<RadioBand, RadioStation[]>>(initialStations);
  const [localCity, setLocalCity] = useState<string | null>(null);
  
  // Cache the location data to avoid re-fetching on every search
  const locationCache = useRef<{city: string, countryCode: string, region: string} | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchLocalStations() {
      try {
        let city = '';
        let countryCode = '';
        let region = '';

        if (!locationCache.current) {
          try {
            const res = await fetch("https://ipwho.is/");
            const data = await res.json();
            if (data && data.success) {
              city = data.city;
              countryCode = data.country_code;
              region = data.region;
            }
          } catch (e) {
            try {
              const res = await fetch("https://ipapi.co/json/");
              const data = await res.json();
              if (data && data.city) {
                city = data.city;
                countryCode = data.country_code;
                region = data.region;
              }
            } catch (e2) {
              const res = await fetch("https://freeipapi.com/api/json");
              const data = await res.json();
              if (data && data.cityName) {
                city = data.cityName;
                countryCode = data.countryCode;
                region = data.regionName;
              }
            }
          }
          if (city && countryCode) {
            locationCache.current = { city, countryCode, region };
          }
        }
        
        if (locationCache.current) {
          city = locationCache.current.city;
          countryCode = locationCache.current.countryCode;
          region = locationCache.current.region;
        }

        if (searchQuery) {
          countryCode = 'IN';
          if (isMounted) setLocalCity(`SEARCH: ${searchQuery.toUpperCase()}`);
        } else {
          if (!city || !countryCode) return;
          if (isMounted) setLocalCity(city);
        }

        const query = new URLSearchParams({
          countrycode: countryCode,
          hidebroken: 'true',
          limit: '15',
          order: 'clickcount',
          reverse: 'true'
        });
        
        if (region && !searchQuery) query.append('state', region);
        if (searchQuery) query.append('name', searchQuery);
        
        const radioRes = await fetch(`https://de1.api.radio-browser.info/json/stations/search?${query.toString()}`);
        const radioData = await radioRes.json();
        
        if (radioData && Array.isArray(radioData) && radioData.length > 0) {
          const newFmStations: RadioStation[] = radioData.map((s: any) => {
            let freq = 88.0;
            const match = s.name.match(/(\d{2,3}\.\d)/);
            if (match) {
               freq = parseFloat(match[1]);
            } else {
               freq = parseFloat((88.0 + (Math.random() * 19.9)).toFixed(1)); 
            }
            
            return {
              frequency: freq,
              name: s.name.trim() || 'Local Radio',
              genre: s.tags ? s.tags.split(',')[0].trim() : 'Local',
              streamUrl: s.url_resolved || s.url,
              desc: searchQuery ? `Indian station matching "${searchQuery}". ${s.tags || ''}` : `Local broadcast from ${city}. ${s.tags || ''}`
            };
          });
          
          if (isMounted) {
            setStations(prev => {
              const combinedFM = [...newFmStations, ...initialStations.FM]
                .filter((v, i, a) => a.findIndex(t => (t.streamUrl === v.streamUrl)) === i)
                .sort((a, b) => a.frequency - b.frequency);
              return { ...prev, FM: combinedFM };
            });
          }
        } else if (searchQuery) {
          // Fallback to searching by tag if name search fails
          const tagQuery = new URLSearchParams({
            countrycode: 'IN',
            hidebroken: 'true',
            limit: '15',
            order: 'clickcount',
            reverse: 'true',
            tag: searchQuery
          });
          const tagRes = await fetch(`https://de1.api.radio-browser.info/json/stations/search?${tagQuery.toString()}`);
          const tagData = await tagRes.json();
          if (tagData && Array.isArray(tagData) && tagData.length > 0) {
              const newFmStations: RadioStation[] = tagData.map((s: any) => {
                let freq = 88.0;
                const match = s.name.match(/(\d{2,3}\.\d)/);
                if (match) {
                   freq = parseFloat(match[1]);
                } else {
                   freq = parseFloat((88.0 + (Math.random() * 19.9)).toFixed(1)); 
                }
                
                return {
                  frequency: freq,
                  name: s.name.trim() || 'Local Radio',
                  genre: s.tags ? s.tags.split(',')[0].trim() : 'Local',
                  streamUrl: s.url_resolved || s.url,
                  desc: `Indian station matching genre "${searchQuery}". ${s.tags || ''}`
                };
              });
              
              if (isMounted) {
                setStations(prev => {
                  const combinedFM = [...newFmStations, ...initialStations.FM]
                    .filter((v, i, a) => a.findIndex(t => (t.streamUrl === v.streamUrl)) === i)
                    .sort((a, b) => a.frequency - b.frequency);
                  return { ...prev, FM: combinedFM };
                });
              }
          }
        }
      } catch (e) {
        console.error("Failed to load local radio stations", e);
      }
    }
    
    const timer = setTimeout(() => {
      fetchLocalStations();
    }, 600);
    
    return () => { 
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return { stations, localCity };
}

export default function CyberRadioWidget() {
  const [band, setBand] = useState<RadioBand>('FM');
  const [frequency, setFrequency] = useState<number>(89.9);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.4);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [signalStrength, setSignalStrength] = useState<number>(100);
  const [snr, setSnr] = useState<number>(45); // Signal to Noise Ratio dB
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');

  // Dynamic stations based on geolocation
  const { stations: localStations, localCity } = useLocalRadioStations(STATIONS, searchInput);

  // Web Audio state references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | OscillatorNode | null>(null);
  const synthNodesRef = useRef<{ oscs: OscillatorNode[]; gain: GainNode } | null>(null);
  const staticGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Audio Element for live streams
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Canvas visualizer reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Fine tune controls
  const limits = BAND_LIMITS[band];

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audioElRef.current = audio;

    // Handle stream loading states
    audio.onwaiting = () => setIsLoading(true);
    audio.onplaying = () => setIsLoading(false);
    audio.oncanplay = () => setIsLoading(false);
    audio.onerror = (e) => {
      console.warn("Audio element stream error, retrying...", e);
      setIsLoading(false);
    };

    return () => {
      audio.pause();
      audio.src = '';
      audioElRef.current = null;
    };
  }, []);

  // Update tuned frequency defaults when band changes
  const changeBand = (newBand: RadioBand) => {
    setBand(newBand);
    const firstStation = localStations[newBand][0];
    setFrequency(firstStation ? firstStation.frequency : BAND_LIMITS[newBand].min);
  };

  // Find nearest station and calculate static noise ratio
  const getTunedStation = (): { station: RadioStation | null; distance: number; staticPercent: number } => {
    const stations = localStations[band];
    const limitsObj = BAND_LIMITS[band];
    
    let nearestStation: RadioStation | null = null;
    let minDistance = Infinity;

    for (const st of stations) {
      const dist = Math.abs(frequency - st.frequency);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStation = st;
      }
    }

    if (nearestStation && minDistance <= limitsObj.range) {
      const staticPercent = minDistance / limitsObj.range; // 0 at exact match, 1 at boundary
      return { station: nearestStation, distance: minDistance, staticPercent };
    }

    return { station: null, distance: minDistance, staticPercent: 1.0 };
  };

  const { station: tunedStation, staticPercent } = getTunedStation();

  // Handle stream audio element source updates
  useEffect(() => {
    if (!audioElRef.current) return;

    if (isPlaying && tunedStation && tunedStation.streamUrl) {
      // Calculate active music volume (lower volume if tuning is off-center)
      const targetVolume = (1 - staticPercent) * volume * (isMuted ? 0 : 1);
      
      // Update stream URL if changed
      if (audioElRef.current.src !== tunedStation.streamUrl) {
        setIsLoading(true);
        audioElRef.current.src = tunedStation.streamUrl;
        audioElRef.current.load();
      }

      audioElRef.current.volume = Math.max(0, Math.min(1, targetVolume));
      audioElRef.current.play().catch(err => {
        console.warn("Autoplay or source change blocked. Interactivity required.", err);
        setIsLoading(false);
      });
    } else {
      if (audioElRef.current) {
        audioElRef.current.pause();
      }
      setIsLoading(false);
    }
  }, [isPlaying, tunedStation?.frequency, staticPercent, volume, isMuted]);

  // Adjust metrics based on tuning accuracy
  useEffect(() => {
    const randomFlicker = Math.random() * 3;
    const strength = Math.max(0, Math.round((1 - staticPercent) * 100 - randomFlicker));
    const dbRatio = Math.max(-5, Math.round((1 - staticPercent) * 50 - 5 - randomFlicker / 2));
    setSignalStrength(strength);
    setSnr(dbRatio);
  }, [frequency, staticPercent]);

  // Initialize and update local synthesizers for UVB-76 / WWV / Numbers Station / Static noise
  useEffect(() => {
    if (!isPlaying) {
      cleanupSynthesizer();
      return;
    }

    try {
      // Lazy init AudioContext
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master Gain setup
      if (!masterGainRef.current) {
        masterGainRef.current = ctx.createGain();
        masterGainRef.current.connect(ctx.destination);
      }
      masterGainRef.current.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);

      // Noise Node (White noise sound generator for authentic static)
      if (!noiseNodeRef.current) {
        // Create procedural static noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;
        noiseFilter.Q.value = 0.4;

        staticGainRef.current = ctx.createGain();
        
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(staticGainRef.current);
        staticGainRef.current.connect(masterGainRef.current);
        
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise as any;
      }

      // Update static volume depending on tuning distance
      if (staticGainRef.current) {
        // Higher static when not tuned exactly
        const targetStaticLevel = Math.max(0.01, staticPercent * 0.18); 
        staticGainRef.current.gain.setTargetAtTime(targetStaticLevel, ctx.currentTime, 0.1);
      }

      // Trigger localized local transmitters
      if (tunedStation && tunedStation.isSynthesized) {
        setupSynthesizedStation(ctx, tunedStation.frequency, staticPercent);
      } else {
        stopSynthesizedTransmission();
      }

    } catch (err) {
      console.warn("Web Audio Initialization error:", err);
    }
  }, [isPlaying, tunedStation?.frequency, staticPercent, volume, isMuted]);

  const stopSynthesizedTransmission = () => {
    if (synthNodesRef.current) {
      synthNodesRef.current.oscs.forEach(osc => {
        try { osc.stop(); } catch(e){}
      });
      synthNodesRef.current.gain.disconnect();
      synthNodesRef.current = null;
    }
  };

  const stopNoiseNode = () => {
    if (noiseNodeRef.current) {
      try { (noiseNodeRef.current as any).stop(); } catch(e){}
      noiseNodeRef.current = null;
    }
    if (staticGainRef.current) {
      staticGainRef.current.disconnect();
      staticGainRef.current = null;
    }
  };

  const cleanupSynthesizer = () => {
    stopSynthesizedTransmission();
    stopNoiseNode();
    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    if (audioCtxRef.current) {
      // Don't close so we can reuse
    }
  };

  // Build authentic synthesized station sounds
  const setupSynthesizedStation = (ctx: AudioContext, freq: number, offCenterRatio: number) => {
    stopSynthesizedTransmission();

    const stationGain = ctx.createGain();
    const tunedClarity = 1 - offCenterRatio;
    stationGain.gain.setValueAtTime(tunedClarity * 0.5, ctx.currentTime);
    stationGain.connect(masterGainRef.current!);

    const oscs: OscillatorNode[] = [];

    if (freq === 4.625) {
      // UVB-76 "The Buzzer" Russian beacon
      // Repeating 1.2 second interval buzzes
      const buzzerTimer = setInterval(() => {
        if (!isPlaying || !audioCtxRef.current || band !== 'SW' || frequency !== 4.625) {
          clearInterval(buzzerTimer);
          return;
        }
        
        try {
          const nowCtx = ctx.currentTime;
          // Buzzer sound
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const buzzGain = ctx.createGain();

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(80, nowCtx); // Low frequency buzz

          osc2.type = 'square';
          osc2.frequency.setValueAtTime(140, nowCtx); // Buzz texture harmonics

          buzzGain.gain.setValueAtTime(0, nowCtx);
          buzzGain.gain.linearRampToValueAtTime(0.35, nowCtx + 0.05);
          buzzGain.gain.setValueAtTime(0.35, nowCtx + 0.95);
          buzzGain.gain.linearRampToValueAtTime(0, nowCtx + 1.0);

          osc1.connect(buzzGain);
          osc2.connect(buzzGain);
          buzzGain.connect(stationGain);

          osc1.start(nowCtx);
          osc2.start(nowCtx);

          osc1.stop(nowCtx + 1.1);
          osc2.stop(nowCtx + 1.1);
        } catch(e){}
      }, 1400);

      // Save a dummy osc reference to allow clean stopping
      const dummyOsc = ctx.createOscillator();
      dummyOsc.start();
      oscs.push(dummyOsc);

    } else if (freq === 9.111) {
      // Lincolnshire Poacher Spy Numbers Station
      // Plays a short classic organ chime melody followed by synthesized numbers speech!
      const playSpySequence = () => {
        if (!isPlaying || !audioCtxRef.current || band !== 'SW' || frequency !== 9.111) return;

        try {
          const nowCtx = ctx.currentTime;
          // Chime organ melody (using sine-square overlay)
          const notes = [523.25, 587.33, 659.25, 523.25, 523.25, 659.25, 587.33]; // C5 D5 E5 C5 C5 E5 D5
          let noteTime = nowCtx;

          notes.forEach(note => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note, noteTime);
            
            g.gain.setValueAtTime(0, noteTime);
            g.gain.linearRampToValueAtTime(0.2, noteTime + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
            
            osc.connect(g);
            g.connect(stationGain);
            osc.start(noteTime);
            osc.stop(noteTime + 0.3);
            noteTime += 0.35;
          });

          // Spooky Numbers Recitation fallback
          setTimeout(() => {
            if (!isPlaying || frequency !== 9.111) return;
            const msg = new SpeechSynthesisUtterance("3... 9... 0... 2... 1... Secure code transmission decoded.");
            msg.rate = 0.75;
            msg.pitch = 0.3; // Deep ominous voice
            msg.volume = volume * tunedClarity;
            window.speechSynthesis?.speak(msg);
          }, 3000);

        } catch (e){}
      };

      playSpySequence();
      const spyInterval = setInterval(playSpySequence, 12000);

      const dummyOsc = ctx.createOscillator();
      dummyOsc.start();
      oscs.push(dummyOsc);

    } else if (freq === 15.000) {
      // WWV Time Signal
      // Periodic ticks of 1Hz (atomic clock sync)
      const tickTimer = setInterval(() => {
        if (!isPlaying || !audioCtxRef.current || band !== 'SW' || frequency !== 15.000) {
          clearInterval(tickTimer);
          return;
        }

        try {
          const nowCtx = ctx.currentTime;
          const tickOsc = ctx.createOscillator();
          const tickGain = ctx.createGain();

          const isSecond0 = new Date().getSeconds() === 0;
          tickOsc.type = 'sine';
          tickOsc.frequency.setValueAtTime(isSecond0 ? 1000 : 500, nowCtx); // High sync beep on minute start

          tickGain.gain.setValueAtTime(0, nowCtx);
          tickGain.gain.linearRampToValueAtTime(0.25, nowCtx + 0.005);
          tickGain.gain.exponentialRampToValueAtTime(0.001, nowCtx + (isSecond0 ? 0.8 : 0.05));

          tickOsc.connect(tickGain);
          tickGain.connect(stationGain);

          tickOsc.start(nowCtx);
          tickOsc.stop(nowCtx + 0.9);
        } catch(e){}
      }, 1000);

      const dummyOsc = ctx.createOscillator();
      dummyOsc.start();
      oscs.push(dummyOsc);
    }

    synthNodesRef.current = { oscs, gain: stationGain };
  };

  // Beautiful Spectrogram Canvas waterfall & Oscilloscope renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 400;
    let height = canvas.height = 100;

    // Resize observer to ensure responsive sizing without causing loop undelivered notifications
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || !entries.length) return;
      const entry = entries[0];
      const entryWidth = entry.contentRect.width || 400;
      window.requestAnimationFrame(() => {
        if (canvas) {
          canvas.width = entryWidth;
          canvas.height = 100;
          width = entryWidth;
          height = 100;
        }
      });
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Capture sound waves procedurally
    let frame = 0;
    const waterfallRows: number[][] = Array(30).fill(0).map(() => Array(100).fill(0));

    const render = () => {
      frame++;
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      // Draw horizontal sub-grid telemetry lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 1;
      for (let y = 10; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Generate visual wave points
      const points = [];
      const len = 120;
      const accuracyMultiplier = 1 - staticPercent;

      for (let i = 0; i < len; i++) {
        const x = (i / len) * width;
        let y = height / 2;

        if (isPlaying) {
          if (tunedStation) {
            if (tunedStation.isSynthesized) {
              // Procedural wave according to local station frequency
              if (tunedStation.frequency === 4.625) {
                // UVB-76: square sharp telemetry pulse spikes
                const buzzState = Math.sin(frame * 0.15) > 0.6 ? 1 : 0;
                y += Math.sin(i * 0.3 + frame * 0.8) * 15 * buzzState * accuracyMultiplier;
              } else if (tunedStation.frequency === 9.111) {
                // Numbers station melodic triangle organ waves combined with digital noise spikes
                y += Math.sin(i * 0.12 + frame * 0.3) * 12 * accuracyMultiplier;
                if (Math.random() > 0.96) {
                  y += (Math.random() * 25 - 12.5);
                }
              } else {
                // Time signal WWV ticks
                const tickPulse = frame % 30 < 4 ? Math.sin(frame * 0.9) * 20 : 0;
                y += Math.sin(i * 0.4) * tickPulse * accuracyMultiplier;
              }
            } else {
              // Real stream waveform mock sync (synchronized with active music genres)
              const genre = tunedStation.genre.toLowerCase();
              if (genre.includes('synth')) {
                // Complex synth waves
                y += Math.sin(i * 0.15 - frame * 0.25) * 14 * accuracyMultiplier;
                y += Math.sin(i * 0.35 + frame * 0.1) * 6 * accuracyMultiplier;
              } else if (genre.includes('lofi')) {
                // Gentle, smooth slow-moving waves
                y += Math.sin(i * 0.08 - frame * 0.08) * 12 * accuracyMultiplier;
                y += Math.cos(i * 0.2 + frame * 0.04) * 4 * accuracyMultiplier;
              } else {
                // Eclectic alternative upbeat music curves
                y += Math.sin(i * 0.25 - frame * 0.18) * 10 * accuracyMultiplier;
                y += Math.cos(i * 0.5 + frame * 0.3) * 5 * accuracyMultiplier;
              }
            }
          }
          
          // Overlay dynamic white noise static crackles (especially if tuning is off)
          const staticNoiseLevel = staticPercent * 16;
          y += (Math.random() * staticNoiseLevel - staticNoiseLevel / 2);
        } else {
          // Standing wave pattern
          y += Math.sin(i * 0.08 + frame * 0.02) * 2;
        }

        points.push({ x, y });
      }

      // Draw the live wave trace line
      ctx.beginPath();
      ctx.strokeStyle = isPlaying 
        ? `hsla(${160 + accuracyMultiplier * 60}, 85%, 55%, ${0.5 + accuracyMultiplier * 0.5})` 
        : 'rgba(148, 163, 184, 0.25)'; // slate-400
      ctx.lineWidth = isPlaying ? 2 : 1;

      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Spectral Waterfall Renderer at bottom of panel
      if (isPlaying) {
        // Push a new spectrum row
        const newRow = Array(100).fill(0).map((_, idx) => {
          // Add peaks where stations are
          const freqNorm = idx / 100;
          let energy = Math.random() * 10;
          
          localStations[band].forEach(st => {
            const limitsObj = BAND_LIMITS[band];
            const stNorm = (st.frequency - limitsObj.min) / (limitsObj.max - limitsObj.min);
            const dist = Math.abs(freqNorm - stNorm);
            if (dist < 0.04) {
              energy += (1 - dist / 0.04) * 45;
            }
          });

          // Focus indicator peak matching the tuned dial
          const tunedNorm = (frequency - limits.min) / (limits.max - limits.min);
          const cursorDist = Math.abs(freqNorm - tunedNorm);
          if (cursorDist < 0.02) {
            energy += (1 - cursorDist / 0.02) * 35;
          }

          return energy;
        });

        waterfallRows.unshift(newRow);
        waterfallRows.pop();
      }

      // Draw Waterfall
      const rowHeight = 1.2;
      waterfallRows.forEach((row, rowIdx) => {
        const y = height - (rowIdx * rowHeight);
        if (y < height - 35) return; // Keep top clear for oscilloscope

        row.forEach((val, colIdx) => {
          const x = (colIdx / row.length) * width;
          const w = width / row.length + 1;
          const alpha = Math.max(0, Math.min(1, 1 - (rowIdx / 30)));
          const intensity = Math.min(255, val * 3);

          ctx.fillStyle = `rgba(16, ${intensity}, ${intensity + 50}, ${alpha * 0.8})`;
          ctx.fillRect(x, y, w, rowHeight);
        });
      });

      // Draw Neon vertical pointer line for current frequency
      const markerX = ((frequency - limits.min) / (limits.max - limits.min)) * width;
      ctx.strokeStyle = '#eab308'; // yellow-500
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(markerX, 10);
      ctx.lineTo(markerX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, frequency, staticPercent, band]);

  // Adjust frequencies
  const changeFreq = (val: number) => {
    let nextFreq = Number((frequency + val).toFixed(3));
    if (nextFreq < limits.min) nextFreq = limits.min;
    if (nextFreq > limits.max) nextFreq = limits.max;
    setFrequency(nextFreq);
  };

  // Slider change handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrequency(parseFloat(e.target.value));
  };

  // Find next station (auto-scan/seek)
  const seekStation = (direction: 'forward' | 'backward') => {
    const stations = localStations[band];
    const limitsObj = BAND_LIMITS[band];
    
    // Sort stations by frequency
    const sorted = [...stations].sort((a, b) => a.frequency - b.frequency);
    
    let target: RadioStation | undefined;

    if (direction === 'forward') {
      target = sorted.find(st => st.frequency > frequency + 0.1);
      if (!target && sorted.length > 0) target = sorted[0]; // Wrap around
    } else {
      target = [...sorted].reverse().find(st => st.frequency < frequency - 0.1);
      if (!target && sorted.length > 0) target = sorted[sorted.length - 1]; // Wrap around
    }

    if (target) {
      setFrequency(target.frequency);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 font-mono select-none text-xs" id="cyber_radio_widget_panel">
      {/* Radio Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              Omni Radio Deck 
              <span className="text-[8px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black font-mono">SDR-V3</span>
            </h3>
            <span className="text-[8px] text-slate-500 uppercase">Multi-Band SW / AM / FM Receiver Node</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
             <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Search Indian stations..." 
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               className="bg-slate-950 border border-slate-850 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors w-40"
             />
          </div>
          <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850">
            {(['FM', 'AM', 'SW'] as RadioBand[]).map(b => (
              <button
                key={b}
                onClick={() => changeBand(b)}
                className={`px-3 py-1 rounded text-[9px] font-black cursor-pointer transition-all ${
                  band === b ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Digital Display Interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* SDR Frequency display */}
        <div className="md:col-span-5 bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle neon glowing dot */}
          <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
          
          <div>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-black">CURRENT FREQUENCY</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight animate-fade-in">
                {band === 'AM' ? frequency : frequency.toFixed(3)}
              </span>
              <span className="text-[10px] font-black text-slate-400">{limits.unit}</span>
            </div>
          </div>

          {/* Telemetry metadata block */}
          <div className="border-t border-slate-850 pt-2.5 mt-3 space-y-1">
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-500">SIGNAL NOISE LEVEL</span>
              <span className="text-yellow-500 font-bold">{snr} dB</span>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-500">PROPAGATION STRENGTH</span>
              <span className={`${signalStrength > 70 ? 'text-emerald-400' : 'text-yellow-500'} font-bold`}>{signalStrength}%</span>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-500">ANTENNA UPLINK</span>
              <span className="text-sky-400 font-bold flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" /> {localCity ? `LOCAL SYNC: ${localCity.toUpperCase()}` : 'IONOSPHERE SYNC'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Canvas Spectrogram Plotter */}
        <div className="md:col-span-7 bg-slate-950 rounded-2xl border border-slate-850 p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center mb-1 text-[8px] text-slate-500">
            <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-emerald-400" /> REAL-TIME SPECTRAL WATERFALL</span>
            <span>FREQ TUNER MARKER</span>
          </div>
          
          <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex-1 min-h-[100px]">
            <canvas ref={canvasRef} className="w-full h-full block" />
            
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">TUNING MATRIX...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Dial Tuning Knob & Slider */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-3">
        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-black">
          <span>{limits.min} {limits.unit}</span>
          <span className="text-yellow-500 flex items-center gap-1"><Sliders className="w-3 h-3" /> Tuning dial</span>
          <span>{limits.max} {limits.unit}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => changeFreq(-limits.step * 5)} 
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Fast Tune Down"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <input
            type="range"
            min={limits.min}
            max={limits.max}
            step={limits.step}
            value={frequency}
            onChange={handleSliderChange}
            className="flex-1 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-850"
          />

          <button 
            onClick={() => changeFreq(limits.step * 5)} 
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Fast Tune Up"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between gap-2">
          <button 
            onClick={() => seekStation('backward')}
            className="flex-1 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white text-[9px] font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" /> Auto Seek Down
          </button>
          <button 
            onClick={() => seekStation('forward')}
            className="flex-1 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white text-[9px] font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            Auto Seek Up <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Cyber Radio Control Console Deck */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Tuning Station Display Metadata Card */}
        <div className="flex-1 bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-start gap-2.5 min-h-[64px]">
          {isPlaying && tunedStation && staticPercent < 0.9 ? (
            <>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '8s' }}>
                <Disc className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-tight">{tunedStation.name}</span>
                  <span className="text-[7px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1 py-0.2 rounded font-black uppercase font-mono">{tunedStation.genre}</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal line-clamp-2">{tunedStation.desc}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 mt-0.5">
                <RadioTower className="w-4 h-4 text-slate-500" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">NO ACTIVE CARRIER SYNCED</span>
                <p className="text-[9px] text-slate-500 leading-normal">
                  {isPlaying ? 'Receiver tuning currently picking up ambient white noise static or ionospheric scatter.' : 'Power deck receiver online. Activate Power switch to begin demodulation.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Deck Power & Sound Controllers */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Deck Volume Slider */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-850 h-10">
            <button 
              onClick={() => setIsMuted(prev => !prev)} 
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Core Power Switch toggle */}
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            className={`px-4 h-10 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.35)] border border-red-500' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white text-white" />
                <span>POWER OFF</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-pulse" />
                <span>POWER ON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
