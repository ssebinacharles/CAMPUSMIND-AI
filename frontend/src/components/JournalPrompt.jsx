import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JournalPrompt({ prompt }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-5 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-amber-100 p-2 rounded-xl">
          <BookOpen className="text-amber-600" size={18} />
        </div>
        <h4 className="font-semibold text-gray-800">Journal Prompt</h4>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-4">
        {prompt || "What's weighing on your mind right now? Writing can help clarify your thoughts."}
      </p>
      <Link 
        to="/mood" 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        Open Journal <ArrowRight size={14} />
      </Link>
    </div>
  );
}