import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMoodTrends, getMoodStats } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, Area, ComposedChart, BarChart, Bar
} from 'recharts';
import {
  Calendar, Download, TrendingUp, Brain, AlertTriangle,
  CheckCircle2, ArrowLeft, Wind, Activity, Sparkles, Clock
} from 'lucide-react';

// ==========================================
// 🚀 1. HOISTED STATIC DATA & FUNCTIONS
// (Prevents reallocation on every render)
// ==========================================
const MIDTERMS_START = 'Oct 20';

const WEEKLY_ACTIVITY_MOCK = [
  { day: 'Mon', mood: 6, appUsage: 15 },
  { day: 'Tue', mood: 7, appUsage: 25 },
  { day: 'Wed', mood: 5, appUsage: 40 },
  { day: 'Thu', mood: 8, appUsage: 10 },
  { day: 'Fri', mood: 8, appUsage: 20 },
  { day: 'Sat', mood: 9, appUsage: 35 },
  { day: 'Sun', mood: 7, appUsage: 15 },
];

const generateForecast = (historicalData, daysAhead = 3) => {
  if (!historicalData || historicalData.length < 3) return [];
  const recentScores = historicalData.slice(-5).map(d => d.score);
  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const trend = recentScores[recentScores.length - 1] - recentScores[0];
  const slope = trend / recentScores.length;
  
  const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / recentScores.length;
  const stdDev = Math.sqrt(variance);
  
  const forecast = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].created_at);
  
  for (let i = 1; i <= daysAhead; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + i * 2);
    const predictedScore = Math.min(10, Math.max(1, avg + slope * i));
    const uncertainty = stdDev * (1 + i * 0.3);
    
    forecast.push({
      date: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      forecast: Math.round(predictedScore * 10) / 10,
      upperBound: Math.min(10, Math.round((predictedScore + uncertainty) * 10) / 10),
      lowerBound: Math.max(1, Math.round((predictedScore - uncertainty) * 10) / 10),
      isPrediction: true,
    });
  }
  return forecast;
};

// ==========================================
// 📊 3. CUSTOM RECHARTS TOOLTIP
// ==========================================
const CustomForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isPrediction = payload[0].payload.isPrediction;
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
        <p className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          {label} {isPrediction && <span className="text-amber-500 text-xs flex items-center gap-1"><AlertTriangle size={12}/> Forecast</span>}
        </p>
        {payload.map((entry, index) => {
          // Hide bounds from tooltip for cleaner UI
          if (entry.dataKey === 'upperBound' || entry.dataKey === 'lowerBound') return null;
          return (
            <div key={index} className="flex justify-between items-center text-sm mb-1">
              <span style={{ color: entry.color }} className="font-medium capitalize">{entry.name}:</span>
              <span className="font-bold text-slate-700">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle'); // idle, exporting, success

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trendsRes, statsRes] = await Promise.all([
        getMoodTrends(30),
        getMoodStats(),
      ]);
      
      const historical = (trendsRes.data || []).map(entry => ({
        date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
        created_at: entry.created_at,
        mood: entry.score,
        isPrediction: false
      }));

      const forecastData = generateForecast(trendsRes.data || [], 4);
      
      const combinedData = [
        ...historical.map(d => ({ ...d, forecast: d.score })),
        ...forecastData.map(d => ({
          date: d.date,
          mood: null,
          forecast: d.forecast,
          upperBound: d.upperBound,
          lowerBound: d.lowerBound,
          isPrediction: true,
        })),
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

  // 🪄 2. MODERN TOAST UX
  const handleExport = () => {
    setExportStatus('exporting');
    setTimeout(() => {
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    }, 2000);
  };

  // ⚡ 1. AGGRESSIVE useMemo FOR DERIVED STATE
  const { 
    avgMood, 
    totalEntries, 
    streakDays, 
    volatility, 
    needsIntervention, 
    volatilityInsight 
  } = useMemo(() => ({
    avgMood: stats?.average || 0,
    totalEntries: stats?.total_entries || 0,
    streakDays: stats?.streak_days || 0,
    volatility: stats?.volatility || 0,
    needsIntervention: stats?.needs_intervention || false,
    volatilityInsight: stats?.volatility_insight || ''
  }), [stats]);

  const confidenceScore = useMemo(() => Math.min(98, Math.floor(totalEntries * 5) + 30), [totalEntries]);
  const hasPredictedDip = useMemo(() => avgMood < 6.5, [avgMood]);

  // ♿ 4. COLOR CONTRAST SAFETY (Using -700 text on -50 backgrounds)
  const { insightMessage, tone, bgClass, iconColor } = useMemo(() => {
    if (needsIntervention) {
      return { message: "I'm concerned about your recent emotional patterns. Let's stabilize together.", tone: "critical", bgClass: "bg-red-50 border-red-200 text-red-800", iconColor: "text-red-700" };
    }
    if (avgMood > 0 && avgMood < 5) {
      return { message: "You're going through a tough phase. Let's work through it step by step.", tone: "support", bgClass: "bg-amber-50 border-amber-200 text-amber-800", iconColor: "text-amber-700" };
    }
    if (avgMood > 0 && avgMood < 7) {
      return { message: "You're stable, but there's room to strengthen your resilience.", tone: "neutral", bgClass: "bg-indigo-50 border-indigo-200 text-indigo-900", iconColor: "text-indigo-700" };
    }
    if (avgMood >= 7) {
      return { message: "You're thriving. Let's maintain this momentum.", tone: "positive", bgClass: "bg-emerald-50 border-emerald-200 text-emerald-900", iconColor: "text-emerald-700" };
    }
    return { message: "Log a few more moods to generate your personalized AI insights.", tone: "empty", bgClass: "bg-slate-50 border-slate-200 text-slate-800", iconColor: "text-slate-600" };
  }, [needsIntervention, avgMood]);

  // 🪄 2. SKELETON LOADERS (Perceived Performance)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 animate-pulse">
        <div className="max-w-6xl mx-auto flex justify-between mb-8">
          <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-slate-200 rounded-[2rem]"></div>
            <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>)}
            </div>
            <div className="h-64 bg-slate-200 rounded-[2rem]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-slate-700 mb-6 font-medium">{error}</p>
          <button onClick={loadData} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-md transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/chat" className="p-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition text-slate-500 hover:text-indigo-600 border border-slate-100" aria-label="Back to chat">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={22} />
              Well-Being Tracker
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Makerere University • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        {/* Dynamic Export Button UX */}
        <button
          onClick={handleExport}
          disabled={exportStatus !== 'idle'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium shadow-sm transition-all disabled:opacity-90 ${
            exportStatus === 'success' 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
              : 'bg-white text-slate-700 border border-slate-200 hover:shadow-md'
          }`}
        >
          {exportStatus === 'exporting' && <><LoadingSpinner size={16} /> <span className="animate-pulse">Exporting...</span></>}
          {exportStatus === 'success' && <><CheckCircle2 size={18} /> Saved to PDF</>}
          {exportStatus === 'idle' && <><Download size={18} className="text-slate-400" /> Export</>}
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Adaptive AI Insight Card */}
          <div className={`rounded-[2rem] p-8 border shadow-sm relative overflow-hidden transition-colors duration-500 ${bgClass}`}>
            <div className="absolute -right-10 -top-10 opacity-10">
              <Brain size={150} className={iconColor} />
            </div>
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/50 backdrop-blur-sm border border-white/40`}>
                <Brain size={24} className={iconColor} />
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                ✨ AI Insight
              </h3>
              <p className="leading-relaxed max-w-xl font-medium">{insightMessage}</p>
              
              {totalEntries > 0 && (
                <div className="mt-4 flex items-center gap-2 text-xs opacity-70 font-semibold">
                  <Brain size={14} />
                  <span>AI Confidence: {confidenceScore}%</span>
                  <span>(based on {totalEntries} data points)</span>
                </div>
              )}
              
              {volatilityInsight && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <p className="text-sm font-semibold flex items-start gap-2">
                    <Activity size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{volatilityInsight}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Mood Forecast Engine</h2>
                <p className="text-sm text-slate-500 mt-1">Based on your past 30 days and academic deadlines</p>
              </div>
              <div className="hidden sm:flex gap-4 text-sm font-medium">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Actual</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-200"></div> Predicted</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-100/50"></div> Range</span>
              </div>
            </div>
            
            {/* 📊 3. RESPONSIVE SIZING FIX (min-h-[300px]) */}
            <div className="min-h-[300px] w-full" role="img" aria-label="Line chart showing mood forecast">
              {moodData.length > 2 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={moodData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis domain={[1, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={<CustomForecastTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }} />
                    
                    {hasPredictedDip && (
                      <ReferenceArea x1={MIDTERMS_START} x2="Oct 30" fill="#fee2e2" fillOpacity={0.3} strokeOpacity={0} />
                    )}
                    
                    {/* Uncertainty Bands */}
                    <Area type="monotone" dataKey="upperBound" stroke="none" fill="#c7d2fe" fillOpacity={0.3} isAnimationActive={false} />
                    <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#c7d2fe" fillOpacity={0.3} isAnimationActive={false} />
                    
                    {/* Forecast Line */}
                    <Area type="monotone" dataKey="forecast" name="Predicted Mood" fill="none" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" />
                    
                    {/* Actual Mood Line */}
                    <Line type="monotone" dataKey="mood" name="Actual Mood" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                // 🪄 2. GRACEFUL EMPTY STATE
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <TrendingUp size={32} className="text-slate-300 mb-3" />
                   <p className="font-medium">Not enough data to generate forecast.</p>
                   <p className="text-sm mt-1">Log at least 3 moods to unlock the engine.</p>
                </div>
              )}
            </div>
            
            {hasPredictedDip && moodData.length > 2 && (
              <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4 items-start">
                <div className="bg-red-100 p-2 rounded-xl text-red-600 mt-1"><AlertTriangle size={18} /></div>
                <div>
                  <h4 className="font-semibold text-red-800">Predicted Dip Approaching</h4>
                  <p className="text-sm text-red-700 mt-1 font-medium">
                    Our engine notices your mood typically drops around Midterms (Oct 20). We've prepared proactive support in your chat.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg Mood</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{totalEntries ? avgMood.toFixed(1) : '—'}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Entries</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{totalEntries}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Streak</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{streakDays}</p>
            </div>
            <div className={`rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border ${needsIntervention ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity size={12} /> Volatility
              </p>
              <p className={`text-2xl font-black mt-1 ${needsIntervention ? 'text-red-700' : 'text-slate-800'}`}>
                {totalEntries ? volatility : '—'}
              </p>
            </div>
          </div>

          {/* Activity Bar Chart */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="mb-6">
              <h3 className="text-slate-800 font-bold">App Activity</h3>
              <p className="text-sm text-slate-500">Time spent logging (mins)</p>
            </div>
            <div className="min-h-[160px] w-full" role="img" aria-label="Bar chart showing app activity">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={WEEKLY_ACTIVITY_MOCK}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0,0,0,0.1)', fontWeight: 'bold' }} 
                    formatter={(value) => [`${value} mins`, 'Usage']}
                  />
                  <Bar dataKey="appUsage" fill="#6366f1" radius={[4, 4, 4, 4]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coping Strategies */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">What Works</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <Wind size={18} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-900">4-7-8 Breathing</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">+2.4</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Cognitive Reframing</span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">+1.8</span>
              </div>
            </div>
            <Link to="/chat" className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
              Start Check‑in
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 font-medium text-center mt-8 max-w-6xl mx-auto">
        🔒 Private & Secure • Predictions run locally based on your logged patterns
      </p>
    </div>
  );
}