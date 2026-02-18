import React, { useState } from 'react';
import demoNarratives from '../demoNarratives';

const ExplanationDisplay = ({ explanation, rawOutput, parsedJson, metrics, loading, error, drafts = [], nss = null, generationType = 'one-shot', numNarratives = 5, selectedModel = '', selectedDataset = '', explanationExtractionWarning = false, prompt = null }) => {
  const [copied, setCopied] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showRawOutputModal, setShowRawOutputModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  
  const isDemo = selectedModel === 'demo';

  // Draft status indicator component
  const DraftIndicator = ({ status, index }) => {
    const getStatusIcon = () => {
      switch (status) {
        case 'loading':
          return (
            <svg className="w-4 h-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          );
        case 'success':
          return (
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          );
        case 'failed':
          return (
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
        default: // pending
          return (
            <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
          );
      }
    };

    return (
      <div 
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
          status === 'loading' ? 'theme-status-badge animate-pulse' :
          status === 'success' ? 'bg-green-500/10 border border-green-500/30' :
          status === 'failed' ? 'bg-amber-500/10 border border-amber-500/30' :
          'theme-status-badge'
        }`}
        title={`Draft ${index + 1}: ${status}`}
      >
        {getStatusIcon()}
      </div>
    );
  };

  // Draft progress section for self-refinement mode
  const DraftProgressSection = () => {
    if (generationType !== 'self-refinement') return null;
    
    // Create array of draft statuses
    const draftStatuses = Array(numNarratives).fill(null).map((_, i) => {
      if (drafts[i]) return drafts[i].status;
      return 'pending';
    });

    return (
      <div className="flex items-center gap-2 ml-4">
        <span className="text-xs text-neutral-500 mr-1">Drafts:</span>
        {draftStatuses.map((status, idx) => (
          <DraftIndicator key={idx} status={status} index={idx} />
        ))}
      </div>
    );
  };

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
            <div className="w-16 h-16 rounded-2xl theme-accent-icon-bg opacity-20 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 theme-accent-text animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl theme-accent-icon-bg opacity-10 animate-ping"></div>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {generationType === 'self-refinement' ? 'Generating Draft Narratives' : 'Generating Explanation'}
          </h3>
          <p className="text-sm text-neutral-500 text-center max-w-md">
            {generationType === 'self-refinement' 
              ? 'The SLM is generating multiple draft explanations for refinement...'
              : 'The SLM is analyzing the differences and crafting a natural language explanation...'}
          </p>
          
          {/* Draft Progress for self-refinement mode */}
          {generationType === 'self-refinement' && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {Array(numNarratives).fill(null).map((_, idx) => {
                  const draftStatus = drafts[idx]?.status || 'pending';
                  return <DraftIndicator key={idx} status={draftStatus} index={idx} />;
                })}
              </div>
              <span className="text-xs text-neutral-500">
                {drafts.filter(d => d?.status === 'success').length} / {numNarratives} drafts completed
              </span>
            </div>
          )}
          
          {/* Simple loading animation for one-shot mode */}
          {generationType !== 'self-refinement' && (
            <div className="mt-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full theme-accent-dot animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full theme-accent-dot animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full theme-accent-dot animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
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

  // Helper function to categorize NSS
  const categorizeNSS = (nssValue) => {
    if (nssValue < 0.7) {
      return { label: 'Low', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
    } else if (nssValue >= 0.7 && nssValue <= 0.8) {
      return { label: 'Medium', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' };
    } else {
      return { label: 'High', color: 'text-green-600', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' };
    }
  };

  // Status indicator component with tooltip
  const StatusBadge = ({ label, isSuccess, value, description, nssValue = null }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    // If this is NSS, use categorization
    const nssCategory = nssValue !== null ? categorizeNSS(nssValue) : null;
    
    return (
      <div 
        className="relative flex items-center gap-3 px-4 py-3 rounded-lg theme-status-badge group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-sm font-semibold theme-status-label uppercase tracking-wider">{label}</span>
        {nssCategory ? (
          <span className={`text-sm font-semibold ${nssCategory.color}`}>{nssCategory.label}</span>
        ) : value !== undefined && value !== null ? (
          <span className="text-sm font-mono theme-accent-text font-medium">{value}</span>
        ) : (
          <div className={`w-4 h-4 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} title={isSuccess ? 'Success' : 'Failed'}></div>
        )}
        
        {/* Tooltip */}
        {description && showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 theme-tooltip rounded-lg shadow-lg z-50 min-w-[200px] max-w-[300px]">
            <p className="text-xs theme-tooltip-text leading-relaxed">
              {description.includes(':') ? (
                <>
                  <span className="font-bold">{description.split(':')[0]}:</span>
                  {description.split(':').slice(1).join(':')}
                </>
              ) : (
                description
              )}
            </p>
            <div className="absolute top-full left-4 -mt-1">
              <div className="w-2 h-2 theme-tooltip-arrow transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="glass-card-elevated rounded-2xl overflow-hidden animate-fade-in-up relative">
        {/* Header */}
        <div className="px-6 py-4 theme-narrative-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl theme-accent-icon-bg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white">Counterfactual Narrative</h3>
            </div>
            <div className="flex items-center gap-4">
              {/* Draft Narratives Card */}
              {generationType === 'self-refinement' && drafts.length > 0 && (
                <div className="px-4 py-2 rounded-lg theme-draft-narratives-container border">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold theme-draft-narratives-label uppercase tracking-wider">Draft Narratives</span>
                    <div className="flex items-center gap-2">
                      {drafts.map((draft, idx) => {
                        const draftText = isDemo && demoNarratives[selectedDataset]?.drafts[idx]?.text 
                          ? demoNarratives[selectedDataset].drafts[idx].text 
                          : draft.explanation || '';
                        const draftStatus = draft?.status || 'pending';
                        const explanationExtracted = draft?.explanation_extracted !== false;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (draftStatus === 'success' && draftText) {
                                setSelectedDraft({
                                  number: idx + 1,
                                  text: draftText,
                                  ranking: draft.ranking ?? null
                                });
                                setShowDraftModal(true);
                              }
                            }}
                            disabled={draftStatus !== 'success' || !draftText}
                            className={`p-2 rounded-lg transition-all border ${
                              draftStatus === 'success' 
                                ? 'theme-draft-button cursor-pointer' 
                                : draftStatus === 'failed'
                                ? 'bg-amber-500/20 dark:bg-amber-500/20 border-amber-500/30 dark:border-amber-500/30 cursor-not-allowed'
                                : 'theme-draft-button cursor-not-allowed opacity-50'
                            }`}
                            title={draftStatus === 'success' ? `Draft ${idx + 1}: Click to view${!explanationExtracted ? ' (explanation not extracted)' : ''}` : `Draft ${idx + 1}: ${draftStatus}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-semibold theme-draft-button-text">Draft {idx + 1}</span>
                              {draftStatus === 'success' ? (
                                <div className="flex items-center gap-0.5">
                                  {!explanationExtracted ? (
                                    <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20" title="Explanation not extracted from JSON">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  )}
                                </div>
                              ) : draftStatus === 'failed' ? (
                                <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-white/40"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleCopy}
                className="btn btn-ghost text-sm"
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                {copied ? (
                  <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Explanation Extraction Warning */}
        {explanationExtractionWarning && (
          <div className="mx-6 mb-4 p-4 rounded-xl border-l-4 border-amber-500/80 bg-amber-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-amber-300">Explanation Extraction Warning</h4>
                  <p className="text-sm text-amber-400/90 mt-0.5">
                    The model output could not be parsed. All required JSON fields (feature_changes, reasoning, features_importance_ranking, explanation) were not present or valid. The narrative above shows an error message; raw output is not displayed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRawOutputModal(true)}
                className="btn btn-secondary text-sm whitespace-nowrap flex-shrink-0"
                title="View full model output"
              >
                Full SLM Output
              </button>
            </div>
          </div>
        )}

        {/* Explanation Content */}
        <div className="p-6 pt-4 theme-narrative-content">
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
          <div className="px-6 pb-6 theme-narrative-content">
            <div className="divider mb-4"></div>
            
            {/* Validation Metrics Card */}
            <div className="inline-flex items-center gap-4 px-4 py-3 rounded-lg theme-status-badge border border-dark-700/30">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Validation Metrics</span>
              <div className="flex items-center gap-3">
                <StatusBadge 
                  label="PFF" 
                  isSuccess={metrics.pff}
                  description="Perfect Feature Faithfulness: All the features changes are correctly identified"
                />
                <StatusBadge 
                  label="TF" 
                  isSuccess={metrics.tf}
                  description="Target Faithfulness: Whether the target variable change is correctly identified"
                />
                {generationType === 'self-refinement' && nss !== null && (
                  <StatusBadge 
                    label="NSS" 
                    nssValue={typeof nss === 'number' ? nss : null}
                    description="Narrative Stability Score: Measures stability and agreement between draft narratives. Low (<0.7): High variation, Medium (0.7-0.8): Moderate agreement, High (>0.8): Strong consensus"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Bottom Right */}
        {metrics && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => setShowJsonModal(true)}
              disabled={!metrics.json_parsing_success}
              className={`btn btn-secondary text-sm ${metrics.json_parsing_success ? '' : 'opacity-50 cursor-not-allowed'}`}
              title="See JSON Object"
            >
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowRawOutputModal(true)}
              className="btn btn-secondary text-sm"
              title="Full SLM Output"
            >
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowPromptModal(true)}
              disabled={!prompt}
              className={`btn btn-secondary text-sm ${prompt ? '' : 'opacity-50 cursor-not-allowed'}`}
              title={prompt ? "Show Prompt" : "Prompt not available"}
            >
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
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
                  <div className="w-10 h-10 rounded-xl theme-accent-icon-bg flex items-center justify-center">
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
              <pre className="bg-dark-900 rounded-xl p-4 text-sm font-mono text-neutral-300 border border-dark-700 whitespace-pre-wrap break-words overflow-wrap-anywhere">
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
                  <div className="w-10 h-10 rounded-xl theme-accent-icon-bg flex items-center justify-center">
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

      {/* Prompt Modal */}
      {showPromptModal && prompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowPromptModal(false)}
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
                  <div className="w-10 h-10 rounded-xl theme-accent-icon-bg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Model Prompt</h3>
                    <p className="text-xs text-neutral-500">
                      {generationType === 'one-shot' ? 'Worker prompt (one-shot)' : 'Refiner prompt (self-refinement)'} sent to the model
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromptModal(false)}
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
                  {prompt}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Modal */}
      {showDraftModal && selectedDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowDraftModal(false)}
          ></div>
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-3xl max-h-[85vh] bg-dark-850 border border-dark-700 rounded-2xl overflow-hidden shadow-elevated animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-dark-850 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Draft {selectedDraft.number}</h3>
                    <p className="text-xs text-neutral-500">Draft narrative explanation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDraftModal(false)}
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
              <div className="prose prose-invert max-w-none">
                <div className="text-neutral-200 leading-relaxed text-base">
                  {selectedDraft.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {selectedDraft.ranking && Object.keys(selectedDraft.ranking).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-dark-600">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Feature importance ranking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedDraft.ranking)
                        .sort(([, a], [, b]) => (Number(a) || 0) - (Number(b) || 0))
                        .map(([feature, rank]) => (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-700/80 text-neutral-300 text-sm font-mono"
                          >
                            <span className="text-amber-400/90 font-semibold">{rank}</span>
                            <span>{feature}</span>
                          </span>
                        ))}
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Lower rank = higher importance. NSS measures agreement of these rankings across drafts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExplanationDisplay;
