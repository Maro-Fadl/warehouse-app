'use client';

import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
];

export function LanguageToggle() {
  const [open, setOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(languages[0]);

  useEffect(() => {
    // Get stored language or detect from browser
    const stored = localStorage.getItem('NEXT_LOCALE');
    const detected = navigator.language.startsWith('ar') ? 'ar' : 'en';
    const code = stored || detected;
    const lang = languages.find(l => l.code === code) || languages[0];
    setCurrentLang(lang);
    applyLanguage(lang);
  }, []);

  const applyLanguage = (lang: Language) => {
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
    localStorage.setItem('NEXT_LOCALE', lang.code);

    // Set cookie for server-side detection
    document.cookie = `NEXT_LOCALE=${lang.code};path=/;max-age=31536000`;
  };

  const handleSelect = (lang: Language) => {
    setCurrentLang(lang);
    applyLanguage(lang);
    setOpen(false);

    // Reload to apply changes server-side
    window.location.reload();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        title={`Language: ${currentLang.nativeName}`}
        className="relative"
      >
        <Globe className="h-5 w-5" />
        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded px-0.5">
          {currentLang.code.toUpperCase()}
        </span>
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-popover shadow-lg py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors',
                  currentLang.code === lang.code && 'bg-muted'
                )}
              >
                <div>
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{lang.name}</div>
                </div>
                {currentLang.code === lang.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
