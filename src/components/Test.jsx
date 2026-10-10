import { useCallback, useEffect, useState } from 'react';
import { QUESTIONS, subjectName } from '../lib/bank.js';
import QuestionCard from './QuestionCard.jsx';
import Navigator from './Navigator.jsx';
import Timer from './Timer.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function Test({ attempt, onChange, onExit }) {
  const [dialog, setDialog] = useState(null); // 'submit' | 'restart' | 'exit' | null
  const { order, answers, current } = attempt;
  const total = order.length;
  const qid = order[current];
  const question = QUESTIONS[qid];
  const answeredCount = order.filter((id) => answers[id] != null).length;

  const update = (patch) => onChange({ ...attempt, ...patch });
  const go = (index) => update({ current: Math.max(0, Math.min(total - 1, index)) });
  const choose = (key) => update({ answers: { ...answers, [qid]: key } });
  const clear = () => {
    const next = { ...answers };
    delete next[qid];
    update({ answers: next });
  };

  const submit = useCallback(() => {
    onChange((a) => (a && !a.submittedAt ? { ...a, submittedAt: Date.now() } : a));
    window.scrollTo(0, 0);
  }, [onChange]);

  const restart = () => {
    onChange({ ...attempt, answers: {}, current: 0, startedAt: Date.now(),
      deadline: attempt.deadline ? Date.now() + attempt.settings.timeLimitMinutes * 60_000 : null });
    setDialog(null);
  };

  // Keyboard: ←/→ to move between questions.
  useEffect(() => {
    const onKey = (e) => {
      if (dialog || e.target.closest?.('input[type="number"], textarea')) return;
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowLeft') go(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="test-layout">
      <div className="test-main stack">
        <div className="card test-header">
          <div className="row between wrap">
            <strong>{attempt.label}</strong>
            <Timer startedAt={attempt.startedAt} deadline={attempt.deadline} onExpire={submit} />
          </div>
          <div className="row between small muted">
            <span>Question {current + 1} of {total}</span>
            <span>{answeredCount} answered · {total - answeredCount} left</span>
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}
            aria-label="Questions answered">
            <div className="progress-bar" style={{ width: `${(answeredCount / total) * 100}%` }} />
          </div>
        </div>

        <QuestionCard
          question={question}
          optionOrder={attempt.optionOrder[qid]}
          chosen={answers[qid]}
          onChoose={choose}
          subjectLabel={subjectName(question.subjectId)}
          position={`Question ${current + 1} / ${total}`}
        />

        <div className="row between wrap">
          <div className="row">
            <button className="btn" type="button" onClick={() => go(current - 1)} disabled={current === 0}>
              ← Previous
            </button>
            <button className="btn" type="button" onClick={clear} disabled={answers[qid] == null}>
              Clear answer
            </button>
          </div>
          {current < total - 1 ? (
            <button className="btn btn-primary" type="button" onClick={() => go(current + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" type="button" onClick={() => setDialog('submit')}>
              Submit test
            </button>
          )}
        </div>
      </div>

      <aside className="test-side stack">
        <Navigator order={order} answers={answers} current={current} onJump={go} />
        <button className="btn btn-primary btn-block" type="button" onClick={() => setDialog('submit')}>
          Submit test
        </button>
        <div className="row">
          <button className="btn btn-block" type="button" onClick={() => setDialog('restart')}>Restart</button>
          <button className="btn btn-block" type="button" onClick={() => setDialog('exit')}>Quit to home</button>
        </div>
      </aside>

      <ConfirmDialog
        open={dialog === 'submit'}
        title="Submit test?"
        confirmLabel="Submit"
        onConfirm={() => { setDialog(null); submit(); }}
        onCancel={() => setDialog(null)}
      >
        <p>You have answered {answeredCount} of {total} questions.</p>
        {total - answeredCount > 0 && (
          <p className="warn">{total - answeredCount} unanswered question(s) will score 0.</p>
        )}
        <p>You can't change answers after submitting.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'restart'}
        title="Restart test?"
        confirmLabel="Restart"
        onConfirm={restart}
        onCancel={() => setDialog(null)}
      >
        <p>All your answers in this attempt will be cleared and the timer reset.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'exit'}
        title="Quit this test?"
        confirmLabel="Quit"
        onConfirm={() => { setDialog(null); onExit(); }}
        onCancel={() => setDialog(null)}
      >
        <p>Your progress in this attempt will be discarded.</p>
      </ConfirmDialog>
    </div>
  );
}
