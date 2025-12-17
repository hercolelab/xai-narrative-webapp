import React from 'react';

const DatasetSelector = ({ datasets, datasetInfo, selectedDataset, onDatasetChange, loading }) => {
  // Default display names mapping
  const defaultDisplayNames = {
    'adult': 'Adult Income',
    'titanic': 'Titanic',
    'california': 'California Housing',
    'diabetes': 'Diabetes'
  };

  const getDisplayName = (dataset) => {
    return datasetInfo?.[dataset] || defaultDisplayNames[dataset] || dataset.charAt(0).toUpperCase() + dataset.slice(1);
  };

  // Ensure we always show all 4 datasets, even if API hasn't returned them yet
  const allDatasets = datasets && datasets.length > 0 
    ? datasets 
    : ['adult', 'titanic', 'california', 'diabetes'];

  return (
    <div className="w-full">
      <label htmlFor="dataset" className="block text-sm font-semibold text-gray-300 mb-3">
        Dataset
      </label>
      <select
        id="dataset"
        value={selectedDataset}
        onChange={(e) => onDatasetChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-500"
      >
        <option value="" className="bg-gray-700">Select a dataset</option>
        {allDatasets.map((dataset) => (
          <option key={dataset} value={dataset} className="bg-gray-700">
            {getDisplayName(dataset)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DatasetSelector;

