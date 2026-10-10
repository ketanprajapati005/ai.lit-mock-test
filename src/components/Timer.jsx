import { useEffect, useState } from 'react';
import { formatDuration } from '../lib/format.js';

// Counts down to `deadline` (and calls onExpire once) or, with no deadline, counts up from `startedAt`.
export default function Timer({ startedAt, deadline, onExpire }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expired = deadline != null && now >= deadline;
  useEffect(() => {
    if (expired) onExpire();
  }, [expired, onExpire]);

  if (deadline == null) {
    return <span className="timer" title="Elapsed time">⏱ {formatDuration(now - startedAt)}</span>;
  }
  const left = deadline - now;
  return (
    <span className={`timer ${left < 60_000 ? 'timer-low' : ''}`} title="Time remaining">
      ⏱ {formatDuration(left)} left
    </span>
  );
}
