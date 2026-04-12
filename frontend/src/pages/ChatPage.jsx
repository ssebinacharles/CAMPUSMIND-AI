import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendMessage, listConversations, getConversation } from '../services/api';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import VoiceRecorder from '../components/VoiceRecorder';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { Send, Menu } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const { speak, stop } = useTextToSpeech();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await listConversations();
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const startNewChat = () => { setMessages([]); setConversationId(null); };
  const loadConversation = async (id) => {
    try {
      const res = await getConversation(id);
      setMessages(res.data.messages);
      setConversationId(id);
    } catch (error) {
      console.error('Failed to load conversation', error);
    }
  };
  const handleConversationDeleted = (deletedId) => {
    setConversations(prev => prev.filter(c => c.id !== deletedId));
    if (conversationId === deletedId) startNewChat();
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    stop(); // Stop any ongoing speech
    const userMsg = { id: Date.now(), sender: 'user', content: messageText, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const res = await sendMessage(messageText, conversationId);
      if (!conversationId) { setConversationId(res.data.conversation_id); loadConversations(); }
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMsg.id);
        return [...filtered, res.data.user_message, res.data.ai_message];
      });
      speak(res.data.ai_message.content);
    } catch (error) {
      console.error('Send failed', error);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) handleSendMessage(input.trim());
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
    setTimeout(() => { if (transcript.trim()) handleSendMessage(transcript.trim()); }, 300);
  };

  const suggestedPrompts = [
    { emoji: '😰', text: "I'm stressed about exams" },
    { emoji: '😟', text: "I'm feeling anxious" },
    { emoji: '😔', text: "I'm feeling down" },
    { emoji: '💬', text: "I just want to talk" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md">
        <Menu size={20} />
      </button>
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative z-40 h-screen`}>
        {loadingConversations ? <div className="w-64 h-full flex items-center justify-center bg-white border-r"><LoadingSpinner /></div> :
          <Sidebar conversations={conversations} currentConversationId={conversationId} onNewChat={startNewChat} onSelectConversation={loadConversation} onConversationDeleted={handleConversationDeleted} />}
      </div>
      <div className="flex-1 flex flex-col h-screen">
        <header className="bg-white border-b px-6 py-4 flex items-center">
          <h1 className="text-xl font-semibold">CampusMind AI</h1>
          <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full hidden sm:block">Mental Health Support</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-medium mb-2">How are you feeling today?</h2>
              <p className="text-center max-w-md mb-6">I'm here to listen and support you.</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {suggestedPrompts.map((p, i) => (
                  <button key={i} onClick={() => setInput(p.text)} className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm text-left">
                    {p.emoji} {p.text}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          {isLoading && <div className="flex justify-start"><div className="bg-white border rounded-2xl rounded-bl-none px-4 py-2 shadow-sm"><LoadingSpinner size={20} /></div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <VoiceRecorder onTranscript={handleVoiceTranscript} />
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..."
              className="flex-1 border rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
            <button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full p-3">
              <Send size={20} />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">CampusMind AI is not a substitute for professional care. Crisis? Contact Makerere Counseling: +256 414 532 630</p>
        </div>
      </div>
    </div>
  );
}