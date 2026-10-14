import { useEffect, useRef } from 'react';

// Keep the browser's editing/IME buffer independent of URL and result updates.
export default function ExploreSearchInput({ value, resetKey, onSearch, label }) {
  const input = useRef(null);
  const timer = useRef(null);
  const composing = useRef(false);
  const commit = useRef(onSearch);
  useEffect(() => { commit.current = onSearch; }, [onSearch]);
  useEffect(() => {
    clearTimeout(timer.current);
    composing.current = false;
    if (input.current.value !== value) input.current.value = value;
  }, [value, resetKey]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function schedule(text) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit.current(text), 300);
  }
  return <input ref={input} aria-label={label} placeholder={label}
    defaultValue={value} maxLength={200}
    onCompositionStart={() => {
      composing.current = true;
      clearTimeout(timer.current);
    }}
    onCompositionEnd={event => {
      composing.current = false;
      schedule(event.currentTarget.value);
    }}
    onChange={event => {
      if (!composing.current && !event.nativeEvent.isComposing) schedule(event.currentTarget.value);
    }}
    onKeyDown={event => {
      if (event.key === 'Enter' && !composing.current && !event.nativeEvent.isComposing && event.keyCode !== 229) {
        event.preventDefault();
        clearTimeout(timer.current);
        commit.current(event.currentTarget.value);
      }
    }}
  />;
}
