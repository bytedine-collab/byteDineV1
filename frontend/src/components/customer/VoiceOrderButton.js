import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function VoiceOrderButton({ onResult, t }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice order not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast('🎤 Listening... Say your order!', { duration: 3000 });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      toast.success(`Heard: "${transcript}"`);
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'aborted') toast.error('Could not understand. Please try again.');
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`min-h-[44px] flex items-center gap-2 rounded-full border px-4 text-sm font-semibold active:scale-95 ${
        isListening
          ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          : 'bg-ash text-gray-400 border-white/10 hover:bg-smoke hover:text-white'
      }`}
    >
      🎤 {isListening ? t('listening') : t('voiceOrder')}
    </button>
  );
}
