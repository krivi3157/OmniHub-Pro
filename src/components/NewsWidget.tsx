import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Megaphone, Plus, Calendar, Edit3, Check, Eye, Trash, MessageSquare, AlertCircle } from 'lucide-react';
import { DeveloperNews } from '../types';

interface NewsWidgetProps {
  currentUserId: string;
  currentUserUsername: string;
  triggerNotification: (title: string, msg: string) => void;
}

export default function NewsWidget({ currentUserId, currentUserUsername, triggerNotification }: NewsWidgetProps) {
  const [news, setNews] = useState<DeveloperNews[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read real-time news articles from Firestore
  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articles: DeveloperNews[] = [];
      snapshot.forEach((doc) => {
        articles.push({
          id: doc.id,
          ...doc.data()
        } as DeveloperNews);
      });
      
      // If empty, let's seed with high-fidelity dev logs
      if (articles.length === 0) {
        seedInitialNews();
      } else {
        setNews(articles);
      }
    }, (err) => {
      console.error("Failed to read news:", err);
    });

    return () => unsubscribe();
  }, []);

  const seedInitialNews = async () => {
    try {
      const initialLogs = [
        {
          title: "OmniHub Pro 4.2.0: The SocialSync Protocol Update",
          content: "### Major System Release\n\nWelcome to OmniHub Pro! This major upgrade brings **fully-integrated Firebase accounts**, **asynchronous friendships**, and **authenticated real-time direct messaging** with multiplayer game inviting.\n\n*   **Federated OAuth Gateways**: Standardized secure Google, GitHub, and Microsoft Identity portals.\n*   **Absolute Network Isolation**: Online players, rankings, and active lobbies are 100% authentic with zero fake bot spoofing. Solo developers see exactly '1 Player Online (You)'.\n*   **Clicker Shop Progression**: Zero-indexed, durable cloud economy featuring Tap upgrades, automated Drones, and Exponential Multipliers.\n*   **Modular Dock Tray**: GPS, Speed Test, and Weather systems decoupled as floating window layers.",
          createdAt: Date.now() - 1000 * 60 * 15 // 15 mins ago
        },
        {
          title: "Patch 4.2.1: Floating Window Physics & Latency Fixes",
          content: "### Performance Improvements\n\n*   Resolved a race condition where double tapping the Clicker button could result in packet drops on slow networks.\n*   Optimized modular desktop render cycles. All floating windows now minimize smoothly to dock tray icons, freeing up resources for Arcade games.",
          createdAt: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
        }
      ];

      for (const log of initialLogs) {
        await addDoc(collection(db, 'news'), log);
      }
    } catch (err) {
      console.error("Failed to seed initial news:", err);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a title and markdown content.');
      return;
    }

    setIsPublishing(true);
    setError(null);
    try {
      await addDoc(collection(db, 'news'), {
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
        author: currentUserUsername
      });

      setTitle('');
      setContent('');
      setShowAdminPanel(false);
      triggerNotification('Dev Log Transmitted', 'New bulletin successfully broadcasted to all active OmniHub interfaces!');
    } catch (err: any) {
      console.error(err);
      setError('Failed to publish dev log: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Simple Markdown-to-HTML formatter to keep things robust & style with Tailwind
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-black text-white mt-4 mb-2 uppercase tracking-wide border-b border-slate-800 pb-1">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-black text-yellow-500 mt-5 mb-2 uppercase tracking-wide">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-black text-white mt-6 mb-3 uppercase">{trimmed.slice(2)}</h1>;
      }

      // Bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const parts = trimmed.slice(2).split('**');
        return (
          <li key={idx} className="text-[11px] text-slate-300 ml-4 list-disc mt-1.5 leading-relaxed">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-bold">{part}</strong> : part)}
          </li>
        );
      }

      // Standard paragraphs with bolding
      if (trimmed === '') return <div key={idx} className="h-2"></div>;
      
      const parts = trimmed.split('**');
      return (
        <p key={idx} className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
          {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-yellow-400 font-bold">{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 font-sans select-none" id="news_suite_hub">
      
      {/* Title & Publish Trigger */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase">Network Bulletin Board</h3>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Direct Dev Log Feed</span>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAdminPanel(!showAdminPanel);
          }}
          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-[10px] font-mono rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {showAdminPanel ? 'CLOSE EDITOR' : 'PUBLISH UPDATE'}
        </button>
      </div>

      {/* Admin Publish Form */}
      {showAdminPanel && (
        <form onSubmit={handlePublish} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3.5 animate-pulse">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="text-[10px] font-mono text-yellow-500 uppercase font-black">Publish New Developer Log</span>
            <span className="text-[9px] font-mono text-slate-500">AUTHOR: {currentUserUsername}</span>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-[10px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase block">Log Title</label>
            <input
              type="text"
              placeholder="e.g. Patch 4.2.2: Instant Message Encryption & Audio Buffs"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase block">Log Content (Markdown Supported)</label>
            <textarea
              placeholder="Use # for headers, * for bullet points, and **text** for bolding."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500 transition-colors font-mono resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            {isPublishing ? 'Transmitting Data...' : 'Broadcast to All Node Clients'}
          </button>
        </form>
      )}

      {/* News Stream */}
      <div className="space-y-4">
        {news.map((item) => (
          <div 
            key={item.id} 
            className="bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-6 hover:border-slate-800 transition-all"
            id={`bulletin_card_${item.id}`}
          >
            <div className="flex justify-between items-start gap-4 mb-3 border-b border-slate-850 pb-3">
              <h2 className="text-sm sm:text-base font-black text-white leading-snug">{item.title}</h2>
              <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-850 shrink-0">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="space-y-1">
              {formatMarkdown(item.content)}
            </div>
          </div>
        ))}

        {news.length === 0 && (
          <div className="text-center py-10 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs uppercase font-mono">
            Directing connection to bulletin server...
          </div>
        )}
      </div>
    </div>
  );
}
