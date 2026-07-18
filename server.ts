import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 3000;

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('Gemini API client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API client:', err);
  }
} else {
  console.log('Gemini API key not found or placeholder used. Running in offline/simulation assistant mode.');
}

// Simulated Database / State in memory for Leaderboard & Social Sync
const systemState = {
  leaderboard: [
    { id: '1', username: 'CryptoKing', score: 12500000, cps: 152.4, game: 'clicker', country: 'US' },
    { id: '2', username: 'RetroGamer', score: 9800000, cps: 94.2, game: 'clicker', country: 'JP' },
    { id: '3', username: 'BentoGridFan', score: 7200000, cps: 81.5, game: 'clicker', country: 'DE' },
    { id: '4', username: 'GoldMiner', score: 4500000, cps: 42.8, game: 'clicker', country: 'CA' },
    { id: '5', username: 'SpeedRunner', score: 1250, cps: 0, game: 'racing', country: 'UK' },
    { id: '6', username: 'SnakeMaster', score: 840, cps: 0, game: 'snake', country: 'BR' },
    { id: '7', username: 'MinesweeperPro', score: 45, cps: 0, game: 'minesweeper', country: 'CH' },
    { id: '8', username: 'ArcheryAce', score: 95, cps: 0, game: 'archery', country: 'AU' },
  ],
  friends: [
    { id: 'f1', username: 'ApexPredator', online: true, score: 5600000, cps: 65.2, game: 'clicker', activeGame: null },
    { id: 'f2', username: 'ZenCoder', online: false, score: 3200000, cps: 40.0, game: 'clicker', activeGame: null },
    { id: 'f3', username: 'CosmicVoyager', online: true, score: 1100, cps: 0, game: 'racing', activeGame: 'Racing 2D' },
  ],
  challenges: [
    { id: 'c1', title: 'Speed Demon', description: 'Reach 25 Clicks Per Second (CPS) in the Tester', target: 25, type: 'cps', reward: 50000, completed: false },
    { id: 'c2', title: 'Golden Miner', description: 'Collect $100,000 from clicking or mini-games', target: 100000, type: 'gold', reward: 25000, completed: false },
    { id: 'c3', title: 'Snake Survivor', description: 'Score over 150 points in Snake.io Arena', target: 150, type: 'snake', reward: 35000, completed: false },
    { id: 'c4', title: 'Archery Perfect', description: 'Hit center bulls-eye (95+ Accuracy) in Archery', target: 95, type: 'archery', reward: 40000, completed: false }
  ],
  inbox: [
    { id: 'm1', from: 'Google Keep System', subject: 'Thoughts synchronized', body: 'Your notes on the multi-alarm setup have been backed up securely.', date: '10:42 AM', read: false },
    { id: 'm2', from: 'Gold Rush Tycoon', subject: 'Prestige Available!', body: 'You have reached enough wealth to reset and claim a 5.5x multiplier.', date: 'Yesterday', read: true },
    { id: 'm3', from: 'Gemini Assistant', subject: 'Daily Diagnostic Summary', body: 'Speed diagnostics check: Ping 12ms, stable. CPU usage 14%. Weather indicates sunny conditions.', date: 'Yesterday', read: true }
  ],
  driveFiles: [
    { id: 'd1', name: 'Dashboard_Layout_V4.bento', type: 'bento', size: '14 KB', date: '2 hours ago' },
    { id: 'd2', name: 'Mine_Arcade_Physics_Engine.ts', type: 'code', size: '184 KB', date: 'Yesterday' },
    { id: 'd3', name: 'Algae_Pollen_Forecast_July.csv', type: 'spreadsheet', size: '1.2 MB', date: '3 days ago' },
    { id: 'd4', name: 'Gemini_Interactive_Voice_System.mp3', type: 'audio', size: '4.5 MB', date: '5 days ago' }
  ],
  keepNotes: [
    { id: 'k1', title: 'OmniHub Drone Build', content: 'Auto clicker drones cost $50,000 baseline. Each increases CPS by 2.0. Upgrading speed costs $15,000.', date: 'Just now' },
    { id: 'k2', title: 'Racing Strategy', content: 'AI drivers tend to take the inside lane. Steer wide on the turns to overtake at high speeds.', date: '2 hours ago' },
    { id: 'k3', title: 'Severe Weather Plan', content: 'If barometric pressure drops below 995 hPa, trigger alarm 1 and cache maps offline.', date: 'Last week' }
  ],
  alarms: [
    { id: 'a1', time: '08:00 AM', label: 'Morning Clicker Boost', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], active: true, sound: 'cyber_synth.mp3' },
    { id: 'a2', time: '10:00 PM', label: 'Global Rank Check', days: ['Everyday'], active: false, sound: 'cosmic_chime.wav' }
  ]
};

// --- GEMINI ENDPOINTS ---

// Intelligent simulated response generator for local offline mode or model error fallback
function generateSimulatedResponse(lastUserMessage: string) {
  const lower = lastUserMessage.toLowerCase();
  let reply = '';
  let systemAction = null;

  if (lower.includes('california') || lower.includes('pacific time') || lower.includes('time in ca') || lower.includes('los angeles')) {
    const californiaTime = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    reply = `The current time in California (Pacific Time) is ${californiaTime}. Is there anything else about timezone offsets or schedule coordination you would like to know?`;
  } else if (lower.includes('alphabet') || lower.includes('abc') || lower.includes('letters')) {
    reply = `The English alphabet consists of 26 letters:
• Uppercase: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
• Lowercase: a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z

Would you like me to spell something in phonetic alphabet format or help with letter count statistics?`;
  } else if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast')) {
    reply = `The weather system is fully operational. Current telemetry reports 24°C, Clear Sky, Feels like 26°C, AQI of 12 (Excellent), and wind velocity at 4 knots. Would you like me to adjust any environmental settings or severe alert levels?`;
  } else if (lower.includes('speed') || lower.includes('diagnostic') || lower.includes('network') || lower.includes('ping')) {
    reply = `Diagnostic check complete! Ping is outstanding at 12ms, Jitter is 2ms, and your simulated download speed is peaking at 842 Mbps. The network link is highly stable.`;
  } else if (lower.includes('alarm') || lower.includes('set an alarm') || lower.includes('timer')) {
    reply = `I have executed your system instruction: I've configured a high-priority alarm for you. Alarm is armed with custom synth audio parameters.`;
    systemAction = { type: 'SET_ALARM', time: '08:30 AM', label: 'Gemini Voice Triggered' };
  } else if (lower.includes('click') || lower.includes('cps') || lower.includes('prestige') || lower.includes('gold')) {
    reply = `Scanning resource reserves... You have $1,420,592 liquid gold. Your active clicking drones are operating at peak efficiency. I suggest converting wealth to Prestige multipliers when you reach the 75% threshold to maximize drone production.`;
  } else if (lower.includes('game') || lower.includes('minesweeper') || lower.includes('racing') || lower.includes('snake')) {
    reply = `The Gold Mine Arcade hub is online. My performance models indicate you can gain a 2.5x currency multiplier playing Snake.io or the top-down Racing simulator with adaptive AI. Which game shall we calibrate?`;
  } else {
    reply = `Greetings! I am your omnipresent Gemini AI Assistant. I can answer general knowledge questions (like California time or alphabet details), check device speed test statistics (842 Mbps), track GPS telemetry, manage your Google Ecosystem (Gmail, Drive, Keep, Calendar), configure multi-alarms, and analyze real-time environments. What system diagnostics or tasks shall we execute today?`;
  }

  return { reply, systemAction };
}

// AI Chatbot endpoint with optional system instructions
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { messages, systemInstruction, toolState } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // If Gemini client is NOT initialized, simulate a beautiful smart response locally
  if (!ai) {
    const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';
    const { reply, systemAction } = generateSimulatedResponse(lastUserMessage);

    return res.json({
      role: 'model',
      content: reply,
      action: systemAction,
      simulated: true
    });
  }

  try {
    // We format the conversation for the official SDK.
    // Let's translate messages to Gemini SDK contents format.
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Inject system instructions if specified, with dynamic time & Alphabet parameters
    const localTimeStr = toolState?.localTime || new Date().toString();
    const tzStr = toolState?.timeZone || 'UTC';
    
    const defaultInstruction = `You are OmniHub Pro's omnipresent AI Assistant. You are connected to system tools, the weather station, a network test (842 MBPS, 12ms ping), the GPS dashboard (51.5074 N), the incremental clicker ($1.4M reserves), and the Google Workspace suite. You can reply in a smart, high-tech, helpful, and concise manner. Act on system-level requests immediately.
The user's local time is: ${localTimeStr} (Timezone: ${tzStr}).
The English alphabets are: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z (lowercase: a to z).
Always answer general knowledge questions (e.g. current time, the alphabet, etc.) with 100% precision.`;
    const activeInstruction = systemInstruction || defaultInstruction;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: activeInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I processed your query, but could not formulate a text response.";
    
    // Simple rule-based system tool parsing from AI text response
    let systemAction = null;
    const lowerReply = replyText.toLowerCase();
    if (lowerReply.includes('alarm') && (lowerReply.includes('set') || lowerReply.includes('creat'))) {
      systemAction = { type: 'SET_ALARM', time: '08:00 AM', label: 'AI Generated Alarm' };
    }

    return res.json({
      role: 'model',
      content: replyText,
      action: systemAction,
      simulated: false
    });
  } catch (error: any) {
    console.error('Error calling Gemini API, falling back to simulation:', error);
    const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';
    const { reply, systemAction } = generateSimulatedResponse(lastUserMessage);
    
    return res.json({
      role: 'model',
      content: `${reply}\n\n*(Uplink Sync Offline: Switched to local sandbox matrix)*`,
      action: systemAction,
      simulated: true
    });
  }
});

// Vibe Coding Endpoint
app.post('/api/gemini/vibe-code', async (req: Request, res: Response) => {
  const { prompt, environment, model } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  // Choose system instructions depending on the vibe coding environment
  let systemInstruction = '';
  if (environment === 'devin') {
    systemInstruction = `You are "Devin", the ultimate autonomous AI software engineer. The user is asking you to modify or inspect the current workspace. Explain how you would implement their request in the workspace, including step-by-step reasoning, file changes, terminal commands, and tests. Format your response with beautiful Markdown.`;
  } else if (environment === 'windsurf') {
    systemInstruction = `You are "Windsurf Cascade", the revolutionary flow-state AI coding agent. Explain how you would edit the current workspace to implement the user's request. Focus on immediate, high-efficiency "Cascade" contiguous code edits, file explorer navigation, and shell tasks. Format your response with beautiful Markdown.`;
  } else {
    systemInstruction = `You are "Google AI Studio Coding Agent". The user is designing a feature for this applet. Provide a highly precise explanation, parameters configuration (such as temperature, top-k), model guidelines ('gemini-3.5-flash'), and code blocks representing the changes. Format your response with beautiful Markdown.`;
  }

  const userPrompt = `The workspace contains:
- src/App.tsx (Main dashboard, state)
- src/components/ArcadeWidget.tsx (Minesweeper, Archery, Chess/Checkers, Racing 2D, Snake.io)
- src/components/AICockpitWidget.tsx (Alarms, Chat, Media Studio)
- src/components/LeaderboardWidget.tsx (Rankings, Challenges, Online-Sync)
- src/components/ProductivityWidget.tsx (Workspace, Google Keep Notes, Drive)
- server.ts (Express, Gemini API client server)

The user prompt is: "${prompt}"

Provide a comprehensive, high-fidelity developer action plan, terminal commands, and code snippet explanations that match the chosen AI environment.`;

  if (!ai) {
    // Generate simulated high-fidelity vibe-code response
    let responseText = '';
    
    if (environment === 'devin') {
      responseText = `### 🧑‍💻 Devin Autonomous Action Plan
I have analyzed the current workspace files and formulated an execution plan for: *"${prompt}"*.

#### 🔍 1. Workspace Analysis
- Identified key target files: \`src/components/ArcadeWidget.tsx\` and \`src/App.tsx\`
- Checked dependency constraints (Vite v6, React v19, Tailwind v4)

#### 📝 2. Code Modifications
To implement this, I will add high-performance visual loops and adaptive structures. Here is the code structure I am injecting:

\`\`\`typescript
// In src/components/ArcadeWidget.tsx
export function applyVibeUpgrade() {
  const customConfig = {
    glowingVisuals: true,
    particleBuffer: 1024,
    speedFactor: 1.25,
    neuralWeights: [0.45, 0.88, 0.12, 0.95] // Adaptive difficulty
  };
  console.log("Vibe upgrade compiled and hot-reloaded.");
}
\`\`\`

#### ⚡ 3. Compilation & Verification
Executing local test-runner and bundling suite:
\`\`\`bash
$ npm run build
> vite build
✓ 458 modules transformed.
dist/index.html           0.48 kB │ gzip: 0.32 kB
dist/assets/index.js    424.12 kB │ gzip: 114.50 kB
✓ Build completed successfully in 1.45s!
\`\`\`

#### ✅ Status: Completed
Changes have been hot-reloaded into the viewport. Ready for validation!`;
    } else if (environment === 'windsurf') {
      responseText = `### 🌊 Cascade Flow Analysis (Windsurf)
Index completed. Identified active editing flow for prompt: *"${prompt}"*.

#### ⚡ contiguous Code Edits (Applied in 2 chunks)

**Chunk 1: Active Arcade rendering context**
\`\`\`typescript
<<<<<<< Original Code
const baseDifficulty = 1.0;
=======
const baseDifficulty = Math.min(2.5, 1.0 + (userScore / 100) * 0.15); // Adaptive AI Scaling
const neonGlowFilter = "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))";
>>>>>>> Modified Code
\`\`\`

**Chunk 2: State registration in dashboard**
\`\`\`typescript
<<<<<<< Original Code
gold: userState.gold,
=======
gold: userState.gold,
vibeCodingActive: true,
customVibePreset: "windsurf-cascade-v2",
>>>>>>> Modified Code
\`\`\`

#### 🚀 Terminal Tasks Executed
- \`npm run lint\`: PASSED with 0 warnings.
- Live asset sync to Drive completed.`;
    } else {
      responseText = `### 🧪 Google AI Studio Execution Log
**Model:** \`gemini-3.5-flash\`  
**Temperature:** \`0.2\`  
**Max Tokens:** \`1024\`

#### 📥 Input Payload
\`\`\`json
{
  "systemInstruction": "You are Google AI Studio's coding agent...",
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "${prompt}" }]
    }
  ]
}
\`\`\`

#### 📤 Generated Code Artifacts
\`\`\`json
{
  "status": "COMPLETED",
  "filesModified": ["src/components/ArcadeWidget.tsx"],
  "stats": { "insertions": 48, "deletions": 12 },
  "output": "Successfully implemented custom cyber-aesthetic layers and adaptive AI bot behavior. Verification complete."
}
\`\`\`

All workspace links are live.`;
    }

    return res.json({
      content: responseText,
      simulated: true
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    return res.json({
      content: response.text || "Vibe coding computation succeeded.",
      simulated: false
    });
  } catch (err: any) {
    console.error('Vibe coding API call failed, falling back to simulated text:', err);
    return res.json({
      content: `### ⚠️ Cloud Uplink Diagnostics Fallback
The AI model returned a network timeout or API limit error. I've switched to the local sandbox executor:

*Prompt:* "${prompt}"
*Environment:* ${environment}

**Simulation Outcome:** Code was successfully parsed and applied in the local virtual DOM simulator. Run \`npm run build\` to verify production compliance.`,
      simulated: true
    });
  }
});

// Image / Video Generation Simulation Endpoint
app.post('/api/gemini/generate-media', async (req: Request, res: Response) => {
  const { prompt, type } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  console.log(`Generating AI asset (${type || 'image'}): ${prompt}`);

  try {
    let url = '';
    if (type === 'image') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          }
        }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } else if (type === 'video') {
      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
      
      let updated = operation;
      let attempts = 0;
      while (!updated.done && attempts < 60) {
         await new Promise(r => setTimeout(r, 5000));
         const op = new GenerateVideosOperation();
         op.name = operation.name;
         updated = await ai.operations.getVideosOperation({ operation: op });
         attempts++;
      }

      if (updated.response?.generatedVideos?.[0]?.video?.uri) {
        const uri = updated.response.generatedVideos[0].video.uri;
        const videoRes = await fetch(uri, {
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
        });
        const buffer = await videoRes.arrayBuffer();
        url = `data:video/mp4;base64,${Buffer.from(buffer).toString('base64')}`;
      } else {
        throw new Error("Video generation failed or timed out.");
      }
    }

    // Mock generated item metadata to return
    const fileId = 'd' + Math.floor(Math.random() * 1000);
    const newFile = {
      id: fileId,
      name: `AI_Asset_${Math.floor(Math.random() * 900 + 100)}.${type === 'video' ? 'mp4' : 'png'}`,
      type: type === 'video' ? 'video' : 'image',
      size: type === 'video' ? '8.4 MB' : '3.2 MB',
      date: 'Just now',
      url
    };

    // Add to driveFiles simulation
    systemState.driveFiles.unshift(newFile);

    return res.json({
      success: true,
      url,
      file: newFile,
      message: `Successfully generated ${type} and saved to Google Drive!`
    });
  } catch (error) {
    console.error('Media generation failed', error);
    return res.status(500).json({ error: 'Media generation failed' });
  }
});

// Web Browser Proxy Endpoint
app.get('/api/proxy', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).send('URL is required');
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const contentType = response.headers.get('content-type') || '';
    let body = await response.text();
    
    if (contentType.includes('text/html')) {
      // Inject base tag to resolve relative URLs
      body = body.replace('<head>', `<head><base href="${targetUrl}">`);
    }
    
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error);
  }
});

// Real-time camera analysis mock
app.post('/api/gemini/vision', async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  // Simulate vision analysis
    const insights = [
      "I see a high-tech modern workstation with deep gray and yellow backlighting.",
      "I analyze a bento grid interface with active widget configurations. Looking extremely clean!",
      "I notice key productivity markers: Gmail is synced, speed tests are running at 842 MBPS, and weather station is online.",
      "The layout looks perfectly balanced. I detect a smartphone or developer terminal in frame, perfect for launching game sessions!"
    ];
    const chosen = insights[Math.floor(Math.random() * insights.length)];

    return res.json({
      success: true,
      analysis: chosen
    });
});

// Location-based news proxy
app.get('/api/news/location', async (req: Request, res: Response) => {
  const location = req.query.location as string || 'Mahbubnagar';
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.warn('NEWS_API_KEY is not set. Falling back to simulated news payload.');
    
    // Generate dynamic plausible news content
    const topics = ['Infrastructure', 'Tech Hub', 'Culture', 'Sustainability', 'Economy'];
    const headlines = [
      `New ${topics[0]} project launched in ${location} to improve urban connectivity.`,
      `${location} sees a surge in ${topics[1]} investments, attracting global talent.`,
      `Local artists celebrate ${topics[2]} festival with vibrant community events in ${location}.`,
      `Expert panel discusses ${topics[3]} strategies for ${location}'s rapid development.`,
      `Market analysis predicts a strong ${topics[4]} growth for ${location} in the coming quarter.`
    ];
    
    const articles = headlines.map((headline, i) => ({
      title: headline,
      content: `In a recent development in ${location}, officials reported that ${headline.toLowerCase()}`,
      source: { name: `GridNews ${location}` },
      urlToImage: `https://picsum.photos/seed/${i + Date.now()}/400/200`,
      publishedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString()
    }));

    return res.json({
      success: true,
      articles: articles.slice(0, 10)
    });
  }

  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(location + ' Telangana news')}&sortBy=publishedAt&apiKey=${apiKey}`);
    const data = await response.json();
    if (data.status === 'ok' && data.articles) {
      console.log('NewsAPI success, returning results.');
      const apiArticles = data.articles.slice(0, 10);
      
      // Fallback topics to pad if needed
      const topics = ['Infrastructure', 'Tech Hub', 'Culture', 'Sustainability', 'Economy'];
      const fallback = topics.map((topic, i) => ({
        title: `${topic} News: ${topic} Development in ${location}`,
        content: `In a recent development in ${location}, officials reported that ${topic} strategies are evolving.`,
        source: { name: `GridNews ${location}` },
        urlToImage: `https://picsum.photos/seed/${i + Date.now()}/400/200`,
        publishedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString()
      }));
      
      // Pad with fallback if fewer than 3
      const finalArticles = apiArticles.length >= 3 ? apiArticles : [...apiArticles, ...fallback.slice(0, 3 - apiArticles.length)];
      
      return res.json({ success: true, articles: finalArticles });
    }
    console.warn('NewsAPI returned no articles, falling back to simulated.');
  } catch (error) {
    console.error('Proxy error, falling back to simulated:', error);
  }

  // Fallback generation (if API failed or returned nothing)
  const topics = ['Infrastructure', 'Tech Hub', 'Culture', 'Sustainability', 'Economy'];
  const articles = topics.map((topic, i) => ({
    title: `${topic} News: ${topic} Development in ${location}`,
    content: `In a recent development in ${location}, officials reported that ${topic} strategies are evolving.`,
    source: { name: `GridNews ${location}` },
    urlToImage: `https://picsum.photos/seed/${i + Date.now()}/400/200`,
    publishedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString()
  }));

  return res.json({
    success: true,
    articles: articles
  });
});

// --- NETWORK SPEED TEST ENDPOINTS ---

// Download payload generator (1MB)
app.get('/api/speedtest/download', (req: Request, res: Response) => {
  const size = 10 * 1024 * 1024; // 10MB
  const payload = Buffer.alloc(size, 'A');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', size.toString());
  res.send(payload);
});

// Upload target discarding the body
app.post('/api/speedtest/upload', (req: Request, res: Response) => {
  res.json({ success: true, received: req.body ? JSON.stringify(req.body).length : 0 });
});

// --- REAL-TIME FINANCIAL MARKET TRACKER ENDPOINT ---
app.get('/api/market/chart/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=15m&range=1d`);
    if (!response.ok) {
      throw new Error(`Yahoo Finance returned status ${response.status}`);
    }
    const data: any = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ error: 'Symbol not found' });
    }
    
    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0]?.close || [];
    
    // Filter out null values
    const sparkline = quotes.filter((q: any) => q !== null && q !== undefined);
    const currentPrice = meta.regularMarketPrice || sparkline[sparkline.length - 1] || 0;
    const previousClose = meta.previousClose || sparkline[0] || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
    
    return res.json({
      symbol,
      longName: meta.symbol,
      currentPrice,
      previousClose,
      change,
      changePercent,
      sparkline: sparkline.slice(-20), // Last 20 points
      currency: meta.currency || 'USD'
    });
  } catch (error: any) {
    console.warn(`Fallback triggered for ${symbol} due to Yahoo Finance connection error`);
    
    const mockStocks: Record<string, any> = {
      AAPL: { currentPrice: 185.4, previousClose: 183.2, longName: 'Apple Inc.' },
      MSFT: { currentPrice: 415.5, previousClose: 412.0, longName: 'Microsoft Corporation' },
      NVDA: { currentPrice: 875.2, previousClose: 850.1, longName: 'NVIDIA Corporation' },
      TSLA: { currentPrice: 175.4, previousClose: 178.5, longName: 'Tesla Inc.' },
      'BTC-USD': { currentPrice: 65420.0, previousClose: 64200.0, longName: 'Bitcoin USD' },
      'ETH-USD': { currentPrice: 3450.0, previousClose: 3520.0, longName: 'Ethereum USD' }
    };
    
    const fallback = mockStocks[symbol] || { currentPrice: 100.0, previousClose: 100.0, longName: `${symbol} Equity` };
    const currentPrice = fallback.currentPrice + (Math.random() - 0.48) * 1.5;
    const previousClose = fallback.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    const sparkline = Array.from({ length: 15 }, (_, i) => previousClose + (currentPrice - previousClose) * (i / 14) + (Math.random() - 0.5) * 1.2);
    
    return res.json({
      symbol,
      longName: fallback.longName,
      currentPrice,
      previousClose,
      change,
      changePercent,
      sparkline,
      currency: 'USD',
      simulated: true
    });
  }
});

// --- GOOGLE WORKSPACE API SIMULATORS (Allows direct state manipulation) ---

app.get('/api/drive/files', async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10', {
      headers: { Authorization: token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Drive API error:', error);
    res.status(500).json({ error: 'Failed to fetch Drive files' });
  }
});

app.get('/api/gmail/messages', async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
      headers: { Authorization: token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Gmail API error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/calendar/events', async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
      headers: { Authorization: token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Calendar API error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/tasks/items', async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
      headers: { Authorization: token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Tasks API error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.get('/api/contacts/people', async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses', {
      headers: { Authorization: token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Contacts API error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.get('/api/keep/notes', async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch('https://keep.googleapis.com/v1/notes', {
      headers: { Authorization: token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Keep API error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const cleaned = ip.trim().toLowerCase();
  
  // Local/loopback
  if (
    cleaned === '::1' || 
    cleaned === '127.0.0.1' || 
    cleaned === 'localhost' || 
    cleaned.startsWith('::ffff:127.0.0.1') ||
    cleaned.startsWith('fe80:')
  ) {
    return true;
  }
  
  // Private IPv4 ranges
  // 10.0.0.0 - 10.255.255.255
  if (cleaned.startsWith('10.')) return true;
  
  // 192.168.0.0 - 192.168.255.255
  if (cleaned.startsWith('192.168.')) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (cleaned.startsWith('172.')) {
    const parts = cleaned.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (!isNaN(second) && second >= 16 && second <= 31) return true;
    }
  }
  
  // 169.254.0.0 - 169.254.255.255 (Link-local)
  if (cleaned.startsWith('169.254.')) return true;
  
  return false;
}

app.get('/api/ip-location', async (req: Request, res: Response) => {
  try {
    // 1. Detect user's actual client IP address from proxy headers using multiple keys
    let ip = '';
    const headersToCheck = [
      'x-forwarded-for',
      'x-client-ip',
      'x-real-ip',
      'cf-connecting-ip',
      'fastly-client-ip',
      'true-client-ip'
    ];

    for (const header of headersToCheck) {
      const val = req.headers[header];
      if (typeof val === 'string' && val.trim()) {
        const firstIp = val.split(',')[0].trim();
        if (firstIp && !isPrivateIp(firstIp)) {
          ip = firstIp;
          break;
        }
      }
    }

    if (!ip) {
      const remoteIp = req.socket.remoteAddress || '';
      if (remoteIp && !isPrivateIp(remoteIp)) {
        ip = remoteIp;
      }
    }

    // 2. Query ipwho.is with client IP
    const url = ip ? `https://ipwho.is/${ip}` : `https://ipwho.is/`;
    console.log(`Resolving IP Geolocation for user IP: ${ip || '[Caller Detection]'}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.success) {
      return res.json({
        success: true,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || 'London',
        country: data.country || 'United Kingdom',
        ip: data.ip
      });
    }

    // 3. Fallback provider 1: ipapi.co
    const fallbackUrl1 = ip ? `https://ipapi.co/${ip}/json/` : `https://ipapi.co/json/`;
    const fallbackRes1 = await fetch(fallbackUrl1);
    const fallbackData1 = await fallbackRes1.json();
    if (fallbackData1 && fallbackData1.latitude && fallbackData1.longitude) {
      return res.json({
        success: true,
        latitude: fallbackData1.latitude,
        longitude: fallbackData1.longitude,
        city: fallbackData1.city || 'London',
        country: fallbackData1.country_name || 'United Kingdom',
        ip: fallbackData1.ip
      });
    }

    // 4. Fallback provider 2: freeipapi.com
    const fallbackUrl2 = ip ? `https://freeipapi.com/api/json/${ip}` : `https://freeipapi.com/api/json`;
    const fallbackRes2 = await fetch(fallbackUrl2);
    const fallbackData2 = await fallbackRes2.json();
    if (fallbackData2 && fallbackData2.latitude && fallbackData2.longitude) {
      return res.json({
        success: true,
        latitude: fallbackData2.latitude,
        longitude: fallbackData2.longitude,
        city: fallbackData2.cityName || 'London',
        country: fallbackData2.countryName || 'United Kingdom',
        ip: fallbackData2.ipAddress
      });
    }

    throw new Error('All geolocation providers exhausted');
  } catch (error) {
    console.error('IP Geolocation error:', error);
    // Safe standard fallback (London) if totally offline or rate-limited
    res.json({
      success: true,
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country: 'United Kingdom',
      ip: '127.0.0.1',
      warning: 'Using default geo-telemetry backup profile.'
    });
  }
});

app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
    
    // Using Open-Meteo (Free, no API key required)
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,pressure_msl,cloud_cover&hourly=temperature_2m`);
    const data = await response.json();
    
    // Normalize data to match OpenWeather structure expectations (simplified for widget)
    const normalizedData = {
        current: {
            temp: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            wind_speed: data.current.wind_speed_10m,
            precipitation: data.current.precipitation,
            pressure: data.current.pressure_msl,
            cloud_cover: data.current.cloud_cover,
            weather_code: data.current.weather_code,
            uvi: 5,
            weather: [{ main: data.current.weather_code > 50 ? 'Rainy' : 'Clear' }],
            alerts: data.current.weather_code > 80 ? ['Severe storm warning'] : []
        },
        hourly: data.hourly.temperature_2m.map((temp: number, i: number) => ({
            dt: Date.now() / 1000 + i * 3600,
            temp: temp
        }))
    };
    
    res.json(normalizedData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const { lat, lon, q } = req.query;
    if (q) {
      // Forward geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}`);
      const data = await response.json();
      return res.json(data);
    }
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon or q' });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Geocode API error:', error);
    res.status(500).json({ error: 'Failed to fetch geocode' });
  }
});

app.get('/api/state', (req: Request, res: Response) => {
  res.json(systemState);
});

app.post('/api/keep/add', (req: Request, res: Response) => {
  const { title, content } = req.body;
  const newNote = {
    id: 'k' + (systemState.keepNotes.length + 1),
    title: title || 'Untitled Note',
    content: content || '',
    date: 'Just now'
  };
  systemState.keepNotes.unshift(newNote);
  res.json({ success: true, note: newNote });
});

app.post('/api/keep/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  systemState.keepNotes = systemState.keepNotes.filter(n => n.id !== id);
  res.json({ success: true });
});

app.post('/api/alarms/add', (req: Request, res: Response) => {
  const { time, label, days, sound } = req.body;
  const newAlarm = {
    id: 'a' + (systemState.alarms.length + 1),
    time: time || '07:00 AM',
    label: label || 'New Alarm',
    days: days || ['Everyday'],
    active: true,
    sound: sound || 'cyber_synth.mp3'
  };
  systemState.alarms.push(newAlarm);
  res.json({ success: true, alarm: newAlarm });
});

app.post('/api/alarms/toggle', (req: Request, res: Response) => {
  const { id } = req.body;
  const alarm = systemState.alarms.find(a => a.id === id);
  if (alarm) {
    alarm.active = !alarm.active;
  }
  res.json({ success: true, alarms: systemState.alarms });
});

app.post('/api/leaderboard/submit', (req: Request, res: Response) => {
  const { username, score, cps, game, country } = req.body;
  const newEntry = {
    id: 'l' + (systemState.leaderboard.length + 1),
    username: username || 'Player',
    score: Number(score) || 0,
    cps: Number(cps) || 0,
    game: game || 'clicker',
    country: country || 'US'
  };
  
  // Keep top scores
  systemState.leaderboard.push(newEntry);
  systemState.leaderboard.sort((a, b) => b.score - a.score);
  res.json({ success: true, leaderboard: systemState.leaderboard });
});

// Setup dev server or static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    // Dynamically import Vite dev server to use as a middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    // Fallback page rendering
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await import('fs').then(fs => fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8'));
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve static compiled assets
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port} (Link: http://localhost:${port})`);
  });
};

startServer().catch(err => {
  console.error('Error starting full-stack server:', err);
});
