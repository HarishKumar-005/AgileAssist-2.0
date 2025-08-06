'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ChatHistoryProps {
  history: ChatMessageType[];
  onPromptClick: (prompt: string) => void;
}

const suggestedPrompts = [
  'Explain photosynthesis in simple terms.',
  'What are the main themes in "To Kill a Mockingbird"?',
  'Give me a fun fact about the Roman Empire.',
];

export function ChatHistory({ history, onPromptClick }: ChatHistoryProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history]);

  return (
    <ScrollArea className="h-full" ref={scrollAreaRef}>
       <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {history.length > 0 ? (
          history.map(msg => <ChatMessage key={msg.id} message={msg} />)
        ) : (
          <div className="flex h-[calc(100vh-18rem)] flex-col items-center justify-center text-center">
            <Sparkles className="h-12 w-12 text-primary/80" />
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              Welcome to AgileAssist
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your AI-powered assistant for the classroom.
            </p>
            <p className="mt-1 text-muted-foreground">
              Press the microphone or try one of these prompts to get started:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                {suggestedPrompts.map((prompt) => (
                    <Card
                      key={prompt}
                      className="cursor-pointer transition-transform hover:scale-105 hover:bg-muted/50"
                      onClick={() => onPromptClick(prompt)}
                    >
                        <CardContent className="p-4">
                            <p className="text-sm font-medium">{prompt}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}