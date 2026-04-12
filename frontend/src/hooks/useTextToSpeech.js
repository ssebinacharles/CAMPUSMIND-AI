import { useCallback } from 'react';

export default function useTextToSpeech() {
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google UK') || v.name.includes('Samantha') || v.name.includes('Female'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);
  const stop = useCallback(() => window.speechSynthesis?.cancel(), []);
  return { speak, stop };
}