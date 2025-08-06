'use client';

import { Sparkles, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { AudioPlayer, WebSpeechPlayer, FallbackPlayer } from './AudioPlayer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const renderPlayer = () => {
    // Don't render a player for user messages
    if (isUser) return null;

    // For the initial welcome message, use the WebSpeechPlayer.
    if (message.isWelcome) {
      return <WebSpeechPlayer text={message.text} lang={message.language || 'en-US'} />;
    }
    
    // If we have a dedicated audio source URL from Google TTS, use the AudioPlayer.
    if (message.audio) {
      return <AudioPlayer src={message.audio} />;
    }
    
    // If there's no audio source, it means we used the browser's voice as a fallback.
    // Provide a button to replay it.
    return <FallbackPlayer text={message.text} lang={message.language || 'en-US'} />;
  };

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
              {renderPlayer()}
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

    