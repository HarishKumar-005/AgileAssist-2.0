
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, LoaderCircle, Mic, MicOff, Sparkles, User } from 'lucide-react';

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useWebSpeech } from '@/hooks/use-web-speech';
import { MicButton } from '@/components/MicButton';
import { ChatHistory } from '@/components/ChatHistory';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';

const initialWelcomeMessage: ChatMessageType = {
  id: 'initial-welcome',
  role: 'assistant',
  text: 'Welcome to AgileAssist! How can I help you today?',
  audio: undefined,
};


export default function Home() {
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([initialWelcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-US'); // Default for speech recognition
  const [isMounted, setIsMounted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { speak, cancel } = useWebSpeech();

  useEffect(() => {
    setIsMounted(true);
    // Cleanup speech on unmount
    return () => {
      cancel();
    }
  }, []);

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

  const processTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim() || !isConfigured) return;

    setIsLoading(true);

    const newChatHistory = chatHistory[0]?.id === 'initial-welcome' ? [] : chatHistory;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      text: transcript,
    };
    setChatHistory([...newChatHistory, userMessage]);

    let assistantText = '';
    let audioData: string | undefined = undefined;

    try {
      const assistanceRes = await fetch('/api/gen-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'multilingualAssistance',
          payload: { question: transcript, languageCode: language }, // languageCode is still sent but ignored by the new prompt
        }),
      });

      if (!assistanceRes.ok) {
         const errorData = await assistanceRes.json();
         throw new Error(errorData.error || 'Failed to get answer from AI.');
      }
      const { answer } = await assistanceRes.json();
      assistantText = answer;

      try {
        const ttsRes = await fetch('/api/gen-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'textToSpeech',
            payload: { text: answer, languageCode: language },
          }),
        });

        if (ttsRes.ok) {
          const { media } = await ttsRes.json();
          audioData = media;
        } else {
          // Fallback to Web Speech API
          console.log('Google TTS failed, falling back to Web Speech API.');
          speak(answer, language);
          const errorData = await ttsRes.json();
          const errorMessage = errorData.error || 'Unknown TTS error';
          console.error('Failed to generate audio:', errorMessage);
          if (typeof errorMessage === 'string' && errorMessage.includes('429')) {
             toast({
              title: 'Audio Generation Limit Reached',
              description: 'Using browser voice as a fallback.',
              variant: 'destructive',
            });
          }
        }
      } catch (ttsError) {
         console.error('An error occurred during TTS call, falling back to Web Speech API:', ttsError);
         speak(answer, language);
      }

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: 'An Error Occurred',
        description: errorMessage,
        variant: 'destructive',
      });
      // Use a generic error message if the AI fails completely
      assistantText = "I'm sorry, but I encountered an error and can't respond right now.";
    } finally {
      if (assistantText) {
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: assistantText,
          audio: audioData,
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
      setIsLoading(false);
    }
  }, [language, toast, isConfigured, chatHistory, speak]);

  useEffect(() => {
    if (!isMounted) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'Browser Not Supported',
        description: 'Speech recognition is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };
    recognition.onerror = (event) => {
      toast({
        title: 'Speech Recognition Error',
        description: event.error,
        variant: 'destructive',
      });
    };
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalTranscript) {
        processTranscript(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
  }, [isMounted, language, toast, processTranscript]);

  const handleMicClick = () => {
    if (isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Cancel any browser speech synthesis when starting a new recognition
      cancel();
      // Use a broad language code for recognition to catch different languages.
      if (recognitionRef.current) {
        recognitionRef.current.lang = 'en-US'; // We can keep this simple, as the AI will handle language switching.
      }
      recognitionRef.current?.start();
    }
  };

  if (!isMounted) {
    return null; // Or a loading spinner
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
              <CardContent className="p-4 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    <p className="text-muted-foreground">Thinking...</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
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
}
