
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, LoaderCircle, Sparkles, User } from 'lucide-react';

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
  language: 'en-US',
  isWelcome: true, 
};


export default function Home() {
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([initialWelcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { isSupported: isWebSpeechSupported, speak, cancel, areVoicesReady } = useWebSpeech();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Play welcome message only when Web Speech API is ready
  useEffect(() => {
    if (isWebSpeechSupported && areVoicesReady && chatHistory[0]?.id === 'initial-welcome') {
      speak(initialWelcomeMessage.text, initialWelcomeMessage.language || 'en-US');
    }
    // Cleanup speech on unmount
    return () => {
      cancel();
    }
  }, [isWebSpeechSupported, areVoicesReady, speak, cancel, chatHistory]);

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
    if (!transcript.trim() || !isConfigured) {
       setIsLoading(false);
       return;
    }

    const newChatHistory = chatHistory[0]?.id === 'initial-welcome' ? [] : chatHistory;

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
        } else {
          // Fallback to Web Speech API
          console.log('Google TTS failed, falling back to Web Speech API.');
          speak(answer, responseLanguage);
          const errorData = await ttsRes.json();
          const errorMessage = errorData.error || 'Unknown TTS error';
          console.log('Failed to generate audio:', errorMessage);
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
         speak(answer, responseLanguage);
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
  }, [isConfigured, chatHistory, speak, toast]);

  useEffect(() => {
    if (!isMounted || !isWebSpeechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // We already check for isWebSpeechSupported, but this is a belts-and-suspenders check
      if (isMounted) { // only show toast if component is mounted
        toast({
          title: 'Browser Not Supported',
          description: 'Speech recognition is not supported in your browser.',
          variant: 'destructive',
        });
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // We let the AI determine the language, so we can be broad here.
    // However, some browsers may perform better with a specific language code.
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      // If isLoading is true, it means we are processing a transcript, so no need to do anything.
      // If it's false, it means recognition ended without a final result (e.g., timeout, manual stop).
      if (!isLoading) {
        // You might want to handle this case, e.g., show a message 'did not catch that'
      }
    };
    recognition.onerror = (event) => {
       console.error('Speech recognition error:', event.error);
       toast({
        title: 'Speech Recognition Error',
        description: event.error === 'no-speech' ? 'No speech was detected.' : event.error,
        variant: 'destructive',
      });
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript.trim();
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      setInterimTranscript(interim);

      if (finalTranscript) {
        recognitionRef.current?.stop(); // Stop listening as soon as we have a final result
        setIsLoading(true);
        processTranscript(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
  }, [isMounted, isWebSpeechSupported, toast, processTranscript, isLoading]);

  const handleMicClick = () => {
    if (isLoading) return;

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      cancel(); // Stop any currently playing audio
      try {
        recognition.start();
      } catch(e) {
        // This can happen if start() is called while it's already starting.
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
          disabled={!isConfigured || !isWebSpeechSupported}
        />
      </footer>
    </div>
  );
}
