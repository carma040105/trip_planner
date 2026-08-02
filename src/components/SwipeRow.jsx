import { useRef, useState } from 'react';

const REVEAL = 76;

// Wraps a card so swiping it left reveals a "삭제" action underneath.
// Deleting still requires a confirm — this only makes the delete action
// reachable without a dedicated always-visible X button.
export default function SwipeRow({ onDelete, children }) {
  const [dragX, setDragX] = useState(0);
  const openRef = useRef(false);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const onPointerDown = (e) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX - (openRef.current ? -REVEAL : 0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta - (openRef.current ? -REVEAL : 0)) > 4) movedRef.current = true;
    setDragX(Math.min(0, Math.max(-REVEAL, delta)));
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDragX((x) => {
      const shouldOpen = x < -REVEAL / 2;
      openRef.current = shouldOpen;
      return shouldOpen ? -REVEAL : 0;
    });
  };

  const closeRow = () => {
    openRef.current = false;
    setDragX(0);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('이 일정을 삭제할까요?')) onDelete();
    closeRow();
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
      <div
        onClick={confirmDelete}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: REVEAL,
          background: '#ff5252',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        삭제
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (movedRef.current) {
            e.stopPropagation();
            movedRef.current = false;
          }
        }}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.2s ease',
          position: 'relative',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
