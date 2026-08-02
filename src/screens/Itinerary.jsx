import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTravel } from '../store/TravelContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { tripTypeKey } from '../lib/mapProviders';
import { canEditItinerary, canManageMembers, canPropose, isOwner } from '../lib/permissions';
import { usePresence, useEditingLock } from '../lib/presence';
import { logActivity } from '../lib/activity';
import { notifyUser } from '../lib/notifications';
import StopMapPreview from '../components/StopMapPreview.jsx';
import ShareSheet from '../components/ShareSheet.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import CommentSheet from '../components/CommentSheet.jsx';
import { AssigneeBadge, AssigneeRow } from '../components/AssigneePicker.jsx';
import StopFormSheet, { DEFAULT_STOP_FIELDS } from '../components/StopFormSheet.jsx';
import SwipeRow from '../components/SwipeRow.jsx';

const TRANSPORT_ICON = { flight: '✈️', ship: '🚢', car: '🚗' };
const TRANSPORT_LABEL = { flight: '항공 이동', ship: '선박 이동', car: '차량 이동' };

function stopIcon(s) {
  return s.type === 'transport' ? TRANSPORT_ICON[s.transportMode] || '🚗' : '📍';
}

function stopSubtitle(s) {
  const parts = [];
  if (s.type === 'transport') {
    parts.push(TRANSPORT_LABEL[s.transportMode] || '이동');
    if (s.transportMode === 'car' && s.rentalCompany) parts.push(s.rentalCompany);
  } else if (s.category) {
    parts.push(s.category);
  }
  if (s.stay) parts.push(s.stay);
  if (s.cost) parts.push(`${Number(s.cost).toLocaleString()}원`);
  return parts.join(' · ');
}

export default function Itinerary() {
  const { data, updateTrip, members, selectedTripId, selectedDay, setSelectedDay, setScreen, showToast } = useTravel();
  const { uid, profile } = useAuth();
  const [previewStop, setPreviewStop] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [commentStop, setCommentStop] = useState(null);
  const [assigningKey, setAssigningKey] = useState(null);
  const [comments, setComments] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [addingTransport, setAddingTransport] = useState(false);
  const [transportForm, setTransportForm] = useState(null);

  const trip = data.trips.find((t) => t.id === selectedTripId);
  const myName = profile?.name || '';
  const onlineIds = usePresence(selectedTripId, uid, myName);
  const locks = useEditingLock(selectedTripId, null, uid, myName);
  useEditingLock(selectedTripId, editForm ? editForm.__lockKey : null, uid, myName);
  useEditingLock(selectedTripId, addingTransport ? 'new-transport' : null, uid, myName);

  useEffect(() => {
    if (!selectedTripId) return;
    const q = query(collection(db, 'trips', selectedTripId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) return;
    return onSnapshot(collection(db, 'trips', selectedTripId, 'proposals'), (snap) =>
      setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [selectedTripId]);

  if (!trip) {
    return (
      <div className="screen" style={{ padding: '70px 20px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>여행을 찾을 수 없어요.</div>
      </div>
    );
  }

  const myMember = members.find((m) => m.uid === uid);
  const editable = canEditItinerary(trip, myMember, uid);
  const proposeOnly = !editable && canPropose(trip, myMember, uid);
  const iOwn = canManageMembers(trip, uid);

  const dayStops = trip.days[selectedDay]?.stops || [];
  const activeProvider = (profile?.mapPrefs || {})[tripTypeKey(trip)] || 'google';
  const commentCount = (stopId) => comments.filter((c) => c.targetKey === stopId).length;

  const removeStop = (idx) => {
    if (!editable) return;
    const stop = dayStops[idx];
    updateTrip(trip.id, (t) => ({
      ...t,
      days: t.days.map((day, di) => (di === selectedDay ? { stops: day.stops.filter((_, i2) => i2 !== idx) } : day)),
    }));
    logActivity(trip.id, { authorId: uid, authorName: myName, type: 'stop_remove', message: `"${stop.name}" 일정을 삭제했어요` });
  };

  const setStopAssignee = (idx, assigneeId) => {
    if (!editable) return;
    const stop = dayStops[idx];
    updateTrip(trip.id, (t) => ({
      ...t,
      days: t.days.map((day, di) => (di === selectedDay ? { stops: day.stops.map((s, i2) => (i2 === idx ? { ...s, assigneeId } : s)) } : day)),
    }));
    setAssigningKey(null);
    if (assigneeId && assigneeId !== uid) {
      notifyUser(assigneeId, { type: 'assigned', tripId: trip.id, message: `${myName}님이 "${stop.name}" 담당자로 지정했어요` });
    }
  };

  const openEditStop = (idx, stop) => {
    if (!editable) return;
    setEditingIdx(idx);
    setEditForm({
      time: stop.time || '09:00',
      name: stop.name || '',
      category: stop.category || '',
      stay: stop.stay || '1시간',
      assigneeId: stop.assigneeId || null,
      type: stop.type || 'place',
      transportMode: stop.transportMode || null,
      rentalCompany: stop.rentalCompany || null,
      cost: stop.cost ?? null,
      __lockKey: stop.id || `edit-${idx}`,
    });
  };

  const closeEditStop = () => {
    setEditingIdx(null);
    setEditForm(null);
  };

  const saveEditStop = (fields) => {
    if (editingIdx === null) return;
    const original = dayStops[editingIdx];
    const { __lockKey, ...clean } = fields;
    updateTrip(trip.id, (t) => ({
      ...t,
      days: t.days.map((day, di) =>
        di === selectedDay ? { stops: day.stops.map((st, i2) => (i2 === editingIdx ? { ...st, ...clean } : st)) } : day
      ),
    }));
    logActivity(trip.id, { authorId: uid, authorName: myName, type: 'stop_edit', message: `"${clean.name || original.name}" 일정을 수정했어요` });
    if (clean.assigneeId && clean.assigneeId !== original.assigneeId && clean.assigneeId !== uid) {
      notifyUser(clean.assigneeId, { type: 'assigned', tripId: trip.id, message: `${myName}님이 "${clean.name || original.name}" 담당자로 지정했어요` });
    }
    closeEditStop();
  };

  const openAddTransport = () => {
    setTransportForm({ ...DEFAULT_STOP_FIELDS, type: 'transport' });
    setAddingTransport(true);
  };

  const closeAddTransport = () => {
    setAddingTransport(false);
    setTransportForm(null);
  };

  // Transport legs (flight/ship/car) don't come from tapping a spot on the
  // map like a place does — added directly from here instead.
  const addNewTransport = async (fields) => {
    const newStop = { ...fields, id: crypto.randomUUID(), lat: null, lng: null };
    const label = newStop.name || TRANSPORT_LABEL[newStop.transportMode] || '이동';
    if (editable) {
      await updateTrip(trip.id, (t) => ({
        ...t,
        days: t.days.map((day, di) => (di === selectedDay ? { stops: [...day.stops, newStop] } : day)),
      }));
      await logActivity(trip.id, { authorId: uid, authorName: myName, type: 'stop_add', message: `"${label}" 일정을 추가했어요` });
      if (newStop.assigneeId && newStop.assigneeId !== uid) {
        notifyUser(newStop.assigneeId, { type: 'assigned', tripId: trip.id, message: `${myName}님이 "${label}" 담당자로 지정했어요` });
      }
      showToast('일정에 이동수단을 추가했어요');
    } else if (proposeOnly) {
      await addDoc(collection(db, 'trips', trip.id, 'proposals'), {
        dayIndex: selectedDay,
        stop: newStop,
        proposedBy: uid,
        proposedByName: myName,
        createdAt: serverTimestamp(),
      });
      await logActivity(trip.id, { authorId: uid, authorName: myName, type: 'proposal', message: `"${label}" 일정을 제안했어요` });
      if (trip.ownerId !== uid) {
        notifyUser(trip.ownerId, { type: 'proposal', tripId: trip.id, message: `${myName}님이 "${label}"을 제안했어요` });
      }
      showToast('일정을 제안했어요. 소유자 승인을 기다려주세요');
    }
    closeAddTransport();
  };

  const respondProposal = async (proposal, approve) => {
    if (!iOwn) return;
    if (approve) {
      updateTrip(trip.id, (t) => ({
        ...t,
        days: t.days.map((day, di) => (di === proposal.dayIndex ? { stops: [...day.stops, proposal.stop] } : day)),
      }));
      logActivity(trip.id, { authorId: uid, authorName: myName, type: 'proposal_approved', message: `"${proposal.stop.name}" 제안을 승인했어요` });
      if (proposal.proposedBy !== uid) {
        notifyUser(proposal.proposedBy, { type: 'proposal', tripId: trip.id, message: `제안한 "${proposal.stop.name}"이 승인됐어요` });
      }
    } else {
      logActivity(trip.id, { authorId: uid, authorName: myName, type: 'proposal_rejected', message: `"${proposal.stop.name}" 제안을 거절했어요` });
      if (proposal.proposedBy !== uid) {
        notifyUser(proposal.proposedBy, { type: 'proposal', tripId: trip.id, message: `제안한 "${proposal.stop.name}"이 거절됐어요` });
      }
    }
    await deleteDoc(doc(db, 'trips', trip.id, 'proposals', proposal.id));
  };

  return (
    <div className="screen">
      <div className="scroll-area" style={{ padding: '70px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div onClick={() => setScreen('home')} style={{ padding: 4, cursor: 'pointer' }}>
            <svg width="10" height="18" viewBox="0 0 10 18">
              <path d="M8.5 1.5L2 9l6.5 7.5" stroke="var(--navy)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', flex: 1 }}>{trip.destination}</div>
          <HeaderIconButton emoji="📋" onClick={() => setShowActivity(true)} />
          <HeaderIconButton emoji="✅" onClick={() => setScreen('checklist')} />
          <HeaderIconButton emoji="👥" onClick={() => setShowShare(true)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 24, marginBottom: 12 }}>
          <div style={{ display: 'flex' }}>
            {members.slice(0, 6).map((m, i) => (
              <div
                key={m.uid}
                title={m.name}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: isOwner(trip, m.uid) ? 'var(--coral)' : 'var(--navy)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -7,
                  border: '2px solid #fff',
                  position: 'relative',
                }}
              >
                {(m.name || '?')[0]}
                {onlineIds.includes(m.uid) && (
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderRadius: 4, background: '#3ec97a', border: '1.5px solid #fff' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{trip.dateLabel}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {trip.days.map((_, i) => (
            <div
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`chip coral${i === selectedDay ? ' active' : ''}`}
              style={{ flexShrink: 0, padding: '8px 16px' }}
            >
              Day {i + 1}
            </div>
          ))}
        </div>

        {proposals.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--coral)', marginBottom: 8 }}>💡 제안된 일정 ({proposals.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proposals.map((p) => (
                <div key={p.id} className="card" style={{ padding: '10px 12px', border: '1.5px dashed var(--coral)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>
                        Day {p.dayIndex + 1} · {p.stop.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.proposedByName}님 제안 · {p.stop.time}</div>
                    </div>
                    {iOwn ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div onClick={() => respondProposal(p, true)} style={{ padding: '6px 10px', borderRadius: 10, background: 'var(--coral)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          승인
                        </div>
                        <div onClick={() => respondProposal(p, false)} style={{ padding: '6px 10px', borderRadius: 10, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          거절
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>검토 대기</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayStops.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 0' }}>
            이 날에는 아직 일정이 없어요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayStops.map((s, idx) => {
            const assignee = members.find((m) => m.uid === s.assigneeId);
            const lockName = s.id ? locks[s.id] : null;
            const key = s.id || idx;
            const card = (
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    onClick={() => openEditStop(idx, s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: editable ? 'pointer' : 'default' }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--coral)', width: 44, flexShrink: 0 }}>{s.time}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>
                        {stopIcon(s)} {s.name || (s.type === 'transport' ? TRANSPORT_LABEL[s.transportMode] : '')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stopSubtitle(s)}</div>
                      {lockName && <div style={{ fontSize: 10, color: 'var(--coral)', fontWeight: 700, marginTop: 2 }}>✏️ {lockName}님이 수정 중</div>}
                    </div>
                  </div>
                  <div onClick={() => setPreviewStop(s)} style={{ fontSize: 14, flexShrink: 0, cursor: 'pointer', padding: 4 }}>
                    🧭
                  </div>
                  <div
                    onClick={() => s.id && setCommentStop(s)}
                    style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, cursor: s.id ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    💬 {s.id ? commentCount(s.id) : 0}
                  </div>
                  <AssigneeBadge name={assignee?.name} onClick={editable ? () => setAssigningKey(assigningKey === key ? null : key) : undefined} />
                </div>
                {assigningKey === key && <AssigneeRow members={members} value={s.assigneeId} onSelect={(id) => setStopAssignee(idx, id)} />}
              </div>
            );
            return (
              <div key={key}>
                {editable ? <SwipeRow onDelete={() => removeStop(idx)}>{card}</SwipeRow> : card}
              </div>
            );
          })}
        </div>

        {(editable || proposeOnly) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div onClick={() => setScreen('map')} style={{ ...dashedButtonStyle, flex: 1 }}>
              {editable ? '📍 장소 추가' : '📍 장소 제안하기'}
            </div>
            <div onClick={openAddTransport} style={{ ...dashedButtonStyle, flex: 1 }}>
              {editable ? '🚗 이동수단 추가' : '🚗 이동수단 제안하기'}
            </div>
          </div>
        )}
      </div>

      {previewStop && <StopMapPreview stop={previewStop} provider={activeProvider} onClose={() => setPreviewStop(null)} />}
      {showShare && <ShareSheet trip={trip} members={members} uid={uid} myName={myName} onClose={() => setShowShare(false)} showToast={showToast} />}
      {showActivity && <ActivityFeed tripId={trip.id} onClose={() => setShowActivity(false)} />}
      {commentStop && <CommentSheet tripId={trip.id} stop={commentStop} members={members} uid={uid} myName={myName} onClose={() => setCommentStop(null)} />}
      {editForm && (
        <StopFormSheet
          title="일정 수정"
          saveLabel="저장"
          value={editForm}
          onChange={setEditForm}
          members={members}
          showAssignee={editable}
          onSave={saveEditStop}
          onClose={closeEditStop}
        />
      )}
      {addingTransport && transportForm && (
        <StopFormSheet
          title={editable ? '이동수단 추가' : '이동수단 제안하기'}
          saveLabel={editable ? '추가' : '제안하기'}
          value={transportForm}
          onChange={setTransportForm}
          members={members}
          showAssignee={editable}
          onSave={addNewTransport}
          onClose={closeAddTransport}
        />
      )}
    </div>
  );
}

const dashedButtonStyle = {
  border: '1.5px dashed var(--coral)',
  borderRadius: 16,
  padding: 13,
  textAlign: 'center',
  color: 'var(--coral)',
  fontSize: 13,
  fontWeight: 700,
  background: 'rgba(255,107,107,0.05)',
  cursor: 'pointer',
};

function HeaderIconButton({ emoji, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        background: '#fff',
        boxShadow: 'var(--shadow-flat)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        cursor: 'pointer',
      }}
    >
      {emoji}
    </div>
  );
}
