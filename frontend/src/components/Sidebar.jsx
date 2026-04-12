import { Plus, MessageCircle, Smile, BarChart3, LogOut, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteConversation } from '../services/api';

export default function Sidebar({ conversations, currentConversationId, onNewChat, onSelectConversation, onConversationDeleted }) {
  const { user, logout } = useAuth();

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await deleteConversation(id);
      onConversationDeleted(id);
    } catch (error) {
      console.error('Delete failed');
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Recent Chats</h3>
        {conversations.map((conv) => (
          <div key={conv.id} onClick={() => onSelectConversation(conv.id)}
            className={`group relative w-full text-left px-3 py-2 rounded-lg mb-1 cursor-pointer ${
              conv.id === currentConversationId ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
            <div className="flex items-center gap-2">
              <MessageCircle size={14} />
              <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
              <button onClick={(e) => handleDelete(e, conv.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
                <Trash2 size={12} className="text-gray-500" />
              </button>
            </div>
            {conv.last_message_preview && <p className="text-xs text-gray-500 truncate ml-6">{conv.last_message_preview}</p>}
          </div>
        ))}
      </div>

      <div className="border-t p-4 space-y-1">
        <Link to="/mood" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg"><Smile size={18} /> Log Mood</Link>
        <Link to="/dashboard" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg"><BarChart3 size={18} /> Dashboard</Link>
        <button onClick={logout} className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 p-2 rounded-lg"><LogOut size={18} /> Logout</button>
      </div>
    </div>
  );
}