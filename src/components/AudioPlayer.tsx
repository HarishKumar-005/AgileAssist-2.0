'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebSpeechPlayerProps {
  text: string;
  lang: string;
  autoplay?: boolean;
}

export function WebSpeechPlayer({ text, lang, autoplay = false }: WebSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    
    // Find a matching voice for the language
    const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;

    if (autoplay) {
      synth.speak(utterance);
    }

    return () => {
      synth.cancel();
    };
  }, [text, lang, autoplay]);

  const togglePlay = () => {
    const synth = window.speechSynthesis;
    if (!synth || !utteranceRef.current) return;

    if (isPlaying) {
      synth.cancel();
    } else {
      synth.speak(utteranceRef.current);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="icon" onClick={togglePlay}>
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
        <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>
    </div>
  );
}

interface AudioPlayerProps {
  src: string;
  autoplay?: boolean;
}

export function AudioPlayer({ src, autoplay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onCanPlay = () => {
      if (autoplay) {
        audio.play().catch(() => setIsPlaying(false));
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    // Set src and load
    audio.src = src;
    audio.load();

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    
    // Autoplay logic
    if (autoplay) {
        // Attempt to play, catching errors for browsers that block it
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Autoplay was prevented:", error);
                setIsPlaying(false);
            });
        }
    }


    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
    };
  }, [src, autoplay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  return (
    <div>
      <audio ref={audioRef} className="hidden" />
      <Button variant="ghost" size="icon" onClick={togglePlay}>
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
        <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>
    </div>
  );
}
