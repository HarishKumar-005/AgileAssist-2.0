
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, LoaderCircle, Sparkles, User } from 'lucide-react';

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { MicButton } from '@/components/MicButton';
import { ChatHistory } from '@/components/ChatHistory';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';

const initialWelcomeMessage: ChatMessageType = {
  id: 'initial-welcome',
  role: 'assistant',
  text: 'Welcome to AgileAssist! How can I help you today?',
  language: 'en-US',
  isWelcome: true, 
};

const SPEECH_RECOGNITION_SILENCE_TIMEOUT = 2000; // 2 seconds

export default function Home() {
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([initialWelcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to handle component mounting
  useEffect(() => {
    setIsMounted(true);
    // Initialize a single audio element to be reused for playback.
    audioRef.current = new Audio();
  }, []);

  // Play welcome message audio using Web Speech API when the app loads.
  useEffect(() => {
    // Only play if this is the first and only message in history.
    if (isMounted && window.speechSynthesis && chatHistory.length === 1 && chatHistory[0].isWelcome) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(initialWelcomeMessage.text);
      utterance.lang = initialWelcomeMessage.language || 'en-US';
      synth.speak(utterance);
    }
  }, [isMounted, chatHistory]);


  // Check for backend configuration on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'ok') {
          setIsConfigured(false);
          toast({
            title: 'Error: Backend not configured',
            description: 'Please configure the GEMINI_API_KEY environment variable.',
            variant: 'destructive',
          });
        }
      });
  }, [toast]);

  const playAudio = useCallback((src: string) => {
    if (audioRef.current) {
        audioRef.current.src = src;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, []);

  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  }, []);

  const processTranscript = useCallback(async (transcript: string) => {
    // Ignore empty or very short transcripts
    if (!transcript.trim() || transcript.length < 2 || !isConfigured) {
       setIsLoading(false);
       return;
    }

    const newChatHistory = chatHistory[0]?.isWelcome ? [] : chatHistory;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      text: transcript,
    };
    setChatHistory([...newChatHistory, userMessage]);

    let assistantText = '';
    let audioData: string | undefined = undefined;
    let responseLanguage = 'en-US'; 

    try {
      const assistanceRes = await fetch('/api/gen-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'multilingualAssistance',
          payload: { question: transcript },
        }),
      });

      if (!assistanceRes.ok) {
         const errorData = await assistanceRes.json();
         throw new Error(errorData.error || 'Failed to get answer from AI.');
      }
      const { answer, languageCode } = await assistanceRes.json();
      assistantText = answer;
      responseLanguage = languageCode || 'en-US';

      // --- Text-to-Speech Generation with Fallback ---
      try {
        const ttsRes = await fetch('/api/gen-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'textToSpeech',
            payload: { text: answer, languageCode: responseLanguage },
          }),
        });

        if (ttsRes.ok) {
          const { media } = await ttsRes.json();
          audioData = media;
          playAudio(media); // Play audio from Google TTS
        } else {
          // Fallback to Web Speech API
          console.log('Google TTS failed, falling back to Web Speech API.');
          const synth = window.speechSynthesis;
          const utterance = new SpeechSynthesisUtterance(answer);
          utterance.lang = responseLanguage;
          synth.speak(utterance);
        }
      } catch (ttsError) {
         console.error('An error occurred during TTS call, falling back to Web Speech API:', ttsError);
         const synth = window.speechSynthesis;
         const utterance = new SpeechSynthesisUtterance(answer);
         utterance.lang = responseLanguage;
         synth.speak(utterance);
      }

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: 'An Error Occurred',
        description: errorMessage,
        variant: 'destructive',
      });
      assistantText = "I'm sorry, but I encountered an error and can't respond right now.";
    } finally {
      if (assistantText) {
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: assistantText,
          audio: audioData,
          language: responseLanguage,
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
      setIsLoading(false);
    }
  }, [isConfigured, chatHistory, toast, playAudio]);

  // Function to stop listening and process the final transcript.
  const stopListeningAndProcess = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      if (finalTranscriptRef.current) {
        setIsLoading(true);
        processTranscript(finalTranscriptRef.current);
        finalTranscriptRef.current = '';
      }
    }
  }, [isListening, processTranscript]);

  // Effect to initialize Speech Recognition
  useEffect(() => {
    if (!isMounted || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
      finalTranscriptRef.current = '';
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
    recognition.onerror = (event) => {
       console.error('Speech recognition error:', event.error);
       toast({
        title: 'Speech Recognition Error',
        description: event.error === 'no-speech' ? 'No speech was detected.' : 'An unknown error occurred.',
        variant: 'destructive',
      });
    };

    recognition.onresult = (event) => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript.trim() + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      if (final) {
          finalTranscriptRef.current += final;
      }
      setInterimTranscript(interim || finalTranscriptRef.current);

      silenceTimerRef.current = setTimeout(
        stopListeningAndProcess,
        SPEECH_RECOGNITION_SILENCE_TIMEOUT
      );
    };

    recognitionRef.current = recognition;
  }, [isMounted, toast, stopListeningAndProcess]);

  const handleMicClick = () => {
    if (isLoading) return;

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      stopListeningAndProcess();
    } else {
      stopAudio();
      try {
        recognition.start();
      } catch(e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">
            AgileAssist
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ChatHistory history={chatHistory} />
      </main>

      <footer className="relative flex flex-col items-center justify-center gap-2 p-4">
        <div className="w-full max-w-md lg:max-w-xl h-16">
          {(isListening || isLoading) && (
            <Card className="bg-muted">
              <CardContent className="p-4 flex items-center justify-center gap-2 text-center">
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    <p className="text-muted-foreground">Thinking...</p>
                  </>
                ) : (
                  <p className="text-muted-foreground truncate">
                    {interimTranscript || 'Listening...'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <MicButton
          isListening={isListening}
          isLoading={isLoading}
          onClick={handleMicClick}
          disabled={!isConfigured}
        />
      </footer>
    </div>
  );

    