import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { AssigneeBadge, AssigneeRow } from '../components/AssigneePicker.jsx';
import { canEditChecklist } from '../lib/permissions';
import { logActivity } from '../lib/activity';
import { notifyUser } from '../lib/notifications';

export default function Checklist() {
  const { data, updateTrip, members, selectedTripId, setScreen } = useTravel();
  const { uid, profile } = useAuth();
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

  const myMember = members.find((m) => m.uid === uid);
  const editable = canEditChecklist(trip, myMember, uid);
  const myName = profile?.name || '';

  const checklist = trip.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const memberByUid = (id) => members.find((m) => m.uid === id);

  const updateChecklist = (fn) => updateTrip(trip.id, (t) => ({ ...t, checklist: fn(t.checklist || []) }));

  const addItem = () => {
    if (!newText.trim() || !editable) return;
    updateChecklist((list) => [...list, { id: crypto.randomUUID(), text: newText.trim(), done: false, assigneeId: null, doneBy: null, doneAt: null }]);
    logActivity(trip.id, { authorId: uid, authorName: myName, type: 'checklist_add', message: `준비물 "${newText.trim()}"을 추가했어요` });
    setNewText('');
  };

  const toggleItem = (item) => {
    if (!editable) return;
    const nextDone = !item.done;
    updateChecklist((list) =>
      list.map((c) => (c.id === item.id ? { ...c, done: nextDone, doneBy: nextDone ? uid : null, doneAt: nextDone ? Date.now() : null } : c))
    );
    if (nextDone) {
      logActivity(trip.id, { authorId: uid, authorName: myName, type: 'checklist_done', message: `"${item.text}" 완료했어요` });
    }
  };

  const removeItem = (id) => {
    if (!editable) return;
    updateChecklist((list) => list.filter((c) => c.id !== id));
  };

  const setAssignee = (item, assigneeId) => {
    if (!editable) return;
    updateChecklist((list) => list.map((c) => (c.id === item.id ? { ...c, assigneeId } : c)));
    setAssigningId(null);
    if (assigneeId && assigneeId !== uid) {
      notifyUser(assigneeId, { type: 'assigned', tripId: trip.id, message: `${myName}님이 "${item.text}" 담당자로 지정했어요` });
    }
  };

  const startEdit = (item) => {
    if (!editable) return;
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
            const assignee = memberByUid(item.assigneeId);
            const doneBy = memberByUid(item.doneBy);
            return (
              <div key={item.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    onClick={() => toggleItem(item)}
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
                      cursor: editable ? 'pointer' : 'default',
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
                        cursor: editable ? 'pointer' : 'default',
                      }}
                    >
                      {item.text}
                    </div>
                  )}

                  <AssigneeBadge
                    name={assignee?.name}
                    onClick={editable ? () => setAssigningId(assigningId === item.id ? null : item.id) : undefined}
                  />

                  {editable && (
                    <div onClick={() => removeItem(item.id)} style={{ fontSize: 14, color: '#c4cad6', padding: 4, cursor: 'pointer' }}>
                      ✕
                    </div>
                  )}
                </div>

                {item.done && doneBy && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, marginLeft: 32 }}>✓ {doneBy.name}님이 완료</div>
                )}

                {assigningId === item.id && (
                  <AssigneeRow members={members} value={item.assigneeId} onSelect={(id) => setAssignee(item, id)} />
                )}
              </div>
            );
          })}
        </div>

        {editable && (
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
        )}
      </div>
    </div>
  );
}
