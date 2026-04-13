import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JournalPrompt({ prompt }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-sm shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="text-amber-600" size={18} />
        <h4 className="font-medium text-gray-800">Journal Prompt</h4>
      </div>
      <p className="text-sm text-gray-700 mb-3">
        {prompt || "What's weighing on your mind right now? Writing can help clarify your thoughts."}
      </p>
      <Link 
        to="/mood" 
        className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg inline-block transition-colors"
      >
        Open Journal →
      </Link>
    </div>
  );
}