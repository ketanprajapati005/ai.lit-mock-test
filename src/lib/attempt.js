import { QUESTIONS } from './bank.js';
import { shuffled } from './shuffle.js';

// Build a fresh attempt for the given question ids.
export function createAttempt({ questionIds, subjectIds, label, settings }) {
  const order = settings.shuffleQuestions ? shuffled(questionIds) : [...questionIds];
  const optionOrder = {};
  for (const id of order) {
    const keys = QUESTIONS[id].options.map((o) => o.key);
    optionOrder[id] = settings.shuffleOptions ? shuffled(keys) : keys;
  }
  const now = Date.now();
  return {
    label,
    subjectIds,
    order,
    optionOrder,
    answers: {},
    current: 0,
    startedAt: now,
    deadline: settings.timeLimitMinutes > 0 ? now + settings.timeLimitMinutes * 60_000 : null,
    submittedAt: null,
    settings,
  };
}
