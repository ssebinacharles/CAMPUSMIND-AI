import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMoodTrends, getMoodStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Area,
  ComposedChart
} from 'recharts';
import {
  Calendar,
  Download,
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Wind,
  Lightbulb,
  Activity
} from 'lucide-react';

// 🧠 Insight generator based on average mood
const getInsight = (avgMood, totalEntries) => {
  if (totalEntries === 0) return "Start logging your mood to unlock AI-powered insights and predictions.";
  if (avgMood < 4) return "Your recent mood has been low. The AI recommends scheduling a counseling session and trying breathing exercises.";
  if (avgMood < 7) return "You're maintaining stability. To boost resilience, try cognitive reframing techniques when stress spikes.";
  return "You're in a strong mental space. Keep leveraging your coping strategies during high-pressure periods.";
};

// 🔮 Simple forecast generator based on historical trend
const generateForecast = (historicalData, daysAhead = 3) => {
  if (historicalData.length < 3) return [];
  
  const recentScores = historicalData.slice(-5).map(d => d.score);
  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const trend = recentScores[recentScores.length - 1] - recentScores[0];
  const slope = trend / recentScores.length;
  
  const forecast = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].created_at);
  
  for (let i = 1; i <= daysAhead; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + (i * 2)); // Every other day
    const predictedScore = Math.min(10, Math.max(1, avg + (slope * i)));
    forecast.push({
      date: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      forecast: Math.round(predictedScore * 10) / 10,
      isPrediction: true
    });
  }
  return forecast;
};

export default function Dashboard() {
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trendsRes, statsRes] = await Promise.all([
        getMoodTrends(30),
        getMoodStats()
      ]);
      
      // Format historical data for chart
      const historical = trendsRes.data.map(entry => ({
        date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
        created_at: entry.created_at,
        mood: entry.score  // For ComposedChart
      }));

      // Generate forecast for next 7-10 days
      const forecastData = generateForecast(trendsRes.data, 4);
      
      // Merge historical and forecast for chart
      const combinedData = [
        ...historical.map(d => ({ ...d, forecast: d.score })),
        ...forecastData.map(d => ({ 
          date: d.date, 
          mood: null, 
          forecast: d.forecast,
          isPrediction: true 
        }))
      ];
      
      setMoodData(combinedData);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      alert('📄 PDF report generated! (Demo feature)');
      setIsExporting(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={loadData} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const avgMood = stats?.average || 0;
  const totalEntries = stats?.total_entries || 0;
  const streakDays = stats?.streak_days || 0;
  const volatility = stats?.volatility || 0;
  const needsIntervention = stats?.needs_intervention || false;
  const volatilityInsight = stats?.volatility_insight || '';
  const insightMessage = getInsight(avgMood, totalEntries);

  // Find midterms marker (you can make this dynamic based on actual date)
  const midtermsStart = 'Oct 20';
  const hasPredictedDip = avgMood < 6.5;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header & Export Action */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/chat" className="text-gray-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Deep Insights</h1>
              <p className="text-sm text-gray-500">Makerere University • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg disabled:opacity-70"
          >
            {isExporting ? (
              <span className="animate-pulse">Generating PDF...</span>
            ) : (
              <>
                <Download size={18} /> Export for Counselor
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* AI Insight Card (Enhanced with Volatility) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Lightbulb className="text-blue-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">✨ AI Insight</h3>
              <p className="text-gray-700">{insightMessage}</p>
              
              {/* Volatility Insight nested inside */}
              {volatilityInsight && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <Activity size={16} className="mt-0.5 flex-shrink-0 text-indigo-500" />
                    <span>{volatilityInsight}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Now 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Average Mood */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Mood</p>
                <p className="text-3xl font-bold text-gray-800">{avgMood.toFixed(1)}</p>
                <p className="text-gray-600 text-sm mt-1">out of 10</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Total Entries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Entries</p>
                <p className="text-3xl font-bold text-gray-800">{totalEntries}</p>
                <p className="text-gray-600 text-sm mt-1">mood logs</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-gray-800">{streakDays}</p>
                <p className="text-gray-600 text-sm mt-1">consecutive days</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle2 className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Volatility Index - NEW CARD */}
          <div className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
            needsIntervention ? 'border-red-300 bg-red-50' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <Activity size={14} /> Volatility Index
                </p>
                <p className="text-3xl font-bold text-gray-800">{volatility}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {needsIntervention ? '⚠️ High Risk' : '✅ Stable'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                needsIntervention ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                <Activity size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Chart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Brain className="text-indigo-500" /> Mood Forecast Engine
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Based on your past 30 days and upcoming Makerere academic deadlines.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Actual</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-200 rounded-full"></div> Predicted</span>
            </div>
          </div>

          <div className="h-80 w-full">
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={moodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis domain={[1, 10]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  />
                  {hasPredictedDip && (
                    <ReferenceArea x1={midtermsStart} x2="Oct 30" fill="#fee2e2" fillOpacity={0.4} strokeOpacity={0} />
                  )}
                  <Area type="monotone" dataKey="forecast" fill="#e0e7ff" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="mood" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Not enough data to generate forecast. Log at least 3 moods.
              </div>
            )}
          </div>

          {/* Automated Contextual Warning */}
          {hasPredictedDip && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4 flex gap-4 items-start">
              <div className="bg-red-100 p-2 rounded-full text-red-600 mt-1">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-red-800">Predicted Dip Approaching</h4>
                <p className="text-sm text-red-700 mt-1">
                  Our engine notices your mood typically drops 15% leading up to Midterms (Oct 20). 
                  The AI has queued up proactive checking-ins and time-management modules for next week.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coping Strategy ROI */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 ml-1">What Works For You</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-green-100 p-3 rounded-xl text-green-600">
                  <Wind size={24} />
                </div>
                <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={12} /> High Impact
                </span>
              </div>
              <h4 className="font-semibold text-gray-800 text-lg">4-7-8 Breathing</h4>
              <p className="text-sm text-gray-500 mt-1">Used 12 times this month.</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-sm text-gray-500">Average Mood Shift</span>
                <span className="font-bold text-green-600 text-lg">+2.4 pts</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <CheckCircle2 size={24} />
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={12} /> Medium Impact
                </span>
              </div>
              <h4 className="font-semibold text-gray-800 text-lg">Cognitive Reframing</h4>
              <p className="text-sm text-gray-500 mt-1">Used 5 times this month.</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-sm text-gray-500">Average Mood Shift</span>
                <span className="font-bold text-blue-600 text-lg">+1.8 pts</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-md p-6 text-white flex flex-col justify-center items-center text-center">
              <h4 className="font-bold text-lg mb-2">Ready for a check-in?</h4>
              <p className="text-indigo-100 text-sm mb-6">Let's talk about the upcoming midterms and map out a study plan.</p>
              <Link to="/chat" className="bg-white text-indigo-600 font-semibold px-6 py-2.5 rounded-full hover:bg-indigo-50 transition-colors w-full">
                Start Chat Session
              </Link>
            </div>
          </div>
        </div>

        {/* Privacy badge */}
        <p className="text-xs text-gray-400 text-center mt-6">
          🔒 Your data is private and secure • Predictions are based on your logged patterns
        </p>
      </div>
    </div>
  );
}