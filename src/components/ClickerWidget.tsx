import React, { useState, useEffect, useRef } from 'react';
import { Coins, Flame, Star, Zap, ShoppingBag, ArrowUpRight, Award, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { UserState, Drone, ThemeType } from '../types';
import { formatNumberInfinite } from '../lib/numberUtils';

interface ClickerWidgetProps {
  userState: UserState;
  setUserState: React.Dispatch<React.SetStateAction<UserState>>;
  onEarnGold: (amount: number) => void;
  triggerNotification: (title: string, msg: string) => void;
}

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  amount: number;
}

export default function ClickerWidget({ userState, setUserState, onEarnGold, triggerNotification }: ClickerWidgetProps) {
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [cps, setCps] = useState(0);
  const clickTimes = useRef<number[]>([]);
  
  // CPS Tester States
  const [isCpsTesting, setIsCpsTesting] = useState(false);
  const [cpsTestClicks, setCpsTestClicks] = useState(0);
  const [cpsTestTimeLeft, setCpsTestTimeLeft] = useState(10);
  const [cpsTestHistory, setCpsTestHistory] = useState<number[]>([]);
  const [cpsTestBest, setCpsTestBest] = useState(0);
  const [cpsTestCurrentRate, setCpsTestCurrentRate] = useState<number[]>([]);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Clicker Theme configuration
  const themeDetails = {
    gold_rush: {
      name: 'Gold Rush',
      bg: 'from-amber-950 to-amber-900 border-amber-500/40',
      accent: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      btnBg: 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600',
      btnBorder: 'border-yellow-300 shadow-[0_0_35px_rgba(245,158,11,0.6)]',
      particleColor: 'text-amber-300 font-bold',
      clickLabel: 'MINE GOLD',
      soundText: '*CLANK*',
      desc: 'Glittering mines & pickaxes'
    },
    money_tycoon: {
      name: 'Money Tycoon',
      bg: 'from-emerald-950 to-emerald-900 border-emerald-500/40',
      accent: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      btnBg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600',
      btnBorder: 'border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.6)]',
      particleColor: 'text-emerald-300 font-bold',
      clickLabel: 'PRINT CASH',
      soundText: '*KACHING*',
      desc: 'High-rise towers & fiat flow'
    },
    crypto_farm: {
      name: 'Crypto Farm',
      bg: 'from-cyan-950 to-cyan-900 border-cyan-500/40',
      accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      btnBg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
      btnBorder: 'border-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.6)]',
      particleColor: 'text-cyan-300 font-mono',
      clickLabel: 'MINE BITCOIN',
      soundText: '*BUZZ*',
      desc: 'Pulsing chips & hash power'
    },
    cosmic_harvest: {
      name: 'Cosmic Harvest',
      bg: 'from-purple-950 to-purple-900 border-purple-500/40',
      accent: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      btnBg: 'bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600',
      btnBorder: 'border-fuchsia-300 shadow-[0_0_35px_rgba(168,85,247,0.6)]',
      particleColor: 'text-fuchsia-300 font-extrabold italic',
      clickLabel: 'HARVEST MATTERS',
      soundText: '*WOOSH*',
      desc: 'Star dust & antimatter'
    }
  };

  const currentTheme = themeDetails[userState.activeTheme] || themeDetails.gold_rush;

  const [shopTab, setShopTab] = useState<'manual' | 'automated' | 'multiplier'>('manual');

  // Track Clicks Per Second in general state
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      clickTimes.current = clickTimes.current.filter(t => now - t < 1000);
      
      const multTier = userState.multiplierTier || 1;
      const finalMultiplier = userState.prestigeMultiplier * (1 + (multTier - 1) * 0.25);

      // Calculate Drone Contribution
      let droneCpsSum = 0;
      userState.drones.forEach(d => {
        droneCpsSum += d.cps * d.count;
      });

      // General CPS combines live clicks + drones
      const activeCps = clickTimes.current.length + (droneCpsSum * finalMultiplier);
      setCps(activeCps);

      // Give gold passive earnings
      if (droneCpsSum > 0) {
        onEarnGold((droneCpsSum * finalMultiplier) / 10);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [userState.drones, userState.prestigeMultiplier, userState.multiplierTier]);

  // Main coin tap event
  const handleCoinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const manualLvl = userState.manualLevel || 1;
    const multTier = userState.multiplierTier || 1;
    const baseEarn = 1 + (manualLvl - 1) * 3;
    const clickEarn = Number((baseEarn * userState.prestigeMultiplier * (1 + (multTier - 1) * 0.25)).toFixed(2));

    onEarnGold(clickEarn);
    clickTimes.current.push(Date.now());
    
    // Play sound based on theme
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        if (userState.activeTheme === 'gold_rush') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
        } else if (userState.activeTheme === 'money_tycoon') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(400 + Math.random() * 100, ctx.currentTime);
        } else if (userState.activeTheme === 'crypto_farm') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600 + Math.random() * 100, ctx.currentTime);
        } else {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200 + Math.random() * 200, ctx.currentTime);
        }
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (err) {
      console.log('Audio error:', err);
    }

    // Spawn floating particle
    const newParticle: ClickParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      amount: clickEarn
    };
    setParticles(prev => [...prev, newParticle].slice(-20)); // Limit active particles

    setUserState(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + 1
    }));

    // Trigger visual/haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Tier 1: Buy Manual Tap Upgrades
  const buyManualUpgrade = () => {
    const currentLvl = userState.manualLevel || 1;
    const cost = Math.floor(150 * Math.pow(1.8, currentLvl - 1));

    if (userState.gold >= cost) {
      onEarnGold(-cost);
      setUserState(prev => ({
        ...prev,
        manualLevel: currentLvl + 1
      }));
      triggerNotification('Sledgehammer Polished', `Tap yield upgraded to Level ${currentLvl + 1}!`);
    } else {
      triggerNotification('Insufficient Assets', `Need $${cost} to buy Manual Tap upgrade.`);
    }
  };

  // Tier 3: Buy Exponential Multipliers
  const buyMultiplierUpgrade = () => {
    const currentTier = userState.multiplierTier || 1;
    const cost = Math.floor(10000 * Math.pow(3.5, currentTier - 1));

    if (userState.gold >= cost) {
      onEarnGold(-cost);
      setUserState(prev => ({
        ...prev,
        multiplierTier: currentTier + 1
      }));
      triggerNotification('Quantum Leap Initiated', `Permanent compounding multiplier boosted to Tier ${currentTier + 1} (+${(currentTier * 25)}% boost)!`);
    } else {
      triggerNotification('Insufficient Assets', `Need $${cost} to upgrade Exponential Multiplier.`);
    }
  };

  // Drone Store purchasing logic
  const buyDrone = (droneId: string) => {
    const drone = userState.drones.find(d => d.id === droneId);
    if (!drone) return;

    if (userState.gold >= drone.cost) {
      onEarnGold(-drone.cost);
      setUserState(prev => ({
        ...prev,
        drones: prev.drones.map(d => {
          if (d.id === droneId) {
            return {
              ...d,
              count: d.count + 1,
              cost: Math.floor(d.cost * 1.25) // Price inflation factor
            };
          }
          return d;
        })
      }));
      triggerNotification('Upgrade Acknowledged', `Acquired ${drone.name}. Passive speed output boosted.`);
    } else {
      triggerNotification('Insufficient Assets', `Need $${drone.cost} to buy ${drone.name}.`);
    }
  };

  // Prestige Reset Logic
  const canPrestige = userState.gold >= 50000;
  const prestigePointsToGain = Math.floor(Math.sqrt(userState.gold / 50000));
  
  const handlePrestige = () => {
    if (!canPrestige) {
      triggerNotification('System Warning', 'You require at least $50,000 Liquid Gold to initialize Prestige cycle.');
      return;
    }

    const nextMultiplier = userState.prestigeMultiplier + (prestigePointsToGain * 0.5);

    setUserState(prev => ({
      ...prev,
      gold: 0,
      prestigePoints: prev.prestigePoints + prestigePointsToGain,
      prestigeMultiplier: nextMultiplier,
      drones: prev.drones.map(d => ({ ...d, count: 0, cost: Math.floor(d.cost / Math.pow(1.25, d.count)) })) // Reset drones
    }));

    triggerNotification('Prestige Phase Completed', `Quantum compression reset wealth. Permanent multiplier upgraded to ${nextMultiplier.toFixed(1)}x!`);
  };

  // --- CPS TEST ENGINE ---
  const startCpsTest = () => {
    setIsCpsTesting(true);
    setCpsTestClicks(0);
    setCpsTestTimeLeft(10);
    setCpsTestCurrentRate([]);
    
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    
    testTimerRef.current = setInterval(() => {
      setCpsTestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(testTimerRef.current!);
          setIsCpsTesting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCpsTestClick = () => {
    if (!isCpsTesting) {
      startCpsTest();
    }
    setCpsTestClicks(prev => prev + 1);
  };

  // Keep live metrics for graph
  useEffect(() => {
    if (isCpsTesting) {
      const rateInterval = setInterval(() => {
        const elapsed = 10 - cpsTestTimeLeft;
        if (elapsed > 0) {
          const liveRate = cpsTestClicks / elapsed;
          setCpsTestCurrentRate(prev => [...prev, Number(liveRate.toFixed(1))].slice(-10));
        }
      }, 500);
      return () => clearInterval(rateInterval);
    }
  }, [isCpsTesting, cpsTestClicks, cpsTestTimeLeft]);

  // Handle completion scoring
  useEffect(() => {
    if (cpsTestTimeLeft === 0 && cpsTestClicks > 0) {
      const finalCps = Number((cpsTestClicks / 10).toFixed(1));
      setCpsTestHistory(prev => [...prev, finalCps].slice(-5));
      if (finalCps > cpsTestBest) {
        setCpsTestBest(finalCps);
        triggerNotification('New Record Speed!', `Your tapping diagnostic hit a new high of ${finalCps} CPS!`);
      }
      
      // Reward gold on speed checks
      const reward = Math.floor(finalCps * 250);
      onEarnGold(reward);
      triggerNotification('Diagnostic Bonus', `Received $${reward} Gold bonus for validating clicking latency.`);
    }
  }, [cpsTestTimeLeft]);

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 font-sans select-none" id="clicker_module_root">
      {/* Visual Theme Selection Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2" id="theme_selection_panel">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            Vibe Tuning Command
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Interactive Assets</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(themeDetails) as ThemeType[]).map(t => (
            <button
              key={t}
              onClick={() => setUserState(prev => ({ ...prev, activeTheme: t }))}
              className={`p-2 rounded-xl text-left border flex flex-col transition-all cursor-pointer ${
                userState.activeTheme === t
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-bold shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-tight block truncate">
                {themeDetails[t].name}
              </span>
              <span className="text-[8px] text-slate-500 truncate block mt-0.5">
                {themeDetails[t].desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Core Coin Tap Box */}
        <div className={`md:col-span-7 bg-gradient-to-br ${currentTheme.bg} border rounded-3xl p-5 flex flex-col justify-between items-center relative min-h-[300px] transition-all overflow-hidden`} id="core_coin_tap_box">
          
          <div className="w-full flex justify-between items-start z-10">
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full ${currentTheme.accent}`}>
                {currentTheme.name} Grid
              </span>
              <p className="text-xs text-slate-400 font-mono mt-1">Total Taps: {userState.totalClicks}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 uppercase">Live Rate</span>
              <p className="text-2xl font-black font-mono text-yellow-500 flex items-center gap-1 justify-end animate-pulse">
                <Flame className="w-5 h-5 text-orange-500" /> {cps.toFixed(1)} <span className="text-xs">CPS</span>
              </p>
            </div>
          </div>

          {/* Interactive Tap Asset */}
          <div className="relative py-4 my-auto z-10">
            <div
              onClick={handleCoinClick}
              className={`w-36 h-36 rounded-full ${currentTheme.btnBg} border-4 ${currentTheme.btnBorder} flex flex-col items-center justify-center cursor-pointer active:scale-90 select-none hover:scale-105 transition-all`}
            >
              {userState.activeTheme === 'gold_rush' && <Coins className="w-16 h-16 text-amber-950" />}
              {userState.activeTheme === 'money_tycoon' && <TrendingUp className="w-16 h-16 text-emerald-950" />}
              {userState.activeTheme === 'crypto_farm' && <Zap className="w-16 h-16 text-cyan-950" />}
              {userState.activeTheme === 'cosmic_harvest' && <Star className="w-16 h-16 text-purple-950" />}
              
              <span className="text-[9px] font-black tracking-widest text-slate-900 mt-1 uppercase text-center max-w-[90px]">
                {currentTheme.clickLabel}
              </span>
              <span className="text-[8px] opacity-70 font-mono text-slate-950 tracking-normal">
                {currentTheme.soundText}
              </span>
            </div>

            {/* Click Particles overlay */}
            {particles.map(p => (
              <span
                key={p.id}
                className={`absolute animate-bounce text-sm font-extrabold select-none pointer-events-none ${currentTheme.particleColor}`}
                style={{
                  left: p.x,
                  top: p.y - 20,
                  transform: 'translate(-50%, -50%)',
                  animationDuration: '0.8s'
                }}
              >
                +${p.amount}
              </span>
            ))}
          </div>

          <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-400 z-10 border-t border-slate-800/60 pt-3">
            <span>Multiplier: <b className="text-white font-bold">{userState.prestigeMultiplier.toFixed(1)}x</b></span>
            <span>Prestige Level: <b className="text-white font-bold">{userState.prestigePoints}</b></span>
          </div>
        </div>

        {/* 3-Tier Shop Panel */}
        <div className="md:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between" id="drone_shop_panel">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase tracking-widest text-yellow-500 font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                Progression Shop
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">3 TIERS</span>
            </div>

            {/* Shop Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1 mb-4">
              {(['manual', 'automated', 'multiplier'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setShopTab(tab)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    shopTab === tab 
                      ? 'bg-yellow-500 text-slate-950 font-black shadow-[0_0_8px_rgba(234,179,8,0.2)]' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab === 'manual' ? 'TAP T1' : tab === 'automated' ? 'AUTO T2' : 'MULT T3'}
                </button>
              ))}
            </div>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {/* TIER 1: MANUAL TAP */}
              {shopTab === 'manual' && (() => {
                const manualLvl = userState.manualLevel || 1;
                const cost = Math.floor(150 * Math.pow(1.8, manualLvl - 1));
                const canAfford = userState.gold >= cost;
                return (
                  <div className={`p-3.5 rounded-xl border ${canAfford ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-950/20 border-slate-900'} flex flex-col gap-3`}>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-200">Sledgehammer Clicker</span>
                        <span className="text-[10px] font-mono text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">LVL {manualLvl}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Polish your tap transducers. Increases baseline yield by **+3 Gold per individual screen tap**.
                      </p>
                      <p className="text-[10px] text-yellow-500 font-mono mt-1.5 font-bold">Cost: ${formatNumberInfinite(cost)} Gold</p>
                    </div>
                    <button
                      onClick={buyManualUpgrade}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        canAfford ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      UPGRADE CLICK (+3/TAP)
                    </button>
                  </div>
                );
              })()}

              {/* TIER 2: AUTOMATED DRONES */}
              {shopTab === 'automated' && userState.drones.map(d => {
                const canAfford = userState.gold >= d.cost;
                const multTier = userState.multiplierTier || 1;
                const finalMultiplier = userState.prestigeMultiplier * (1 + (multTier - 1) * 0.25);
                return (
                  <div
                    key={d.id}
                    className={`p-2.5 rounded-xl border flex justify-between items-center transition-colors ${
                      canAfford ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-950/20 border-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{d.name}</span>
                        <span className="text-[10px] font-mono text-yellow-500 font-semibold bg-yellow-500/10 px-1.5 py-0.2 rounded">
                          x{d.count}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Yields: +{formatNumberInfinite(d.cps * finalMultiplier)}/s • Cost: ${formatNumberInfinite(d.cost)}
                      </p>
                    </div>

                    <button
                      onClick={() => buyDrone(d.id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-400 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      BUY
                    </button>
                  </div>
                );
              })}

              {/* TIER 3: EXPONENTIAL MULTIPLIERS */}
              {shopTab === 'multiplier' && (() => {
                const multTier = userState.multiplierTier || 1;
                const cost = Math.floor(10000 * Math.pow(3.5, multTier - 1));
                const canAfford = userState.gold >= cost;
                return (
                  <div className={`p-3.5 rounded-xl border ${canAfford ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-950/20 border-slate-900'} flex flex-col gap-3`}>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-200">Quantum Multipliers</span>
                        <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">TIER {multTier}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Unleash permanent percentage buffs. Grants **+25% compounding boost** to all manual clicks and automated drone pipelines.
                      </p>
                      <p className="text-[10px] text-yellow-500 font-mono mt-1.5 font-bold">Cost: ${formatNumberInfinite(cost)} Gold</p>
                    </div>
                    <button
                      onClick={buyMultiplierUpgrade}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        canAfford ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      UPGRADE MULTIPLIER (+25%)
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Prestige conversion bar */}
          <div className="border-t border-slate-800/80 pt-3 mt-3 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-purple-400 uppercase font-bold flex items-center gap-1">
                <Award className="w-3 h-3" />
                PRESTIGE RESET
              </span>
              <span className="text-slate-400 font-semibold">
                {userState.gold >= 50000 ? `Ready to yield +${prestigePointsToGain} points` : 'Requires $50k Gold'}
              </span>
            </div>
            
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex items-center relative">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-purple-600 transition-all duration-300"
                style={{ width: `${Math.min(100, (userState.gold / 50000) * 100)}%` }}
              ></div>
              <span className="absolute inset-y-0 right-2 text-[8px] font-mono text-slate-400 self-center flex items-center">
                {Math.min(100, Math.floor((userState.gold / 50000) * 100))}%
              </span>
            </div>

            <button
              onClick={handlePrestige}
              disabled={!canPrestige}
              className={`w-full py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                canPrestige
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white hover:opacity-90 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Reset for +{prestigePointsToGain} Prestige Multiplier
            </button>
          </div>
        </div>
      </div>

      {/* CPS Tester and Graphics Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5" id="cps_tester_and_graphics_section">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Latency Clicking Speed Tester
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-md">
            Record: {cpsTestBest} CPS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Action trigger & records */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Verify your tapping speed capabilities. Click the diagnostic trigger as rapidly as possible for 10 seconds. You earn $250 gold per final CPS!
            </p>

            <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Time Remaining</span>
                <span className="text-2xl font-black font-mono text-white">{cpsTestTimeLeft}s</span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="flex-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Taps Counted</span>
                <span className="text-2xl font-black font-mono text-cyan-400">{cpsTestClicks}</span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="flex-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Live Speed</span>
                <span className="text-2xl font-black font-mono text-yellow-400">
                  {cpsTestTimeLeft < 10 ? (cpsTestClicks / (10 - cpsTestTimeLeft)).toFixed(1) : '0.0'} <span className="text-xs">CPS</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleCpsTestClick}
              className={`w-full py-3 rounded-2xl font-black uppercase text-sm tracking-widest transition-all cursor-pointer ${
                isCpsTesting
                  ? 'bg-cyan-500 text-slate-950 animate-pulse border-cyan-300 active:scale-95'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95'
              }`}
            >
              {isCpsTesting ? 'CLICK TRIGGER!' : 'START DIAGNOSTIC TEST'}
            </button>
          </div>

          {/* SVG Live Rate Plot Chart */}
          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              Live Rate Plotting (10s timeline)
            </span>
            
            <div className="h-28 w-full flex items-end relative border-b border-l border-slate-800/80 pb-1 pl-1">
              {/* Live SVG Graph line */}
              {cpsTestCurrentRate.length > 1 ? (
                <svg className="w-full h-full absolute inset-0 pt-2 pr-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Fill gradient */}
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Chart Path */}
                  <path
                    d={`M 0 100 ${cpsTestCurrentRate.map((r, i) => {
                      const maxVal = Math.max(...cpsTestCurrentRate, 10);
                      const x = (i / (cpsTestCurrentRate.length - 1)) * 100;
                      const y = 100 - (r / maxVal) * 80;
                      return `L ${x} ${y}`;
                    }).join(' ')} L 100 100 Z`}
                    fill="url(#chart-grad)"
                  />

                  {/* Stroke line */}
                  <path
                    d={cpsTestCurrentRate.map((r, i) => {
                      const maxVal = Math.max(...cpsTestCurrentRate, 10);
                      const x = (i / (cpsTestCurrentRate.length - 1)) * 100;
                      const y = 100 - (r / maxVal) * 80;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-[10px] font-mono uppercase">
                  No active diagnostic plot line
                </div>
              )}

              {/* Gridlines */}
              <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-600">MAX: {Math.max(...cpsTestCurrentRate, 10).toFixed(1)} CPS</div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-600">0.0 CPS</div>
            </div>

            {/* Test History list */}
            <div className="flex items-center gap-2 mt-2 pt-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">Previous runs:</span>
              <div className="flex gap-1.5 overflow-x-auto">
                {cpsTestHistory.length > 0 ? (
                  cpsTestHistory.map((val, idx) => (
                    <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                      {val} CPS
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-slate-600 font-mono italic">No telemetry data</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
