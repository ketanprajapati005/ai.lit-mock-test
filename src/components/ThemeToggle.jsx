import { useEffect, useState } from 'react';
import { load, save } from '../lib/storage.js';

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => load('theme', null) ?? systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    save('theme', next);
  };

  return (
    <button className="btn btn-ghost" onClick={toggle} type="button" aria-label="Toggle dark mode">
      {theme === 'dark' ? '☀ Light' : '☾ Dark'}
    </button>
  );
}
