import React, { useState } from 'react';

const ExplanationDisplay = ({ explanation, rawOutput, parsedJson, metrics, loading, error }) => {
  const [copied, setCopied] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showRawOutputModal, setShowRawOutputModal] = useState(false);

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
      <div className="glass-card rounded-2xl p-8 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/20 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-accent-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-accent-500/10 animate-ping"></div>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Generating Explanation</h3>
          <p className="text-sm text-neutral-500 text-center max-w-md">
            The SLM is analyzing the differences and crafting a natural language explanation...
          </p>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 border-l-4 border-red-500/80 bg-red-950/10 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-red-300">Generation Failed</h3>
            <p className="mt-1 text-sm text-red-400/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-dark-750 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-300 mb-2">Ready for Explanation</h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Load an example and click "Generate Explanation" to create a natural language narrative.
        </p>
      </div>
    );
  }

  // Status indicator component
  const StatusBadge = ({ label, isSuccess, value }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-700/50">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{label}</span>
      {value !== undefined && value !== null ? (
        <span className="text-sm font-mono text-accent-300">{value}</span>
      ) : (
        <div className={`w-3 h-3 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} title={isSuccess ? 'Success' : 'Failed'}></div>
      )}
    </div>
  );

  return (
    <>
      <div className="glass-card-elevated rounded-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-accent-500/10 to-transparent border-b border-dark-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Counterfactual Narrative</h3>
                <p className="text-xs text-neutral-500">LLM-generated translation of the selected counterfactual explanation into natural language</p>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-ghost text-sm"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 mr-1.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Explanation Content */}
        <div className="p-6">
          <div className="prose prose-invert max-w-none">
            <div className="text-neutral-200 leading-relaxed text-base">
              {explanation.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        {metrics && (
          <div className="px-6 pb-6">
            <div className="divider mb-4"></div>
            
            {/* Status Indicators */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <StatusBadge 
                label="JP" 
                isSuccess={metrics.json_parsing_success} 
              />
              <StatusBadge 
                label="PFF" 
                isSuccess={metrics.pff} 
              />
              <StatusBadge 
                label="TF" 
                isSuccess={metrics.tf} 
              />
              <StatusBadge 
                label="AvgFF" 
                value={metrics.avg_ff !== null && metrics.avg_ff !== undefined ? metrics.avg_ff.toFixed(3) : 'N/A'} 
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowJsonModal(true)}
                disabled={!metrics.json_parsing_success}
                className={`btn ${metrics.json_parsing_success ? 'btn-secondary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                See JSON Object
              </button>
              
              <button
                onClick={() => setShowRawOutputModal(true)}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Full SLM Output
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Object Modal */}
      {showJsonModal && parsedJson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowJsonModal(false)}
          ></div>
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-4xl max-h-[85vh] bg-dark-850 border border-dark-700 rounded-2xl overflow-hidden shadow-elevated animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-dark-850 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Parsed JSON Object</h3>
                    <p className="text-xs text-neutral-500">Structured output extracted from SLM response</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-dark-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <pre className="bg-dark-900 rounded-xl p-4 overflow-x-auto text-sm font-mono text-neutral-300 border border-dark-700 whitespace-pre">
                {JSON.stringify(parsedJson, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Full SLM Output Modal */}
      {showRawOutputModal && rawOutput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowRawOutputModal(false)}
          ></div>
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-4xl max-h-[85vh] bg-dark-850 border border-dark-700 rounded-2xl overflow-hidden shadow-elevated animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-dark-850 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Full SLM Output</h3>
                    <p className="text-xs text-neutral-500">Complete raw text generated by the language model</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRawOutputModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-dark-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
                <pre className="whitespace-pre-wrap text-sm text-neutral-300 font-mono leading-relaxed">
                  {rawOutput}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExplanationDisplay;
