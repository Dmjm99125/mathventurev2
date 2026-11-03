import { Compass } from 'lucide-react';

export function AppLoadingScreen() {
  return (
    <div role="status" aria-live="polite" className="student-loading-screen">
      <div className="student-loading-card">
        <div className="student-loading__badge" aria-hidden="true">
          <Compass className="h-10 w-10" strokeWidth={2.2} />
        </div>
        <h1 className="student-loading__title">MathVenture</h1>
        <p className="student-loading__body">Getting things ready…</p>
        <div className="student-loading__progress" aria-hidden="true">
          <div className="student-loading__track">
            <div className="student-loading__fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
