import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SingerNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onFetchSuggestions: () => Promise<string[]>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function SingerNameAutocomplete({
  value,
  onChange,
  onFetchSuggestions,
  placeholder,
  disabled,
  className,
  id,
}: SingerNameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions on mount and when instance changes
  useEffect(() => {
    let mounted = true;
    
    const fetchSuggestions = async () => {
      try {
        const names = await onFetchSuggestions();
        if (mounted) {
          setSuggestions(names);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    fetchSuggestions();
    
    return () => {
      mounted = false;
    };
  }, [onFetchSuggestions]);

  // Filter suggestions based on input
  useEffect(() => {
    if (value.trim().length === 0) {
      setFilteredSuggestions(suggestions.slice(0, 10));
    } else {
      const filtered = suggestions.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredSuggestions(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, suggestions]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          onChange(filteredSuggestions[highlightedIndex]);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectSuggestion = (name: string) => {
    onChange(name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filteredSuggestions.map((name, index) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelectSuggestion(name)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                highlightedIndex === index && "bg-accent text-accent-foreground"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
