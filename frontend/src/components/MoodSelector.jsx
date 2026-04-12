const moods = [
  { emoji: '😢', label: 'Very Low', score: 2 },
  { emoji: '😕', label: 'Low', score: 4 },
  { emoji: '😐', label: 'Neutral', score: 6 },
  { emoji: '🙂', label: 'Good', score: 8 },
  { emoji: '😄', label: 'Great', score: 10 },
];

export default function MoodSelector({ selectedScore, onSelect }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-4">
      {moods.map((mood) => (
        <button
          key={mood.score}
          type="button"
          onClick={() => onSelect(mood.score)}
          className={`p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl transition-all ${
            selectedScore === mood.score ? 'bg-blue-100 border-2 border-blue-500 scale-105 shadow-md' : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          <div>{mood.emoji}</div>
          <div className="text-xs mt-1 text-gray-600 hidden sm:block">{mood.label}</div>
        </button>
      ))}
    </div>
  );
}