'use client';

import { Sparkles, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { AudioPlayer } from './AudioPlayer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
        <CardContent className="p-4">
          <p className="whitespace-pre-wrap">{message.text}</p>
          {!isUser && message.audio && (
            <div className="mt-2 -ml-2">
              <AudioPlayer src={message.audio} />
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
