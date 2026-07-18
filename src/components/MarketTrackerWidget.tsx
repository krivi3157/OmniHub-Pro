import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw, Star, StarOff, Globe, DollarSign } from 'lucide-react';

interface StockData {
  symbol: string;
  longName: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  currency: string;
  simulated?: boolean;
}

interface MarketTrackerWidgetProps {
  triggerNotification: (title: string, msg: string) => void;
  onOpenTerminal?: () => void;
}

export default function MarketTrackerWidget({ triggerNotification, onOpenTerminal }: MarketTrackerWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'BTC-USD', 'ETH-USD']);
  const [tickerDetails, setTickerDetails] = useState<Record<string, StockData>>({});

  // Fetch stock data for a symbol
  const fetchSymbolData = async (symbol: string) => {
    try {
      const res = await fetch(`/api/market/chart/${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch symbol data');
      const data: StockData = await res.json();
      setTickerDetails(prev => ({ ...prev, [symbol]: data }));
    } catch (err) {
      console.error(`Error loading market metrics for ${symbol}:`, err);
    }
  };

  // Bulk refresh watchlist
  const refreshAll = async () => {
    setLoading(true);
    await Promise.all(watchlist.map(sym => fetchSymbolData(sym)));
    setLoading(false);
    triggerNotification('Market Matrix Synchronized', 'Real-time quotes and sparklines updated via secure data proxy.');
  };

  // Run on mount and periodically
  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      watchlist.forEach(sym => fetchSymbolData(sym));
    }, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [watchlist]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const sym = searchQuery.trim().toUpperCase();
    setLoading(true);
    try {
      const res = await fetch(`/api/market/chart/${sym}`);
      if (!res.ok) {
        triggerNotification('Search Failed', `Symbol ${sym} could not be resolved by terminal.`);
        setLoading(false);
        return;
      }
      const data: StockData = await res.json();
      setTickerDetails(prev => ({ ...prev, [sym]: data }));
      setActiveSymbol(sym);
      if (!watchlist.includes(sym)) {
        setWatchlist(prev => [...prev, sym]);
      }
      triggerNotification('Asset Loaded', `Successfully synchronized live charts for ${sym}.`);
    } catch (err) {
      triggerNotification('Lookup Error', `Could not fetch data for ${sym}`);
    } finally {
      setLoading(false);
      setSearchQuery('');
    }
  };

  const toggleWatchlist = (sym: string) => {
    if (watchlist.includes(sym)) {
      if (watchlist.length <= 1) {
        triggerNotification('Action Denied', 'Watchlist must hold at least one active node.');
        return;
      }
      setWatchlist(prev => prev.filter(s => s !== sym));
      if (activeSymbol === sym) {
        setActiveSymbol(watchlist.find(s => s !== sym) || 'AAPL');
      }
      triggerNotification('Watchlist Pruned', `Removed ${sym} from priority terminals.`);
    } else {
      setWatchlist(prev => [...prev, sym]);
      triggerNotification('Watchlist Expanded', `Added ${sym} to priority monitoring.`);
    }
  };

  const activeData = tickerDetails[activeSymbol];

  // SVG Sparkline Renderer
  const renderSparkline = (prices: number[], color: string) => {
    if (!prices || prices.length < 2) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 140;
    const height = 40;
    const points = prices.map((price, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          points={points}
          className="transition-all duration-300"
        />
        {/* Glow effect */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="5"
          opacity="0.3"
          points={points}
          style={{ filter: `drop-shadow(0px 0px 4px ${color})` }}
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full font-sans text-slate-100" id="market_tracker_root">
      
      {/* Title & Refresh */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">Live Market Telemetry</h2>
        </div>
        <div className="flex items-center gap-2">
          {onOpenTerminal && (
            <button
              onClick={onOpenTerminal}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-xl border border-emerald-500/30 transition-colors uppercase cursor-pointer"
            >
              Open Terminal
            </button>
          )}
          <button
            onClick={refreshAll}
            disabled={loading}
            className={`p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer ${loading ? 'animate-spin text-emerald-400' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Asset Search */}
      <form onSubmit={handleSearch} className="relative mb-4 flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Ticker (e.g. NVDA, TSLA, AAPL)..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
        />
        <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
      </form>

      {/* Main Grid: Active terminal + Watchlist scroll */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Watchlist Quick Scroll */}
        <div className="md:col-span-5 space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {watchlist.map(sym => {
            const data = tickerDetails[sym];
            if (!data) return (
              <div key={sym} className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-2xl flex items-center justify-between animate-pulse">
                <span className="text-xs font-mono font-bold text-slate-500">{sym}</span>
                <span className="text-[10px] text-slate-600">Loading...</span>
              </div>
            );

            const isPositive = data.change >= 0;
            const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400';
            const bgClass = activeSymbol === sym ? 'bg-slate-900 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900';

            return (
              <div
                key={sym}
                onClick={() => setActiveSymbol(sym)}
                className={`border p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${bgClass}`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black text-white">{data.symbol}</span>
                    {data.simulated && (
                      <span className="text-[8px] bg-slate-800 text-slate-500 px-1 rounded uppercase font-mono">Sim</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 block truncate max-w-[80px] font-mono leading-tight">{data.longName}</span>
                </div>
                
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-slate-100">${data.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className={`text-[9px] font-mono font-bold block ${colorClass}`}>
                    {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Chart & Active Info */}
        <div className="md:col-span-7 bg-slate-950 border border-slate-850/80 rounded-2xl p-4 flex flex-col justify-between min-h-[180px]">
          {activeData ? (
            <div className="space-y-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono tracking-tight text-white">{activeData.symbol}</span>
                    <button
                      onClick={() => toggleWatchlist(activeData.symbol)}
                      className="text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer"
                    >
                      {watchlist.includes(activeData.symbol) ? (
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{activeData.currency.toUpperCase()} • REAL-TIME DATA</span>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-lg font-black font-mono text-white">
                      ${activeData.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1 font-mono text-[10px] font-bold">
                    {activeData.change >= 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">+{activeData.change.toFixed(2)} (+{activeData.changePercent.toFixed(2)}%)</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400">{activeData.change.toFixed(2)} ({activeData.changePercent.toFixed(2)}%)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="flex justify-center items-center py-2 bg-slate-900/30 rounded-2xl border border-slate-900 h-20 relative">
                {activeData.sparkline && activeData.sparkline.length > 0 ? (
                  renderSparkline(activeData.sparkline, activeData.change >= 0 ? '#10b981' : '#f43f5e')
                ) : (
                  <span className="text-[10px] font-mono text-slate-600">Telemetry feed loading...</span>
                )}
                <div className="absolute bottom-1.5 left-2.5 text-[8px] font-mono text-slate-500">24H PERFORMANCE GRID</div>
              </div>

              <div className="text-[9px] text-slate-500 flex justify-between font-mono italic">
                <span>PREV CLOSE: ${activeData.previousClose.toFixed(2)}</span>
                {activeData.simulated && <span className="text-yellow-500/80 font-bold uppercase">Simulation Override Active</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-2"></div>
              <span className="text-xs font-mono">Calibrating terminal streams...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
