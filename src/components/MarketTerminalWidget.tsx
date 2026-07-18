import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Settings, Maximize2, X, Plus, Clock, Layout, FileText, List, Link } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketTerminalWidget() {
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real chart data for active symbol
  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/chart/${activeSymbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.sparkline) {
          const chartData = data.sparkline.map((price: number, i: number) => ({
            time: `${Math.floor(i / 4)}:${(i % 4) * 15}`,
            price: Number(price.toFixed(2)),
            volume: Math.floor(Math.random() * 10000),
            rsi: 50 + (Math.random() - 0.5) * 40
          }));
          setChartData(chartData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch market data:', err);
        setLoading(false);
      });
  }, [activeSymbol]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const prevPrice = chartData.length > 0 ? chartData[0].price : 0;
  const change = currentPrice - prevPrice;
  const percentChange = prevPrice ? (change / prevPrice) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-950 text-slate-300 font-sans border border-slate-800 rounded-xl overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-950/80 gap-6">
        <div className="flex items-center gap-2 font-black text-white whitespace-nowrap">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          OMNIHUB TERMINAL
        </div>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for Stocks, F&O, Indices etc."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-4 items-center flex-1 overflow-x-auto no-scrollbar justify-end">
          {/* Indices */}
          {['S&P 500', 'NASDAQ', 'DOW JONES'].map((idx, i) => {
            const v = 5000 + i * 2000 + Math.random() * 100;
            const c = (Math.random() - 0.5) * 50;
            const pos = c >= 0;
            return (
              <div key={idx} className="flex flex-col text-[10px] whitespace-nowrap border-r border-slate-800 pr-4 last:border-0">
                <span className="text-slate-500">{idx}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">{v.toFixed(2)}</span>
                  <span className={pos ? "text-emerald-500" : "text-red-500"}>
                    {pos ? '+' : ''}{c.toFixed(2)} ({(c/v*100).toFixed(2)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Positions */}
        <div className="w-72 border-r border-slate-800 flex flex-col bg-slate-950">
          <div className="flex items-center justify-between p-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Positions</span>
            </div>
            <X className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-4">Equity F&O Positions (2)</h3>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Overall P&L</p>
                <p className="text-lg font-bold text-red-500">- $73.00</p>
              </div>
              <button className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-xs rounded-lg transition-colors">
                Set Safe Exit
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'AAPL 15 Jul 150 Put', pnl: -335.00, avg: 151.00, mkt: 134.25, qty: 20 },
                { name: 'AAPL 15 Jul 160 Put', pnl: 262.00, avg: 0.00, mkt: 172.40, qty: 0 }
              ].map(pos => (
                <div key={pos.name} className="flex flex-col gap-1 border-b border-slate-800/50 pb-3 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white">{pos.name}</span>
                    <span className={`text-xs font-bold ${pos.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Avg ${pos.avg.toFixed(2)} • Mkt ${pos.mkt.toFixed(2)}</span>
                    <span>{pos.qty > 0 ? `+ ${pos.qty}` : pos.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/50 relative">
          {/* Chart Header */}
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white tracking-wider">{activeSymbol} <span className="text-slate-500 font-normal">· 1m · NASDAQ</span></span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">O<span className={isPositive ? "text-emerald-500" : "text-red-500"}>{prevPrice.toFixed(2)}</span></span>
                <span className="text-slate-400">H<span className={isPositive ? "text-emerald-500" : "text-red-500"}>{(currentPrice * 1.01).toFixed(2)}</span></span>
                <span className="text-slate-400">L<span className={isPositive ? "text-emerald-500" : "text-red-500"}>{(prevPrice * 0.99).toFixed(2)}</span></span>
                <span className="text-slate-400">C<span className={isPositive ? "text-emerald-500" : "text-red-500"}>{currentPrice.toFixed(2)} {change > 0 ? '+' : ''}{change.toFixed(2)}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Clock className="w-4 h-4 hover:text-white cursor-pointer" />
              <Settings className="w-4 h-4 hover:text-white cursor-pointer" />
              <Maximize2 className="w-4 h-4 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 p-2 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} orientation="right" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="price" stroke={isPositive ? "#10b981" : "#ef4444"} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* RSI / Volume Panel Below Chart */}
          <div className="h-32 border-t border-slate-800 p-2">
             <div className="text-[10px] text-slate-500 mb-1 ml-2">RSI 14 SMA 1 <span className="text-purple-400">58.63</span></div>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} orientation="right" ticks={[30, 70]} />
                  <Area type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} fill="transparent" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel - Options Chain */}
        <div className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Chain</span>
            </div>
            <X className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Chain Header */}
            <div className="flex justify-between items-center px-4 py-2 text-[10px] font-semibold text-slate-400 border-b border-slate-800">
              <div className="flex gap-2">
                <span>{activeSymbol} ▽</span>
                <span>15 Jul ▽</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Basket</span>
                <div className="w-6 h-3 bg-emerald-500/20 rounded-full border border-emerald-500 relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-4 py-2 text-[10px] font-semibold text-slate-500 border-b border-slate-800">
              <span>Call price</span>
              <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                <span className="px-2 py-0.5 rounded text-slate-400 cursor-pointer">OI</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 cursor-pointer">Price</span>
              </div>
              <span>Put price</span>
            </div>

            {/* Options rows */}
            <div className="space-y-1 p-2 relative">
              {[
                { call: 424.30, callChange: -40.06, strike: 150.00, put: 81.15, putChange: -8.97 },
                { call: 346.45, callChange: -44.26, strike: 155.00, put: 103.40, putChange: -3.41 },
                { call: 279.80, callChange: -49.29, strike: 160.00, put: 134.25, putChange: 5.25 },
                { call: 218.95, callChange: -54.15, strike: 165.00, put: 172.40, putChange: 12.46 },
                { call: 169.75, callChange: -58.18, strike: 170.00, put: 225.95, putChange: 22.23 },
                { call: 131.45, callChange: -61.95, strike: 175.00, put: 285.60, putChange: 29.38 },
                { call: 101.70, callChange: -65.25, strike: 180.00, put: 357.10, putChange: 36.17 }
              ].map((opt, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-900 rounded cursor-pointer group">
                  {/* Call */}
                  <div className="flex items-center gap-2 w-20">
                    <input type="checkbox" className="opacity-0 group-hover:opacity-100 accent-emerald-500" />
                    <div className="text-right flex-1">
                      <div className="text-xs font-semibold text-white">{opt.call.toFixed(2)}</div>
                      <div className={`text-[9px] ${opt.callChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {opt.callChange >= 0 ? '+' : ''}{opt.callChange}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Strike */}
                  <div className="text-xs font-bold text-slate-300 w-16 text-center">
                    {opt.strike}
                    <div className="flex gap-1 justify-center mt-0.5">
                      <div className="w-3 h-0.5 bg-red-500/50 rounded-full"></div>
                      <div className="w-3 h-0.5 bg-emerald-500/50 rounded-full"></div>
                    </div>
                  </div>

                  {/* Put */}
                  <div className="flex items-center gap-2 w-20 justify-end">
                    <div className="text-left flex-1">
                      <div className="text-xs font-semibold text-white">{opt.put.toFixed(2)}</div>
                      <div className={`text-[9px] ${opt.putChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {opt.putChange >= 0 ? '+' : ''}{opt.putChange}%
                      </div>
                    </div>
                    <input type="checkbox" className="opacity-0 group-hover:opacity-100 accent-emerald-500" />
                  </div>
                </div>
              ))}
              
              {/* Current Price overlay strip */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-950 font-bold text-[10px] px-3 py-1 rounded-full shadow-lg border border-slate-200 z-10 flex items-center gap-2">
                {currentPrice.toFixed(2)} <span className={isPositive ? "text-emerald-600" : "text-red-600"}>{change > 0 ? '+' : ''}{change.toFixed(2)} ({(percentChange).toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Far Right Sidebar - Nav */}
        <div className="w-14 bg-[#0a0f1c] border-l border-slate-800 flex flex-col items-center py-4 gap-6 overflow-y-auto no-scrollbar">
          {[
            { icon: List, label: 'Watchlist' },
            { icon: Layout, label: 'Positions' },
            { icon: FileText, label: 'Orders' },
            { icon: Link, label: 'Chain' },
            { icon: TrendingDown, label: 'Depth' },
            { icon: Clock, label: 'Holdings' }
          ].map(nav => (
            <div key={nav.label} className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <nav.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </div>
              <span className="text-[8px] text-slate-500 group-hover:text-slate-300 font-medium">{nav.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
