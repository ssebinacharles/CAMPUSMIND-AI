import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logMood } from '../services/api';
import MoodSelector from '../components/MoodSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';

export default function Mood() {
  const [selectedScore, setSelectedScore] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScore) {
      setError('Please select how you\'re feeling');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await logMood(selectedScore, note);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Failed to log mood:', error);
      setError('Failed to save mood. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/chat" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-all duration-200 hover:translate-x-[-4px]">
          <ArrowLeft size={20} className="mr-1" />
          Back to Chat
        </Link>

        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 transition-all duration-300 hover:shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">How are you feeling today?</h1>
          <p className="text-gray-600 mb-8">Your mood data helps you track patterns over time.</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">✅ Mood saved successfully</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <MoodSelector selectedScore={selectedScore} onSelect={setSelectedScore} />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add a note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!selectedScore || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
              >
                {submitting ? <LoadingSpinner size={20} /> : 'Save Mood'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}