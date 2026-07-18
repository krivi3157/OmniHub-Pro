import React, { useState } from 'react';
import { Mail, HardDrive, Edit3, Calendar, CheckSquare, Users, Plus, Trash2, Send, RefreshCw, FileText, Check } from 'lucide-react';
import { GmailMessage, DriveFile, KeepNote, CalendarEvent, GoogleTask, GoogleContact } from '../types';

interface ProductivityWidgetProps {
  inbox: GmailMessage[];
  setInbox: React.Dispatch<React.SetStateAction<GmailMessage[]>>;
  driveFiles: DriveFile[];
  setDriveFiles: React.Dispatch<React.SetStateAction<DriveFile[]>>;
  keepNotes: KeepNote[];
  setKeepNotes: React.Dispatch<React.SetStateAction<KeepNote[]>>;
  calendarEvents: CalendarEvent[];
  tasks: GoogleTask[];
  setTasks: React.Dispatch<React.SetStateAction<GoogleTask[]>>;
  contacts: GoogleContact[];
  triggerNotification: (title: string, msg: string) => void;
}

type ActiveSuiteTab = 'gmail' | 'drive' | 'keep' | 'calendar' | 'tasks' | 'contacts';

export default function ProductivityWidget({
  inbox,
  setInbox,
  driveFiles,
  setDriveFiles,
  keepNotes,
  setKeepNotes,
  calendarEvents,
  tasks,
  setTasks,
  contacts,
  triggerNotification
}: ProductivityWidgetProps) {
  const [activeTab, setActiveTab] = useState<ActiveSuiteTab>('gmail');

  // Syncing states
  const [syncing, setSyncing] = useState(false);

  // --- GMAIL STATES ---
  const [activeMessage, setActiveMessage] = useState<GmailMessage | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const sendGmailDraft = () => {
    if (!composeTo || !composeSubject || !composeBody) {
      triggerNotification('Validation Failed', 'Recipient, subject, and body must be populated.');
      return;
    }
    const newMessage: GmailMessage = {
      id: 'm' + (inbox.length + 1),
      from: `To: ${composeTo}`,
      subject: composeSubject,
      body: composeBody,
      date: 'Just now',
      read: true
    };
    setInbox(prev => [newMessage, ...prev]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    triggerNotification('Gmail Draft Dispatched', 'Draft message synchronized into Gmail outbox queue.');
  };

  const readGmailMessage = (msg: GmailMessage) => {
    setActiveMessage(msg);
    setInbox(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, read: true } : m))
    );
  };


  // --- KEEP NOTES STATES ---
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const addKeepNote = () => {
    if (!newNoteTitle || !newNoteContent) return;
    const newNote: KeepNote = {
      id: 'k' + (keepNotes.length + 1),
      title: newNoteTitle,
      content: newNoteContent,
      date: 'Just now'
    };
    setKeepNotes(prev => [newNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    triggerNotification('Keep Note Saved', 'Note synchronized with online Google Ecosystem servers.');
  };

  const deleteKeepNote = (id: string) => {
    setKeepNotes(prev => prev.filter(n => n.id !== id));
    triggerNotification('Keep Note Deleted', 'Note deleted from database.');
  };


  // --- TASKS STATES ---
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTaskItem = () => {
    if (!newTaskTitle) return;
    const newTask: GoogleTask = {
      id: 't' + (tasks.length + 1),
      title: newTaskTitle,
      completed: false
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    triggerNotification('Task Added', 'Task checklist item created.');
  };

  const toggleTaskState = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };


  // --- SYNC HUB MECHANISM ---
  const triggerEcosystemSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      triggerNotification('Google Ecosystem Synced', 'Successfully aggregated Gmail updates, Drive revisions, and Keep logs.');
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 font-sans select-none" id="productivity_suite_root">
      
      {/* Ecosystem sync bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"></div>
          <div>
            <h4 className="text-xs font-black text-slate-200 uppercase">Google Suite Hub</h4>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">OAuth Link Established</span>
          </div>
        </div>

        <button
          onClick={triggerEcosystemSync}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold font-mono text-pink-400 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'SYNCHRONIZING...' : 'SYNC ALL DATA'}
        </button>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
        {[
          { tab: 'gmail', label: 'Gmail', icon: Mail },
          { tab: 'drive', label: 'Drive', icon: HardDrive },
          { tab: 'keep', label: 'Keep', icon: Edit3 },
          { tab: 'calendar', label: 'Calendar', icon: Calendar },
          { tab: 'tasks', label: 'Tasks', icon: CheckSquare },
          { tab: 'contacts', label: 'People', icon: Users }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab as any)}
              className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === item.tab
                  ? 'bg-pink-600/15 border border-pink-500/40 text-pink-400 font-bold shadow-[0_0_12px_rgba(236,72,153,0.15)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 min-h-[250px]">
        
        {/* --- TAB: GMAIL READ/WRITE --- */}
        {activeTab === 'gmail' && (
          <div className="space-y-3" id="gmail_module">
            {isComposing ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300">Compose New Draft Message</span>
                  <button onClick={() => setIsComposing(false)} className="text-[10px] text-slate-500 hover:text-white">CANCEL</button>
                </div>

                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Recipient address (e.g. boss@google.com)"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500"
                  />
                  <input
                    type="text"
                    placeholder="Subject line"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500"
                  />
                  <textarea
                    placeholder="Compose mail body content here..."
                    rows={4}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 resize-none"
                  />
                </div>

                <button
                  onClick={sendGmailDraft}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  DISPATCH DRAFT MESSAGE
                </button>
              </div>
            ) : activeMessage ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{activeMessage.subject}</h4>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{activeMessage.from} • {activeMessage.date}</span>
                  </div>
                  <button onClick={() => setActiveMessage(null)} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold">CLOSE</button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900 p-3 rounded-2xl border border-slate-800/60 whitespace-pre-line">
                  {activeMessage.body}
                </p>
                <button
                  onClick={() => {
                    setComposeTo(activeMessage.from.replace('To: ', ''));
                    setComposeSubject(`Re: ${activeMessage.subject}`);
                    setIsComposing(true);
                    setActiveMessage(null);
                  }}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-xl uppercase"
                >
                  Reply
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Received Inbox (Gmail Nodes)</span>
                  <button
                    onClick={() => setIsComposing(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-pink-600/10 hover:bg-pink-600/20 text-pink-400 border border-pink-500/20 rounded-xl text-[10px] font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    COMPOSE MAIL
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {inbox.map(m => (
                    <div
                      key={m.id}
                      onClick={() => readGmailMessage(m)}
                      className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                        m.read
                          ? 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-850'
                          : 'bg-pink-600/5 border-pink-500/20 hover:bg-pink-600/10'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${m.read ? 'bg-slate-600' : 'bg-pink-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">{m.from}</span>
                          <span className="text-[9px] text-slate-600 font-mono">{m.date}</span>
                        </div>
                        <h5 className={`text-xs block truncate ${m.read ? 'text-slate-300 font-normal' : 'text-slate-100 font-bold'}`}>{m.subject}</h5>
                        <p className="text-[10px] text-slate-500 block truncate mt-0.5">{m.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: DRIVE DIRECTORY BROWSER --- */}
        {activeTab === 'drive' && (
          <div className="space-y-3" id="drive_module">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">My Google Drive Files (Secure Folder Link)</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {driveFiles.map(f => (
                <div key={f.id} className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center gap-3">
                  {f.type === 'image' && f.url ? (
                    <img src={f.url} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-800" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-pink-500 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 block truncate">{f.name}</p>
                    <span className="text-[9px] text-slate-500 block">{f.type.toUpperCase()} • {f.size} • {f.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-slate-500 italic">
              *All generated images and media exports from the Creative AI Studio are automatically aggregated straight into this Drive folder.
            </p>
          </div>
        )}

        {/* --- TAB: KEEP NOTES LIST --- */}
        {activeTab === 'keep' && (
          <div className="space-y-3" id="keep_module">
            {/* Input card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-2">
              <input
                type="text"
                placeholder="Keep note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
              />
              <textarea
                placeholder="Write out quick daily thoughts..."
                rows={2}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 outline-none resize-none"
              />
              <button
                onClick={addKeepNote}
                className="w-full py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl uppercase"
              >
                SYNC NOTE
              </button>
            </div>

            {/* Note items display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
              {keepNotes.map(n => (
                <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                      <button onClick={() => deleteKeepNote(n.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 block text-right mt-2">{n.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: CALENDAR SCHEDULES --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-3" id="calendar_module">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Google Calendar Agenda Feed</span>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {calendarEvents.map(e => (
                <div key={e.id} className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    e.type === 'meeting' ? 'bg-red-400' : e.type === 'social' ? 'bg-blue-400' : 'bg-yellow-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-200">{e.title}</p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Time: {e.time} • Date: {e.date}</span>
                  </div>
                  <span className="bg-slate-950 px-2.5 py-1 text-[9px] font-mono text-slate-400 rounded-lg uppercase">
                    {e.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: TASKS CHECKLIST --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-3" id="tasks_module">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Google Tasks Todo List</span>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add high-priority task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
              />
              <button
                onClick={addTaskItem}
                className="px-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold font-mono"
              >
                ADD
              </button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {tasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskState(t.id)}
                  className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-850"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    t.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700'
                  }`}>
                    {t.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span className={`text-xs font-mono ${t.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: CONTACTS LIST --- */}
        {activeTab === 'contacts' && (
          <div className="space-y-3" id="contacts_module">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Google Contacts Synced Database</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {contacts.map(c => (
                <div key={c.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center font-bold text-xs text-pink-400 uppercase shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 block truncate">{c.name}</p>
                    <span className="text-[9px] text-slate-500 block truncate">{c.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
