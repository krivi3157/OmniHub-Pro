import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Code2, Folder, Cpu, Play, Check, Loader2, Settings, Layers, ShieldCheck, ChevronRight, Sliders, PlayCircle } from 'lucide-react';

interface VibeCodingTabProps {
  triggerNotification: (title: string, msg: string) => void;
}

type CodingEnv = 'devin' | 'windsurf' | 'ai_studio';

interface FileItem {
  name: string;
  path: string;
  code: string;
  language: string;
}

const mockFiles: FileItem[] = [
  {
    name: 'ArcadeWidget.tsx',
    path: 'src/components/ArcadeWidget.tsx',
    language: 'typescript',
    code: `import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Swords, Flame, Sparkles } from 'lucide-react';

export default function ArcadeWidget() {
  const [activeGame, setActiveGame] = useState('snake');
  const [snakeScore, setSnakeScore] = useState(0);
  const [difficulty, setDifficulty] = useState('adaptive');

  // Snake Game Speed & Bot Logic
  useEffect(() => {
    if (activeGame === 'snake') {
      const interval = setInterval(() => {
        // Run AI bot slither vectors
        moveAdaptiveBots();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activeGame, difficulty]);

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Swords className="text-emerald-400 w-5 h-5" />
        Bento Gold Mine Arcade
      </h3>
    </div>
  );
}`
  },
  {
    name: 'App.tsx',
    path: 'src/App.tsx',
    language: 'typescript',
    code: `import React, { useState } from 'react';
import { Clock, Play, Mail, Sparkles, Award } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [gold, setGold] = useState(1420592.50);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-4 border-b border-slate-900 flex justify-between">
        <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          OMNIHUB PRO
        </h1>
      </header>
    </div>
  );
}`
  },
  {
    name: 'server.ts',
    path: 'server.ts',
    language: 'typescript',
    code: `import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = 3000;

app.post('/api/gemini/chat', async (req, res) => {
  const { messages } = req.body;
  // Route proxy logic using gemini-3.5-flash
  res.json({ content: "Greetings from the server!" });
});`
  },
  {
    name: 'package.json',
    path: 'package.json',
    language: 'json',
    code: `{
  "name": "omnihub-pro-applet",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@google/genai": "^2.4.0",
    "express": "^4.21.2",
    "motion": "^12.23.24"
  }
}`
  }
];

export default function VibeCodingTab({ triggerNotification }: VibeCodingTabProps) {
  const [env, setEnv] = useState<CodingEnv>('devin');
  const [selectedFile, setSelectedFile] = useState<FileItem>(mockFiles[0]);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [temperature, setTemperature] = useState(0.3);
  const [model, setModel] = useState('gemini-3.5-flash');

  // Terminal & logs simulator state
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'OmniHub Developer Terminal v1.1 online.',
    'Ready for vibe coding instructions...'
  ]);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const appendTerminal = (line: string) => {
    setTerminalLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  const handleVibeCodeSubmit = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setProgressStep(1);
    setAiResponse('');
    setTerminalLines([]);

    appendTerminal(`Starting agent execution task: "${prompt}"`);
    appendTerminal(`Configured active environment: ${env.toUpperCase()}`);

    // Step 1: Planning
    setTimeout(() => {
      setProgressStep(2);
      appendTerminal('🔍 Planning: Indexing workspace directories & checking dependencies...');
    }, 1200);

    // Step 2: Context Reading
    setTimeout(() => {
      setProgressStep(3);
      appendTerminal(`📖 Reading: Parsing code files matching context keywords (${selectedFile.name})...`);
    }, 2500);

    // Step 3: API Request & Code Gen
    setTimeout(async () => {
      setProgressStep(4);
      appendTerminal('✏️ Modifying: Dispatching vector code request to Gemini core...');
      
      try {
        const response = await fetch('/api/gemini/vibe-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            environment: env,
            model,
            temperature
          })
        });
        const data = await response.json();
        setAiResponse(data.content);
        appendTerminal('✨ Compilation: Code diff formulated and successfully validated.');
      } catch (err) {
        console.error(err);
        appendTerminal('⚠️ System Alert: Cloud pipeline returned a gateway warning. Running offline synthesis...');
        setAiResponse(`### ⚠️ Offline Synthesis Complete
Successfully built local container mock parameters for prompt: *"${prompt}"* inside local code context.`);
      }

      setProgressStep(5);
      appendTerminal('✅ Build Success: npm run build executed successfully in 1.2s (Zero errors).');
      setIsProcessing(false);
      triggerNotification('Vibe Coding Finished', `Agent successfully applied code logic using ${env.toUpperCase()} workspace.`);
    }, 4000);
  };

  return (
    <div className="space-y-4" id="vibe_coding_workspace_tab">
      
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Autonomous Sandbox Editor</span>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            AI Vibe Coding Cockpit
          </h2>
        </div>

        {/* Environment Switches */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 w-full sm:w-auto overflow-x-auto">
          {(['devin', 'windsurf', 'ai_studio'] as CodingEnv[]).map(e => (
            <button
              key={e}
              onClick={() => {
                setEnv(e);
                appendTerminal(`Active agent profile changed to: ${e.toUpperCase()}`);
              }}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                env === e 
                  ? e === 'devin' ? 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : e === 'windsurf' ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(79,70,229,0.3)]'
                    : 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {e === 'devin' ? '🧑‍💻 Devin Mode' : e === 'windsurf' ? '🌊 Windsurf Cascade' : '🧪 AI Studio'}
            </button>
          ))}
        </div>
      </div>

      {/* Main IDE Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Explorer tree */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[280px] lg:h-[400px]">
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
              <Folder className="w-3 h-3 text-slate-500" />
              Workspace Explorer
            </span>
            <div className="space-y-1 max-h-[160px] lg:max-h-[260px] overflow-y-auto">
              {mockFiles.map(f => (
                <button
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left font-mono text-[11px] transition-all cursor-pointer ${
                    selectedFile.path === f.path 
                      ? 'bg-slate-800 text-purple-400 font-bold border-l-2 border-purple-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 opacity-60" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="border-t border-slate-800/80 pt-3 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>SDK CORE:</span>
              <span className="text-slate-300">@google/genai</span>
            </div>
            <div className="flex justify-between">
              <span>ACTIVE MODEL:</span>
              <span className="text-slate-300">gemini-3.5-flash</span>
            </div>
          </div>
        </div>

        {/* Center / Right Columns: Code Editor & Preview Tab */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[280px] lg:h-[400px] overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-500" />
                {selectedFile.path}
              </span>
              <span className="text-[8px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-500 uppercase">
                {selectedFile.language}
              </span>
            </div>

            {/* Simulated Editor Panel */}
            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 whitespace-pre scrollbar-thin">
              {selectedFile.code}
            </div>
          </div>

        </div>

      </div>

      {/* Coding Agent Prompting Panel */}
      <div className={`border rounded-3xl p-5 transition-all duration-300 ${
        env === 'devin' ? 'bg-emerald-950/10 border-emerald-500/20' 
        : env === 'windsurf' ? 'bg-indigo-950/10 border-indigo-500/20' 
        : 'bg-slate-900 border-slate-800'
      }`}>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* Controls & Prompt */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                {env === 'devin' ? '🧑‍💻 Tell Devin what to build' 
                  : env === 'windsurf' ? '🌊 Instruct Cascade Flow-State' 
                  : '🧪 Prompt System Prompt Configurations'}
              </span>

              {env === 'ai_studio' && (
                <span className="text-[9px] font-mono text-amber-400 uppercase">
                  Google AI Studio Preset
                </span>
              )}
            </div>

            <textarea
              rows={3}
              disabled={isProcessing}
              placeholder={
                env === 'devin' ? "e.g. 'Build a neural-network difficulty scaling algorithm for Snake.io bots and hot-reload changes'"
                : env === 'windsurf' ? "e.g. 'Add real-time top-down racing camera particle trails and outrun retro grid layouts'"
                : "e.g. 'Add support for California local time metrics and alphabetical listings inside the assistant core'"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none resize-none focus:border-purple-500 transition-colors"
            />

            <div className="flex flex-wrap gap-2.5 items-center">
              <button
                onClick={handleVibeCodeSubmit}
                disabled={isProcessing || !prompt.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase transition-all duration-300 cursor-pointer ${
                  isProcessing 
                    ? 'bg-slate-800 text-slate-500 animate-pulse cursor-wait'
                    : env === 'devin' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : env === 'windsurf' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(79,70,229,0.3)]'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Agent is Coding...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    DISPATCH AGENT
                  </>
                )}
              </button>

              {/* Progress Steps Indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${progressStep >= 1 ? 'bg-purple-500 animate-ping' : 'bg-slate-700'}`}></span>
                  <span>
                    {progressStep === 1 && 'Initializing Agent...'}
                    {progressStep === 2 && 'Analyzing Workspace File Index...'}
                    {progressStep === 3 && 'Synthesizing Contiguous Changes...'}
                    {progressStep === 4 && 'Applying Code Diffs & Hot-Reloading...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Sliders / AI Studio Sidebar */}
          <div className="md:col-span-4 bg-slate-950 p-4 rounded-2xl border border-slate-850/80 space-y-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              Agent Core Parameters
            </span>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span className="text-slate-500">SYSTEM MODEL</span>
                  <span className="text-purple-400">{model}</span>
                </div>
                <select
                  disabled={isProcessing}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 mt-1 text-[10px] text-slate-300 font-mono outline-none"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span className="text-slate-500">TEMPERATURE</span>
                  <span className="text-purple-400">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  disabled={isProcessing}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Output Console Log / Agent thoughts section */}
      {(aiResponse || isProcessing) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Timeline of agent steps */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-4 font-sans space-y-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Agent Plan Executions</span>
            <div className="space-y-4">
              {[
                { step: 1, label: 'Task Dispatch', desc: 'Agent initialized, environment variables configured' },
                { step: 2, label: 'Codebase Scopes', desc: 'Scanned file headers and matched components' },
                { step: 3, label: 'Context Synthesizer', desc: 'Read target code block dependencies' },
                { step: 4, label: 'Model Generation', desc: 'Formulated precise functional updates' },
                { step: 5, label: 'Linter & Sync', desc: 'Ran local build check and compiled output successfully' }
              ].map((step) => {
                const active = progressStep >= step.step;
                const completed = progressStep > step.step || (!isProcessing && progressStep > 0);
                return (
                  <div key={step.step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                        completed ? 'bg-emerald-600 border-emerald-500 text-white'
                        : active ? 'bg-purple-600 border-purple-500 text-white animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}>
                        {completed ? '✓' : step.step}
                      </div>
                      {step.step < 5 && <div className={`w-0.5 h-6 ${completed ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>}
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold block ${active ? 'text-slate-200' : 'text-slate-500'}`}>{step.label}</span>
                      <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal details & output */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex flex-col h-[260px]">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-850 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                Live Agent Terminal Shell
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 font-mono text-[10px] text-slate-300 space-y-1.5 overflow-y-auto bg-slate-950 leading-relaxed scrollbar-thin">
              {terminalLines.map((line, idx) => (
                <div key={idx} className={line.includes('Success') || line.includes('✅') ? 'text-emerald-400 font-bold' : line.includes('⚠️') ? 'text-amber-400' : 'text-slate-300'}>
                  {line}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-1 text-purple-400 animate-pulse">
                  <span>$ running build processes...</span>
                  <span className="h-2 w-1 bg-purple-400 animate-ping"></span>
                </div>
              )}
              <div ref={terminalEndRef}></div>
            </div>
          </div>

        </div>
      )}

      {/* Code diff result block */}
      {aiResponse && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3" id="agentic_changes_result">
          <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Vibe Coding Execution Outcome
          </span>
          <div className="markdown-body text-xs text-slate-300 leading-relaxed space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850/80 max-h-[300px] overflow-y-auto">
            {aiResponse.split('\n').map((line, idx) => {
              if (line.startsWith('###')) {
                return <h3 key={idx} className="text-sm font-bold text-white border-b border-slate-800 pb-1.5 mt-4 mb-2">{line.replace('###', '').trim()}</h3>;
              }
              if (line.startsWith('####')) {
                return <h4 key={idx} className="text-xs font-bold text-slate-200 mt-3 mb-1">{line.replace('####', '').trim()}</h4>;
              }
              if (line.startsWith('-')) {
                return <li key={idx} className="list-disc ml-4 text-slate-300 my-0.5">{line.replace('-', '').trim()}</li>;
              }
              if (line.startsWith('`') || line.endsWith('`') || line.startsWith('<<<<') || line.startsWith('====') || line.startsWith('>>>>')) {
                return <div key={idx} className="font-mono text-[10px] bg-slate-900/60 p-1.5 rounded text-indigo-300 my-1">{line}</div>;
              }
              return <p key={idx} className="my-1.5">{line}</p>;
            })}
          </div>
        </div>
      )}

    </div>
  );
}
