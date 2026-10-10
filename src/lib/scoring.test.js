import { describe, expect, it } from 'vitest';
import data from '../data/questions.json';
import { scoreAttempt, statusOf } from './scoring.js';
import { QUESTIONS, questionIdsFor } from './bank.js';

const qs = [
  { id: 'a1', subjectId: 'a', answer: 'A' },
  { id: 'a2', subjectId: 'a', answer: 'B' },
  { id: 'a3', subjectId: 'a', answer: 'C' },
  { id: 'b1', subjectId: 'b', answer: 'D' },
];

describe('scoreAttempt', () => {
  it('counts correct, incorrect and unanswered with default +1/0/0', () => {
    const r = scoreAttempt(qs, { a1: 'A', a2: 'C', b1: 'D' }, { correct: 1, incorrect: 0, unanswered: 0 });
    expect(r.overall).toMatchObject({
      total: 4, correct: 2, incorrect: 1, unanswered: 1, attempted: 3,
      marks: 2, maxMarks: 4, percentage: 50, accuracy: 66.67,
    });
    const [a, b] = r.subjects;
    expect(a).toMatchObject({ subjectId: 'a', total: 3, correct: 1, incorrect: 1, unanswered: 1, marks: 1, maxMarks: 3 });
    expect(b).toMatchObject({ subjectId: 'b', total: 1, correct: 1, marks: 1, percentage: 100, accuracy: 100 });
  });

  it('supports negative marking', () => {
    const r = scoreAttempt(qs, { a1: 'A', a2: 'C', a3: 'A' }, { correct: 1, incorrect: -0.25, unanswered: 0 });
    expect(r.overall.marks).toBe(0.5);
    expect(r.overall.percentage).toBe(12.5);
  });

  it('handles a blank attempt without dividing by zero', () => {
    const r = scoreAttempt(qs, {}, { correct: 1, incorrect: 0, unanswered: 0 });
    expect(r.overall).toMatchObject({ unanswered: 4, marks: 0, percentage: 0, accuracy: 0 });
  });

  it('statusOf', () => {
    expect(statusOf(qs[0], {})).toBe('unanswered');
    expect(statusOf(qs[0], { a1: 'A' })).toBe('correct');
    expect(statusOf(qs[0], { a1: 'B' })).toBe('incorrect');
  });
});

describe('question bank', () => {
  it('has the counts declared in the PDF', () => {
    expect(data.subjects.map((s) => s.questions.length)).toEqual([100, 101]);
    expect(data.totalQuestions).toBe(201);
  });

  it('every question has A-D options, a keyed answer and an explanation', () => {
    for (const s of data.subjects) {
      s.questions.forEach((q, i) => {
        expect(q.number).toBe(i + 1);
        expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D']);
        expect(q.options.every((o) => o.text.length > 0)).toBe(true);
        expect(['A', 'B', 'C', 'D']).toContain(q.answer);
        expect(q.explanation.length).toBeGreaterThan(0);
        expect(q.needsReview).toBe(false);
      });
    }
  });

  it('answering every question with its key scores 100% for each subject', () => {
    const ids = questionIdsFor(data.subjects.map((s) => s.id));
    const questions = ids.map((id) => QUESTIONS[id]);
    const answers = Object.fromEntries(questions.map((q) => [q.id, q.answer]));
    const r = scoreAttempt(questions, answers, { correct: 1, incorrect: 0, unanswered: 0 });
    expect(r.overall).toMatchObject({ total: 201, correct: 201, percentage: 100 });
    expect(r.subjects.map((s) => s.marks)).toEqual([100, 101]);
  });

  it('spot-checks answers against the PDF answer key', () => {
    const key = (s, n) => QUESTIONS[`s${s}-q${n}`].answer;
    expect([key(1, 1), key(1, 2), key(1, 51), key(1, 100)]).toEqual(['C', 'D', 'A', 'D']);
    expect([key(2, 1), key(2, 2), key(2, 5), key(2, 101)]).toEqual(['D', 'A', 'D', 'C']);
  });
});
