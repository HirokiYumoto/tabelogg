import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/** NFKC normalize + katakana→hiragana + lowercase */
function normalizeSearchText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .toLowerCase();
}

/** Romaji → hiragana conversion table (longest match first) */
const ROMAJI_TABLE: [string, string][] = [
  // 4-char
  ['sshi', 'っし'], ['cchi', 'っち'], ['ttsu', 'っつ'],
  // 3-char combos
  ['sha', 'しゃ'], ['shi', 'し'], ['shu', 'しゅ'], ['sho', 'しょ'],
  ['chi', 'ち'], ['tsu', 'つ'], ['cha', 'ちゃ'], ['chu', 'ちゅ'], ['cho', 'ちょ'],
  ['tya', 'ちゃ'], ['tyu', 'ちゅ'], ['tyo', 'ちょ'],
  ['sya', 'しゃ'], ['syu', 'しゅ'], ['syo', 'しょ'],
  ['kya', 'きゃ'], ['kyu', 'きゅ'], ['kyo', 'きょ'],
  ['nya', 'にゃ'], ['nyu', 'にゅ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyu', 'ひゅ'], ['hyo', 'ひょ'],
  ['mya', 'みゃ'], ['myu', 'みゅ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryu', 'りゅ'], ['ryo', 'りょ'],
  ['gya', 'ぎゃ'], ['gyu', 'ぎゅ'], ['gyo', 'ぎょ'],
  ['jya', 'じゃ'], ['jyu', 'じゅ'], ['jyo', 'じょ'],
  ['bya', 'びゃ'], ['byu', 'びゅ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyu', 'ぴゅ'], ['pyo', 'ぴょ'],
  // 2-char
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['fu', 'ふ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yu', 'ゆ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['ja', 'じゃ'], ['ji', 'じ'], ['ju', 'じゅ'], ['jo', 'じょ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  // 1-char vowels
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
];

/** Convert romaji string to hiragana (best-effort, greedy longest match) */
function romajiToHiragana(input: string): string {
  const s = input.toLowerCase();
  let result = '';
  let i = 0;
  while (i < s.length) {
    // 'n' before consonant (not vowel/y) or at end → ん
    if (s[i] === 'n' && (i + 1 >= s.length || (!'aiueoy'.includes(s[i + 1]) && s[i + 1] !== 'n'))) {
      result += 'ん';
      i++;
      continue;
    }
    // Double consonant → っ (except nn)
    if (i + 1 < s.length && s[i] === s[i + 1] && s[i] !== 'n' && /[a-z]/.test(s[i]) && !'aiueo'.includes(s[i])) {
      result += 'っ';
      i++;
      continue;
    }
    // Greedy table match (longest first: entries are pre-sorted)
    let matched = false;
    for (const [rom, hira] of ROMAJI_TABLE) {
      if (s.startsWith(rom, i)) {
        result += hira;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += s[i];
      i++;
    }
  }
  return result;
}

export interface SelectOption {
  value: string;
  label: string;
  reading?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  /** Compact mode for header search bar */
  compact?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '選択してください',
  disabled = false,
  className = '',
  error = false,
  compact = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const filtered = useMemo(() => {
    if (!search) return options;
    const normalizedSearch = normalizeSearchText(search);
    const romajiSearch = romajiToHiragana(normalizedSearch);
    return options.filter((o) => {
      if (o.label.includes(search)) return true;
      if (normalizeSearchText(o.label).includes(normalizedSearch)) return true;
      if (o.reading) {
        const nr = normalizeSearchText(o.reading);
        if (nr.includes(normalizedSearch)) return true;
        if (romajiSearch !== normalizedSearch && nr.includes(romajiSearch)) return true;
      }
      return false;
    });
  }, [search, options]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setSearch('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [disabled]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
    setOpen(false);
    setSearch('');
  }, [onChange]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (compact) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Trigger */}
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`w-full h-full py-2 pl-2 sm:pl-3 pr-6 sm:pr-8 text-xs sm:text-sm bg-transparent text-left text-gray-700 truncate disabled:opacity-50 disabled:cursor-not-allowed ${
            !selectedLabel ? 'text-gray-400' : ''
          }`}
        >
          {selectedLabel || placeholder}
        </button>
        {/* Chevron */}
        <svg
          className="pointer-events-none absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-[100]">
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="検索..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {value && (
                <li>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
                  >
                    {placeholder}（クリア）
                  </button>
                </li>
              )}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-gray-400">該当なし</li>
              )}
              {filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-orange-50 hover:text-orange-600 ${
                      opt.value === value ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Standard (form) mode
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${!selectedLabel ? 'text-gray-400' : 'text-gray-700'}`}
      >
        {selectedLabel || placeholder}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100]">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="検索..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">該当なし</li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-600 ${
                    opt.value === value ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
