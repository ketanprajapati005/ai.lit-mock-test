import { QUESTIONS, subjectName } from '../lib/bank.js';

// Grid of question buttons, grouped by subject when the order keeps subjects contiguous.
export default function Navigator({ order, answers, current, onJump }) {
  const groups = [];
  order.forEach((id, index) => {
    const subjectId = QUESTIONS[id].subjectId;
    const last = groups[groups.length - 1];
    if (last && last.subjectId === subjectId) last.items.push({ id, index });
    else groups.push({ subjectId, items: [{ id, index }] });
  });
  const grouped = groups.length <= 4; // shuffled multi-subject orders would fragment into many groups

  const renderItems = (items) =>
    items.map(({ id, index }) => {
      const cls = [
        'nav-item',
        answers[id] != null ? 'nav-answered' : '',
        index === current ? 'nav-current' : '',
      ].join(' ');
      return (
        <button
          key={id}
          type="button"
          className={cls}
          onClick={() => onJump(index)}
          aria-label={`Question ${index + 1}${answers[id] != null ? ', answered' : ', not answered'}`}
          aria-current={index === current ? 'step' : undefined}
        >
          {index + 1}
        </button>
      );
    });

  return (
    <nav className="card navigator" aria-label="Question navigation">
      <div className="legend">
        <span><i className="dot dot-answered" /> Answered</span>
        <span><i className="dot dot-unanswered" /> Not answered</span>
        <span><i className="dot dot-current" /> Current</span>
      </div>
      <div className="nav-scroll">
        {grouped
          ? groups.map((g) => (
              <div key={g.subjectId + g.items[0].index}>
                <h3 className="nav-heading">{subjectName(g.subjectId)}</h3>
                <div className="nav-grid">{renderItems(g.items)}</div>
              </div>
            ))
          : <div className="nav-grid">{renderItems(order.map((id, index) => ({ id, index })))}</div>}
      </div>
    </nav>
  );
}
