import React from 'react';

const DatasetSelector = ({ datasets, datasetInfo, selectedDataset, onDatasetChange, loading }) => {
  const defaultDisplayNames = {
    'adult': 'Adult Income',
    'titanic': 'Titanic',
    'california': 'California Housing',
    'diabetes': 'Diabetes'
  };

  const datasetIcons = {
    'adult': '👤',
    'titanic': '🚢',
    'california': '🏠',
    'diabetes': '🏥'
  };

  const getDisplayName = (dataset) => {
    return datasetInfo?.[dataset] || defaultDisplayNames[dataset] || dataset.charAt(0).toUpperCase() + dataset.slice(1);
  };

  const allDatasets = datasets && datasets.length > 0 
    ? datasets 
    : ['california', 'diabetes', 'adult', 'titanic'];

  return (
    <div className="w-full">
      <label htmlFor="dataset" className="label flex items-center gap-2">
        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        Dataset
      </label>
      <div className="relative">
        <select
          id="dataset"
          value={selectedDataset}
          onChange={(e) => onDatasetChange(e.target.value)}
          disabled={loading}
          className="select-modern"
        >
          <option value="">Select a dataset...</option>
          {allDatasets.map((dataset) => (
            <option key={dataset} value={dataset}>
              {datasetIcons[dataset] || '📊'} {getDisplayName(dataset)}
            </option>
          ))}
        </select>
      </div>
      {selectedDataset && (
        <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full theme-accent-dot"></span>
          {getDisplayName(selectedDataset)} dataset selected
        </p>
      )}
    </div>
  );
};

export default DatasetSelector;
