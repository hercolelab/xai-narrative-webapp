import React from 'react';

const DataDisplay = ({ factual, counterfactual, loading, onOpenDatasetDescription }) => {
  // Common target variable names
  const targetKeys = ['income', 'survived', 'target', 'medhouseval', 'prediction', 'label', 'class'];
  
  const getTargetKey = (data) => {
    if (!data) return null;
    const keys = Object.keys(data).map(k => k.toLowerCase());
    for (const targetKey of targetKeys) {
      const foundKey = Object.keys(data).find(k => k.toLowerCase() === targetKey);
      if (foundKey) return foundKey;
    }
    // If no target found, use the last key
    return Object.keys(data)[Object.keys(data).length - 1];
  };

  const targetKey = getTargetKey(factual) || getTargetKey(counterfactual);

  const getFeatureKeys = (data) => {
    if (!data) return [];
    return Object.keys(data).filter(key => key !== targetKey);
  };

  const getChangedKeys = () => {
    if (!factual || !counterfactual) return [];
    const keys = new Set([...Object.keys(factual), ...Object.keys(counterfactual)]);
    return Array.from(keys).filter(key => factual[key] !== counterfactual[key]);
  };

  const changedKeys = getChangedKeys();
  const featureKeys = getFeatureKeys(factual) || getFeatureKeys(counterfactual);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg theme-data-icon-bg flex items-center justify-center">
            <svg className="w-4 h-4 theme-data-icon animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-medium theme-data-title">Loading Data...</h2>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-xl"></div>
          <div className="skeleton h-32 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!factual && !counterfactual) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl theme-data-empty-icon-bg flex items-center justify-center">
          <svg className="w-8 h-8 theme-data-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium theme-data-empty-title mb-2">No Data Loaded</h3>
        <p className="text-base theme-data-empty-text max-w-md mx-auto">
          Select a dataset and click "Load Example" to fetch a factual/counterfactual pair for analysis.
        </p>
      </div>
    );
  }

  const ProfileCard = ({ title, subtitle, data, predictionLabel, predictionValue, isCounterfactual = false, showChangesIndicator = false, showInfoButton = false, onInfoClick }) => {
    const isTargetChanged = targetKey && changedKeys.includes(targetKey);
    
    return (
      <div className={`glass-card rounded-xl overflow-hidden ${isCounterfactual ? 'theme-profile-cf' : 'theme-profile-factual'}`}>
        {/* Card Header */}
        <div className={`px-5 py-3 theme-profile-header ${isCounterfactual ? 'theme-profile-header-cf' : 'theme-profile-header-factual'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCounterfactual ? 'theme-data-dot-green' : 'theme-data-dot-orange'}`}></span>
                <h3 className="text-lg font-semibold theme-profile-title">{title}</h3>
                {/* Info button for dataset description */}
                {showInfoButton && onInfoClick && (
                  <button
                    onClick={onInfoClick}
                    className="w-5 h-5 rounded-full flex items-center justify-center theme-info-button transition-all hover:scale-110"
                    title="View dataset description"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Changes indicator - only shown on CF card */}
              {showChangesIndicator && changedKeys.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full theme-changes-badge">
                  <svg className="w-3.5 h-3.5 theme-changes-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className="text-xs font-semibold theme-changes-text">
                    {changedKeys.length} change{changedKeys.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs theme-profile-subtitle">{subtitle}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <div className="flex gap-4">
            {/* Features Section */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {featureKeys.map((key) => {
                  const value = data?.[key];
                  const isChanged = changedKeys.includes(key);
                  
                  return (
                    <div 
                      key={key}
                      className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[70px] ${
                        isChanged 
                          ? (isCounterfactual ? 'theme-feature-chip-changed-cf' : 'theme-feature-chip-changed')
                          : 'theme-feature-chip'
                      }`}
                    >
                      <span className={`text-[10px] font-medium uppercase tracking-wider mb-1 text-center ${
                        isChanged 
                          ? (isCounterfactual ? 'theme-feature-label-changed-cf' : 'theme-feature-label-changed')
                          : 'theme-feature-label'
                      }`}>
                        {key}
                      </span>
                      <span className={`text-sm font-semibold text-center ${
                        isChanged 
                          ? (isCounterfactual ? 'theme-feature-value-changed-cf' : 'theme-feature-value-changed')
                          : 'theme-feature-value'
                      }`}>
                        {value === null || value === undefined ? 'N/A' : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prediction Section - styled like a feature chip */}
            {targetKey && (
              <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all min-w-[70px] ${
                isTargetChanged 
                  ? (isCounterfactual ? 'theme-prediction-changed-cf' : 'theme-prediction-changed')
                  : 'theme-prediction'
              }`}>
                <span className="text-xs font-medium uppercase tracking-wider mb-1 theme-prediction-label">
                  {predictionLabel}
                </span>
                <span className={`text-xl font-bold ${
                  isTargetChanged 
                    ? (isCounterfactual ? 'theme-prediction-value-changed-cf' : 'theme-prediction-value-changed')
                    : 'theme-prediction-value'
                }`}>
                  {predictionValue === null || predictionValue === undefined ? 'N/A' : String(predictionValue)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Factual Profile */}
      {factual && (
        <ProfileCard
          title="Your Profile"
          subtitle="Original instance"
          data={factual}
          predictionLabel="Your Prediction"
          predictionValue={factual[targetKey]}
          isCounterfactual={false}
          showChangesIndicator={false}
          showInfoButton={true}
          onInfoClick={onOpenDatasetDescription}
        />
      )}

      {/* Counterfactual Profile */}
      {counterfactual && (
        <ProfileCard
          title="Counterfactual Profile"
          subtitle="Counterfactual Instance"
          data={counterfactual}
          predictionLabel="CF Prediction"
          predictionValue={counterfactual[targetKey]}
          isCounterfactual={true}
          showChangesIndicator={true}
        />
      )}
    </div>
  );
};

export default DataDisplay;
