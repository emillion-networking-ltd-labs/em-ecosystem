'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: 'EN', name: 'English (United Kingdom)' },
  { code: 'ES', name: 'Español (España)' },
  { code: 'FR', name: 'Français (France)' },
];

const STORAGE_KEY = 'nexacore-language';

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Language>(LANGUAGES[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = LANGUAGES.find(l => l.code === stored);
      if (found) setSelected(found);
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  const filtered = useMemo(
    () =>
      LANGUAGES.filter(
        l =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const handleSelect = (lang: Language) => {
    setSelected(lang);
    localStorage.setItem(STORAGE_KEY, lang.code);
    setIsOpen(false);
    setSearch('');
  };

  /* Trigger styles:
     Both states share the same box model (h-10, px-4, rounded-full) to prevent layout shift.
     Closed → invisible pill (transparent border/bg), Nav Link color (75% → 100%)
     Open   → visible pill (border black/5, bg-white), full opacity text, no shadow */
  const triggerBase = 'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium leading-[21px] transition-all';
  const triggerClass = isOpen
    ? `${triggerBase} border border-border-default bg-surface-primary text-content-primary`
    : `${triggerBase} border border-transparent bg-transparent text-content-primary/75 hover:text-content-primary`;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger — arrow RIGHT, gap 8px */}
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={triggerClass}>
        <span className="whitespace-nowrap">{selected.name}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover — opens upward (footer context), search adjacent to trigger */}
      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-[330px]">
          <div className="flex flex-col gap-1">
            {/* Results — Figma: rounded card, border, shadow, scrollable */}
            <div className="max-h-[240px] overflow-y-auto rounded-3xl border border-border-default bg-surface-primary p-4 shadow-card">
              {filtered.length === 0 ? (
                <p className="py-2 text-center text-sm text-content-primary/50">
                  No results
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map(lang => {
                    const isSelected = selected.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang)}
                        className={`flex h-10 items-center gap-2 rounded-md px-2 font-medium transition-colors ${
                          isSelected
                            ? 'bg-surface-subtle text-content-primary'
                            : 'bg-transparent text-content-primary/50 hover:bg-surface-subtle hover:text-content-primary/75'
                        }`}
                      >
                        {/* Avatar — 32px circle, bg black/5, code 12px/600 */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                          <span className="text-xs font-semibold">
                            {lang.code}
                          </span>
                        </div>
                        {/* Name — 15px */}
                        <span className="truncate text-[15px]">
                          {lang.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Bar — adjacent to trigger, pill, border, shadow */}
            <div className="flex h-12 items-center gap-2 rounded-full border border-border-default bg-surface-primary px-4 shadow-card">
              <Search size={16} className="shrink-0 text-content-primary" strokeWidth={2} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search language..."
                className="flex-1 bg-transparent text-[15px] leading-6 text-content-primary outline-none placeholder:text-content-placeholder"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="shrink-0 text-content-primary/50 hover:text-content-primary"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
