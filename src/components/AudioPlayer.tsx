'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerProps {
  // A function to handle playing the audio.
  play: () => void;
  // A function to handle stopping/pausing the audio.
  stop: () => void;
  // A flag indicating if audio is currently playing.
  isPlaying: boolean;
}

/**
 * A generic player control component.
 */
function PlayerControl({ play, stop, isPlaying }: PlayerProps) {
  const togglePlay = () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={togglePlay}>
      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
    </Button>
  );
}

interface WebSpeechPlayerProps {
  text: string;
  lang: string;
}

/**
 * A component to play text using the browser's native Web Speech API.
 * This is used for the welcome message.
 */
export function WebSpeechPlayer({ text, lang }: WebSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    utteranceRef.current = utterance;

    return () => {
      synth.cancel();
    };
  }, [text, lang]);

  const play = () => {
    const synth = window.speechSynthesis;
    if (synth && utteranceRef.current) {
      synth.speak(utteranceRef.current);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
  };

  return <PlayerControl play={play} stop={stop} isPlaying={isPlaying} />;
}

interface AudioPlayerProps {
  src: string;
}

/**
 * A component to control playback of an audio source.
 * This is used for AI-generated responses that have an audio source URL.
 */
export function AudioPlayer({ src }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const play = () => audioRef.current?.play().catch(e => console.error("Playback failed", e));
  const stop = () => audioRef.current?.pause();

  return <PlayerControl play={play} stop={stop} isPlaying={isPlaying} />;
}

/**
 * A component to indicate that a message can be played, but without an audio source.
 * This is used for AI-generated responses where TTS failed and we fell back
 * to the browser's voice, which was played automatically on the main page.
 * This component just provides a button to re-play it.
 */
export function FallbackPlayer({ text, lang }: WebSpeechPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const play = () => {
        const synth = window.speechSynthesis;
        if (!synth) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        synth.speak(utterance);
    }
    const stop = () => {
        window.speechSynthesis.cancel();
    }
    
    return <PlayerControl play={play} stop={stop} isPlaying={isPlaying} />;
}

    