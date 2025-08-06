'use client';

import { Sparkles, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { AudioPlayer, WebSpeechPlayer } from './AudioPlayer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Determine which player to use
  const Player = message.audio ? AudioPlayer : WebSpeechPlayer;
  const playerProps = message.audio
    ? { src: message.audio, autoplay: true }
    // If there's no audio data, it means we should use the browser's voice as a fallback
    // The `language` prop ensures the browser uses the correct voice (e.g., Tamil).
    : { text: message.text, lang: message.language || 'en-US', autoplay: true };


  return (
    <div
      className={cn('flex items-start gap-4', {
        'justify-end': isUser,
      })}
    >
      {!isUser && (
        <Avatar className="h-10 w-10 border">
          <AvatarFallback>
            <Sparkles className="h-6 w-6 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn('max-w-md lg:max-w-xl', {
          'bg-primary text-primary-foreground': isUser,
          'bg-card': !isUser,
        })}
      >
        <CardContent className="p-4 flex items-start gap-2">
          <p className="whitespace-pre-wrap flex-1">{message.text}</p>
          {!isUser && (
            <div className="-mr-2 -my-2">
              <Player {...playerProps} />
            </div>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-10 w-10 border">
          <AvatarFallback>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
