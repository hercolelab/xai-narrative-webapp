import React from 'react';

const TypeSelector = ({ selectedType, onTypeChange, loading }) => {
  const typeOptions = [
    { value: 'one-shot', label: 'One-shot Generation', description: 'Single generation pass' },
    { value: 'self-refinement', label: 'Self-Refinement', description: '5 drafts + refinement' }
  ];

  return (
    <div className="w-full">
      <label htmlFor="type" className="label flex items-center gap-2">
        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Type
      </label>
      <div className="relative">
        <select
          id="type"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          disabled={loading}
          className="select-modern"
        >
          <option value="">
            Select a type...
          </option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full theme-accent-dot"></span>
        {!selectedType
          ? 'Select a generation type to continue'
          : selectedType === 'one-shot' 
            ? 'Single pass generation' 
            : '5 draft narratives with refinement'}
      </p>
    </div>
  );
};

export default TypeSelector;
