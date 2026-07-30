import { useEffect, useRef } from 'react';

const ITEM_HEIGHT = 34;
const VISIBLE = 5;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

// A single iOS-style scroll wheel: snaps to the item nearest the center band.
export default function WheelPicker({ items, value, onChange, width = 64 }) {
  const scrollRef = useRef(null);
  const programmatic = useRef(false);
  const timeoutRef = useRef(null);

  const scrollToIndex = (idx, behavior) => {
    programmatic.current = true;
    scrollRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      programmatic.current = false;
    }, behavior === 'smooth' ? 300 : 0);
  };

  useEffect(() => {
    const idx = Math.max(0, items.indexOf(value));
    scrollToIndex(idx, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    if (programmatic.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const idx = Math.min(items.length - 1, Math.max(0, Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)));
      scrollToIndex(idx, 'smooth');
      if (items[idx] !== value) onChange(items[idx]);
    }, 120);
  };

  return (
    <div style={{ position: 'relative', height: ITEM_HEIGHT * VISIBLE, width }}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="wheel-scroll"
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          padding: `${PAD}px 0`,
        }}
      >
        {items.map((it, idx) => (
          <div
            key={it}
            onClick={() => {
              scrollToIndex(idx, 'smooth');
              onChange(it);
            }}
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: it === value ? 16 : 14,
              fontWeight: it === value ? 800 : 500,
              color: it === value ? 'var(--navy)' : 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {it}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: PAD,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTop: '1.5px solid var(--border-soft)',
          borderBottom: '1.5px solid var(--border-soft)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
