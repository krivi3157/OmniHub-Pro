import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';

export default function WatchlistWidget() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(collection(db, 'users', auth.currentUser.uid, 'watchlist'), (snapshot) => {
      setSymbols(snapshot.docs.map(doc => doc.id));
    });
    return unsub;
  }, [auth.currentUser]);

  const addSymbol = async () => {
    if (!newSymbol || !auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid, 'watchlist', newSymbol.toUpperCase()), {});
    setNewSymbol('');
  };

  const removeSymbol = async (symbol: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'watchlist', symbol));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5" id="dashboard_watchlist_card">
      <h3 className="text-white font-bold mb-4">My Watchlist</h3>
      <div className="flex gap-2 mb-4">
        <input 
          value={newSymbol} 
          onChange={(e) => setNewSymbol(e.target.value)}
          className="bg-slate-800 text-white p-2 rounded w-full border border-slate-700 focus:outline-none focus:border-blue-500"
          placeholder="e.g. AAPL"
        />
        <button onClick={addSymbol} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </div>
      <ul className="space-y-2">
        {symbols.map(s => (
          <li key={s} className="flex justify-between bg-slate-800 p-2 rounded text-slate-200">
            {s} 
            <button onClick={() => removeSymbol(s)} className="text-red-400 hover:text-red-300">X</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
