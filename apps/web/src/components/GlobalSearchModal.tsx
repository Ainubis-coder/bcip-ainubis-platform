import React, { useState, useEffect, useRef } from 'react';
import { MOCK_SEARCH_INDEX } from '../data/mock-search-data';
import { GlobalSearchResult } from '../types/tenant';
import { ModuleId } from '../types/navigation';
import { Icon } from '@bcip/ui';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (moduleId: ModuleId, itemId?: string) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onSelect }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResults = MOCK_SEARCH_INDEX.filter((item) => {
    const matchesQuery =
      query.trim() === '' ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredResults[selectedIndex];
      if (current) {
        onSelect(current.moduleId as ModuleId, current.id);
        onClose();
      }
    }
  };

  const getCategoryIcon = (category: GlobalSearchResult['category']) => {
    switch (category) {
      case 'schemes': return <Icon name="building" size="xs" className="text-emerald-400" />;
      case 'properties': return <Icon name="layers" size="xs" className="text-sky-400" />;
      case 'contacts': return <Icon name="shield" size="xs" className="text-indigo-400" />;
      case 'finance': return <Icon name="file-text" size="xs" className="text-amber-400" />;
      case 'documents': return <Icon name="copy" size="xs" className="text-slate-400" />;
      case 'ainubis': return <Icon name="zap" size="xs" className="text-pink-400" />;
      case 'navigation': return <Icon name="arrow-up-right" size="xs" className="text-emerald-400" />;
      default: return <Icon name="search" size="xs" className="text-slate-400" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Results' },
    { id: 'schemes', label: 'Schemes' },
    { id: 'properties', label: 'Units' },
    { id: 'finance', label: 'Invoices' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'ainubis', label: 'Ainubis Alerts' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <Icon name="search" size="sm" className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            id="global-search-title"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search schemes, units, invoices, contacts, tasks, alerts (e.g. 'Sandton', 'Unit 42', 'INV-2026')..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40 max-h-96">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Icon name="search" size="lg" className="mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-300">No records matching "{query}"</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try searching for scheme names, unit identifiers, or invoice reference numbers.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.moduleId as ModuleId, item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs truncate text-slate-100">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-950 border border-slate-700 text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono tabular-nums">{item.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase text-slate-400 ml-3 shrink-0">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-3.5 py-2 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-slate-800 px-1 rounded border border-slate-700">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono bg-slate-800 px-1 rounded border border-slate-700">↵</kbd> to select
            </span>
            <span>
              <kbd className="font-mono bg-slate-800 px-1 rounded border border-slate-700">ESC</kbd> to close
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">
            Global Search Foundation · Pre-indexed metadata
          </span>
        </div>
      </div>
    </div>
  );
}
