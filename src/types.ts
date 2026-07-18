export interface NotificationToast {
  id: string;
  title: string;
  message: string;
}

export type ThemeType = 'gold_rush' | 'money_tycoon' | 'crypto_farm' | 'cosmic_harvest';

export interface Drone {
  id: string;
  name: string;
  cost: number;
  cps: number;
  count: number;
  level: number;
}

export interface UserState {
  gold: number;
  money: number;
  crypto: number;
  cosmicEnergy: number;
  prestigePoints: number;
  prestigeMultiplier: number;
  activeTheme: ThemeType;
  totalClicks: number;
  cpsHistory: number[];
  drones: Drone[];
  online: boolean;
  username: string;
  photoURL?: string | null;
  status?: 'Online' | 'Offline' | 'Away' | 'Playing';
  activeGame?: string | null;
  manualLevel?: number; // Manual Clicker tier
  multiplierTier?: number; // Multiplier tier
}

// Rich Friend request & mutual status
export interface Friendship {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  status: 'pending' | 'accepted';
  createdAt: number;
}

// Chat Messages with Deep-Link Invites
export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  content: string;
  createdAt: number;
  inviteGame?: 'snake' | 'racing' | 'chess' | 'minesweeper' | 'archery' | null;
  inviteActive?: boolean;
}

// Developer News Item
export interface DeveloperNews {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  unread?: boolean;
}


export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  aqi: number;
  uv: string;
  windSpeed: number;
  pressure: number;
  pollenCount: number;
  precipitation: number;
  cloudCover: number;
  alerts: string[];
  forecast24h: { hour: string; temp: number; icon: string }[];
  outlook14d: { day: string; tempMax: number; tempMin: number; condition: string }[];
}

export interface SpeedTestData {
  ping: number;
  jitter: number;
  download: number;
  upload: number;
  history: number[];
  running: boolean;
}

export interface GPSData {
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  cachedMapLoaded: boolean;
}

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  url?: string;
}

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  type: 'meeting' | 'social' | 'personal';
}

export interface GoogleTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoogleContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  cps: number;
  game: string;
  country: string;
}

export interface FriendEntry {
  id: string;
  username: string;
  online: boolean;
  score: number;
  cps: number;
  game: string;
  activeGame: string | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  type: 'cps' | 'gold' | 'snake' | 'archery' | 'racing';
  reward: number;
  completed: boolean;
}

export interface Alarm {
  id: string;
  time: string;
  label: string;
  days: string[];
  active: boolean;
  sound: string;
}

export interface DashboardConfig {
  pinnedWidgets: string[];
  showTemp: boolean;
  showAqi: boolean;
  showUV: boolean;
  showWind: boolean;
  showSpeedPing: boolean;
  showSpeedJitter: boolean;
  showGpsAlt: boolean;
  showGpsHeading: boolean;
}
