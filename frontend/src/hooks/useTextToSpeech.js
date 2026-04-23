import { useState, useEffect, useCallback } from 'react';

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  // ⚡ Load voices asynchronously to avoid empty array bug in Chrome/Safari
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices(); // Initial attempt
    
    // Listen for voices to be loaded by the browser
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // 🧹 Sanitize text: remove XML/Markdown/Emojis so the AI sounds human
  const cleanTextForSpeech = (rawText) => {
    return rawText
      .replace(/<[^>]*>?/gm, '')                     // Remove XML/HTML tags
      .replace(/[*_#`~]/g, '')                       // Remove Markdown characters
      .replace(/([\u2700-\u27BF]|\uE000-\uF8FF|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Remove emojis
      .replace(/\s+/g, ' ')                          // Collapse multiple spaces
      .trim();
  };

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel(); 
    
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // 🧠 Therapeutic pacing: slightly slower for a calmer tone
    utterance.rate = 0.95; 
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // 🎙️ Advanced voice selection with cross‑platform fallbacks
    if (voices.length > 0) {
      const preferred = voices.find(v => 
        v.name.includes('Google UK English Female') || // Chrome/Android premium
        v.name.includes('Samantha') ||                 // macOS/iOS premium
        (v.name.includes('Female') && v.lang.startsWith('en')) // Generic fallback
      );
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    // 🔄 Sync React state with speech events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}