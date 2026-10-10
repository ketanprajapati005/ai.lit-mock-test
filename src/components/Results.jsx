import { useMemo, useState } from 'react';
import { SCORING } from '../config.js';
import { LETTERS, QUESTIONS, subjectName } from '../lib/bank.js';
import { scoreAttempt, statusOf } from '../lib/scoring.js';
import { formatDuration } from '../lib/format.js';

const FILTERS = [
  ['all', 'All'],
  ['incorrect', 'Incorrect'],
  ['unanswered', 'Unanswered'],
  ['correct', 'Correct'],
];

export default function Results({ attempt, onRetake, onHome, onPractice }) {
  const [filter, setFilter] = useState('all');
  const questions = useMemo(() => attempt.order.map((id) => QUESTIONS[id]), [attempt.order]);
  const result = useMemo(() => scoreAttempt(questions, attempt.answers, SCORING), [questions, attempt.answers]);
  const o = result.overall;

  const wrongIds = questions.filter((q) => statusOf(q, attempt.answers) !== 'correct').map((q) => q.id);
  const incorrectOnly = questions.filter((q) => statusOf(q, attempt.answers) === 'incorrect').map((q) => q.id);
  const shown = questions
    .map((q, index) => ({ q, index, status: statusOf(q, attempt.answers) }))
    .filter((r) => filter === 'all' || r.status === filter);

  const practice = (ids, label) =>
    onPractice({
      questionIds: ids,
      subjectIds: [...new Set(ids.map((id) => QUESTIONS[id].subjectId))],
      label,
      overrideSettings: attempt.settings,
    });

  const reviewIncorrect = () => {
    setFilter('incorrect');
    document.getElementById('review')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="stack">
      <section className="card">
        <h1>Results — {attempt.label}</h1>
        <p className="muted small">
          Time taken: {formatDuration(attempt.submittedAt - attempt.startedAt)} · Marking +{SCORING.correct} /{' '}
          {SCORING.incorrect} / {SCORING.unanswered}
        </p>
        <div className="stats">
          <Stat label="Score" value={`${o.marks} / ${o.maxMarks}`} />
          <Stat label="Percentage" value={`${o.percentage}%`} />
          <Stat label="Accuracy" value={`${o.accuracy}%`} hint="correct ÷ attempted" />
          <Stat label="Total questions" value={o.total} />
          <Stat label="Correct" value={o.correct} tone="good" />
          <Stat label="Incorrect" value={o.incorrect} tone="bad" />
          <Stat label="Unanswered" value={o.unanswered} />
        </div>
        <div className="row wrap">
          <button className="btn" type="button" onClick={reviewIncorrect} disabled={o.incorrect === 0}>
            Review incorrect answers
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => practice(incorrectOnly, `Practice: ${o.incorrect} incorrect`)}
            disabled={incorrectOnly.length === 0}
          >
            Practice incorrect ({incorrectOnly.length})
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => practice(wrongIds, `Practice: ${wrongIds.length} incorrect + unanswered`)}
            disabled={wrongIds.length === 0}
          >
            Practice incorrect + unanswered ({wrongIds.length})
          </button>
          <button className="btn btn-primary" type="button" onClick={onRetake}>Retake test</button>
          <button className="btn" type="button" onClick={onHome}>Home</button>
        </div>
      </section>

      <section className="card">
        <h2>Subject-wise marks</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Questions</th>
                <th>Max marks</th>
                <th>Marks obtained</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Unattempted</th>
                <th>Percentage</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {result.subjects.map((s) => (
                <SubjectRow key={s.subjectId} name={subjectName(s.subjectId)} s={s} />
              ))}
            </tbody>
            {result.subjects.length > 1 && (
              <tfoot>
                <SubjectRow name="Overall total" s={o} />
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="card" id="review">
        <div className="row between wrap">
          <h2>Answer review</h2>
          <div className="segmented" role="tablist" aria-label="Filter questions">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 && <p className="muted">No questions in this category.</p>}
        <ol className="review-list">
          {shown.map(({ q, index, status }) => (
            <ReviewItem
              key={q.id}
              q={q}
              index={index}
              status={status}
              chosen={attempt.answers[q.id]}
              optionOrder={attempt.optionOrder[q.id]}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, tone, hint }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`} title={hint}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SubjectRow({ name, s }) {
  return (
    <tr>
      <th scope="row">{name}</th>
      <td>{s.total}</td>
      <td>{s.maxMarks}</td>
      <td>{s.marks}</td>
      <td>{s.correct}</td>
      <td>{s.incorrect}</td>
      <td>{s.unanswered}</td>
      <td>{s.percentage}%</td>
      <td>{s.accuracy}%</td>
    </tr>
  );
}

function ReviewItem({ q, index, status, chosen, optionOrder }) {
  const byKey = Object.fromEntries(q.options.map((o) => [o.key, o]));
  const badge = { correct: 'Correct', incorrect: 'Incorrect', unanswered: 'Not answered' }[status];
  const letterOf = (key) => LETTERS[optionOrder.indexOf(key)];
  return (
    <li className={`review-item review-${status}`}>
      <div className="row between wrap">
        <span className="small muted">
          #{index + 1} · {subjectName(q.subjectId)} · Q{q.number} (PDF page {q.sourcePage})
        </span>
        <span className={`badge badge-${status}`}>{badge}</span>
      </div>
      {q.context && <p className="scenario">{q.context}</p>}
      <p className="stem">{q.question}</p>
      <ul className="review-options">
        {optionOrder.map((key, i) => {
          const isAnswer = key === q.answer;
          const isChosen = key === chosen;
          const cls = isAnswer ? 'opt-correct' : isChosen ? 'opt-wrong' : '';
          return (
            <li key={key} className={cls}>
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="option-text">{byKey[key].text}</span>
              {isAnswer && <span className="tag tag-good">✓ Correct answer</span>}
              {isChosen && !isAnswer && <span className="tag tag-bad">✗ Your answer</span>}
              {isChosen && isAnswer && <span className="tag tag-good">Your answer</span>}
            </li>
          );
        })}
      </ul>
      <p className="small">
        <strong>Your answer:</strong> {chosen ? `${letterOf(chosen)}) ${byKey[chosen].text}` : '—'}
        <br />
        <strong>Correct answer:</strong> {letterOf(q.answer)}) {byKey[q.answer].text}
      </p>
      {q.explanation && (
        <p className="explanation">
          <strong>Explanation (from PDF):</strong> {q.explanation}
        </p>
      )}
    </li>
  );
}
