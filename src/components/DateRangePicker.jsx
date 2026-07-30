import { useState } from 'react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year, month) {
  return new Date(year, month, 1).getDay();
}
function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDateLabel(start, end) {
  if (!start) return '';
  const s = `${start.getFullYear()}.${start.getMonth() + 1}.${start.getDate()}`;
  if (!end || sameDay(start, end)) return s;
  const sameYear = start.getFullYear() === end.getFullYear();
  const e = sameYear ? `${end.getMonth() + 1}.${end.getDate()}` : `${end.getFullYear()}.${end.getMonth() + 1}.${end.getDate()}`;
  return `${s} – ${e}`;
}

export function nightsBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.round((e - s) / 86400000));
}

export default function DateRangePicker({ initialStart, initialEnd, onConfirm, onClose }) {
  const base = initialStart || new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [start, setStart] = useState(initialStart || null);
  const [end, setEnd] = useState(initialEnd || null);

  const changeMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const tapDay = (date) => {
    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
    } else if (date.getTime() < start.getTime()) {
      setStart(date);
    } else {
      setEnd(date);
    }
  };

  const total = daysInMonth(viewYear, viewMonth);
  const lead = firstWeekday(viewYear, viewMonth);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => new Date(viewYear, viewMonth, i + 1))];

  const nights = start && end ? nightsBetween(start, new Date(end)) : null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 40 }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 30px',
          zIndex: 41,
          boxShadow: '0 -10px 26px rgba(27,43,75,0.2)',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>여행 날짜 선택</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div onClick={() => changeMonth(-1)} style={{ padding: 8, cursor: 'pointer', fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>
            ‹
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>
            {viewYear}년 {viewMonth + 1}월
          </div>
          <div onClick={() => changeMonth(1)} style={{ padding: 8, cursor: 'pointer', fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>
            ›
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
          {cells.map((date, i) => {
            if (!date) return <div key={`b${i}`} />;
            const isStart = sameDay(date, start);
            const isEnd = sameDay(date, end);
            const inRange = start && end && date.getTime() > start.getTime() && date.getTime() < end.getTime();
            const isEdge = isStart || isEnd;
            return (
              <div key={i} style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                {inRange && (
                  <div style={{ position: 'absolute', inset: '4px -1px', background: 'rgba(255,107,107,0.14)' }} />
                )}
                {isStart && end && (
                  <div style={{ position: 'absolute', top: 4, bottom: 4, left: '50%', right: -1, background: 'rgba(255,107,107,0.14)' }} />
                )}
                {isEnd && start && !isStart && (
                  <div style={{ position: 'absolute', top: 4, bottom: 4, left: -1, right: '50%', background: 'rgba(255,107,107,0.14)' }} />
                )}
                <div
                  onClick={() => tapDay(date)}
                  style={{
                    position: 'relative',
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: isEdge ? 800 : 500,
                    background: isEdge ? 'var(--coral)' : 'transparent',
                    color: isEdge ? '#fff' : 'var(--navy)',
                    cursor: 'pointer',
                  }}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, marginBottom: 14, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
          {start && end
            ? `${formatDateLabel(start, end)} · ${nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`}`
            : start
              ? '종료일을 선택하세요'
              : '시작일을 선택하세요'}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div
            onClick={onClose}
            style={{ flex: 1, textAlign: 'center', padding: 14, borderRadius: 14, background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            취소
          </div>
          <div
            onClick={() => start && end && onConfirm(start, end)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 14,
              borderRadius: 14,
              background: start && end ? 'var(--coral)' : '#f0c9c9',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: start && end ? 'pointer' : 'default',
            }}
          >
            확인
          </div>
        </div>
      </div>
    </>
  );
}
