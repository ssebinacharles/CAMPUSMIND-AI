import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendMessage, listConversations, getConversation } from '../services/api';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import VoiceRecorder from '../components/VoiceRecorder';
import BreathingWidget from '../components/BreathingWidget';
import JournalPrompt from '../components/JournalPrompt';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { Send, Menu, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 🚀 Hoisted static data
const SUGGESTED_PROMPTS = [
  { emoji: '😰', text: "I'm stressed about exams" },
  { emoji: '😟', text: "I'm feeling anxious" },
  { emoji: '😔', text: "I'm feeling down" },
  { emoji: '💬', text: "I just want to talk" },
];

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
  const [crisisDetected, setCrisisDetected] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setCrisisDetected(false);
  };

  const loadConversation = async (id) => {
    try {
      const res = await getConversation(id);
      setMessages(res.data.messages);
      setConversationId(id);
      setCrisisDetected(false);
    } catch (error) {
      console.error('Failed to load conversation', error);
    }
  };

  const handleConversationDeleted = (deletedId) => {
    setConversations(prev => prev.filter(c => c.id !== deletedId));
    if (conversationId === deletedId) startNewChat();
  };

  // 🪄 Auto‑resizing textarea logic
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ⚡ Optimistic UI send
  const handleQuickSend = (text) => {
    setInput(text);
    // Focus textarea and trigger height adjustment
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    // Optionally auto‑submit after a tiny delay (comment out if you prefer manual)
    // setTimeout(() => handleSendMessage(text), 100);
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    stop(); // Stop any ongoing speech

    const tempId = Date.now();
    const userMsg = {
      id: tempId,
      sender: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    setCrisisDetected(false);

    try {
      const res = await sendMessage(messageText, conversationId);
      if (!conversationId) {
        setConversationId(res.data.conversation_id);
        loadConversations();
      }

      const aiMsg = {
        ...res.data.ai_message,
        sender: 'ai',
      };

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [...filtered, res.data.user_message, aiMsg];
      });

      speak(aiMsg.content);

      if (aiMsg.uiAction === 'suggest_counselor') {
        setCrisisDetected(true);
      }
    } catch (error) {
      console.error('Send failed', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) handleSendMessage(input.trim());
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 font-sans">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar menu"
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur rounded-2xl shadow-lg transition-transform hover:scale-105"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative z-40 h-screen`}>
        {loadingConversations ? (
          <div className="w-72 h-full flex items-center justify-center bg-white/50 backdrop-blur-xl border-r border-white/50">
            <LoadingSpinner />
          </div>
        ) : (
          <Sidebar
            conversations={conversations}
            currentConversationId={conversationId}
            onNewChat={startNewChat}
            onSelectConversation={loadConversation}
            onConversationDeleted={handleConversationDeleted}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        <header className="bg-white/60 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center shadow-sm z-10">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 tracking-tight">
            <Sparkles className="text-indigo-500" size={20} />
            AI Support Chat
          </h1>
          <span className="hidden sm:inline-block ml-4 text-xs bg-indigo-100/80 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Mental Health Companion
          </span>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 border border-white max-w-lg w-full text-center"
              >
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">How are you feeling?</h2>
                <p className="mb-8 text-gray-500">I'm here to listen, support, and help you navigate your day.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickSend(p.text)}
                      className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-200 hover:shadow-md text-sm text-left transition-all duration-200 font-medium text-slate-700"
                    >
                      <span className="mr-2 text-lg">{p.emoji}</span> {p.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col"
                >
                  <ChatMessage message={msg} />

                  {msg.sender === 'ai' && msg.uiAction === 'activate_breathe' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start mt-3 ml-2"
                    >
                      <BreathingWidget />
                    </motion.div>
                  )}
                  {msg.sender === 'ai' && msg.uiAction === 'suggest_journal' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start mt-3 ml-2"
                    >
                      <JournalPrompt prompt="What's weighing on your mind right now?" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/80 backdrop-blur border border-white/50 rounded-2xl px-5 py-4 shadow-sm flex gap-2 items-center text-sm text-gray-500 font-medium">
                <LoadingSpinner size={16} /> AI is thinking...
              </div>
            </div>
          )}

          {crisisDetected && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              role="alert"
              aria-live="assertive"
              className="bg-red-50/95 backdrop-blur-xl border border-red-200 text-red-800 p-6 rounded-[2rem] mt-6 shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-2xl text-red-600 flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">We're concerned about you</h3>
                  <p className="text-sm mt-1 text-red-700 font-medium">You're not alone. Please reach out immediately:</p>
                  <div className="mt-4 space-y-2 text-sm font-bold bg-white/50 p-4 rounded-xl">
                    <p className="flex items-center gap-2">
                      📞 Makerere Counseling: <a href="tel:+256414532630" className="text-red-600 hover:underline">+256 414 532 630</a>
                    </p>
                    <p className="flex items-center gap-2">
                      📞 National Helpline: <a href="tel:0800212121" className="text-red-600 hover:underline">0800 21 21 21</a>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/50 bg-white/60 backdrop-blur-2xl p-4 md:p-6 pb-6 md:pb-8">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto items-end">
            <div className="pb-1">
              <VoiceRecorder onTranscript={handleVoiceTranscript} />
            </div>

            <div className="flex-1 relative bg-white border border-gray-200 shadow-sm rounded-3xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) handleSubmit(e);
                  }
                }}
                placeholder="Message CampusMind..."
                className="w-full bg-transparent px-5 py-4 focus:outline-none resize-none max-h-[120px] text-gray-700"
                rows={1}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="relative bg-indigo-600 text-white rounded-full p-4 shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-md mb-0.5 flex-shrink-0"
            >
              <Send size={20} className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'} />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner size={16} />
                </div>
              )}
            </button>
          </form>
          <div className="mt-4 text-[11px] font-medium text-gray-400 text-center tracking-wide uppercase">
            🔐 Private & Secure · ⚠️ Not medical advice
          </div>
        </div>
      </div>
    </div>
  );
}