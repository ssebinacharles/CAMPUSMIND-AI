import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 32 }) {
  return (
    <div className="flex justify-center items-center p-4">
      <Loader2 className="animate-spin text-indigo-500" size={size} />
    </div>
  );
}