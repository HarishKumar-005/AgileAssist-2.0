'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

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
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <h2 className="text-2xl font-semibold">PolyLingua Knowledge Assistant</h2>
            <p className="mt-2">
              Press the microphone button to start a conversation.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
