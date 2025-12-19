import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatasetSelector from './components/DatasetSelector';
import ModelSelector from './components/ModelSelector';
import DataDisplay from './components/DataDisplay';
import ExplanationDisplay from './components/ExplanationDisplay';
import DatasetDescriptionModal from './components/DatasetDescriptionModal';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [datasetInfo, setDatasetInfo] = useState({});
  const [models, setModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [factual, setFactual] = useState(null);
  const [counterfactual, setCounterfactual] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [featureChanges, setFeatureChanges] = useState({});
  const [targetVariableChange, setTargetVariableChange] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [loadingCounterfactual, setLoadingCounterfactual] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  // Load datasets and models on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [datasetsRes, modelsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/datasets`),
          axios.get(`${API_BASE_URL}/api/models`)
        ]);
        setDatasets(datasetsRes.data.datasets || []);
        const infoMap = {};
        if (datasetsRes.data.dataset_info) {
          datasetsRes.data.dataset_info.forEach(item => {
            infoMap[item.key] = item.name;
          });
        }
        setDatasetInfo(infoMap);
        setModels(modelsRes.data.models || []);
      } catch (err) {
        setError(`Failed to load datasets/models: ${err.message}`);
        console.error('Error loading initial data:', err);
      }
    };

    fetchInitialData();

    const savedHistory = localStorage.getItem('explanationHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('explanationHistory', JSON.stringify(history));
    }
  }, [history]);

  // Clear loaded data when dataset changes
  useEffect(() => {
    // Clear all loaded data when dataset selection changes
    setFactual(null);
    setCounterfactual(null);
    setExplanation(null);
    setFeatureChanges({});
    setTargetVariableChange({});
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
    setFeatureChanges({});
    setTargetVariableChange({});

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
    setFeatureChanges({});
    setTargetVariableChange({});

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

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/explain`, {
        dataset: selectedDataset,
        model: selectedModel,
        factual,
        counterfactual,
        use_refiner: false,
        temperature: 0.6,
        top_p: 0.8,
        max_tokens: 4096
      });

      setExplanation(response.data.explanation);
      setFeatureChanges(response.data.feature_changes || {});
      setTargetVariableChange(response.data.target_variable_change || {});

      const historyEntry = {
        id: Date.now(),
        dataset: selectedDataset,
        model: selectedModel,
        explanation: response.data.explanation,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyEntry, ...prev].slice(0, 10));
    } catch (err) {
      setError(`Failed to generate explanation: ${err.response?.data?.detail || err.message}`);
      console.error('Error generating explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-dark-950 bg-grid">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-60 h-60 bg-accent-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-dark-800/80 bg-dark-900/50 backdrop-blur-xl sticky top-0 z-50">
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
                  className="h-10 w-auto"
                />
              </a>
              <div className="border-l border-dark-700 pl-4">
                <h1 className="text-xl font-semibold text-white tracking-tight">
                  Counterfactual Narrative Generator
                </h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Translating technical counterfactual explanations into natural language via SLMs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 mr-1.5 animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Configuration Panel */}
        <section className="mb-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-white">Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                loading={loading || loadingExample}
              />
            </div>

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
                disabled={!selectedDataset || !selectedModel || !factual || !counterfactual || loading}
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

        {/* Data Display */}
        <section className="mb-8">
          <DataDisplay
            factual={factual}
            counterfactual={counterfactual}
            loading={loadingExample}
          />
        </section>

        {/* Explanation Display */}
        <section className="mb-8">
          <ExplanationDisplay
            explanation={explanation}
            featureChanges={featureChanges}
            targetVariableChange={targetVariableChange}
            loading={loading}
            error={error && !factual ? error : null}
          />
        </section>

        {/* History Section */}
        {history.length > 0 && (
          <section className="animate-fade-in">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-white">Recent Explanations</h2>
                <span className="badge badge-neutral ml-2">{history.length}</span>
              </div>
              
              <div className="space-y-3">
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="group p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-dark-600 hover:bg-dark-750/50 transition-all duration-200 cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-accent">{entry.dataset}</span>
                        <span className="text-dark-500">•</span>
                        <span className="text-sm text-neutral-400 font-mono">{entry.model}</span>
                      </div>
                      <span className="text-xs text-neutral-600">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 line-clamp-2 group-hover:text-neutral-300 transition-colors">
                      {entry.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
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
                Counterfactual Narrative Generator
              </span>
            </a>
            <p className="text-sm text-neutral-600">
              © {new Date().getFullYear()} • Built by{' '}
              <a 
                href="https://hercolelab.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent-400 hover:text-accent-300 transition-colors"
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
