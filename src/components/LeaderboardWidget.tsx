import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { 
  Trophy, Users, Swords, Globe, Radio, Zap, 
  UserPlus, Check, MessageSquare, Send, X, Flame, ShieldAlert, Award
} from 'lucide-react';
import { UserState, Challenge, Friendship, ChatMessage } from '../types';

interface LeaderboardWidgetProps {
  currentUserId: string;
  currentUserUsername: string;
  userState: UserState;
  challenges: Challenge[];
  setChallenges: React.Dispatch<React.SetStateAction<Challenge[]>>;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  onEarnGold: (amount: number) => void;
  triggerNotification: (title: string, msg: string) => void;
  onLaunchGame?: (game: string) => void;
}

interface RealUserEntry {
  uid: string;
  username: string;
  gold: number;
  prestigePoints: number;
  status: string;
  activeGame: string | null;
}

export default function LeaderboardWidget({
  currentUserId,
  currentUserUsername,
  userState,
  challenges,
  setChallenges,
  isOnline,
  setIsOnline,
  onEarnGold,
  triggerNotification,
  onLaunchGame
}: LeaderboardWidgetProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'crew' | 'challenges'>('leaderboard');
  
  // Real Players from database
  const [globalPlayers, setGlobalPlayers] = useState<RealUserEntry[]>([]);
  const [activeLobbyPlayers, setActiveLobbyPlayers] = useState<RealUserEntry[]>([]);
  
  // Asynchronous Friendship Workflow States
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<{ success?: boolean; msg: string } | null>(null);
  
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<Friendship[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<{ [uid: string]: RealUserEntry }>({});

  // Real-time Chat States
  const [selectedFriend, setSelectedFriend] = useState<RealUserEntry | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Load Leaderboard and Active Players from Database
  useEffect(() => {
    if (!isOnline) {
      setGlobalPlayers([{
        uid: currentUserId,
        username: currentUserUsername,
        gold: userState.gold,
        prestigePoints: userState.prestigePoints,
        status: 'Online',
        activeGame: null
      }]);
      setActiveLobbyPlayers([{
        uid: currentUserId,
        username: currentUserUsername,
        gold: userState.gold,
        prestigePoints: userState.prestigePoints,
        status: 'Online',
        activeGame: null
      }]);
      return;
    }

    // Real-time listener for ALL registered players (Zero Spoofing Policy)
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const players: RealUserEntry[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        players.push({
          uid: d.uid || doc.id,
          username: d.username || 'Anonymous',
          gold: d.gold || 0,
          prestigePoints: d.prestigePoints || 0,
          status: d.status || 'Offline',
          activeGame: d.activeGame || null
        });
      });

      // Sort leaderboard strictly by score
      const sortedPlayers = [...players].sort((a, b) => b.gold - a.gold);
      setGlobalPlayers(sortedPlayers);

      // Active player count includes ONLY users currently logged in and not offline
      const onlinePlayers = players.filter(p => p.status !== 'Offline');
      setActiveLobbyPlayers(onlinePlayers);
    }, (error) => {
      console.error("Firestore global users leaderboard snapshot failure:", error);
    });

    return () => unsubscribeUsers();
  }, [isOnline, currentUserId, currentUserUsername, userState.gold, userState.prestigePoints]);

  // Social Friendships listener
  useEffect(() => {
    if (!isOnline) return;

    // Retrieve friendships involving the current user
    const qSender = query(collection(db, 'friendships'), where('senderId', '==', currentUserId));
    const qReceiver = query(collection(db, 'friendships'), where('receiverId', '==', currentUserId));

    const loadFriendships = () => {
      const unsubSender = onSnapshot(qSender, (snapshotSender) => {
        const sRequests: Friendship[] = [];
        snapshotSender.forEach(d => sRequests.push({ id: d.id, ...d.data() } as Friendship));
        
        const unsubReceiver = onSnapshot(qReceiver, (snapshotReceiver) => {
          const rRequests: Friendship[] = [];
          snapshotReceiver.forEach(d => rRequests.push({ id: d.id, ...d.data() } as Friendship));

          const allFriendships = [...sRequests, ...rRequests];
          setFriendships(allFriendships);

          // Categorize requests
          // Pending received (visible to current user)
          setPendingRequests(allFriendships.filter(f => f.receiverId === currentUserId && f.status === 'pending'));
          // Accepted mutual links
          setAcceptedFriends(allFriendships.filter(f => f.status === 'accepted'));
        }, (err) => {
          console.error("Friendships receiver query snapshot failure:", err);
        });
      }, (err) => {
        console.error("Friendships sender query snapshot failure:", err);
      });
    };

    loadFriendships();
  }, [isOnline, currentUserId]);

  // Load real-time friend presence & scores
  useEffect(() => {
    if (!isOnline || acceptedFriends.length === 0) return;

    const friendIds = acceptedFriends.map(f => f.senderId === currentUserId ? f.receiverId : f.senderId);
    
    // Listen to changes of these specific users
    const unsubscribers = friendIds.map(fId => {
      return onSnapshot(doc(db, 'users', fId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const d = docSnapshot.data();
          setFriendProfiles(prev => ({
            ...prev,
            [fId]: {
              uid: fId,
              username: d.username,
              gold: d.gold || 0,
              prestigePoints: d.prestigePoints || 0,
              status: d.status || 'Offline',
              activeGame: d.activeGame || null
            }
          }));
        }
      }, (err) => {
        console.error(`Friend profile snapshot failure for UID ${fId}:`, err);
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [acceptedFriends, isOnline, currentUserId]);

  // Handle Friend Request lookup
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFeedback(null);
    if (!friendSearchInput.trim()) return;

    const targetUsername = friendSearchInput.trim();
    if (targetUsername.toLowerCase() === currentUserUsername.toLowerCase()) {
      setSearchFeedback({ msg: 'Cannot add yourself as a friend.' });
      return;
    }

    try {
      // Find user document by username
      const q = query(collection(db, 'users'), where('username', '==', targetUsername));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchFeedback({ msg: `OmniHub Pro Account "${targetUsername}" not found. Verify username and spelling.` });
        return;
      }

      const targetDoc = querySnapshot.docs[0];
      const targetData = targetDoc.data();
      const targetUserId = targetDoc.id;

      // Check if friendship already exists
      const alreadyFriends = friendships.some(f => 
        (f.senderId === currentUserId && f.receiverId === targetUserId) ||
        (f.senderId === targetUserId && f.receiverId === currentUserId)
      );

      if (alreadyFriends) {
        setSearchFeedback({ msg: `A request or mutual connection already exists with ${targetUsername}.` });
        return;
      }

      // Create pending friendship request document
      const requestRef = doc(collection(db, 'friendships'));
      await setDoc(requestRef, {
        id: requestRef.id,
        senderId: currentUserId,
        senderUsername: currentUserUsername,
        receiverId: targetUserId,
        receiverUsername: targetUsername,
        status: 'pending',
        createdAt: Date.now()
      });

      setFriendSearchInput('');
      setSearchFeedback({ success: true, msg: `Friend Request transmitted successfully to ${targetUsername}!` });
      triggerNotification('Social Handshake Transmitted', `Friend request sent to ${targetUsername}.`);
    } catch (err: any) {
      console.error(err);
      setSearchFeedback({ msg: 'Social transaction protocol failed.' });
    }
  };

  // Handshake Approval Event (mutual friendship approval)
  const handleApproveFriend = async (request: Friendship) => {
    try {
      await updateDoc(doc(db, 'friendships', request.id), {
        status: 'accepted'
      });
      triggerNotification('Mutual Handshake Confirmed', `You are now mutually connected with ${request.senderUsername}!`);
    } catch (err) {
      console.error(err);
      triggerNotification('Handshake Error', 'Failed to approve friendship.');
    }
  };

  // Real-time chat messaging subscription
  useEffect(() => {
    if (!selectedFriend || !isOnline) return;

    // Room ID is deterministic to prevent index errors
    const roomId = currentUserId < selectedFriend.uid 
      ? `${currentUserId}_${selectedFriend.uid}` 
      : `${selectedFriend.uid}_${currentUserId}`;

    const q = query(
      collection(db, 'chats'), 
      where('roomId', '==', roomId), 
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach(d => {
        messages.push({ id: d.id, ...d.data() } as ChatMessage);
      });
      setChatMessages(messages);
      
      // Scroll to bottom
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Firestore chat snapshot query failure:", err);
    });

    return () => unsubscribe();
  }, [selectedFriend, isOnline, currentUserId]);

  // Transmit instant message
  const handleSendMessage = async (e?: React.FormEvent, inviteGame?: 'snake' | 'racing' | 'chess' | 'minesweeper' | 'archery' | null) => {
    if (e) e.preventDefault();
    if (!selectedFriend || !isOnline) return;
    if (!messageInput.trim() && !inviteGame) return;

    const roomId = currentUserId < selectedFriend.uid 
      ? `${currentUserId}_${selectedFriend.uid}` 
      : `${selectedFriend.uid}_${currentUserId}`;

    const textContent = inviteGame 
      ? `🎮 INVITE: Join my head-to-head match in ${inviteGame.toUpperCase()}!` 
      : messageInput.trim();

    try {
      await addDoc(collection(db, 'chats'), {
        roomId,
        senderId: currentUserId,
        senderUsername: currentUserUsername,
        receiverId: selectedFriend.uid,
        content: textContent,
        createdAt: Date.now(),
        inviteGame: inviteGame || null,
        inviteActive: inviteGame ? true : null
      });

      setMessageInput('');
      if (inviteGame) {
        triggerNotification('Game Challenge Broadcasted', `Challenging ${selectedFriend.username} to ${inviteGame}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimChallenge = (id: string) => {
    const challenge = challenges.find(c => c.id === id);
    if (!challenge) return;

    onEarnGold(challenge.reward);
    setChallenges(prev =>
      prev.map(c => (c.id === id ? { ...c, completed: true } : c))
    );
    triggerNotification('Mission Accomplished!', `Claimed $${challenge.reward} Gold for completing challenge: ${challenge.title}.`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 font-sans select-none" id="social_suite_root">
      
      {/* Network Presence & Active Lobby Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></div>
            {isOnline && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60"></div>}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight">Active Social Hub</h4>
            <span className="text-[10px] text-slate-500 font-mono uppercase font-black block mt-0.5">
              {isOnline 
                ? `${activeLobbyPlayers.length} Active Player${activeLobbyPlayers.length > 1 ? 's' : ''} Online ${activeLobbyPlayers.length === 1 ? '(You)' : ''}`
                : 'Offline Safe-Mode • Multi-lobby Locked'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOnline(!isOnline);
            triggerNotification(
              isOnline ? 'Offline Protocol Activated' : 'Multiplayer Uplink Transmitted',
              isOnline 
                ? 'Social synchronization deactivated. Lobbies locked.' 
                : 'Uplink established. All active lobbies fully restored.'
            );
          }}
          className={`px-3 py-1.5 rounded-xl border font-bold text-[10px] font-mono cursor-pointer transition-all ${
            isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          {isOnline ? 'DISCONNECT' : 'ESTABLISH LINK'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Side: Rankings & Friendship Actions */}
        <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between" id="social_rankings_panel">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase tracking-widest text-yellow-500 font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Rankings Matrix
              </span>
              
              <div className="flex gap-1 p-0.5 bg-slate-900 border border-slate-850 rounded-xl">
                {(['leaderboard', 'crew', 'challenges'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase cursor-pointer ${
                      activeTab === tab ? 'bg-yellow-500 text-slate-950 shadow-[0_0_8px_rgba(234,179,8,0.2)]' : 'text-slate-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB: LEADERS */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Authentic Global Leaders (Zero Spoofing)</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {globalPlayers.map((player, idx) => (
                    <div
                      key={player.uid}
                      className={`p-2.5 rounded-xl border flex justify-between items-center ${
                        player.uid === currentUserId ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.05)]' : 'bg-slate-900/40 border-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black font-mono text-slate-500 w-5 text-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-200">{player.username} {player.uid === currentUserId && '(You)'}</span>
                          <span className="text-[8px] font-mono text-slate-500 block uppercase mt-0.5">
                            Status: <strong className={player.status !== 'Offline' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>{player.status}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black font-mono text-yellow-500">${player.gold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-slate-500 font-mono">Prestige level: {player.prestigePoints}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CREW (Friends list with Add Friend search and Real-time presence) */}
            {activeTab === 'crew' && (
              <div className="space-y-4">
                {/* Search / Add Friend Form */}
                <form onSubmit={handleSendFriendRequest} className="space-y-2 bg-slate-900/50 border border-slate-850 p-3 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Lookup OmniHub Username</span>
                    <span className="text-[9px] font-mono text-slate-600">ASYNCHRONOUS PROTOCOL</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter username (exact case)"
                      value={friendSearchInput}
                      onChange={e => setFriendSearchInput(e.target.value)}
                      disabled={!isOnline}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500"
                    />
                    <button
                      type="submit"
                      disabled={!isOnline}
                      className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      ADD
                    </button>
                  </div>
                  {searchFeedback && (
                    <p className={`text-[9px] font-mono mt-1 ${searchFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {searchFeedback.msg}
                    </p>
                  )}
                </form>

                {/* Mutual Friend List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Mutual Friends Accepted ({acceptedFriends.length})</span>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {acceptedFriends.map(f => {
                      const friendId = f.senderId === currentUserId ? f.receiverId : f.senderId;
                      const friendProfile = friendProfiles[friendId] || {
                        uid: friendId,
                        username: f.senderId === currentUserId ? f.receiverUsername : f.senderUsername,
                        gold: 0,
                        prestigePoints: 0,
                        status: 'Offline',
                        activeGame: null
                      };

                      const isSelected = selectedFriend?.uid === friendProfile.uid;

                      return (
                        <div 
                          key={f.id} 
                          className={`p-2 bg-slate-900/40 border rounded-xl flex justify-between items-center transition-all ${
                            isSelected ? 'border-yellow-500/50 bg-slate-900/90' : 'border-slate-850'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-blue-400 uppercase">
                                {friendProfile.username[0]}
                              </div>
                              <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${
                                friendProfile.status !== 'Offline' ? 'bg-emerald-500' : 'bg-slate-600'
                              }`}></div>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-200 block">{friendProfile.username}</span>
                              <span className="text-[8px] font-mono text-slate-500 block uppercase">
                                {friendProfile.status !== 'Offline' 
                                  ? (friendProfile.activeGame ? `Playing ${friendProfile.activeGame}` : 'Idle Online') 
                                  : 'Offline'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedFriend(friendProfile)}
                            className="px-2.5 py-1.2 rounded-lg text-[9px] font-bold bg-blue-500 text-slate-950 hover:bg-blue-400 cursor-pointer flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3 h-3" />
                            SECURE CHAT
                          </button>
                        </div>
                      );
                    })}

                    {acceptedFriends.length === 0 && (
                      <p className="text-[10px] text-slate-500 font-mono uppercase text-center py-4 border border-dashed border-slate-850 rounded-2xl">
                        No accepted crew members. Lookup users above to add crew.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CHALLENGES */}
            {activeTab === 'challenges' && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Multiplayer Missions Agenda</span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {challenges.map(c => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl border border-slate-850 bg-slate-900/40 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-200">{c.title}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">+${c.reward}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{c.description}</p>
                      
                      <button
                        onClick={() => handleClaimChallenge(c.id)}
                        disabled={c.completed}
                        className={`w-full py-1.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                          c.completed
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        }`}
                      >
                        {c.completed ? 'COMPLETED' : 'VALIDATE & CLAIM'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider italic mt-4">
            *Offline safe-mode preserves progress locally; multiplayer sync resumes on link restoration.
          </p>
        </div>

        {/* Right Side: Active Real-Time Secure Chat or Social Notifications */}
        <div className="md:col-span-5 flex flex-col gap-4">
          
          {/* Incoming Friendship Requests (Targeted Notifications Dashboard only visible to recipient) */}
          {pendingRequests.length > 0 && (
            <div className="bg-slate-950 border-2 border-yellow-500/40 rounded-3xl p-4 shadow-[0_0_20px_rgba(234,179,8,0.15)] animate-bounce">
              <span className="text-xs uppercase tracking-widest text-yellow-500 font-bold flex items-center gap-1.5 mb-2">
                <UserPlus className="w-4 h-4 text-yellow-500 animate-pulse" />
                Crew Request Handshake
              </span>
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-slate-200">{req.senderUsername}</span>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Wants to unlock secure chat channel</p>
                    </div>
                    <button
                      onClick={() => handleApproveFriend(req)}
                      className="px-2.5 py-1.2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-lg text-[9px] font-black cursor-pointer uppercase flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secure Instant Messenger Screen */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between h-[360px]" id="secure_chat_console">
            {selectedFriend ? (
              <div className="flex flex-col h-full justify-between">
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-[9px] uppercase text-blue-400">
                      {selectedFriend.username[0]}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-200 block leading-tight">{selectedFriend.username}</span>
                      <span className="text-[8px] font-mono text-slate-500 block">ENCRYPTED CHAT ROOM</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedFriend(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-2 max-h-[190px]">
                  {chatMessages.map(msg => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                          isOwn 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                        }`}>
                          <span className="text-[8px] font-mono text-slate-400 uppercase block mb-1 font-black">
                            {msg.senderUsername}
                          </span>
                          
                          {/* Chat body text */}
                          <p className="break-words font-sans">{msg.content}</p>

                          {/* Render game invites deep link */}
                          {msg.inviteGame && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                              <span className="text-[8px] font-mono text-yellow-300 uppercase tracking-widest font-black flex items-center gap-1.5">
                                <Swords className="w-3 h-3 text-yellow-400 animate-bounce" />
                                Interactive Duel Invite
                              </span>
                              <button
                                onClick={() => {
                                  if (onLaunchGame) {
                                    onLaunchGame(msg.inviteGame!);
                                    triggerNotification('Duel Accepted', `Connecting to ${selectedFriend.username}'s active room...`);
                                  }
                                }}
                                className="w-full py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-[9px] uppercase rounded-lg cursor-pointer transition-all mt-1"
                              >
                                Accept Match & Launch Game
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef}></div>

                  {chatMessages.length === 0 && (
                    <div className="text-center py-10 text-[10px] text-slate-500 font-mono uppercase">
                      Conversation opened. Send message to authenticate session link.
                    </div>
                  )}
                </div>

                {/* Action forms and Invites */}
                <div className="border-t border-slate-850 pt-2.5 space-y-2">
                  {/* Game Invite quick triggers */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                    <span className="text-[8px] font-mono text-slate-500 uppercase self-center shrink-0">Invites:</span>
                    {(['snake', 'racing', 'chess', 'minesweeper', 'archery'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => handleSendMessage(undefined, g)}
                        className="px-2 py-0.8 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/20 text-yellow-400 font-bold text-[8px] uppercase tracking-wider rounded-md cursor-pointer shrink-0"
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={e => handleSendMessage(e)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type encrypted message..."
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-yellow-500"
                    />
                    <button
                      type="submit"
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                <h4 className="text-xs font-black text-slate-400 uppercase">Encrypted Messengers</h4>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[180px] leading-normal font-mono">
                  Select mutual crew members in the "Crew" tab to authenticate a real-time messaging link.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
