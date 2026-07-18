import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Mic, Camera, Play, Pause, Image, Video, Calendar, Bell, Clock, Globe, ArrowUpRight, Check, Code2 } from 'lucide-react';
import { Alarm, DriveFile } from '../types';
import VibeCodingTab from './VibeCodingTab';

interface AICockpitWidgetProps {
  alarms: Alarm[];
  setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>>;
  setDriveFiles: React.Dispatch<React.SetStateAction<DriveFile[]>>;
  gold: number;
  speedDownload: number;
  weatherTemp: number;
  triggerNotification: (title: string, msg: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export default function AICockpitWidget({
  alarms,
  setAlarms,
  setDriveFiles,
  gold,
  speedDownload,
  weatherTemp,
  triggerNotification
}: AICockpitWidgetProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'alarms' | 'generate' | 'vibe'>('chat');

  // --- CHATBOT & VOICE & VISION STATES ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Greetings! I am your omnipresent Gemini AI Companion. I can inspect system status (such as your $1.4M reserves or 842 Mbps speed), set alarms, analyze webcam frames, or generate media assets. How can I assist you?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [cameraAnalyzing, setCameraAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = async (overrideText?: string) => {
    const text = overrideText || userInput;
    if (!text.trim()) return;

    const updated = [...chatMessages, { role: 'user', content: text } as ChatMessage];
    setChatMessages(updated);
    setUserInput('');
    setLoadingChat(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          toolState: { 
            gold, 
            speedDownload, 
            weatherTemp,
            localTime: new Date().toString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });
      const data = await response.json();
      
      setChatMessages(prev => [...prev, { role: 'model', content: data.content }]);
      
      // Perform system-level instructions executed by AI (e.g. Set Alarm)
      if (data.action && data.action.type === 'SET_ALARM') {
        const newAlarm: Alarm = {
          id: 'a' + (alarms.length + 1),
          time: data.action.time,
          label: data.action.label,
          days: ['Everyday'],
          active: true,
          sound: 'cyber_synth.mp3'
        };
        setAlarms(prev => [...prev, newAlarm]);
        triggerNotification('AI Action: Alarm Created', `Alarm set successfully for ${data.action.time}.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('AI Error', 'Failed to connect to backend server proxy.');
    } finally {
      setLoadingChat(false);
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceActive(prev => {
      const next = !prev;
      if (next) {
        triggerNotification('Fluid Voice Channel Open', 'Listening... Speak your command verbal vectors.');
        // Simulate a voice response after 3 seconds
        setTimeout(() => {
          sendChatMessage("How are you doing?");
          setIsVoiceActive(false);
        }, 3000);
      } else {
        triggerNotification('Voice Channel Closed', 'Microphone link deactivated.');
      }
      return next;
    });
  };

  const triggerCameraVision = () => {
    setCameraAnalyzing(true);
    triggerNotification('Webcam Sensor Armed', 'Capturing workspace grid frame metrics...');
    
    setTimeout(async () => {
      try {
        const res = await fetch('/api/gemini/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: 'mock_frame_data' })
        });
        const data = await res.json();
        
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: "[Camera Snap analyzed]" },
          { role: 'model', content: `[Camera Analysis Insights]: ${data.analysis}` }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setCameraAnalyzing(false);
      }
    }, 1500);
  };


  // --- TIME COMMANDS: WORLD CLOCK & TIMER & ALARMS ---
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer states
  const [timerDuration, setTimerDuration] = useState(60); // 1 minute default
  const [timerTimeLeft, setTimerTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdownTimer = () => {
    if (timerActive) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimerActive(false);
    } else {
      const initial = timerTimeLeft > 0 ? timerTimeLeft : timerDuration;
      setTimerTimeLeft(initial);
      setTimerActive(true);
      
      timerIntervalRef.current = setInterval(() => {
        setTimerTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerActive(false);
            triggerNotification('Countdown Concluded', 'Time interval limit reached!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetCountdownTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerActive(false);
    setTimerTimeLeft(0);
  };

  // Alarm management
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [selectedAlarmSound, setSelectedAlarmSound] = useState('cyber_synth.mp3');

  const addAlarm = () => {
    const parts = newAlarmTime.split(':');
    let h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const formattedTime = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;

    const newAlarm: Alarm = {
      id: 'a' + (alarms.length + 1),
      time: formattedTime,
      label: newAlarmLabel || 'Custom Alarm',
      days: ['Everyday'],
      active: true,
      sound: selectedAlarmSound
    };

    setAlarms(prev => [...prev, newAlarm]);
    setNewAlarmLabel('');
    triggerNotification('Alarm Configured', `Armed alarm for ${formattedTime} utilizing sound: ${selectedAlarmSound}`);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev =>
      prev.map(a => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };


  // --- CREATIVE AI STUDIO GENERATE ---
  const [mediaPrompt, setMediaPrompt] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [generatingAsset, setGeneratingAsset] = useState(false);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState('');

  const runCreativeGeneration = async () => {
    if (!mediaPrompt.trim()) return;
    setGeneratingAsset(true);
    triggerNotification('Synthesizing Asset', `Model starting high-fidelity ${mediaType} generation for: "${mediaPrompt}"`);

    try {
      const res = await fetch('/api/gemini/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: mediaPrompt, type: mediaType })
      });
      const data = await res.json();
      
      setLastGeneratedUrl(data.url);
      setDriveFiles(prev => [data.file, ...prev]);
      triggerNotification('Asset Exported Successfully', `${mediaType.toUpperCase()} exported straight to Google Drive folder!`);
    } catch (err) {
      console.error(err);
      triggerNotification('Generation Error', 'Visual asset generation pipelines failed.');
    } finally {
      setGeneratingAsset(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 font-sans select-none" id="creative_ai_cockpit_root">
      
      {/* Tab Selectors */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 justify-around gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs uppercase font-black transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'chat' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          CHAT
        </button>
        <button
          onClick={() => setActiveTab('alarms')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs uppercase font-black transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'alarms' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          TIME
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs uppercase font-black transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'generate' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          MEDIA
        </button>
        <button
          onClick={() => setActiveTab('vibe')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs uppercase font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'vibe' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          VIBE CODING
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5">
        
        {/* --- TAB: ASSISTANT CHAT ENGINE --- */}
        {activeTab === 'chat' && (
          <div className="space-y-3" id="ai_assistant_chat_tab">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Dual-channel smart assistant</span>
              <div className="flex gap-2">
                <button
                  onClick={triggerCameraVision}
                  disabled={cameraAnalyzing}
                  className={`p-1.5 rounded-lg border ${
                    cameraAnalyzing ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Capture webcam metrics"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleVoiceMode}
                  className={`p-1.5 rounded-lg border ${
                    isVoiceActive ? 'bg-purple-500/20 border-purple-500 text-purple-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Fluid Voice Channel Mode"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat list viewport */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 h-[220px] overflow-y-auto space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  }`}>
                    {msg.role === 'user' ? 'ME' : 'AI'}
                  </div>
                  <div className={`p-2.5 rounded-2xl max-w-[80%] text-xs leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-blue-600/15 border-blue-500/20 text-slate-100'
                      : 'bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loadingChat && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded bg-purple-600 animate-pulse"></div>
                  <div className="bg-slate-800 p-2.5 rounded-xl text-xs text-slate-500 font-mono">
                    Gemini model formulating response vector...
                  </div>
                </div>
              )}
              <div ref={scrollRef}></div>
            </div>

            {/* Voice visualizer */}
            {isVoiceActive && (
              <div className="flex items-center justify-center gap-1.5 py-1 text-purple-400 font-mono text-[9px] uppercase animate-pulse">
                <span>🎤 Fluid Voice Channel Active</span>
                <span className="h-2 w-0.5 bg-purple-400 animate-bounce"></span>
                <span className="h-3 w-0.5 bg-purple-400 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="h-1 w-0.5 bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            )}

            {/* Input field */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask assistant to set alarm, report weather, run speed check..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
              />
              <button
                onClick={() => sendChatMessage()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase"
              >
                SUBMIT
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: TIME COMMANDS & ALARMS --- */}
        {activeTab === 'alarms' && (
          <div className="space-y-4" id="time_commands_alarms_tab">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Clocks & Stopwatch */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Clocks & Countdown Nodes</span>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Local System Clock</span>
                  <p className="text-2xl font-black font-mono text-white mt-1">
                    {time.toLocaleTimeString()}
                  </p>
                  <div className="flex gap-1 justify-center text-[8px] font-mono text-slate-400 mt-1 uppercase">
                    <span>UTC: {new Date().toUTCString().slice(17, 25)}</span>
                    <span>• Tokyo: {new Date(new Date().getTime() + 9 * 3600000).toUTCString().slice(17, 25)}</span>
                  </div>
                </div>

                {/* Countdown Countdown timer */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Countdown Alarm node</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="3600"
                      disabled={timerActive}
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                    />
                    <button
                      onClick={startCountdownTimer}
                      className="flex-1 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg uppercase"
                    >
                      {timerActive ? 'PAUSE' : 'START TIMER'}
                    </button>
                    <button
                      onClick={resetCountdownTimer}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg uppercase"
                    >
                      RESET
                    </button>
                  </div>
                  {timerTimeLeft > 0 && (
                    <p className="text-xl font-bold font-mono text-center text-orange-400 mt-2">
                      Timer count: {Math.floor(timerTimeLeft / 60)}m {timerTimeLeft % 60}s
                    </p>
                  )}
                </div>
              </div>

              {/* Alarms configuration scheduler */}
              <div className="md:col-span-7 space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Configured alarms ({alarms.length} Active)</span>

                {/* Quick Add Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={newAlarmTime}
                      onChange={(e) => setNewAlarmTime(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    />
                    <select
                      value={selectedAlarmSound}
                      onChange={(e) => setSelectedAlarmSound(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300"
                    >
                      <option value="cyber_synth.mp3">cyber_synth.mp3</option>
                      <option value="cosmic_chime.wav">cosmic_chime.wav</option>
                      <option value="alarm_bell.mp3">alarm_bell.mp3</option>
                      <option value="custom_file.wav">Custom device file</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Alarm reminder label (e.g. Rank check)"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />

                  <button
                    onClick={addAlarm}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs uppercase"
                  >
                    SAVE ALARM
                  </button>
                </div>

                {/* Alarm rows list */}
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {alarms.map(a => (
                    <div key={a.id} className="p-2 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-white">{a.time}</span>
                          <span className={`text-[8px] font-mono px-1.5 rounded uppercase ${
                            a.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500'
                          }`}>
                            {a.active ? 'Armed' : 'Muted'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.label} • {a.sound}</p>
                      </div>
                      <button
                        onClick={() => toggleAlarm(a.id)}
                        className={`px-3 py-1 text-[10px] rounded-lg font-bold cursor-pointer transition-all ${
                          a.active ? 'bg-purple-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-500'
                        }`}
                      >
                        {a.active ? 'DISABLE' : 'ENABLE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: CREATIVE MEDIA GENERATOR --- */}
        {activeTab === 'generate' && (
          <div className="space-y-4" id="creative_media_generator_tab">
            <p className="text-[11px] text-slate-400">
              Create high-fidelity graphic assets or short clips. Formulated visuals are compiled and exported straight to Google Drive folder!
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setMediaType('image')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border ${
                    mediaType === 'image'
                      ? 'bg-purple-600/15 border-purple-500 text-purple-400'
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}
                >
                  Text-To-Image
                </button>
                <button
                  onClick={() => setMediaType('video')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border ${
                    mediaType === 'video'
                      ? 'bg-purple-600/15 border-purple-500 text-purple-400'
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}
                >
                  Text-To-Video
                </button>
              </div>

              <input
                type="text"
                placeholder="Describe asset details (e.g., 'Glittering golden coin with cosmic dust nebula background')..."
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
              />

              <button
                onClick={runCreativeGeneration}
                disabled={generatingAsset}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase ${
                  generatingAsset
                    ? 'bg-slate-800 text-slate-500 animate-pulse cursor-wait'
                    : 'bg-purple-600 hover:bg-purple-500 text-white font-black'
                }`}
              >
                {generatingAsset ? `SYNTHESIZING ${mediaType.toUpperCase()}...` : 'DISPATCH CREATIVE PIPELINE'}
              </button>
            </div>

            {/* Render last generated image */}
            {lastGeneratedUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Last Compiled Visual node</span>
                <img src={lastGeneratedUrl} className="mx-auto rounded-xl max-h-32 object-cover border border-slate-800" />
                <span className="text-[8px] font-mono text-emerald-400 uppercase flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Successfully archived in Google Drive
                </span>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: VIBE CODING WORKSPACE --- */}
        {activeTab === 'vibe' && (
          <VibeCodingTab triggerNotification={triggerNotification} />
        )}
      </div>
    </div>
  );
}
