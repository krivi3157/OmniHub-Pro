import React, { useState, useEffect } from 'react';
import { Activity, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrafficNode {
  id: string;
  ip: string;
  bytes: number;
  protocol: string;
  type: 'inbound' | 'outbound';
  timestamp: number;
}

export default function NetworkTrafficWidget() {
  const [traffic, setTraffic] = useState<TrafficNode[]>([]);
  const [activeConnections, setActiveConnections] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live packet capture
      if (Math.random() > 0.3) {
        const newNode: TrafficNode = {
          id: Date.now().toString() + Math.random(),
          ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          bytes: Math.floor(Math.random() * 4096) + 128,
          protocol: ['WSS', 'TCP', 'UDP', 'HTTPS'][Math.floor(Math.random() * 4)],
          type: Math.random() > 0.5 ? 'inbound' : 'outbound',
          timestamp: Date.now()
        };
        
        setTraffic(prev => [newNode, ...prev].slice(0, 8)); // keep last 8 packets
        setActiveConnections(Math.floor(Math.random() * 45) + 12);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden h-64 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Live Network Traffic</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase">WSS Active ({activeConnections})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 font-mono text-[9px] uppercase">
        <AnimatePresence initial={false}>
          {traffic.map(node => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center justify-between py-1 border-b border-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <span className={node.type === 'inbound' ? 'text-emerald-400' : 'text-purple-400'}>
                  {node.type === 'inbound' ? 'RX' : 'TX'}
                </span>
                <span className="text-slate-300">{node.ip}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span className="bg-slate-800 px-1.5 rounded">{node.protocol}</span>
                <span>{node.bytes} B</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
