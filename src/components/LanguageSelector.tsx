'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const languages = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', name: 'తెలుగు', flag: '🇮🇳' },
];

export function LanguageSelector({ value, onValueChange }: LanguageSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map(lang => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
