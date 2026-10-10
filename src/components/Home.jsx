import { SCORING } from '../config.js';
import { SUBJECTS, questionIdsFor } from '../lib/bank.js';

export default function Home({ settings, onSettingsChange, onStart }) {
  const set = (patch) => onSettingsChange({ ...settings, ...patch });
  const total = SUBJECTS.reduce((n, s) => n + s.count, 0);

  const startSubjects = (subjectIds, label) =>
    onStart({ questionIds: questionIdsFor(subjectIds), subjectIds, label });

  return (
    <div className="stack">
      <section className="card">
        <h1>Round 2 — Technical Module</h1>
        <p className="muted">
          {total} questions across {SUBJECTS.length} subjects. Marking: +{SCORING.correct} correct,{' '}
          {SCORING.incorrect} incorrect, {SCORING.unanswered} unanswered. Answers are revealed only after you
          submit.
        </p>
      </section>

      <section className="subject-grid">
        {SUBJECTS.map((s) => (
          <div className="card subject-card" key={s.id}>
            <h2>{s.name}</h2>
            <p className="muted">
              {s.count} questions · {s.count * SCORING.correct} marks
            </p>
            <button className="btn btn-primary" type="button" onClick={() => startSubjects([s.id], s.name)}>
              Start {s.name}
            </button>
          </div>
        ))}
        <div className="card subject-card subject-card-all">
          <h2>All subjects</h2>
          <p className="muted">
            {total} questions · {total * SCORING.correct} marks · combined result with per-subject breakdown
          </p>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => startSubjects(SUBJECTS.map((s) => s.id), 'All subjects')}
          >
            Start full test
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Settings</h2>
        <div className="settings">
          <label className="check">
            <input
              type="checkbox"
              checked={settings.shuffleQuestions}
              onChange={(e) => set({ shuffleQuestions: e.target.checked })}
            />
            Randomize question order
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={settings.shuffleOptions}
              onChange={(e) => set({ shuffleOptions: e.target.checked })}
            />
            Randomize option order
          </label>
          <label className="field">
            Time limit (minutes, 0 = none)
            <input
              type="number"
              min="0"
              max="600"
              value={settings.timeLimitMinutes}
              onChange={(e) => set({ timeLimitMinutes: Math.max(0, Math.min(600, Number(e.target.value) || 0)) })}
            />
          </label>
        </div>
        <p className="muted small">Settings apply to the next test you start.</p>
      </section>
    </div>
  );
}
