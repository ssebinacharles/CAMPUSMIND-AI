import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logMood } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Mic, Sparkles, X } from 'lucide-react';

const MOODS = [
  { label: 'Terrible', emoji: '😞', score: 2, color: 'from-red-500 to-rose-700' },
  { label: 'Bad', emoji: '😕', score: 4, color: 'from-orange-400 to-amber-600' },
  { label: 'Okay', emoji: '😐', score: 6, color: 'from-yellow-300 to-yellow-500' },
  { label: 'Good', emoji: '🙂', score: 8, color: 'from-emerald-400 to-teal-500' },
  { label: 'Great', emoji: '😄', score: 10, color: 'from-indigo-400 to-blue-600' }
];

const detectTags = (text) => {
  const tags = [];
  const lower = text.toLowerCase();
  if (lower.match(/\b(exam|test|study|midterm)\b/)) tags.push('📚 Exams');
  if (lower.match(/\b(stress|anxious|worry|overwhelmed)\b/)) tags.push('😰 Stress');
  if (lower.match(/\b(sleep|tired|insomnia|exhausted)\b/)) tags.push('😴 Sleep');
  if (lower.match(/\b(friend|family|lonely|relationship)\b/)) tags.push('👥 Social');
  if (lower.match(/\b(work|job|project|assignment)\b/)) tags.push('💼 Work');
  return tags;
};

const getAIFeedback = (score) => {
  if (score <= 3) return "I'm really sorry you're feeling this way. You're not alone 🤍";
  if (score <= 6) return "You're holding on. Let's take it one step at a time 💙";
  if (score <= 8) return "Nice! You're doing okay. Keep building momentum ✨";
  return "Amazing energy today! Keep shining 🌟";
};

export default function Mood() {
  const navigate = useNavigate();
  
  const [selectedMoodLabel, setSelectedMoodLabel] = useState(null);
  const [note, setNote] = useState(() => localStorage.getItem('mood_draft') || '');
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const recognitionRef = useRef(null);
  const prefersReducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const selectedMood = useMemo(() => MOODS.find(m => m.label === selectedMoodLabel), [selectedMoodLabel]);
  const activeColor = selectedMood ? selectedMood.color : 'from-slate-700 to-slate-900';
  
  const intensityClass = useMemo(() => {
    if (!selectedMood) return 'scale-100';
    if (selectedMood.score <= 4) return 'scale-90';
    if (selectedMood.score <= 7) return 'scale-105';
    return 'scale-125';
  }, [selectedMood]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setNote(prev => (prev + ' ' + finalTranscript).trim());
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    } else {
      setHasSpeechSupport(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTags(detectTags(note));
      localStorage.setItem('mood_draft', note);
    }, 500);
    return () => clearTimeout(timer);
  }, [note]);

  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) {
      setError('Please select how you\'re feeling');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await logMood(selectedMood.score, note);
      localStorage.removeItem('mood_draft');
      setAiFeedback(getAIFeedback(selectedMood.score));
      setSuccess(true);

      const destination = selectedMood.score <= 4 ? '/chat?mode=breathing' : '/dashboard';
      setTimeout(() => navigate(destination), 1200);
    } catch (err) {
      console.error('Failed to log mood:', err);
      setError('Failed to save mood. Please try again.');
      setSubmitting(false);
    }
  };

  const clearNote = () => {
    setNote('');
    localStorage.removeItem('mood_draft');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white flex flex-col items-center p-6 relative overflow-hidden font-sans">
      
      {/* Top Navigation */}
      <div className="w-full max-w-md flex justify-between items-center z-20 mt-2">
        <Link to="/chat" className="p-3 bg-white/5 rounded-full hover:bg-white/15 backdrop-blur-md transition-colors">
          <ArrowLeft size={20} className="text-gray-300" />
        </Link>
        <span className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
          Daily Check‑in
        </span>
        <div className="w-11 h-11"></div>
      </div>

      {/* Header */}
      <div className="z-20 text-center mt-8 mb-4">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">How are you feeling?</h1>
      </div>

      {/* Glowing Orb */}
      <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center z-10 my-auto will-change-transform">
        <div className={`absolute inset-[-20%] bg-gradient-to-tr ${activeColor} rounded-full opacity-30 filter blur-[80px] transition-colors duration-700 ease-in-out`}></div>
        <div className={`absolute inset-4 bg-gradient-to-b ${activeColor} rounded-full opacity-70 filter blur-[40px] transition-all duration-500 ease-in-out ${intensityClass}`}></div>
        
        <motion.div
          animate={{ scale: selectedMoodLabel ? 1.2 : 1 }}
          transition={{ type: prefersReducedMotion.current ? "tween" : "spring", stiffness: 200, damping: 12 }}
          className="relative z-20 text-8xl drop-shadow-2xl"
        >
          {selectedMood ? selectedMood.emoji : '😶'}
        </motion.div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md z-20 mt-auto flex flex-col gap-4">
        
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {success && aiFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-200 text-sm text-center backdrop-blur-md"
          >
            <Sparkles className="inline mr-1" size={16} /> {aiFeedback}
          </motion.div>
        )}

        {/* Mood Selector */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-2xl">
          <div className="flex justify-between items-center">
            {MOODS.map((mood) => (
              <button
                key={mood.label}
                type="button"
                onClick={() => setSelectedMoodLabel(mood.label)}
                className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                  selectedMoodLabel === mood.label 
                    ? 'bg-white/20 scale-110 shadow-lg border border-white/20' 
                    : 'hover:bg-white/10 hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note Field */}
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 pb-12 text-white placeholder-gray-500 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition-all resize-none"
            rows={2}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {note && (
              <button onClick={clearNote} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                <X size={16} />
              </button>
            )}
            {hasSpeechSupport && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-500/30 text-red-300 animate-pulse' 
                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                }`}
                title={isListening ? "Stop listening" : "Speak instead"}
              >
                <Mic size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Smart Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="text-xs font-medium bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedMood || submitting || success}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            selectedMood 
              ? 'bg-white text-[#0A0F1C] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02]' 
              : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
          }`}
        >
          {submitting || success ? (
             <><LoadingSpinner size={20} /> <span>{success ? 'Saved!' : 'Saving...'}</span></>
          ) : (
            selectedMood?.score <= 4 ? 'Get Support' : 'Save & Continue'
          )}
        </button>

        {/* 🔒 Psychological Trust Signal */}
        <p className="text-[10px] text-gray-500 text-center">
          🔒 Your mood data is private and never shared
        </p>
      </div>
    </div>
  );
}