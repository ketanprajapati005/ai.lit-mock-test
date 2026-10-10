// Marking scheme. Change these to enable negative marking, e.g. incorrect: -0.25.
export const SCORING = {
  correct: 1,
  incorrect: 0,
  unanswered: 0,
};

// Defaults for the settings panel on the home page.
export const DEFAULT_SETTINGS = {
  shuffleQuestions: false,
  shuffleOptions: false,
  timeLimitMinutes: 0, // 0 = no limit (an elapsed-time clock is still shown)
};
