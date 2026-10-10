import { LETTERS } from '../lib/bank.js';

// Shows the scenario + question and its options in the attempt's option order.
// Option labels are positional (A, B, …); the stored answer is the original key.
export default function QuestionCard({ question, optionOrder, chosen, onChoose, subjectLabel, position }) {
  const byKey = Object.fromEntries(question.options.map((o) => [o.key, o]));
  return (
    <article className="card question">
      <div className="question-meta">
        <span>{position}</span>
        <span className="muted">
          {subjectLabel} · Q{question.number}
        </span>
      </div>
      {question.context && <p className="scenario">{question.context}</p>}
      <h2 className="stem">{question.question}</h2>
      <fieldset className="options">
        <legend className="sr-only">Options</legend>
        {optionOrder.map((key, i) => (
          <label key={key} className={`option ${chosen === key ? 'option-selected' : ''}`}>
            <input
              type="radio"
              name={`q-${question.id}`}
              value={key}
              checked={chosen === key}
              onChange={() => onChoose(key)}
            />
            <span className="option-letter">{LETTERS[i]}</span>
            <span className="option-text">{byKey[key].text}</span>
          </label>
        ))}
      </fieldset>
    </article>
  );
}
