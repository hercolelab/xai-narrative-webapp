import React from 'react';

const ModelSelector = ({ models, selectedModel, onModelChange, loading }) => {
  return (
    <div className="w-full">
      <label htmlFor="model" className="block text-sm font-semibold text-gray-300 mb-3">
        Model
      </label>
      <select
        id="model"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-500"
      >
        <option value="" className="bg-gray-700">Select a model</option>
        {models.map((model) => (
          <option key={model} value={model} className="bg-gray-700">
            {model}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;

