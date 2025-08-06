'use client';

import { LoaderCircle, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  isListening: boolean;
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ isListening, isLoading, onClick, disabled }: MicButtonProps) {
  const getIcon = () => {
    if (isLoading) {
      return <LoaderCircle className="h-8 w-8 animate-spin" />;
    }
    if (isListening) {
      return <MicOff className="h-8 w-8" />;
    }
    return <Mic className="h-8 w-8" />;
  };

  return (
    <Button
      size="icon"
      className={cn(
        'h-20 w-20 rounded-full shadow-lg transition-all duration-300 ease-in-out',
        isListening && 'bg-destructive/90 scale-110 shadow-xl shadow-destructive/50',
        isLoading && 'bg-muted-foreground',
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {getIcon()}
    </Button>
  );
}
