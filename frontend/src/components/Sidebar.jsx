import { useState, useCallback } from 'react';
import { 
  Plus, MessageCircle, Smile, BarChart3, LogOut, 
  Trash2, Brain, Check, X, Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteConversation } from '../services/api';

export default function Sidebar({ conversations, currentConversationId, onNewChat, onSelectConversation, onConversationDeleted }) {
  const { user, logout } = useAuth();
  
  // ⚡ New States for Inline Deletion UX
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // 🪄 1. INLINE CONFIRMATION LOGIC
  const handleDeleteRequest = useCallback((e, id) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  }, []);

  const cancelDelete = useCallback((e) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  }, []);

  const confirmDelete = async (e, id) => {
    e.stopPropagation();
    setIsDeletingId(id);
    try {
      await deleteConversation(id);
      onConversationDeleted(id);
    } catch (error) {
      console.error('Delete failed');
      // Optionally add a toast notification here for failure
    } finally {
      setIsDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="w-72 h-screen flex flex-col bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-xl font-sans">
      
      {/* User Profile */}
      <div className="p-5 border-b border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md border border-indigo-400/30">
            {user?.username?.charAt(0).toUpperCase() || <Brain size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 truncate">{user?.username || 'Student'}</p>
            <p className="text-xs font-medium text-slate-500 truncate">{user?.email || 'Logged in'}</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg text-white font-medium py-3.5 px-4 rounded-2xl transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} /> New Check-in
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-hide pb-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Recent Chats</h3>
        
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageCircle size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No conversations yet</p>
            <p className="text-xs text-slate-400 mt-1">Start a new check-in above.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              const isConfirming = confirmDeleteId === conv.id;
              const isDeleting = isDeletingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => !isDeleting && onSelectConversation(conv.id)}
                  className={`group relative w-full text-left p-3 rounded-2xl cursor-pointer transition-all overflow-hidden ${
                    isActive
                      ? 'bg-white shadow-sm border border-indigo-100/50'
                      : 'hover:bg-white/50 border border-transparent'
                  } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* 🪄 ACTIVE ACCENT BAR */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl"></div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>
                      <MessageCircle size={16} />
                    </div>
                    
                    <span className={`text-sm font-semibold truncate flex-1 ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {conv.title || 'New Chat'}
                    </span>

                    {/* 🪄 INLINE DELETION UX */}
                    <div className="flex items-center">
                      {isDeleting ? (
                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                      ) : isConfirming ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200">
                          <button onClick={(e) => confirmDelete(e, conv.id)} className="p-1 text-red-600 hover:bg-red-100 rounded-md" aria-label="Confirm delete">
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <button onClick={cancelDelete} className="p-1 text-slate-400 hover:bg-slate-200 rounded-md" aria-label="Cancel delete">
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleDeleteRequest(e, conv.id)}
                          aria-label="Delete conversation"
                          className={`p-1.5 rounded-lg transition-all ${
                            isActive ? 'opacity-100 text-indigo-300 hover:text-red-500 hover:bg-red-50' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {conv.last_message_preview && !isConfirming && (
                    <p className="text-xs font-medium text-slate-400 truncate ml-11 mt-0.5">
                      {conv.last_message_preview}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-white/50 p-4 space-y-1.5 bg-white/30 backdrop-blur-md">
        <Link to="/mood" className="flex items-center gap-3 text-slate-700 hover:bg-white hover:shadow-sm p-3 rounded-2xl transition-all font-semibold">
          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Smile size={18} /></div>
          Log Mood
        </Link>
        <Link to="/dashboard" className="flex items-center gap-3 text-slate-700 hover:bg-white hover:shadow-sm p-3 rounded-2xl transition-all font-semibold">
          <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><BarChart3 size={18} /></div>
          Dashboard
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 p-3 rounded-2xl transition-all font-semibold mt-2">
          <div className="p-1.5 bg-red-100/50 rounded-lg"><LogOut size={18} /></div>
          Logout
        </button>
      </div>
    </div>
  );
}