import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import type { FilterOption } from '../filters/filterOptions';

interface SelectSheetProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** Intitulé du réglage, affiché en titre de la feuille. */
  label: string;
  className?: string;
}

export function SelectSheet({ value, options, onChange, label, className = '' }: SelectSheetProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-label={`${label} : ${current.label}`}
        className={`font-crimson flex items-center justify-between gap-2 min-h-[44px] w-full px-3 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm ${className}`}
      >
        <span className="truncate">{current.label}</span>
        <svg className="w-4 h-4 shrink-0 text-sepia-chaud" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} label={label} maxHeight="70vh">
        <div className="px-4 pb-8">
          <h3 className="font-bebas text-rouge-cinema text-lg uppercase tracking-wider py-3">
            {label}
          </h3>
          <ul role="listbox" aria-label={label} className="divide-y divide-sepia-chaud/20">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`font-crimson flex items-center justify-between w-full min-h-[48px] px-2 text-left text-base ${
                      selected ? 'text-rouge-cinema font-semibold' : 'text-noir-velours'
                    }`}
                  >
                    <span>{option.label}</span>
                    {selected && (
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </BottomSheet>
    </>
  );
}
