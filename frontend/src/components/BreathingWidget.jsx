import { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

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
            // Switch phase
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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 max-w-sm shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Wind className="text-blue-600" size={20} />
        <h4 className="font-semibold text-gray-800">4-7-8 Breathing</h4>
      </div>
      
      <div className="flex flex-col items-center">
        <div className={`w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center transition-transform duration-1000 ${getCircleSize()}`}>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-800">{counter}</p>
            <p className="text-xs text-blue-600 uppercase tracking-wider">{phase}</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-3 text-center">
          {phase === 'inhale' && 'Breathe in through your nose'}
          {phase === 'hold' && 'Hold your breath'}
          {phase === 'exhale' && 'Exhale slowly through your mouth'}
        </p>
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
        
        {cycles > 0 && (
          <p className="text-xs text-gray-500 mt-2">Completed {cycles} cycle{cycles !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}