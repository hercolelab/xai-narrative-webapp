import React, { useState } from 'react';

const ExplanationDisplay = ({ explanation, featureChanges, targetVariableChange, loading, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (explanation) {
      try {
        await navigator.clipboard.writeText(explanation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-300 text-lg">Generating explanation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-red-300">Error</h3>
        </div>
        <p className="mt-2 text-red-400">{error}</p>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-400 shadow-xl">
        No explanation generated yet. Load an example and click "Generate Explanation" to create one.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
        <h3 className="text-2xl font-semibold text-white">Narrative Explanation</h3>
        <button
          onClick={handleCopy}
          className="flex items-center px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-all duration-200 border border-blue-700/50 hover:border-blue-600"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
          {explanation.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {Object.keys(featureChanges || {}).length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Feature Changes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(featureChanges).map(([key, change]) => (
              <div key={key} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{key}</span>
                <div className="mt-2 text-sm">
                  <span className="text-gray-400">From: </span>
                  <span className="font-medium text-gray-200">{String(change.factual)}</span>
                  <span className="mx-2 text-gray-500">→</span>
                  <span className="text-gray-400">To: </span>
                  <span className="font-medium text-blue-400">{String(change.counterfactual)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {targetVariableChange && Object.keys(targetVariableChange).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-3">Target Variable Change</h4>
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700/50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {targetVariableChange.variable}
            </span>
            <div className="mt-2 text-sm">
              <span className="text-gray-400">From: </span>
              <span className="font-medium text-gray-200">{String(targetVariableChange.factual)}</span>
              <span className="mx-2 text-gray-500">→</span>
              <span className="text-gray-400">To: </span>
              <span className="font-medium text-blue-400">{String(targetVariableChange.counterfactual)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplanationDisplay;

