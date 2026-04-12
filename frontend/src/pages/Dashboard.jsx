import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMoodTrends, getMoodStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Calendar, Award } from 'lucide-react';

export default function Dashboard() {
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [trendsRes, statsRes] = await Promise.all([getMoodTrends(30), getMoodStats()]);
      const formatted = trendsRes.data.map(entry => ({
        date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
      })).reverse();
      setMoodData(formatted);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (score) => {
    if (score >= 8) return '😄';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    if (score >= 2) return '😕';
    return '😢';
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/chat" className="inline-flex items-center text-gray-600 hover:text-gray-800"><ArrowLeft size={20} className="mr-1" /> Back to Chat</Link>
          <h1 className="text-2xl font-bold text-gray-800">Your Wellness Dashboard</h1>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Average Mood</p><p className="text-3xl font-bold text-gray-800">{stats?.average || '—'}</p><p className="text-gray-600 text-sm mt-1">out of 10</p></div>
              <div className="bg-blue-100 p-3 rounded-full"><TrendingUp className="text-blue-600" size={24} /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Entries</p><p className="text-3xl font-bold text-gray-800">{stats?.total_entries || 0}</p><p className="text-gray-600 text-sm mt-1">mood logs</p></div>
              <div className="bg-green-100 p-3 rounded-full"><Calendar className="text-green-600" size={24} /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Current Streak</p><p className="text-3xl font-bold text-gray-800">{stats?.streak_days || 0}</p><p className="text-gray-600 text-sm mt-1">consecutive days</p></div>
              <div className="bg-purple-100 p-3 rounded-full"><Award className="text-purple-600" size={24} /></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Mood Trends (Last 30 Days)</h2>
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(value) => [`${value}/10`, 'Mood Score']} />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No mood data yet. Start logging your mood to see trends!</p>
              <Link to="/mood" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Log Your First Mood</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}