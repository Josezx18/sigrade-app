import { LoadingSpinner } from './LoadingSpinner';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
      <LoadingSpinner />
    </div>
  );
}
