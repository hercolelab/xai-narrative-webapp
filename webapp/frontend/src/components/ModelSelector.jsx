import React from 'react';

const ModelSelector = ({ models, selectedModel, onModelChange, loading }) => {
  const getModelIcon = (model) => {
    const lower = model?.toLowerCase() || '';
    if (lower.includes('gpt')) return '🧠';
    if (lower.includes('claude')) return '🤖';
    if (lower.includes('gemini')) return '✨';
    if (lower.includes('llama')) return '🦙';
    return '⚡';
  };

  return (
    <div className="w-full">
      <label htmlFor="model" className="label flex items-center gap-2">
        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Model
      </label>
      <div className="relative">
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={loading}
          className="select-modern"
        >
          <option value="">Select a model...</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {getModelIcon(model)} {model}
            </option>
          ))}
        </select>
      </div>
      {selectedModel && (
        <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
          Ready to generate with {selectedModel}
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
