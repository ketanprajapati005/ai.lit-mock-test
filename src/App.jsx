import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from './config.js';
import { createAttempt } from './lib/attempt.js';
import { load, save } from './lib/storage.js';
import Home from './components/Home.jsx';
import Test from './components/Test.jsx';
import Results from './components/Results.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { TITLE } from './lib/bank.js';

export default function App() {
  const [attempt, setAttempt] = useState(() => load('attempt', null));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('settings', {}) }));

  useEffect(() => save('attempt', attempt ?? undefined), [attempt]);
  useEffect(() => save('settings', settings), [settings]);

  const start = ({ questionIds, subjectIds, label, overrideSettings }) => {
    setAttempt(createAttempt({ questionIds, subjectIds, label, settings: overrideSettings ?? settings }));
    window.scrollTo(0, 0);
  };

  const retake = () =>
    start({
      questionIds: attempt.order,
      subjectIds: attempt.subjectIds,
      label: attempt.label,
      overrideSettings: attempt.settings,
    });

  const goHome = () => setAttempt(null);

  let view;
  if (!attempt) {
    view = <Home settings={settings} onSettingsChange={setSettings} onStart={start} />;
  } else if (!attempt.submittedAt) {
    view = <Test attempt={attempt} onChange={setAttempt} onExit={goHome} />;
  } else {
    view = <Results attempt={attempt} onRetake={retake} onHome={goHome} onPractice={start} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={attempt?.submittedAt || !attempt ? goHome : undefined} type="button">
          {TITLE}
        </button>
        <ThemeToggle />
      </header>
      <main className="container">{view}</main>
    </div>
  );
}
