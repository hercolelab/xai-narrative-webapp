import React from 'react';

const DataDisplay = ({ factual, counterfactual, loading }) => {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-white">Loading Data...</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-10 w-1/4 rounded-lg"></div>
              <div className="skeleton h-10 flex-1 rounded-lg"></div>
              <div className="skeleton h-10 flex-1 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!factual && !counterfactual) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-dark-750 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-300 mb-2">No Data Loaded</h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Select a dataset and click "Load Example" to fetch a factual/counterfactual pair for analysis.
        </p>
      </div>
    );
  }

  const getChangedKeys = () => {
    if (!factual || !counterfactual) return new Set();
    const keys = new Set([...Object.keys(factual), ...Object.keys(counterfactual)]);
    return Array.from(keys).filter(key => factual[key] !== counterfactual[key]);
  };

  const changedKeys = getChangedKeys();

  const allKeys = factual && counterfactual 
    ? [...new Set([...Object.keys(factual), ...Object.keys(counterfactual)])]
    : factual ? Object.keys(factual) : Object.keys(counterfactual || {});

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="px-6 py-4 bg-dark-800/50 border-b border-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white">Instance Comparison</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-neutral">
              {allKeys.length} features
            </span>
            {changedKeys.length > 0 && (
              <span className="badge badge-accent">
                {changedKeys.length} changed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider bg-dark-850/50 w-1/4">
                Feature
              </th>
              <th className="px-6 py-4 text-left bg-dark-850/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-white">Factual</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left bg-dark-850/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-500"></span>
                  <span className="text-sm font-medium text-white">Counterfactual</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {allKeys.map((key, index) => {
              const isChanged = changedKeys.includes(key);
              const factualValue = factual?.[key];
              const counterfactualValue = counterfactual?.[key];
              
              return (
                <tr 
                  key={key} 
                  className={`group transition-colors duration-150 ${
                    isChanged 
                      ? 'bg-accent-500/5 hover:bg-accent-500/10' 
                      : 'hover:bg-dark-750/50'
                  }`}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {isChanged && (
                        <svg className="w-3 h-3 text-accent-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-xs font-mono uppercase tracking-wider ${
                        isChanged ? 'text-accent-300' : 'text-neutral-500'
                      }`}>
                        {key}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${
                      isChanged 
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' 
                        : 'bg-dark-700/50 text-neutral-300 border border-dark-600/50'
                    }`}>
                      {factualValue === null || factualValue === undefined ? (
                        <span className="text-neutral-500 italic">N/A</span>
                      ) : String(factualValue)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {isChanged && (
                        <svg className="w-4 h-4 text-accent-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                      <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${
                        isChanged 
                          ? 'bg-accent-500/10 text-accent-300 border border-accent-500/20' 
                          : 'bg-dark-700/50 text-neutral-300 border border-dark-600/50'
                      }`}>
                        {counterfactualValue === null || counterfactualValue === undefined ? (
                          <span className="text-neutral-500 italic">N/A</span>
                        ) : String(counterfactualValue)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="px-6 py-3 bg-dark-850/30 border-t border-dark-700/30">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Original value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-500"></span>
            <span>Changed value</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;
