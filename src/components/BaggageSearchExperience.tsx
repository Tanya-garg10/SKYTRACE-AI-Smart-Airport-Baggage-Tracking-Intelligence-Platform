import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, SearchX } from 'lucide-react';

export function BaggageSearchExperience({
  initialQuery = '',
  loading,
  error,
  suggestions = [],
  onSearch,
  variant = 'light',
}: {
  initialQuery?: string;
  loading?: boolean;
  error?: string;
  suggestions?: string[];
  onSearch: (bagId: string) => void;
  variant?: 'light' | 'dark';
}) {
  const [query, setQuery] = useState(initialQuery);
  const isLight = variant === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim().toUpperCase());
  };

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-5 space-y-4 ${
        isLight
          ? 'border-[#101B2D]/12 bg-white shadow-xs'
          : 'border-[#A8B6C7]/18 bg-[#203650]/60 backdrop-blur-md'
      }`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-[#203650]/50' : 'text-[#A8B6C7]'
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Bag ID (e.g. ST-2026-4810) or QR payload..."
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#54D6E8] ${
              isLight
                ? 'border-[#101B2D]/20 bg-[#F3F5F7] text-[#101B2D] placeholder:text-[#203650]/45'
                : 'border-[#A8B6C7]/25 bg-[#101B2D] text-[#F3F5F7] placeholder:text-[#A8B6C7]/60'
            }`}
          />
        </div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-ma-aurora text-[#101B2D] text-xs font-bold tracking-wider hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          {loading ? 'LOCATING...' : 'FOLLOW MY BAG'}
        </motion.button>
      </form>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={isLight ? 'text-[#203650]/70' : 'text-[#A8B6C7]'}>Quick lookup:</span>
          {suggestions.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setQuery(id);
                onSearch(id);
              }}
              className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                isLight
                  ? 'border border-[#101B2D]/15 text-[#101B2D] hover:border-[#157A8C]'
                  : 'border border-[#A8B6C7]/20 text-[#54D6E8] hover:border-[#54D6E8]'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div
          className={`h-12 rounded-xl animate-pulse ${
            isLight ? 'bg-[#E5E9EF]' : 'bg-[#101B2D]/60'
          }`}
        />
      )}

      {error && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            isLight
              ? 'border-[#E87583]/45 bg-[#E87583]/10 text-[#9B2938]'
              : 'border-[#E87583]/45 bg-[#E87583]/10 text-[#E87583]'
          }`}
        >
          <SearchX className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </motion.div>
  );
}
