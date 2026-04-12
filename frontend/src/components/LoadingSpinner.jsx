import { Loader2 } from 'lucide-react';
export default function LoadingSpinner({ size = 32 }) {
  return <Loader2 className="animate-spin text-blue-600" size={size} />;
}