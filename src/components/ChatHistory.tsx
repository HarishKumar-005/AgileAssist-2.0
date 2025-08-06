
'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface ChatHistoryProps {
  history: ChatMessageType[];
}

export function ChatHistory({ history }: ChatHistoryProps) {
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
             Press the microphone to get started.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
