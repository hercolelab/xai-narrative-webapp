import React from 'react';

const DataDisplay = ({ factual, counterfactual, loading }) => {
  if (!factual && !counterfactual) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-400 shadow-lg">
        No data loaded. Click "Load Example" to fetch a factual/counterfactual pair.
      </div>
    );
  }

  const getChangedKeys = () => {
    if (!factual || !counterfactual) return new Set();
    const keys = new Set([...Object.keys(factual), ...Object.keys(counterfactual)]);
    return Array.from(keys).filter(key => factual[key] !== counterfactual[key]);
  };

  const changedKeys = getChangedKeys();

  const renderValue = (key, value, isChanged, isCounterfactual = false) => {
    const displayValue = value === null || value === undefined ? 'N/A' : String(value);
    
    if (isChanged) {
      // For counterfactual column, use red styling when values differ
      if (isCounterfactual) {
        return (
          <span className="font-semibold text-red-300 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-700/50">
            {displayValue}
          </span>
        );
      }
      // For factual column, use blue styling when values differ
      return (
        <span className="font-semibold text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-700/50">
          {displayValue}
        </span>
      );
    }
    // When values are the same, use blue styling in both columns
    return (
      <span className="font-semibold text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-700/50">
        {displayValue}
      </span>
    );
  };

  const allKeys = factual && counterfactual 
    ? [...new Set([...Object.keys(factual), ...Object.keys(counterfactual)])]
    : factual ? Object.keys(factual) : Object.keys(counterfactual || {});

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl overflow-x-auto">
      <div className="min-w-full">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-700">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Feature
          </div>
          <div className="text-xl font-semibold text-white">
            Factual Instance
          </div>
          <div className="text-xl font-semibold text-white">
            Counterfactual Instance
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {allKeys.map((key) => {
            const isChanged = changedKeys.includes(key);
            return (
              <div key={key} className="grid grid-cols-3 gap-4 items-center py-2 hover:bg-gray-750/50 rounded-lg px-2 transition-colors">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {key}
                </div>
                <div className="text-base">
                  {renderValue(key, factual?.[key], isChanged, false)}
                </div>
                <div className="text-base">
                  {renderValue(key, counterfactual?.[key], isChanged, true)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;

