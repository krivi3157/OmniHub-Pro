import React, { useState, useRef } from 'react';
import { 
  auth, 
  db,
  storage,
  googleProvider, 
  githubProvider, 
  microsoftProvider, 
  signInWithPopup 
} from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Mail, Lock, User, Sparkles, Loader2, Chrome, Github, Cpu, AlertCircle, ImagePlus } from 'lucide-react';

interface AuthGatewayProps {
  onAuthSuccess: (uid: string, username: string, isNew: boolean, token?: string) => void;
  triggerNotification: (title: string, msg: string) => void;
}

export default function AuthGateway({ onAuthSuccess, triggerNotification }: AuthGatewayProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize new user progress records in Firestore
  const initializeUserInDatabase = async (uid: string, userEmail: string, chosenUsername: string, photoURL: string | null = null) => {
    const userRef = doc(db, 'users', uid);
    const initialData = {
      uid,
      email: userEmail,
      username: chosenUsername,
      photoURL,
      gold: 0.0,
      prestigePoints: 0,
      prestigeMultiplier: 1.0,
      activeTheme: 'gold_rush',
      totalClicks: 0,
      cpsHistory: [],
      online: true,
      status: 'Online',
      activeGame: null,
      manualLevel: 1,
      multiplierTier: 1,
      createdAt: Date.now(),
      drones: [
        { id: 'dr1', name: 'Raw Pickaxe Drone', cost: 1500, cps: 2, count: 0, level: 1 },
        { id: 'dr2', name: 'Pneumatic Steam Drill', cost: 12000, cps: 15, count: 0, level: 1 },
        { id: 'dr3', name: 'Silicon Cryptominer ASIC', cost: 50000, cps: 80, count: 0, level: 1 },
        { id: 'dr4', name: 'Antimatter Solar Harvester', cost: 250000, cps: 500, count: 0, level: 1 }
      ]
    };
    await setDoc(userRef, initialData);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    if (!isLogin && !username.trim()) {
      setError('Please specify an OmniHub Pro username.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // Sign In
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', credentials.user.uid);
        const snapshot = await getDoc(userRef);
        let activeUsername = email.split('@')[0];
        let isNew = false;

        if (snapshot.exists()) {
          activeUsername = snapshot.data().username || activeUsername;
        } else {
          // Fallback init if document somehow doesn't exist
          isNew = true;
          await initializeUserInDatabase(credentials.user.uid, email, activeUsername);
        }

        onAuthSuccess(credentials.user.uid, activeUsername, isNew, await credentials.user.getIdToken());
      } else {
        // Sign Up
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        
        let photoURL = null;
        if (profilePic) {
          try {
            const fileRef = ref(storage, `profile_pictures/${credentials.user.uid}_${Date.now()}`);
            await uploadBytes(fileRef, profilePic);
            photoURL = await getDownloadURL(fileRef);
          } catch (imgErr) {
            console.error("Profile picture upload failed", imgErr);
          }
        }
        
        await initializeUserInDatabase(credentials.user.uid, email, username.trim(), photoURL);
        onAuthSuccess(credentials.user.uid, username.trim(), true, await credentials.user.getIdToken());
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please switch to Login.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication sequence failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFederatedAuth = async (providerName: 'google' | 'github' | 'microsoft') => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    let provider;
    if (providerName === 'google') provider = googleProvider;
    else if (providerName === 'github') provider = githubProvider;
    else provider = microsoftProvider;

    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      const userEmail = result.user.email || `${result.user.uid}@omnihub.pro`;
      const displayName = result.user.displayName || userEmail.split('@')[0];

      // Check if user already exists in Firestore
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      let isNew = false;

      if (!snapshot.exists()) {
        isNew = true;
        await initializeUserInDatabase(uid, userEmail, displayName);
        triggerNotification('OmniHub Account Provisioned', `Welcome to the network, ${displayName}!`);
      }

      onAuthSuccess(uid, snapshot.exists() ? snapshot.data().username : displayName, isNew, await result.user.getIdToken());
    } catch (err: any) {
      console.error('Federated auth error:', err);
      // Detailed diagnostics for iframe sandbox limitations
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setError('Federated Auth window was blocked. This often happens inside web previews. Please register/login using the secure Email credentials form below instead!');
      } else {
        setError(err.message || 'Federated Authentication protocol error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      // Workaround for auth/admin-restricted-operation (Anonymous auth disabled)
      const randomId = Math.random().toString(36).substring(2, 10);
      const guestEmail = `guest_${randomId}@omnihub.pro`;
      const guestPass = `Guest123!`;
      const result = await createUserWithEmailAndPassword(auth, guestEmail, guestPass);
      const uid = result.user.uid;
      const displayName = `Guest_${uid.substring(0, 5)}`;

      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      let isNew = false;

      if (!snapshot.exists()) {
        isNew = true;
        await initializeUserInDatabase(uid, guestEmail, displayName);
        triggerNotification('Guest Access Granted', `Welcome to the network, ${displayName}!`);
      }

      onAuthSuccess(uid, snapshot.exists() ? snapshot.data().username : displayName, isNew, await result.user.getIdToken());
    } catch (err: any) {
      console.error('Guest auth error:', err);
      setError(err.message || 'Failed to initialize Guest Session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] select-none mt-10" id="onboarding_onboarding_form">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(234,179,8,0.45)] mb-3">
          <Cpu className="w-7 h-7 text-slate-950 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">OmniHub <span className="text-yellow-500">Pro</span></h2>
        <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wider">Secure Quantum Gateway</p>
      </div>

      <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
        <button
          onClick={() => { setError(null); setIsLogin(true); }}
          className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer ${isLogin ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Login
        </button>
        <button
          onClick={() => { setError(null); setIsLogin(false); }}
          className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer ${!isLogin ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Sign Up
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-3 rounded-2xl text-xs flex items-start gap-2 mb-4 leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Guest Auth Button */}
      <button
        onClick={handleGuestAuth}
        disabled={isLoading}
        className="w-full mb-4 py-3 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]"
      >
        <User className="w-4 h-4" />
        Continue as Guest (No Account Required)
      </button>

      {/* Federated OAuth Buttons */}
      <div className="space-y-2 mb-5">
        <button
          onClick={() => handleFederatedAuth('google')}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <Chrome className="w-4 h-4 text-red-400" />
          {isLogin ? 'Login with Google' : 'Sign Up with Google'}
        </button>
        <button
          onClick={() => handleFederatedAuth('github')}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <Github className="w-4 h-4 text-purple-400" />
          {isLogin ? 'Login with GitHub' : 'Sign Up with GitHub'}
        </button>
        <button
          onClick={() => handleFederatedAuth('microsoft')}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <Shield className="w-4 h-4 text-blue-400" />
          {isLogin ? 'Login with Microsoft' : 'Sign Up with Microsoft'}
        </button>
      </div>

      <div className="flex items-center gap-2 text-slate-600 text-[10px] font-mono uppercase mb-4">
        <div className="h-px bg-slate-800/80 flex-1"></div>
        <span>or secure credentials login</span>
        <div className="h-px bg-slate-800/80 flex-1"></div>
      </div>

      {/* Form Credentials */}
      <form onSubmit={handleEmailAuth} className="space-y-3.5">
        {!isLogin && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">Profile Picture (Optional)</label>
              <div 
                className="w-16 h-16 mx-auto bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-slate-500" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">OmniHub Pro Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  disabled={isLoading}
                  placeholder="e.g. SpeedRunnerPro"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="email"
              disabled={isLoading}
              placeholder="e.g. agent@omnihub.pro"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase block">Secret Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="password"
              disabled={isLoading}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(234,179,8,0.25)] cursor-pointer mt-5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying uplink security...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 animate-pulse" />
              {isLogin ? 'Login to OmniHub' : 'Create OmniHub Account'}
            </>
          )}
        </button>
      </form>
      
      <p className="text-[9px] text-slate-600 font-mono text-center mt-6 leading-relaxed px-4">
        * Note: If you are continually asked to login across refreshes, your browser may be blocking third-party cookies in this preview. Open the app in a new tab using the icon in the top right to enable proper session persistence.
      </p>
    </div>
  );
}
