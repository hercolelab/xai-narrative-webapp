import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatasetSelector from './components/DatasetSelector';
import ModelSelector from './components/ModelSelector';
import DataDisplay from './components/DataDisplay';
import ExplanationDisplay from './components/ExplanationDisplay';
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

  // Load datasets and models on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [datasetsRes, modelsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/datasets`),
          axios.get(`${API_BASE_URL}/api/models`)
        ]);
        setDatasets(datasetsRes.data.datasets || []);
        // Create a map of dataset keys to display names
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

    // Load history from localStorage
    const savedHistory = localStorage.getItem('explanationHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('explanationHistory', JSON.stringify(history));
    }
  }, [history]);

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
      // Keep the same factual instance
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

      // Add to history
      const historyEntry = {
        id: Date.now(),
        dataset: selectedDataset,
        model: selectedModel,
        explanation: response.data.explanation,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyEntry, ...prev].slice(0, 10)); // Keep last 10
    } catch (err) {
      setError(`Failed to generate explanation: ${err.response?.data?.detail || err.message}`);
      console.error('Error generating explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Counterfactual Narrative Explainer
          </h1>
          <p className="text-gray-400 text-lg">
            Generate human-readable explanations for counterfactual instances using LLM pipeline
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Section */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 mb-6">
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

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleLoadExample}
              disabled={!selectedDataset || loading || loadingExample}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loadingExample ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Load Example'
              )}
            </button>
            <button
              onClick={handleNewCounterfactual}
              disabled={!selectedDataset || !factual || loading || loadingExample || loadingCounterfactual}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loadingCounterfactual ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'New Counterfactual'
              )}
            </button>
            <button
              onClick={handleGenerateExplanation}
              disabled={!selectedDataset || !selectedModel || !factual || !counterfactual || loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Explanation'
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 rounded-xl p-4 shadow-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Data Display */}
        <div className="mb-6">
          <DataDisplay
            factual={factual}
            counterfactual={counterfactual}
            loading={loadingExample}
          />
        </div>

        {/* Explanation Display */}
        <div className="mb-6">
          <ExplanationDisplay
            explanation={explanation}
            featureChanges={featureChanges}
            targetVariableChange={targetVariableChange}
            loading={loading}
            error={error && !factual ? error : null}
          />
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Recent Explanations</h2>
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-700 rounded-lg p-4 hover:bg-gray-750 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-blue-400">{entry.dataset}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-300">{entry.model}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{entry.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          Counterfactual Narrative Explainer &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;

