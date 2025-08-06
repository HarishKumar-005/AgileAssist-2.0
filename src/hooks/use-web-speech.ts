'use client';

import { useState, useEffect, useCallback } from 'react';

export function useWebSpeech() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const speak = useCallback((text: string, lang: string) => {
    if (!isSupported) {
      console.error('Web Speech API is not supported in this browser.');
      return;
    }
    
    // Cancel any ongoing speech before starting a new one
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    // Attempt to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    
    if (voice) {
      utterance.voice = voice;
    } else if (voices.length === 0) {
      // If voices are not loaded yet, wait for them
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const updatedVoice = updatedVoices.find(v => v.lang === lang) || updatedVoices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (updatedVoice) {
          utterance.voice = updatedVoice;
        }
        window.speechSynthesis.speak(utterance);
        // Clean up the event listener
        window.speechSynthesis.onvoiceschanged = null;
      };
      // In some browsers, you might need to call getVoices again to trigger the event
      window.speechSynthesis.getVoices();
      return;
    }

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);
  
  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  return { isSupported, speak, cancel };
}
