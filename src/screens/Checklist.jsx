import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';

export default function Checklist() {
  const { data, updateData, selectedTripId, setScreen } = useTravel();
  const trip = data.trips.find((t) => t.id === selectedTripId);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [assigningId, setAssigningId] = useState(null);

  if (!trip) {
    return (
      <div className="screen" style={{ padding: '70px 20px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>여행을 찾을 수 없어요.</div>
      </div>
    );
  }

  const checklist = trip.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const accountById = (id) => data.accounts.find((a) => a.id === id);

  const updateChecklist = (fn) => {
    updateData((d) => ({
      ...d,
      trips: d.trips.map((t2) => (t2.id === trip.id ? { ...t2, checklist: fn(t2.checklist || []) } : t2)),
    }));
  };

  const addItem = () => {
    if (!newText.trim()) return;
    updateChecklist((list) => [...list, { id: 'c' + Date.now(), text: newText.trim(), done: false, assigneeId: null }]);
    setNewText('');
  };

  const toggleItem = (id) => {
    updateChecklist((list) => list.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  };

  const removeItem = (id) => {
    updateChecklist((list) => list.filter((c) => c.id !== id));
  };

  const setAssignee = (id, assigneeId) => {
    updateChecklist((list) => list.map((c) => (c.id === id ? { ...c, assigneeId } : c)));
    setAssigningId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = () => {
    if (editingText.trim()) {
      updateChecklist((list) => list.map((c) => (c.id === editingId ? { ...c, text: editingText.trim() } : c)));
    }
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div className="screen">
      <div className="scroll-area" style={{ padding: '70px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div onClick={() => setScreen('itinerary')} style={{ padding: 4, cursor: 'pointer' }}>
            <svg width="10" height="18" viewBox="0 0 10 18">
              <path d="M8.5 1.5L2 9l6.5 7.5" stroke="var(--navy)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', flex: 1 }}>{trip.destination} 준비물</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 24, marginBottom: 16 }}>
          {checklist.length === 0 ? '체크리스트가 비어있어요' : `${doneCount} / ${checklist.length} 완료`}
        </div>

        {checklist.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 0' }}>
            아래에서 준비물을 추가해보세요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {checklist.map((item) => {
            const assignee = accountById(item.assigneeId);
            return (
              <div key={item.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    onClick={() => toggleItem(item.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      flexShrink: 0,
                      border: item.done ? 'none' : '2px solid #d8dce6',
                      background: item.done ? 'var(--coral)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {item.done && (
                      <svg width="12" height="10" viewBox="0 0 12 10">
                        <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>

                  {editingId === item.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 8, padding: '6px 8px', fontSize: 14 }}
                    />
                  ) : (
                    <div
                      onClick={() => startEdit(item)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: item.done ? 'var(--text-muted)' : 'var(--navy)',
                        textDecoration: item.done ? 'line-through' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {item.text}
                    </div>
                  )}

                  <div
                    onClick={() => setAssigningId(assigningId === item.id ? null : item.id)}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 9px',
                      borderRadius: 99,
                      background: assignee ? 'var(--navy)' : 'var(--bg)',
                      color: assignee ? '#fff' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {assignee ? assignee.name : '담당자'}
                  </div>

                  <div onClick={() => removeItem(item.id)} style={{ fontSize: 14, color: '#c4cad6', padding: 4, cursor: 'pointer' }}>
                    ✕
                  </div>
                </div>

                {assigningId === item.id && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                    <div
                      onClick={() => setAssignee(item.id, null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background: !item.assigneeId ? 'var(--coral)' : 'var(--bg)',
                        color: !item.assigneeId ? '#fff' : 'var(--navy)',
                        cursor: 'pointer',
                      }}
                    >
                      미정
                    </div>
                    {data.accounts.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setAssignee(item.id, a.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          background: item.assigneeId === a.id ? 'var(--coral)' : 'var(--bg)',
                          color: item.assigneeId === a.id ? '#fff' : 'var(--navy)',
                          cursor: 'pointer',
                        }}
                      >
                        {a.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="준비물 입력 (예: 여권)"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: '#fff',
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: 14,
              boxShadow: 'var(--shadow-raised-sm)',
              boxSizing: 'border-box',
            }}
          />
          <div
            onClick={addItem}
            style={{
              flexShrink: 0,
              background: 'var(--coral)',
              color: '#fff',
              borderRadius: 14,
              padding: '12px 18px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            추가
          </div>
        </div>
      </div>
    </div>
  );
}
