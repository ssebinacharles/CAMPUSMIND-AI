import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function VoiceRecorder({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onresult = (event) => onTranscript(event.results[0][0].transcript);
    recognitionRef.current.onerror = (e) => { console.error(e); setIsRecording(false); setIsProcessing(false); };
    recognitionRef.current.onend = () => { setIsRecording(false); setIsProcessing(false); };
    recognitionRef.current.start();
    setIsProcessing(true);
  };

  const stopRecording = () => recognitionRef.current?.stop();

  return (
    <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing && !isRecording}
      className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      title={isRecording ? 'Stop recording' : 'Start voice input'}>
      {isProcessing && !isRecording ? <Loader2 size={20} className="animate-spin" /> : isRecording ? <Square size={20} /> : <Mic size={20} />}
    </button>
  );
}