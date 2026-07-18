import React, { useState, useRef, useEffect } from 'react';
import { Compass, RefreshCw, ArrowLeft, ArrowRight, Home, Plus, X, Lock, ExternalLink, Code, Bookmark } from 'lucide-react';

interface BrowserWidgetProps {
  triggerNotification: (title: string, msg: string) => void;
}

interface Tab {
  id: string;
  title: string;
  url: string;
}

export default function BrowserWidget({ triggerNotification }: BrowserWidgetProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Start Page', url: 'https://www.google.com/webhp?igu=1' }
  ]);
  const [bookmarks, setBookmarks] = useState<Tab[]>([
    { id: 'b1', title: 'Google', url: 'https://www.google.com/webhp?igu=1' },
    { id: 'b2', title: 'YouTube', url: 'https://www.youtube.com/' },
    { id: 'b3', title: 'GitHub', url: 'https://github.com/' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [urlInput, setUrlInput] = useState('https://www.google.com/webhp?igu=1');
  const [searchEngine, setSearchEngine] = useState<'google' | 'bing' | 'duckduckgo'>('google');
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTabId, activeTab.url]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = urlInput.trim();
    
    // Determine if input is a search query or a URL
    let isSearch = false;
    if (finalUrl.includes(' ')) {
      isSearch = true;
    } else if (!finalUrl.includes('.') && !finalUrl.startsWith('localhost') && !finalUrl.startsWith('http')) {
      isSearch = true;
    }

    if (isSearch) {
      // Determine search URL based on selected engine
      const searchUrls = {
        google: `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`,
        bing: `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`,
        duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`
      };
      finalUrl = searchUrls[searchEngine];
    } else {
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      
      // Auto-convert YouTube watch URLs to embed URLs to bypass iframe restrictions
      try {
        const urlObj = new URL(finalUrl);
        if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
          const videoId = urlObj.searchParams.get('v');
          if (videoId) {
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        } else if (urlObj.hostname === 'youtu.be') {
          const videoId = urlObj.pathname.slice(1);
          if (videoId) {
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
      } catch (err) {
        // Invalid URL parsing, ignore
      }
    }
    
    updateTabUrl(activeTabId, finalUrl);
  };

  const updateTabUrl = (id: string, url: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, url, title: url } : t));
  };

  const addTab = () => {
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTabs(prev => [...prev, { id: newId, title: 'New Tab', url: 'https://www.bing.com/' }]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const reload = () => {
    if (iframeRef.current) {
      // Force iframe reload by re-setting src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = currentSrc;
      }, 50);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 font-sans text-slate-200">
      {/* Sidebar Workspace Tabs (Opera GX style) */}
      <div className="w-16 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-10">
        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Compass className="w-5 h-5 text-indigo-400" />
        </div>
        
        <div className="w-8 h-px bg-slate-800 my-2"></div>
        
        {/* Workspace icons */}
        <button className="w-10 h-10 rounded-xl hover:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors group relative">
          <Code className="w-5 h-5" />
          <span className="absolute left-14 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 font-bold whitespace-nowrap pointer-events-none z-50">Local Vibe Environment</span>
        </button>
        
        <div className="flex-1 flex flex-col items-center gap-2 mt-4">
          {bookmarks.map(bm => (
            <button 
              key={bm.id}
              onClick={() => updateTabUrl(activeTabId, bm.url)}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors"
              title={bm.title}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Browser Top Chrome */}
        <div className="bg-slate-900 border-b border-slate-800 flex flex-col">
          {/* Tab Strip */}
          <div className="flex items-end px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 max-w-[200px] min-w-[120px] px-3 py-1.5 rounded-t-lg border-t border-x cursor-pointer transition-colors ${
                  activeTabId === tab.id 
                    ? 'bg-slate-950 border-indigo-500/30 text-indigo-100 shadow-[inset_0_2px_10px_rgba(99,102,241,0.05)]' 
                    : 'bg-slate-900 border-transparent text-slate-500 hover:bg-slate-800'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-slate-800 shrink-0 border border-slate-700"></div>
                <span className="text-xs truncate flex-1 font-medium">{tab.title}</span>
                <button 
                  onClick={(e) => closeTab(e, tab.id)}
                  className={`p-0.5 rounded-md hover:bg-slate-700 ${tabs.length === 1 ? 'invisible' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button 
              onClick={addTab}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md ml-1 mb-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="bg-slate-950 px-3 py-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"><ArrowLeft className="w-4 h-4" /></button>
              <button className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"><ArrowRight className="w-4 h-4" /></button>
              <button onClick={reload} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => updateTabUrl(activeTabId, 'https://www.google.com/webhp?igu=1')} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"><Home className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleNavigate} className="flex-1">
              <div className="relative flex items-center w-full bg-slate-900 border border-slate-700 rounded-full hover:border-slate-600 focus-within:border-indigo-500 focus-within:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all px-3 py-1">
                <select 
                  value={searchEngine}
                  onChange={(e) => setSearchEngine(e.target.value as any)}
                  className="bg-slate-900 text-[10px] text-slate-400 border-none outline-none mr-2 uppercase font-bold cursor-pointer hover:text-indigo-400"
                >
                  <option value="google">G</option>
                  <option value="bing">B</option>
                  <option value="duckduckgo">DDG</option>
                </select>
                <Lock className="w-3 h-3 text-emerald-500 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs text-slate-200 font-mono"
                  placeholder="Enter URL or search..."
                />
              </div>
            </form>

            <button 
              onClick={() => window.open(activeTab.url, '_blank')}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
              title="Open in external browser"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Content */}
        <div className="flex-1 relative bg-white flex flex-col">
          <div className="bg-amber-100 text-amber-900 text-xs px-4 py-3 flex items-center justify-between shadow-md z-10 border-b border-amber-200">
            <span className="font-bold flex items-center gap-2">
              ⚠️ Content Security Restriction
            </span>
            <span className="text-xs hidden md:inline">
              Some sites block being embedded.
            </span>
            <button 
              onClick={() => window.open(activeTab.url, '_blank')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg font-black text-[10px] transition-colors shadow-sm ml-auto whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" /> Open in New Tab
            </button>
          </div>
          <iframe 
            ref={iframeRef}
            src={activeTab.url} 
            className="w-full flex-1 border-none bg-white"
            title="Browser"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  );
}
