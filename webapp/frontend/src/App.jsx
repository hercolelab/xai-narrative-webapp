import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatasetSelector from './components/DatasetSelector';
import ModelSelector from './components/ModelSelector';
import TypeSelector from './components/TypeSelector';
import DataDisplay from './components/DataDisplay';
import ExplanationDisplay from './components/ExplanationDisplay';
import DatasetDescriptionModal from './components/DatasetDescriptionModal';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  // Theme state - default to dark mode
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light';
  });

  const [datasets, setDatasets] = useState([]);
  const [datasetInfo, setDatasetInfo] = useState({});
  const [models, setModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [generationType, setGenerationType] = useState('');
  const [fineTuned, setFineTuned] = useState(true);
  const [factual, setFactual] = useState(null);
  const [counterfactual, setCounterfactual] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [rawOutput, setRawOutput] = useState(null);
  const [parsedJson, setParsedJson] = useState(null);
  const [featureChanges, setFeatureChanges] = useState({});
  const [targetVariableChange, setTargetVariableChange] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [drafts, setDrafts] = useState([]); // Draft statuses for self-refinement mode
  const [ncs, setNcs] = useState(null); // Narrative Consensus Score
  const [warning, setWarning] = useState(null); // Model warning (CUDA, no models found, etc.)
  const [loading, setLoading] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [loadingCounterfactual, setLoadingCounterfactual] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  // Load datasets on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const datasetsRes = await axios.get(`${API_BASE_URL}/api/datasets`);
        setDatasets(datasetsRes.data.datasets || []);
        const infoMap = {};
        if (datasetsRes.data.dataset_info) {
          datasetsRes.data.dataset_info.forEach(item => {
            infoMap[item.key] = item.name;
          });
        }
        setDatasetInfo(infoMap);
      } catch (err) {
        setError(`Failed to load datasets: ${err.message}`);
        console.error('Error loading initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Load models when dataset changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedDataset) {
        setModels([]);
        setSelectedModel('');
        return;
      }

      setLoadingModels(true);
      setError(null);
      setWarning(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/models/${selectedDataset}`);
        setModels(response.data.models || []);
        setSelectedModel(''); // Reset model selection when dataset changes
        
        // Show warning if present (not an error)
        if (response.data.warning) {
          // If it's a CUDA warning, add the template explanation note
          if (response.data.warning.toLowerCase().includes('cuda')) {
            setWarning("CUDA is not available. The generated explanation is just a template.");
          } else {
            setWarning(response.data.warning);
          }
        }
      } catch (err) {
        // Only show as error if it's a real error (not just no models found)
        if (err.response?.status === 404 && err.response?.data?.detail?.includes("not found")) {
          // Dataset not found is an error
          setError(`Failed to load models: ${err.response?.data?.detail || err.message}`);
          setModels([]);
        } else {
          // Other errors - show as warning if it's about missing models
          const detail = err.response?.data?.detail || err.message;
          if (detail.includes("No fine-tuned models")) {
            setWarning(detail + " Demo model is available for testing.");
            // Still try to set demo model if available
            setModels(["demo"]);
          } else {
            setError(`Failed to load models: ${detail}`);
            setModels([]);
          }
        }
        console.error('Error loading models:', err);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [selectedDataset]);

  // Clear loaded data when dataset changes
  useEffect(() => {
    // Clear all loaded data when dataset selection changes
    setFactual(null);
    setCounterfactual(null);
    setExplanation(null);
    setRawOutput(null);
    setParsedJson(null);
    setFeatureChanges({});
    setTargetVariableChange({});
    setMetrics(null);
    setDrafts([]);
    setNcs(null);
    setGenerationType('');
    // Don't clear model warning here - it will be updated when models are loaded
    setFineTuned(true); // Reset fine-tuned checkbox to default
    // Don't clear error here as it might be about dataset/model loading
  }, [selectedDataset]);

  const handleLoadExample = async () => {
    if (!selectedDataset) {
      setError('Please select a dataset first');
      return;
    }

    setLoadingExample(true);
    setError(null);
    setExplanation(null);
    setRawOutput(null);
    setParsedJson(null);
    setFeatureChanges({});
    setTargetVariableChange({});
    setMetrics(null);
    // Don't clear warning - it should persist throughout the process

    try {
      const response = await axios.get(`${API_BASE_URL}/api/examples/${selectedDataset}`);
      setFactual(response.data.factual);
      setCounterfactual(response.data.counterfactual);
    } catch (err) {
      setError(`Failed to load example: ${err.response?.data?.detail || err.message}`);
      console.error('Error loading example:', err);
    } finally {
      setLoadingExample(false);
    }
  };

  const handleNewCounterfactual = async () => {
    if (!selectedDataset || !factual) {
      setError('Please load an example first');
      return;
    }

    setLoadingCounterfactual(true);
    setError(null);
    setExplanation(null);
    setRawOutput(null);
    setParsedJson(null);
    setFeatureChanges({});
    setTargetVariableChange({});
    setMetrics(null);
    // Don't clear warning - it should persist throughout the process

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/examples/${selectedDataset}/new-counterfactual`,
        factual
      );
      setCounterfactual(response.data.counterfactual);
    } catch (err) {
      setError(`Failed to load new counterfactual: ${err.response?.data?.detail || err.message}`);
      console.error('Error loading new counterfactual:', err);
    } finally {
      setLoadingCounterfactual(false);
    }
  };

  const handleGenerateExplanation = async () => {
    if (!selectedDataset || !selectedModel || !factual || !counterfactual) {
      setError('Please select dataset, model, and load an example first');
      return;
    }

    if (!generationType) {
      setError('Please select a generation type in the Configuration panel');
      return;
    }

    setLoading(true);
    setError(null);
    setDrafts([]);
    setNcs(null);
    // Don't clear warning - it should persist throughout the process

    // Use streaming endpoint for self-refinement mode
    if (generationType === 'self-refinement') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/explain/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataset: selectedDataset,
            model: selectedModel,
            factual,
            counterfactual,
            generation_type: generationType,
            fine_tuned: fineTuned,
            temperature: 0.6,
            top_p: 0.8,
            max_tokens: 4096
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to generate explanation');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'draft_progress') {
                  // Update draft status
                  setDrafts(prev => {
                    const newDrafts = [...prev];
                    newDrafts[data.index] = {
                      status: data.status,
                      ranking: data.ranking
                    };
                    return newDrafts;
                  });
                } else if (data.type === 'complete') {
                  // Final result
                  setExplanation(data.explanation);
                  setRawOutput(data.raw_output || null);
                  setParsedJson(data.parsed_json || null);
                  setFeatureChanges(data.feature_changes || {});
                  setTargetVariableChange(data.target_variable_change || {});
                  setMetrics(data.metrics || null);
                  setNcs(data.ncs);
                  setDrafts(data.drafts || []);
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (parseErr) {
                console.error('Error parsing SSE data:', parseErr);
              }
            }
          }
        }
      } catch (err) {
        setError(`Failed to generate explanation: ${err.message}`);
        console.error('Error generating explanation:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // One-shot mode - use regular endpoint
      try {
        const response = await axios.post(`${API_BASE_URL}/api/explain`, {
          dataset: selectedDataset,
          model: selectedModel,
          factual,
          counterfactual,
          generation_type: generationType,
          fine_tuned: fineTuned,
          temperature: 0.6,
          top_p: 0.8,
          max_tokens: 4096
        });

        setExplanation(response.data.explanation);
        setRawOutput(response.data.raw_output || null);
        setParsedJson(response.data.parsed_json || null);
        setFeatureChanges(response.data.feature_changes || {});
        setTargetVariableChange(response.data.target_variable_change || {});
        setMetrics(response.data.metrics || null);
      } catch (err) {
        setError(`Failed to generate explanation: ${err.response?.data?.detail || err.message}`);
        console.error('Error generating explanation:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen theme-container">
      {/* Header */}
      <header className="relative border-b border-dark-800/80 bg-dark-900/50 backdrop-blur-xl theme-header">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <a 
                href="https://hercolelab.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0 transition-opacity hover:opacity-80"
              >
                <img 
                  src="/hercolelab_white.png" 
                  alt="HERCOLE Lab" 
                  className="h-[50px] w-auto theme-logo"
                />
              </a>
              <div className="border-l pl-4 theme-header-divider">
                <h1 className="text-xl font-semibold text-white tracking-tight theme-title">
                  Counterfactual Narrative Explanation System
                </h1>
                <p className="text-sm mt-0.5 theme-subtitle">
                  Translating technical counterfactual explanations into natural language via SLMs
                </p>
              </div>
            </div>
            {/* Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-dark-750 hover:bg-dark-700 border border-dark-600 hover:border-dark-500 text-neutral-300 hover:text-white transition-all duration-200 active:scale-95 theme-toggle-btn"
              aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
              title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {isLightMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Configuration Panel */}
        <section className="mb-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
                <svg className="w-4 h-4 theme-accent-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-white">Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <DatasetSelector
                datasets={datasets}
                datasetInfo={datasetInfo}
                selectedDataset={selectedDataset}
                onDatasetChange={setSelectedDataset}
                loading={loading || loadingExample}
              />
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                loading={loading || loadingExample || loadingModels}
              />
              <TypeSelector
                selectedType={generationType}
                onTypeChange={setGenerationType}
                loading={loading || loadingExample}
              />
            </div>

            {/* Fine-tuned checkbox - only show when model is selected */}
            {selectedModel && (
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={fineTuned}
                    onChange={(e) => setFineTuned(e.target.checked)}
                    disabled={loading || loadingExample}
                    className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-dark-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed theme-checkbox"
                  />
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                    Use Fine-tuned Model (LoRA)
                  </span>
                </label>
                <p className="mt-1 text-xs text-neutral-500 ml-8">
                  {fineTuned 
                    ? "Using fine-tuned model with LoRA adapter from checkpoint"
                    : "Using base model without fine-tuning"}
                </p>
              </div>
            )}

            <div className="divider mb-6"></div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsDescriptionModalOpen(true)}
                disabled={!selectedDataset}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dataset Description
              </button>
              
              <button
                onClick={handleLoadExample}
                disabled={!selectedDataset || loading || loadingExample}
                className="btn btn-secondary"
              >
                {loadingExample ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load Example
                  </>
                )}
              </button>
              
              <button
                onClick={handleNewCounterfactual}
                disabled={!selectedDataset || !factual || loading || loadingExample || loadingCounterfactual}
                className="btn btn-secondary"
              >
                {loadingCounterfactual ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Counterfactual
                  </>
                )}
              </button>
              
              <button
                onClick={handleGenerateExplanation}
                disabled={
                  !selectedDataset ||
                  !selectedModel ||
                  !factual ||
                  !counterfactual ||
                  !generationType ||
                  loading
                }
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Explanation
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="mb-6 animate-fade-in-down">
            <div className="glass-card rounded-xl p-4 border-l-4 border-red-500/80 bg-red-950/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-300">Error</h4>
                  <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Model Warning Display */}
        {warning && (
          <div className="mb-6 animate-fade-in-down">
            <div className="glass-card rounded-xl p-4 border-l-4 theme-warning-border theme-warning-bg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg theme-warning-icon-bg flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 theme-warning-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium theme-warning-title">Warning</h4>
                  <p className="text-sm theme-warning-text mt-0.5">{warning}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Display */}
        <section className="mb-8">
          <DataDisplay
            factual={factual}
            counterfactual={counterfactual}
            loading={loadingExample}
            onOpenDatasetDescription={() => setIsDescriptionModalOpen(true)}
          />
        </section>

        {/* Explanation Display */}
        <section className="mb-8">
          <ExplanationDisplay
            explanation={explanation}
            rawOutput={rawOutput}
            parsedJson={parsedJson}
            metrics={metrics}
            loading={loading}
            error={error && !factual ? error : null}
            drafts={drafts}
            ncs={ncs}
            generationType={generationType}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative mt-16 py-8 border-t border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <a 
              href="https://hercolelab.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <img 
                src="/hercolelab_white.png" 
                alt="HERCOLE Lab" 
                className="h-6 w-auto opacity-60"
              />
              <span className="text-sm text-neutral-500">
                Counterfactual Narrative Explanation System
              </span>
            </a>
            <p className="text-sm text-neutral-600">
              © {new Date().getFullYear()} • Built by{' '}
              <a 
                href="https://hercolelab.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="theme-accent-text hover:opacity-80 transition-colors"
              >
                HERCOLE Lab
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Dataset Description Modal */}
      <DatasetDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        datasetKey={selectedDataset}
      />
    </div>
  );
}

export default App;
