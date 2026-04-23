const moods = [
  { emoji: '😢', label: 'Very Low', score: 2, color: 'from-red-400 to-pink-400' },
  { emoji: '😕', label: 'Low', score: 4, color: 'from-orange-400 to-amber-400' },
  { emoji: '😐', label: 'Neutral', score: 6, color: 'from-yellow-400 to-amber-400' },
  { emoji: '🙂', label: 'Good', score: 8, color: 'from-green-400 to-emerald-400' },
  { emoji: '😄', label: 'Great', score: 10, color: 'from-blue-400 to-indigo-400' },
];

export default function MoodSelector({ selectedScore, onSelect }) {
  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-4">
      {moods.map((mood) => (
        <button
          key={mood.score}
          type="button"
          onClick={() => onSelect(mood.score)}
          className={`p-4 rounded-2xl text-3xl transition-all duration-300 ${
            selectedScore === mood.score
              ? `bg-gradient-to-br ${mood.color} text-white shadow-xl scale-105 border-2 border-white/50`
              : 'bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-md'
          }`}
        >
          <div className="drop-shadow-md">{mood.emoji}</div>
          <div className={`text-xs mt-2 font-medium ${selectedScore === mood.score ? 'text-white/90' : 'text-gray-600'}`}>
            {mood.label}
          </div>
        </button>
      ))}
    </div>
  );
}