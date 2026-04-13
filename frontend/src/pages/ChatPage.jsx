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
import { Send, Menu, AlertTriangle } from 'lucide-react';

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

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    stop(); // Stop any ongoing speech
    
    const userMsg = { 
      id: Date.now(), 
      sender: 'user', 
      content: messageText, 
      created_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setCrisisDetected(false);

    try {
      const res = await sendMessage(messageText, conversationId);
      
      if (!conversationId) {
        setConversationId(res.data.conversation_id);
        loadConversations();
      }
      
      // Create AI message object with uiAction
      const aiMsg = {
        ...res.data.ai_message,
        sender: 'ai'
      };
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMsg.id);
        return [...filtered, res.data.user_message, aiMsg];
      });
      
      // Speak the response aloud
      speak(aiMsg.content);
      
      // Check for crisis/suicide suggestion
      if (aiMsg.uiAction === 'suggest_counselor') {
        setCrisisDetected(true);
      }
    } catch (error) {
      console.error('Send failed', error);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
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
    setTimeout(() => { 
      if (transcript.trim()) handleSendMessage(transcript.trim()); 
    }, 300);
  };

  const suggestedPrompts = [
    { emoji: '😰', text: "I'm stressed about exams" },
    { emoji: '😟', text: "I'm feeling anxious" },
    { emoji: '😔', text: "I'm feeling down" },
    { emoji: '💬', text: "I just want to talk" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative z-40 h-screen`}>
        {loadingConversations ? (
          <div className="w-64 h-full flex items-center justify-center bg-white border-r">
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">AI Support Chat</h1>
          <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full hidden sm:block">
            Mental Health Support
          </span>
        </header>

        {/* Messages Container */}
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
                  <button
                    key={i}
                    onClick={() => setInput(p.text)}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm text-left transition-all duration-200 hover:scale-[1.02]"
                  >
                    {p.emoji} {p.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="flex flex-col">
                {/* Standard Chat Bubble */}
                <ChatMessage message={msg} />
                
                {/* 🚀 Conditionally Render Widgets based on Claude's uiAction */}
                {msg.sender === 'ai' && msg.uiAction === 'activate_breathe' && (
                  <div className="flex justify-start mt-2 ml-2">
                    <BreathingWidget />
                  </div>
                )}
                
                {msg.sender === 'ai' && msg.uiAction === 'suggest_journal' && (
                  <div className="flex justify-start mt-2 ml-2">
                    <JournalPrompt prompt="What's weighing on your mind right now?" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                <LoadingSpinner size={20} />
              </div>
            </div>
          )}
          
          {/* Crisis Alert UI */}
          {crisisDetected && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl mt-4 animate-pulse">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-bold">⚠️ We're concerned about you</h3>
                  <p className="text-sm mt-1">You're not alone. Please reach out immediately:</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>📞 Makerere Counseling: +256 414 532 630</p>
                    <p>📞 National Helpline: 0800 21 21 21</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <VoiceRecorder onTranscript={handleVoiceTranscript} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full p-3 transition-all duration-200 hover:scale-105"
            >
              <Send size={20} />
            </button>
          </form>
          
          {/* Ethics & Privacy Block */}
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mt-3 space-y-1 max-w-4xl mx-auto">
            <p>🔐 Private & anonymous</p>
            <p>⚠️ Not a replacement for professional care</p>
            <p>🤝 Encourages human support when needed</p>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            AI responses are supportive, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}