import data from '../data/questions.json';

// Positional labels shown next to options (independent of the original key when shuffled).
export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const TITLE = data.title;
export const SUBJECTS = data.subjects.map(({ id, name, questions }) => ({
  id,
  name,
  count: questions.length,
}));

// Flat lookup: question id -> question (with subjectId attached).
export const QUESTIONS = {};
for (const subject of data.subjects) {
  for (const q of subject.questions) {
    QUESTIONS[q.id] = { ...q, subjectId: subject.id };
  }
}

export function questionIdsFor(subjectIds) {
  return data.subjects
    .filter((s) => subjectIds.includes(s.id))
    .flatMap((s) => s.questions.map((q) => q.id));
}

export function subjectName(id) {
  return SUBJECTS.find((s) => s.id === id)?.name ?? id;
}
