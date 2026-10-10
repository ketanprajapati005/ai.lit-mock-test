// Pure scoring helpers. `questions` is a list of { id, subjectId, answer }.
// `answers` maps question id -> chosen option key ("A".."D").

function emptyTally() {
  return { total: 0, correct: 0, incorrect: 0, unanswered: 0, marks: 0, maxMarks: 0 };
}

function finish(t) {
  const attempted = t.correct + t.incorrect;
  return {
    ...t,
    attempted,
    marks: round(t.marks),
    percentage: t.maxMarks > 0 ? round((t.marks / t.maxMarks) * 100) : 0,
    accuracy: attempted > 0 ? round((t.correct / attempted) * 100) : 0,
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function statusOf(question, answers) {
  const chosen = answers[question.id];
  if (chosen == null) return 'unanswered';
  return chosen === question.answer ? 'correct' : 'incorrect';
}

export function scoreAttempt(questions, answers, scoring) {
  const overall = emptyTally();
  const bySubject = new Map();

  for (const q of questions) {
    if (!bySubject.has(q.subjectId)) bySubject.set(q.subjectId, emptyTally());
    const status = statusOf(q, answers);
    for (const t of [overall, bySubject.get(q.subjectId)]) {
      t.total += 1;
      t.maxMarks += scoring.correct;
      t[status] += 1;
      t.marks += scoring[status];
    }
  }

  return {
    overall: finish(overall),
    subjects: [...bySubject].map(([subjectId, t]) => ({ subjectId, ...finish(t) })),
  };
}
