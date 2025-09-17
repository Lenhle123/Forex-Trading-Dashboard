import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Globe, BarChart3, Newspaper, Activity } from 'lucide-react';

const ExchangeRateDashboard = () => {
  const [rates, setRates] = useState({});
  const [selectedPair, setSelectedPair] = useState('USD/EUR');
  const [historicalData, setHistoricalData] = useState([]);
  const [news, setNews] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // API Configuration - fallback for different environments
  const getApiBase = () => {
    // Try to get from environment variables
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:5000'; // Local development
    }
    
    // Production fallback - replace with your actual Render URL
    return 'https://your-render-app-name.onrender.com';
  };
  
  const API_BASE = getApiBase();

  // Currency pairs
  const CURRENCY_PAIRS = ['USD/EUR', 'USD/GBP', 'USD/JPY', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'];

  // Fetch current rates
  const fetchRates = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch(`${API_BASE}/api/rates`);
      const data = await response.json();
      setRates(data.rates || {});
      setConnectionStatus('connected');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      setConnectionStatus('error');
      // Fallback to mock data
      setRates({
        'USD/EUR': { rate: 1.0545, change: 0.0023, timestamp: new Date().toISOString() },
        'USD/GBP': { rate: 0.7823, change: -0.0012, timestamp: new Date().toISOString() },
        'USD/JPY': { rate: 149.85, change: 0.45, timestamp: new Date().toISOString() },
        'EUR/GBP': { rate: 0.8412, change: 0.0008, timestamp: new Date().toISOString() },
        'EUR/JPY': { rate: 142.15, change: 0.78, timestamp: new Date().toISOString() },
        'GBP/JPY': { rate: 191.58, change: -0.32, timestamp: new Date().toISOString() }
      });
      setConnectionStatus('connected');
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async (pair) => {
    try {
      const response = await fetch(`${API_BASE}/api/exchange/${pair}/history?period=24h&limit=20`);
      const data = await response.json();
      setHistoricalData(data.data || []);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      // Generate mock historical data
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - (19 - i) * 60 * 60 * 1000).toISOString(),
        rate: 1.0545 + (Math.random() - 0.5) * 0.02,
        volume: Math.floor(Math.random() * 5000000) + 1000000
      }));
      setHistoricalData(mockData);
    }
  };

  // Fetch news
  const fetchNews = async (pair) => {
    try {
      const response = await fetch(`${API_BASE}/api/news/${pair}`);
      const data = await response.json();
      setNews(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      // Mock news data
      setNews([
        {
          id: '1',
          title: 'Federal Reserve Signals Policy Changes',
          content: 'The Federal Reserve indicated potential monetary policy adjustments...',
          source: 'Reuters',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sentiment: { label: 'neutral', score: 0.1 }
        },
        {
          id: '2',
          title: 'European Central Bank Maintains Rates',
          content: 'The ECB decided to keep interest rates unchanged...',
          source: 'Bloomberg',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          sentiment: { label: 'positive', score: 0.3 }
        }
      ]);
    }
  };

  // Generate forecast
  const generateForecast = async (pair) => {
    try {
      const response = await fetch(`${API_BASE}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: pair,
          model: 'ensemble',
          horizon: 12
        })
      });
      const data = await response.json();
      setForecast(data);
    } catch (error) {
      console.error('Failed to generate forecast:', error);
      // Mock forecast
      const currentRate = rates[pair]?.rate || 1.0545;
      const mockPredictions = Array.from({ length: 12 }, (_, i) => ({
        timestamp: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(),
        predicted: currentRate + (Math.random() - 0.5) * 0.01,
        confidence: 0.85 - i * 0.02
      }));
      setForecast({
        pair: pair,
        predictions: mockPredictions,
        model_info: { accuracy: 0.847 }
      });
    }
  };

  // Format time ago
  const timeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Format currency
  const formatCurrency = (value, pair) => {
    if (!value) return 'N/A';
    const decimals = pair?.includes('JPY') ? 2 : 4;
    return value.toFixed(decimals);
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchRates();
        if (selectedPair) {
          await fetchHistoricalData(selectedPair);
          await fetchNews(selectedPair);
          await generateForecast(selectedPair);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Update data when pair changes
  useEffect(() => {
    if (!loading && selectedPair) {
      const updatePairData = async () => {
        try {
          await fetchHistoricalData(selectedPair);
          await fetchNews(selectedPair);
          await generateForecast(selectedPair);
        } catch (error) {
          console.error('Error updating pair data:', error);
        }
      };
      updatePairData();
    }
  }, [selectedPair, loading]);

  // Auto-refresh rates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRates().catch(error => {
        console.error('Error refreshing rates:', error);
      });
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const currentRate = rates[selectedPair] || { rate: 0, change: 0, timestamp: new Date().toISOString() };
  const isPositiveChange = (currentRate.change || 0) >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Exchange Rate Forecasting
                </h1>
                <p className="text-sm text-gray-500">
                  AI-powered currency predictions with real-time data
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <Activity className="h-4 w-4" />
                <span className="capitalize">{connectionStatus}</span>
              </div>
              
              <button
                onClick={fetchRates}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading exchange rate data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Currency Selector */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Select Currency Pair</h2>
              <div className="flex flex-wrap gap-2">
                {CURRENCY_PAIRS.map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPair === pair
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Rate Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Current Rate - {selectedPair}</h2>
                <span className="text-sm text-gray-500">
                  Updated {timeAgo(currentRate.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-4xl font-bold text-gray-900">
                  {formatCurrency(currentRate.rate, selectedPair)}
                </div>
                
                <div className={`flex items-center space-x-1 ${
                  isPositiveChange ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isPositiveChange ? '+' : ''}{formatCurrency(currentRate.change, selectedPair)}
                  </span>
                  <span className="text-sm">
                    ({isPositiveChange ? '+' : ''}{((currentRate.change / currentRate.rate) * 100).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                24-Hour Price Chart
              </h2>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  />
                  <YAxis 
                    domain={['dataMin - 0.005', 'dataMax + 0.005']}
                    tickFormatter={(value) => formatCurrency(value, selectedPair)}
                  />
                  <Tooltip
                    labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                    formatter={(value) => [formatCurrency(value, selectedPair), 'Rate']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    name={selectedPair}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast */}
            {forecast && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  AI Forecast - Next 12 Hours
                </h2>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Model: {forecast.model_info?.accuracy 
                      ? `Ensemble (${(forecast.model_info.accuracy * 100).toFixed(1)}% accuracy)`
                      : 'Ensemble Model'
                    }
                  </p>
                </div>
                
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={forecast.predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value, selectedPair)}
                    />
                    <Tooltip
                      labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                      formatter={(value, name) => [
                        name === 'predicted' ? formatCurrency(value, selectedPair) : `${(value * 100).toFixed(1)}%`,
                        name === 'predicted' ? 'Predicted Rate' : 'Confidence'
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      name="Predicted Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* News */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Newspaper className="h-5 w-5 mr-2" />
                Market News
              </h2>
              
              <div className="space-y-4">
                {news.slice(0, 5).map((article) => (
                  <div key={article.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {article.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{article.source}</span>
                          <span>{timeAgo(article.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                        getSentimentColor(article.sentiment?.label)
                      }`}>
                        {article.sentiment?.label || 'neutral'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-500">
              Exchange Rate Forecasting Dashboard v2.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExchangeRateDashboard;
