import { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export default function BreathingWidget() {
  const [phase, setPhase] = useState('inhale');
  const [counter, setCounter] = useState(4);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    let timer;
    if (isActive) {
      timer = setInterval(() => {
        setCounter(prev => {
          if (prev === 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              return 7;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return 8;
            } else {
              setPhase('inhale');
              setCycles(c => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase]);

  const reset = () => {
    setIsActive(false);
    setPhase('inhale');
    setCounter(4);
    setCycles(0);
  };

  const getCircleSize = () => {
    if (phase === 'inhale') return 'scale-100';
    if (phase === 'hold') return 'scale-110';
    return 'scale-90';
  };

  const getGradient = () => {
    if (phase === 'inhale') return 'from-blue-400 to-cyan-400';
    if (phase === 'hold') return 'from-indigo-400 to-purple-400';
    return 'from-purple-400 to-pink-400';
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-5 max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
          <Wind className="text-white" size={18} />
        </div>
        <h4 className="font-semibold text-gray-800">4-7-8 Breathing</h4>
        <Sparkles className="text-indigo-400 ml-auto" size={16} />
      </div>
      
      <div className="flex flex-col items-center">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-1000 bg-gradient-to-r ${getGradient()} shadow-lg ${getCircleSize()}`}>
          <div className="text-center">
            <p className="text-4xl font-bold text-white drop-shadow-md">{counter}</p>
            <p className="text-xs text-white/90 uppercase tracking-wider font-medium">{phase}</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-4 text-center font-medium">
          {phase === 'inhale' && 'Breathe in through your nose'}
          {phase === 'hold' && 'Hold your breath'}
          {phase === 'exhale' && 'Exhale slowly through your mouth'}
        </p>
        
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setIsActive(!isActive)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="bg-white/80 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-sm"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
        
        {cycles > 0 && (
          <p className="text-xs text-gray-500 mt-3 font-medium">
            Completed {cycles} cycle{cycles !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}