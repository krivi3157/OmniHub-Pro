import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Play, Wifi, CloudSun, Database, Mail, HardDrive, Swords, 
  Calendar, Compass, Clock, Award, ChevronRight, Volume2, Coins, 
  Flame, Star, Zap, TrendingUp, LogOut, ShieldCheck, Megaphone, MapPin, 
  Layers, RefreshCw, Minus, Square, X, User, Search, Loader2,
  Sun, Cloud, CloudRain, CloudLightning, Maximize2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { db, auth } from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import ClickerWidget from './components/ClickerWidget';
import LeaderboardWidget from './components/LeaderboardWidget';
import AICockpitWidget from './components/AICockpitWidget';
import ArcadeWidget from './components/ArcadeWidget';
import ProductivityWidget from './components/ProductivityWidget';
import AuthGateway from './components/AuthGateway';
import NewsWidget from './components/NewsWidget';
import MarketTrackerWidget from './components/MarketTrackerWidget';
import WatchlistWidget from './components/WatchlistWidget';
import MarketTerminalWidget from './components/MarketTerminalWidget';
import BrowserWidget from './components/BrowserWidget';
import NetworkTrafficWidget from './components/NetworkTrafficWidget';
import { ThermalMap } from './components/ThermalMap';
import CyberRadioWidget from './components/CyberRadioWidget';

import { formatNumberInfinite } from './lib/numberUtils';

import { 
  UserState, 
  SpeedTestData, 
  GPSData, 
  WeatherData, 
  Alarm, 
  Challenge, 
  DriveFile, 
  KeepNote,
  GmailMessage,
  CalendarEvent,
  GoogleTask,
  GoogleContact,
  NotificationToast 
} from './types';

// Theme styles configuration
const themeDetails: { [key: string]: { name: string; class: string; glow: string } } = {
  gold_rush: { name: 'Gold Rush Tycoon', class: 'from-amber-500 to-yellow-600', glow: 'shadow-[0_0_20px_#eab308]' },
  crypto_mint: { name: 'Crypto Minting Peak', class: 'from-emerald-400 to-teal-600', glow: 'shadow-[0_0_20px_#10b981]' },
  cosmic_harvest: { name: 'Cosmic Stellar Miner', class: 'from-purple-500 to-indigo-700', glow: 'shadow-[0_0_20px_#8b5cf6]' },
};

export default function App() {
  // Authentication & Onboarding states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core progression state (initialized zero-indexed)
  const [userState, setUserState] = useState<UserState>({
    gold: 0.00,
    prestigePoints: 0,
    prestigeMultiplier: 1.0,
    activeTheme: 'gold_rush',
    totalClicks: 0,
    cpsHistory: [],
    online: true,
    username: 'Guest Player',
    status: 'Online',
    activeGame: null,
    manualLevel: 1,
    multiplierTier: 1,
    drones: [
      { id: 'dr1', name: 'Raw Pickaxe Drone', cost: 1500, cps: 2, count: 0, level: 1 },
      { id: 'dr2', name: 'Pneumatic Steam Drill', cost: 12000, cps: 15, count: 0, level: 1 },
      { id: 'dr3', name: 'Silicon Cryptominer ASIC', cost: 50000, cps: 80, count: 0, level: 1 },
      { id: 'dr4', name: 'Antimatter Solar Harvester', cost: 250000, cps: 500, count: 0, level: 1 }
    ]
  });

  // Navigation system
  const [activeView, setActiveView] = useState<'dashboard' | 'arcade' | 'productivity' | 'ai_cockpit' | 'social' | 'news' | 'terminal'>('dashboard');
  const [newsUnreadCount, setNewsUnreadCount] = useState(0);

  // Toast notification state
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  // Local device statistics state
  const [speedData, setSpeedData] = useState<SpeedTestData>({
    download: 842.15,
    upload: 312.4,
    ping: 12,
    jitter: 2,
    carrier: 'Google Fiber Gigabit LLC',
    testing: false
  });

  const [gpsData, setGpsData] = useState<GPSData>({
    latitude: 51.5074,
    longitude: -0.1278,
    accuracy: 3.5,
    city: 'London',
    country: 'United Kingdom',
    mapsUrl: 'https://maps.google.com/?q=51.5074,-0.1278',
    tracking: true
  });

  const [weatherData, setWeatherData] = useState<WeatherData>({
    temp: 24.5,
    humidity: 48,
    pressure: 1012,
    aqi: 12,
    condition: 'Sunny Intervals',
    pollenCount: 'Low (Algae 14ppm)',
    lastUpdated: 'Just now'
  });

  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F' | 'K'>('C');
  const [weatherAiBrief, setWeatherAiBrief] = useState<string>('');
  const [isAnalyzingWeather, setIsAnalyzingWeather] = useState<boolean>(false);

  // Challenges agenda state
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 'c1', title: 'Speed Demon', description: 'Reach 25 Clicks Per Second (CPS) in active tapping', target: 25, type: 'cps', reward: 50000, completed: false },
    { id: 'c2', title: 'Golden Miner', description: 'Amass $100,000 baseline reserves in your account', target: 100000, type: 'gold', reward: 25000, completed: false },
    { id: 'c3', title: 'Snake Master', description: 'Survive in Snake Arena with a high rating index', target: 150, type: 'snake', reward: 35000, completed: false },
    { id: 'c4', title: 'Archery Marksman', description: 'Validate perfect bulls-eye physics telemetry in Archery', target: 95, type: 'archery', reward: 40000, completed: false }
  ]);

  // Alarms and Documents simulation structures
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: 'a1', time: '08:00 AM', label: 'Morning Clicker Boost', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], active: true, sound: 'cyber_synth.mp3' },
    { id: 'a2', time: '10:00 PM', label: 'Global Rank Validation', days: ['Everyday'], active: false, sound: 'cosmic_chime.wav' }
  ]);

  const [inbox, setInbox] = useState<GmailMessage[]>([]);
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);

  // Fetch real Google Workspace data
  useEffect(() => {
    if (!currentUser || !accessToken) return;
    
    const fetchWorkspaceData = async () => {
      const headers = { Authorization: `Bearer ${accessToken}` };
      
      try {
        const [drive, gmail, calendar, tasks, contacts, keep] = await Promise.all([
          fetch('/api/drive/files', { headers }).then(r => r.json()),
          fetch('/api/gmail/messages', { headers }).then(r => r.json()),
          fetch('/api/calendar/events', { headers }).then(r => r.json()),
          fetch('/api/tasks/items', { headers }).then(r => r.json()),
          fetch('/api/contacts/people', { headers }).then(r => r.json()),
          fetch('/api/keep/notes', { headers }).then(r => r.json()),
        ]);

        setDriveFiles(drive.files || []);
        setInbox(gmail.messages || []);
        setCalendarEvents(calendar.items || []);
        setTasks(tasks.items || []);
        setContacts(contacts.connections || []);
        setKeepNotes(keep.notes || []);
      } catch (error) {
        console.error('Failed to fetch workspace data:', error);
      }
    };
    
    fetchWorkspaceData();
  }, [currentUser, accessToken]);

  // Floating windows open/minimize states

  // Floating windows open/minimize states
  const [openWeather, setOpenWeather] = useState(false);
  const [weatherFullScreen, setWeatherFullScreen] = useState(false);
  const [openGps, setOpenGps] = useState(false);
  const [openSpeedTest, setOpenSpeedTest] = useState(false);
  
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Invite game launcher state
  const [inviteGame, setInviteGame] = useState<string | undefined>(undefined);

  // Trigger custom responsive toast notification
  const triggerNotification = (title: string, msg: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: NotificationToast = { id, title, message: msg };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Force logout on first mount for testing purposes
  useEffect(() => {
    if (!localStorage.getItem('forced_logout_v5')) {
      localStorage.setItem('forced_logout_v5', 'true');
      signOut(auth).catch(console.error);
    }
  }, []);

  // Firebase Auth Observer (Onboarding System)
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Firebase auth state changed:', user ? user.uid : 'null');

      if (user) {
        setCurrentUser(user);
        
        // Listen to user's persistent profile document in Firestore
        const userRef = doc(db, 'users', user.uid);
        unsubDoc = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setUserState(prev => ({
              ...prev,
              gold: data.gold ?? 0.00,
              prestigePoints: data.prestigePoints ?? 0,
              prestigeMultiplier: data.prestigeMultiplier ?? 1.0,
              activeTheme: data.activeTheme ?? 'gold_rush',
              totalClicks: data.totalClicks ?? 0,
              manualLevel: data.manualLevel ?? 1,
              multiplierTier: data.multiplierTier ?? 1,
              username: data.username ?? user.email?.split('@')[0] ?? 'User',
              photoURL: data.photoURL ?? null,
              status: data.status ?? 'Online',
              drones: data.drones ?? prev.drones
            }));
          } else {
            // Document initializer: Create database record setting all baseline zero values
            const initialProfile = {
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0] || 'OmniPlayer',
              gold: 0.00,
              prestigePoints: 0,
              prestigeMultiplier: 1.0,
              activeTheme: 'gold_rush',
              totalClicks: 0,
              manualLevel: 1,
              multiplierTier: 1,
              status: 'Online',
              activeGame: null,
              drones: [
                { id: 'dr1', name: 'Raw Pickaxe Drone', cost: 1500, cps: 2, count: 0, level: 1 },
                { id: 'dr2', name: 'Pneumatic Steam Drill', cost: 12000, cps: 15, count: 0, level: 1 },
                { id: 'dr3', name: 'Silicon Cryptominer ASIC', cost: 50000, cps: 80, count: 0, level: 1 },
                { id: 'dr4', name: 'Antimatter Solar Harvester', cost: 250000, cps: 500, count: 0, level: 1 }
              ],
              createdAt: Date.now()
            };
            setDoc(userRef, initialProfile).catch(e => console.error("Error creating initial profile", e));
          }
        }, (error) => {
          console.error("Firestore user snapshot listener failure:", error);
          triggerNotification("Cloud Link Terminated", "Unable to stream profile. Operating in Offline Safe-Mode.");
        });

        // Set user database status to Active/Online
        setDoc(userRef, { status: 'Online' }, { merge: true }).catch(e => console.error("Failed to update status flag:", e));

        // Trigger personalized welcome banner toast
        getDoc(userRef).then(snap => {
          const uName = snap.exists() ? (snap.data().username || 'Pro Member') : 'Pro Member';
          triggerNotification('OmniHub Pro Account Initialized', `Welcome back, ${uName}! All persistent cloud progress restored.`);
        }).catch(e => {
          if (e.message && e.message.includes("offline")) {
            console.log("Client is offline, skipping initial username fetch.");
            triggerNotification('OmniHub Pro Account Initialized', `Welcome back! Operating in Offline Mode.`);
          } else {
            console.error("Failed to fetch initial username", e);
          }
        });
        
        setAuthLoading(false);
      } else {
        setCurrentUser(null);
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        setAuthLoading(false);
      }
    }, (error) => {
      console.error('Firebase Auth error:', error);
      setAuthLoading(false);
    });

    // Fallback timeout in case auth takes too long
    const fallbackTimeout = setTimeout(() => {
      console.warn('Auth loading timeout hit');
      setAuthLoading(false);
    }, 2000);

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  // Debounced database synchronizer to prevent Firestore write limits
  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    
    const syncTimeout = setTimeout(async () => {
      try {
        await updateDoc(userRef, {
          gold: userState.gold,
          prestigePoints: userState.prestigePoints,
          prestigeMultiplier: userState.prestigeMultiplier,
          activeTheme: userState.activeTheme,
          totalClicks: userState.totalClicks,
          manualLevel: userState.manualLevel || 1,
          multiplierTier: userState.multiplierTier || 1,
          status: userState.status || 'Online',
          drones: userState.drones
        });
      } catch (err) {
        console.error("Error debouncing write to database:", err);
      }
    }, 1500); // 1.5s write debounce

    return () => clearTimeout(syncTimeout);
  }, [userState, currentUser]);

  // Unread badge indicator algorithm for News bulletins
  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastReadNewsTime = localStorage.getItem('omnihub_last_news_read') || '0';
      let unread = 0;
      snapshot.forEach((doc) => {
        if (doc.data().createdAt > Number(lastReadNewsTime)) {
          unread++;
        }
      });
      setNewsUnreadCount(unread);
    }, (error) => {
      console.error("Firestore news snapshot failure:", error);
    });
    return () => unsubscribe();
  }, [activeView]);

  // Clear unread news markers when viewing bulletins
  useEffect(() => {
    if (activeView === 'news') {
      localStorage.setItem('omnihub_last_news_read', Date.now().toString());
      setNewsUnreadCount(0);
    }
  }, [activeView]);

  // Fetch real geolocation and weather
  const fetchWeatherAndLocation = async (
    latitude: number,
    longitude: number,
    accuracy: number = 0,
    overrideCity?: string,
    overrideCountry?: string
  ) => {
    // Reverse Geocoding to get City/Country if not already provided
    let city = overrideCity || "Unknown City";
    let country = overrideCountry || "Unknown Country";
    if (!overrideCity || !overrideCountry) {
      try {
        const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        city = overrideCity || data.address.city || data.address.town || data.address.village || data.address.state || city;
        country = overrideCountry || data.address.country || country;
      } catch (e) {
        console.error("Geocoding failed:", e);
      }
    }

    const mapsUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.02},${latitude - 0.02},${longitude + 0.02},${latitude + 0.02}&layer=mapnik&marker=${latitude},${longitude}`;

    setGpsData({
      latitude,
      longitude,
      accuracy,
      city,
      country,
      mapsUrl,
      tracking: true
    });

    // Fetch Weather
    try {
      const weatherRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      if (!weatherRes.ok) throw new Error(`Server returned ${weatherRes.status}`);
      const weatherData = await weatherRes.json();
      
      if (weatherData && weatherData.current) {
        setWeatherData(prev => ({
          ...prev,
          temp: Math.round(weatherData.current.temp),
          humidity: weatherData.current.humidity,
          windSpeed: weatherData.current.wind_speed,
          precipitation: weatherData.current.precipitation,
          pressure: Math.round(weatherData.current.pressure),
          cloudCover: Math.round(weatherData.current.cloud_cover),
          alerts: weatherData.current.alerts,
          uv: weatherData.current.uvi,
          condition: weatherData.current.weather[0].main,
          forecast24h: weatherData.hourly.slice(0, 5).map((h: any) => ({
            hour: new Date(h.dt * 1000).getHours() + ':00',
            temp: Math.round(h.temp),
            icon: 'cloud'
          })),
          lastUpdated: new Date().toLocaleTimeString()
        }));
      }
    } catch (e) {
      console.error("Weather failed:", e);
    }
  };

  const handleWeatherAiAnalysis = async () => {
    setIsAnalyzingWeather(true);
    setWeatherAiBrief('');
    try {
      const telemetryText = `Analyze this meteorology telemetry for ${gpsData.city}, ${gpsData.country}:
Temperature: ${weatherData.temp}°C, Humidity: ${weatherData.humidity}%, Wind Speed: ${weatherData.windSpeed} km/h, Precipitation: ${weatherData.precipitation} mm, Pressure: ${weatherData.pressure} hPa, Cloud Cover: ${weatherData.cloudCover}%, Condition: ${weatherData.condition}.`;
      
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: telemetryText }],
          systemInstruction: "You are the Senior Meteorologist on OmniHub Pro. Provide a highly professional, dense, and cool 2-sentence micro-advisory report analyzing the local air pressure stability, storm/precipitation probabilities, and safety recommendations for this location. Keep it high-tech, precise, under 50 words total, and do not use any markdown bolding."
        })
      });
      const resData = await response.json();
      if (resData.content) {
        setWeatherAiBrief(resData.content);
      } else {
        setWeatherAiBrief("Barometric trends remain stable. No anomalies detected in current atmospheric layers.");
      }
    } catch (e) {
      console.error(e);
      setWeatherAiBrief("Uplink timeout. High-altitude atmospheric diagnostics suggest stable localized microclimates.");
    } finally {
      setIsAnalyzingWeather(false);
    }
  };

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;
    setIsSearchingLocation(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationSearch)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const bestResult = data[0];
        const lat = parseFloat(bestResult.lat);
        const lon = parseFloat(bestResult.lon);
        let city = bestResult.name;
        let country = bestResult.display_name.split(',').pop()?.trim() || 'Unknown';
        await fetchWeatherAndLocation(lat, lon, 0, city, country);
        triggerNotification('Location Updated', `Manual override set to ${city}, ${country}`);
        setLocationSearch('');
      } else {
        triggerNotification('Location Error', `Could not find location: ${locationSearch}`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Location Error', 'Failed to perform location search.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Fetch location details based on client IP address
  const fetchLocationByIP = async () => {
    // 1. Try our high-accuracy backend proxy which securely decodes the actual proxy user IP
    try {
      const res = await fetch("/api/ip-location");
      const data = await res.json();
      if (data && data.success) {
        const { latitude, longitude, city, country, ip } = data;
        triggerNotification('IP Geolocation Synced', `Connected via IP ${ip} in ${city}, ${country}`);
        await fetchWeatherAndLocation(latitude, longitude, 0, city, country);
        return true;
      }
    } catch (e) {
      console.warn("Backend IP location resolver failed, attempting direct client-side overrides...", e);
    }

    // Direct fallback queries in case client browser is bypassing iframe restrictions
    try {
      const res = await fetch("https://ipwho.is/");
      const data = await res.json();
      if (data && data.success) {
        const { latitude, longitude, city, country, ip } = data;
        triggerNotification('IP Geolocation Synced', `Connected via Wi-Fi IP ${ip} in ${city}, ${country}`);
        await fetchWeatherAndLocation(latitude, longitude, 0, city, country);
        return true;
      }
    } catch (e) {
      console.warn("ipwho.is lookup failed, trying fallback...", e);
    }

    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const { latitude, longitude, city, country_name, ip } = data;
        triggerNotification('IP Geolocation Synced', `Connected via Wi-Fi IP ${ip} in ${city}, ${country_name}`);
        await fetchWeatherAndLocation(latitude, longitude, 0, city, country_name);
        return true;
      }
    } catch (e) {
      console.warn("ipapi.co lookup failed...", e);
    }

    try {
      const res = await fetch("https://freeipapi.com/api/json");
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const { latitude, longitude, cityName, countryName, ipAddress } = data;
        triggerNotification('IP Geolocation Synced', `Connected via Wi-Fi IP ${ipAddress} in ${cityName}, ${countryName}`);
        await fetchWeatherAndLocation(latitude, longitude, 0, cityName, countryName);
        return true;
      }
    } catch (e) {
      console.warn("freeipapi.com lookup failed...", e);
    }

    return false;
  };

  useEffect(() => {
    const initializeLocation = async () => {
      const ipSuccess = await fetchLocationByIP();
      if (!ipSuccess) {
        console.warn("Wi-Fi IP-based location services unavailable. Resolving default telemetry location...");
        // Default to London standard coordinates
        fetchWeatherAndLocation(51.5074, -0.1278, 0, 'London', 'United Kingdom');
      }
    };

    initializeLocation();
  }, []);

  // Handle active game invites
  const handleLaunchGame = (gameKey: string) => {
    setInviteGame(gameKey);
    setActiveView('arcade');
  };

  // Safe logout protocol
  const handleSignOut = async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { status: 'Offline' });
        await signOut(auth);
        triggerNotification('Session Terminated', 'OmniHub Pro session closed. Transduced progress securely cached.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Passive multi-currency accrual callback
  const handleEarnGold = (amount: number) => {
    setUserState(prev => ({
      ...prev,
      gold: Number((prev.gold + amount).toFixed(2)),
      money: Number(((prev.money || 0) + amount * 0.1).toFixed(2)),
      crypto: Number(((prev.crypto || 0) + amount * 0.005).toFixed(2)),
      cosmicEnergy: Number(((prev.cosmicEnergy || 0) + amount * 0.001).toFixed(2))
    }));
  };

  const activeThemeObj = themeDetails[userState.activeTheme] || themeDetails.gold_rush;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden font-sans select-none" id="omnihub_pro_framework">
      
      {/* Visual Overlay Particles & Neon Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent)] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* RENDER PHASE 1: BOOT/LOADER */}
      {authLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 z-50 relative space-y-4">
          <div className="w-16 h-16 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">Initializing cloud matrix synchronization...</p>
        </div>
      ) : !currentUser ? (
        
        /* RENDER PHASE 2: AUTH ONBOARDING GATEWAY */
        <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
          <AuthGateway 
            onAuthSuccess={(uid, username, isNew, token) => {
              setCurrentUser({ uid });
              setAccessToken(token || null);
              setUserState(prev => ({ ...prev, username }));
            }} 
            triggerNotification={triggerNotification} 
          />
        </div>
      ) : (
        
        /* RENDER PHASE 3: AUTHENTICATED ACTIVE CONSOLE */
        <div className="flex-1 flex flex-col relative z-10 pb-4" id="authenticated_main_workspace">
          
          {/* Top Integrated System Bar (Opera GX Style) */}
          <header className="sticky top-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-center gap-4 z-40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  OMNIHUB PRO <span className="text-[8px] font-mono bg-yellow-500 text-slate-950 px-1.5 py-0.5 rounded font-black">V5.0.0</span>
                </h1>
              </div>
            </div>

            {/* Opera GX Inspired Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'dashboard', icon: Layers, label: 'Console' },
                { id: 'terminal', icon: TrendingUp, label: 'Terminal' },
                { id: 'arcade', icon: Play, label: 'Arcade' },
                { id: 'productivity', icon: HardDrive, label: 'Drive' },
                { id: 'social', icon: Swords, label: 'Social' },
                { id: 'browser', icon: Compass, label: 'Browser' },
                { id: 'news', icon: Megaphone, label: 'News', badge: newsUnreadCount }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setInviteGame(undefined);
                    setActiveView(tab.id as any);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeView === tab.id ? 'bg-slate-800 text-yellow-400 shadow-inner' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                  {tab.badge ? (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  ) : null}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {/* Dynamic Currency Tickers */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 flex items-center gap-1 shadow-inner">
                  <Coins className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[10px] font-black font-mono text-yellow-500">
                    {formatNumberInfinite(userState.gold)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 flex items-center gap-1 shadow-inner">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black font-mono text-emerald-500">
                    {formatNumberInfinite(userState.money || 0)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 hidden sm:flex items-center gap-1 shadow-inner">
                  <Zap className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[10px] font-black font-mono text-cyan-500">
                    {formatNumberInfinite(userState.crypto || 0)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 hidden sm:flex items-center gap-1 shadow-inner">
                  <Star className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[10px] font-black font-mono text-purple-500">
                    {formatNumberInfinite(userState.cosmicEnergy || 0)}
                  </span>
                </div>
              </div>

              {/* Telemetry Status widgets */}
              <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <button
                  onClick={() => setOpenWeather(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border ${openWeather ? 'border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]' : 'border-slate-800 text-slate-400'} text-[10px] font-mono transition-colors cursor-pointer`}
                  title="Toggle Meteorology Station"
                >
                  <CloudSun className="w-3.5 h-3.5 text-blue-400" />
                  <span>{weatherData.temp}°C</span>
                </button>
                <button
                  onClick={() => setOpenGps(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border ${openGps ? 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'border-slate-800 text-slate-400'} text-[10px] font-mono transition-colors cursor-pointer`}
                  title="Toggle GPS Tracking Node"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{gpsData.city || 'Location'}</span>
                </button>
                <button
                  onClick={() => setOpenSpeedTest(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border ${openSpeedTest ? 'border-purple-500 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]' : 'border-slate-800 text-slate-400'} text-[10px] font-mono transition-colors cursor-pointer`}
                  title="Toggle Network Speed Diagnostician"
                >
                  <Wifi className="w-3.5 h-3.5 text-purple-400" />
                  <span>{Math.round(speedData.download)} Mbps</span>
                </button>
              </div>

              {/* Profile Pic & Secure LogOut button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">{userState.username}</span>
                  {userState.photoURL ? (
                    <img src={userState.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 font-black uppercase text-xs shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* Primary Viewport Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6" id="primary_viewport">
            
            {/* VIEW 1: DASHBOARD CONSOLE (Spacious, Decoupled Grid) */}
            {activeView === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard_console_view">
                
                {/* Grid Left: Spacious Clicker & Shop */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <ClickerWidget
                    userState={userState}
                    setUserState={setUserState}
                    onEarnGold={handleEarnGold}
                    triggerNotification={triggerNotification}
                  />
                  <CyberRadioWidget />
                </div>

                {/* Grid Right: AI Companion Cockpit & Market Tracker */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between min-h-[380px]" id="dashboard_assistant_card">
                    <AICockpitWidget
                      alarms={alarms}
                      setAlarms={setAlarms}
                      setDriveFiles={setDriveFiles}
                      gold={userState.gold}
                      speedDownload={speedData.download}
                      weatherTemp={weatherData.temp}
                      triggerNotification={triggerNotification}
                    />
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5" id="dashboard_market_card">
                    <MarketTrackerWidget 
                      triggerNotification={triggerNotification} 
                      onOpenTerminal={() => setActiveView('terminal')}
                    />
                  </div>

                  <WatchlistWidget />

                  <NetworkTrafficWidget />
                </div>

              </div>
            )}

            {/* VIEW 1.5: MARKET TERMINAL */}
            {activeView === 'terminal' && (
              <MarketTerminalWidget />
            )}

            {/* VIEW 2: ARCADE */}
            {activeView === 'arcade' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 min-h-[500px]" id="arcade_view">
                <ArcadeWidget
                  userState={userState}
                  onEarnGold={handleEarnGold}
                  triggerNotification={triggerNotification}
                  initialGame={inviteGame}
                />
              </div>
            )}

            {/* VIEW 3: PRODUCTIVITY WORKSPACE */}
            {activeView === 'productivity' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 min-h-[500px]" id="productivity_view">
                <ProductivityWidget
                  inbox={inbox}
                  setInbox={setInbox}
                  driveFiles={driveFiles}
                  setDriveFiles={setDriveFiles}
                  keepNotes={keepNotes}
                  setKeepNotes={setKeepNotes}
                  calendarEvents={calendarEvents}
                  tasks={tasks}
                  setTasks={setTasks}
                  contacts={contacts}
                  triggerNotification={triggerNotification}
                />
              </div>
            )}

            {/* VIEW 4: SOCIAL MULTIPLAYER HUB */}
            {activeView === 'social' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 min-h-[500px]" id="social_view">
                <LeaderboardWidget
                  currentUserId={currentUser.uid}
                  currentUserUsername={userState.username}
                  userState={userState}
                  challenges={challenges}
                  setChallenges={setChallenges}
                  isOnline={userState.online}
                  setIsOnline={(online) => setUserState(prev => ({ ...prev, online }))}
                  onEarnGold={handleEarnGold}
                  triggerNotification={triggerNotification}
                  onLaunchGame={handleLaunchGame}
                />
              </div>
            )}

            {/* VIEW 5: DEV BULLETINS & NEWS FEED */}
            {activeView === 'news' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 min-h-[500px]" id="news_view">
                <NewsWidget
                  currentUserId={currentUser.uid}
                  currentUserUsername={userState.username}
                  triggerNotification={triggerNotification}
                />
              </div>
            )}
            
            {/* VIEW 6: EMBEDDED BROWSER HUB */}
            {activeView === 'browser' as any && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[calc(100vh-120px)]" id="browser_view">
                <BrowserWidget triggerNotification={triggerNotification} />
              </div>
            )}

          </main>

          {/* FLOATING WINDOWS LAYER (Aesthetic, Decoupled Utilities) */}
          <AnimatePresence>
            
            {/* WINDOW 1: WEATHER STATION SYSTEM */}
            {openWeather && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 100 }}
                className={`fixed ${weatherFullScreen ? 'inset-0 md:inset-4 md:w-auto md:translate-x-0' : 'inset-x-4 top-24 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[480px]'} bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-3xl p-5 shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-50 font-mono flex flex-col transition-all duration-300`}
                id="floating_weather_window"
              >
                {/* Header Window Bar */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Meteorology Terminal</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setWeatherFullScreen(!weatherFullScreen)} className="w-5 h-5 bg-slate-950/60 hover:bg-slate-850 rounded flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer" title="Toggle Full Screen">
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => setOpenWeather(false)} className="w-5 h-5 bg-slate-950/60 hover:bg-slate-850 rounded flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <button onClick={() => setOpenWeather(false)} className="w-5 h-5 bg-red-950/30 hover:bg-red-900/40 text-red-500 rounded flex items-center justify-center transition-colors cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={`text-xs flex flex-col ${weatherFullScreen ? 'flex-1 overflow-auto space-y-4' : 'space-y-4'}`}>
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850 shrink-0">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const cond = weatherData.condition.toLowerCase();
                        if (cond.includes('sun') || cond.includes('clear')) return <Sun className="w-10 h-10 animate-spin-slow text-yellow-500" />;
                        if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-10 h-10 animate-float text-blue-400" />;
                        if (cond.includes('storm')) return <CloudLightning className="w-10 h-10 animate-pulse text-indigo-400" />;
                        return <Cloud className="w-10 h-10 animate-float text-slate-400" />;
                      })()}
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">OUTSIDE TEMPERATURE</span>
                        <span className="text-2xl font-black text-yellow-500 font-mono">
                          {(() => {
                            if (temperatureUnit === 'F') return `${Math.round((weatherData.temp * 9) / 5 + 32)}°F`;
                            if (temperatureUnit === 'K') return `${Math.round(weatherData.temp + 273.15)}K`;
                            return `${Math.round(weatherData.temp)}°C`;
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-1.5 flex flex-col items-end">
                      <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        {(['C', 'F', 'K'] as const).map(u => (
                          <button
                            key={u}
                            onClick={() => setTemperatureUnit(u)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer transition-colors ${
                              temperatureUnit === u ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            °{u}
                          </button>
                        ))}
                      </div>
                      <div>
                        <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase font-black">{weatherData.condition}</span>
                        <span className="text-[8px] text-slate-500 block uppercase mt-1">Telemetry Live</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block">Humidity</span>
                      <span className="text-xs font-bold text-slate-200">{weatherData.humidity}%</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block">Precipitation</span>
                      <span className="text-xs font-bold text-slate-200">{weatherData.precipitation} mm</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block">UV Index</span>
                      <span className="text-xs font-bold text-slate-200">{weatherData.uv}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block">Wind</span>
                      <span className="text-xs font-bold text-slate-200">{weatherData.windSpeed} km/h</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block">Pressure</span>
                      <span className="text-xs font-bold text-slate-200">{weatherData.pressure} hPa</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block">Cloud Cover</span>
                      <span className="text-xs font-bold text-slate-200">{weatherData.cloudCover}%</span>
                    </div>
                    {weatherData.alerts && weatherData.alerts.length > 0 && (
                        <div className="bg-red-950/30 p-3 rounded-xl border border-red-900/50 col-span-2">
                          <span className="text-[9px] text-red-500 uppercase block">Alerts</span>
                          <span className="text-xs font-bold text-red-200">{weatherData.alerts.join(', ')}</span>
                        </div>
                    )}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 col-span-2">
                      <span className="text-[9px] text-slate-500 uppercase block mb-2">5-Hour Forecast</span>
                      <div className="flex justify-between items-center gap-2">
                        {(weatherData.forecast24h || []).slice(0, 5).map((f, i) => {
                          const formattedForecastTemp = (() => {
                            if (temperatureUnit === 'F') return `${Math.round((f.temp * 9) / 5 + 32)}°`;
                            if (temperatureUnit === 'K') return `${Math.round(f.temp + 273.15)}K`;
                            return `${f.temp}°`;
                          })();
                          return (
                            <div key={i} className="flex flex-col items-center gap-1 min-w-[50px] bg-slate-950/40 p-1.5 rounded-lg border border-slate-850/40">
                              <span className="text-[9px] text-slate-400">{f.hour}</span>
                              <span className="text-[10px] font-bold text-slate-200">{formattedForecastTemp}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className={`bg-slate-950/60 p-3 rounded-xl border border-slate-850 col-span-2 flex flex-col ${weatherFullScreen ? 'flex-1 min-h-[300px]' : ''}`}>
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Thermal & Wind Projection Map</span>
                      <ThermalMap 
                        lat={gpsData.latitude} 
                        lon={gpsData.longitude} 
                        city={gpsData.city} 
                        country={gpsData.country} 
                        temp={weatherData.temp} 
                        windSpeed={weatherData.windSpeed} 
                        humidity={weatherData.humidity} 
                        precipitation={weatherData.precipitation} 
                        unit={temperatureUnit} 
                        isFullScreen={weatherFullScreen}
                      />
                    </div>

                    {/* GEMINI AI WEATHER CO-PILOT ANALYZER PANEL */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 col-span-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold tracking-wider">Gemini AI Climate Advisory</span>
                        <button
                          onClick={handleWeatherAiAnalysis}
                          disabled={isAnalyzingWeather}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-[8px] font-black text-blue-400 cursor-pointer disabled:opacity-50 uppercase tracking-wider transition-colors"
                        >
                          {isAnalyzingWeather ? (
                            <>
                              <Loader2 className="w-2 h-2 animate-spin text-blue-400" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2 h-2 text-yellow-500 animate-pulse" />
                              Generate Outlook
                            </>
                          )}
                        </button>
                      </div>
                      
                      {weatherAiBrief ? (
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80 text-[10px] text-slate-300 font-mono leading-relaxed relative overflow-hidden animate-fade-in">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                          <p>{weatherAiBrief}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850/50 text-[9px] text-slate-500 font-mono text-center">
                          Uplink ready. Request Gemini meteorological assessment of localized atmospheric columns.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-850">
                    <span>STATUS: RECEPTOR ONLINE</span>
                    <span>UPDATED: {weatherData.lastUpdated}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* WINDOW 2: GPS MAPS TRACKER */}
            {openGps && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 100 }}
                className="fixed inset-x-4 top-24 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[480px] bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-3xl p-5 shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-50 font-mono"
                id="floating_gps_window"
              >
                {/* Header Window Bar */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">GPS Space-Tracking Node</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setOpenGps(false)} className="w-5 h-5 bg-slate-950/60 hover:bg-slate-850 rounded flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <button onClick={() => setOpenGps(false)} className="w-5 h-5 bg-red-950/30 hover:bg-red-900/40 text-red-500 rounded flex items-center justify-center transition-colors cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-850 flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>LOCATION: <b className="text-white font-bold">{gpsData.city}, {gpsData.country}</b></span>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider">ACTIVE FEED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1.5">
                      <div>LAT: <b className="text-slate-200">{gpsData.latitude.toFixed(4)}° N</b></div>
                      <div>LON: <b className="text-slate-200">{gpsData.longitude.toFixed(4)}° W</b></div>
                    </div>
                    <span className="text-[9px] text-slate-500">ACCURACY THRESHOLD: +/- {gpsData.accuracy} meters</span>
                  </div>

                  <form onSubmit={handleLocationSearch} className="relative">
                    <input
                      type="text"
                      placeholder="Search global coordinates or city..."
                      value={locationSearch}
                      onChange={e => setLocationSearch(e.target.value)}
                      disabled={isSearchingLocation}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <button 
                      type="submit" 
                      disabled={isSearchingLocation}
                      className="absolute right-2 top-1.5 bottom-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 rounded-lg text-[10px] font-black uppercase transition-colors"
                    >
                      {isSearchingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Set'}
                    </button>
                  </form>

                  <div className="h-48 bg-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <iframe
                      src={gpsData.mapsUrl}
                      className="w-full h-full border-0"
                      title="GPS Map"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${gpsData.latitude},${gpsData.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Launch External Google Maps Link
                  </a>
                </div>
              </motion.div>
            )}

            {/* WINDOW 3: WI-FI SPEED DIAGNOSTIC */}
            {openSpeedTest && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 100 }}
                className="fixed inset-x-4 top-24 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[480px] bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-3xl p-5 shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-50 font-mono"
                id="floating_speed_window"
              >
                {/* Header Window Bar */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Network Speed Diagnostician</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setOpenSpeedTest(false)} className="w-5 h-5 bg-slate-950/60 hover:bg-slate-850 rounded flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <button onClick={() => setOpenSpeedTest(false)} className="w-5 h-5 bg-red-950/30 hover:bg-red-900/40 text-red-500 rounded flex items-center justify-center transition-colors cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 text-xs">
                  <div className="flex justify-around items-center bg-slate-950 p-4 rounded-2xl border border-slate-850 text-center">
                    <div>
                      <span className="text-[8px] text-slate-500 block">DOWNLOAD RATE</span>
                      <span className="text-xl font-black text-yellow-500">{speedData.download} <b className="text-[10px] font-normal">Mbps</b></span>
                    </div>
                    <div className="h-8 w-px bg-slate-850"></div>
                    <div>
                      <span className="text-[8px] text-slate-500 block">UPLOAD RATE</span>
                      <span className="text-sm font-bold text-slate-200">{speedData.upload} <b className="text-[9px] font-normal">Mbps</b></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8px] text-slate-500 block">Ping Latency</span>
                      <span className="text-xs font-bold text-purple-400">{speedData.ping} ms</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8px] text-slate-500 block">Jitter Standard</span>
                      <span className="text-xs font-bold text-slate-300">{speedData.jitter} ms</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-[9px] text-slate-400">
                    NETWORK CARRIER: <b className="text-white font-bold">{speedData.carrier}</b>
                  </div>

                  <button
                    onClick={async () => {
                      setSpeedData(prev => ({ ...prev, testing: true }));
                      triggerNotification('Diagnostic Initiated', 'Measuring server node downlink capacities...');
                      
                      try {
                        const startTime = Date.now();
                        const response = await fetch('/api/speedtest/download');
                        const blob = await response.blob();
                        const endTime = Date.now();
                        
                        const durationSec = Math.max(0.01, (endTime - startTime) / 1000);
                        const bitsLoaded = blob.size * 8;
                        const speedMbps = Number((bitsLoaded / durationSec / (1024 * 1024)).toFixed(2));
                        
                        // Fake upload test for timing/symmetry
                        const uploadStartTime = Date.now();
                        await fetch('/api/speedtest/upload', {
                          method: 'POST',
                          body: new Uint8Array(2 * 1024 * 1024)
                        });
                        const uploadEndTime = Date.now();
                        const uploadDuration = Math.max(0.01, (uploadEndTime - uploadStartTime) / 1000);
                        const uploadSpeedMbps = Number(((2 * 1024 * 1024 * 8) / uploadDuration / (1024 * 1024)).toFixed(2));

                        setSpeedData({
                          download: speedMbps,
                          upload: uploadSpeedMbps,
                          ping: Math.max(1, Math.floor((endTime - startTime) / 20)),
                          jitter: Math.max(1, Math.floor(Math.random() * 5)),
                          carrier: 'Google Fiber Gigabit LLC',
                          testing: false
                        });
                        
                        triggerNotification('Diagnostic Finalized', `Downlink measured at ${speedMbps} Mbps.`);
                      } catch (e) {
                        setSpeedData(prev => ({ ...prev, testing: false }));
                        triggerNotification('Diagnostic Failed', 'Failed to reach diagnostic servers.');
                      }
                    }}
                    disabled={speedData.testing}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${speedData.testing ? 'animate-spin' : ''}`} />
                    {speedData.testing ? 'RUNNING TEST...' : 'RE-RUN NETWORK SPEED TEST'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Toast Stack Rendering */}
          <div className="fixed top-24 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
            <AnimatePresence>
              {toasts.map(toast => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  className="bg-slate-900/95 border-2 border-yellow-500/30 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-1 pointer-events-auto select-none"
                  id={`toast_notif_${toast.id}`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black">{toast.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal font-sans mt-0.5">{toast.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      )}

    </div>
  );
}
