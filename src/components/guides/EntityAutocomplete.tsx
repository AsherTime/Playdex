"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type AutocompleteOption = {
  id: string;
  label: string;
  description?: string;
};

type EntityAutocompleteProps = {
  label: string;
  value: string;
  options: AutocompleteOption[];
  placeholder?: string;
  onSelect: (option: AutocompleteOption) => void;
  onValueChange?: (value: string) => void;
};

const MAX_RESULTS = 5;

export function EntityAutocomplete({
  label,
  value,
  options,
  placeholder = "Search...",
  onSelect,
  onValueChange,
}: EntityAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLLabelElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, MAX_RESULTS);
    return options
      .filter((option) => option.label.toLowerCase().includes(normalized))
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function commit(option: AutocompleteOption) {
    setQuery(option.label);
    setOpen(false);
    onSelect(option);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || !matches.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % matches.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + matches.length) % matches.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      commit(matches[activeIndex] ?? matches[0]);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label ref={rootRef} className="relative block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          onValueChange?.(next);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/40"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-[#0d0f18] py-1 shadow-xl"
        >
          {matches.length ? (
            matches.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(option)}
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm transition ${
                    index === activeIndex ? "bg-cyan-300/10 text-white" : "text-zinc-300 hover:bg-white/[0.05]"
                  }`}
                >
                  <span>{option.label}</span>
                  {option.description ? <span className="text-[11px] text-zinc-500">{option.description}</span> : null}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-zinc-500">No matches</li>
          )}
        </ul>
      ) : null}
    </label>
  );
}
