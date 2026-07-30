import { useState } from 'react';
import { arrayRemove, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EXPIRY_OPTIONS, createInviteLink, invitePendingByEmail } from '../lib/invites';
import { logActivity } from '../lib/activity';
import { ROLE_LABELS, canManageMembers, isOwner } from '../lib/permissions';

const ROLE_OPTIONS = ['editor', 'viewer'];
const CUSTOM_FLAGS = [
  { key: 'editItinerary', label: '일정 수정' },
  { key: 'editChecklist', label: '체크리스트 수정' },
  { key: 'editNotes', label: '메모 작성' },
  { key: 'comment', label: '댓글 작성' },
];

export default function ShareSheet({ trip, members, uid, myName, onClose, showToast }) {
  const [tab, setTab] = useState('invite');
  const [linkRole, setLinkRole] = useState('editor');
  const [expiryId, setExpiryId] = useState('7d');
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [busy, setBusy] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [emailBusy, setEmailBusy] = useState(false);

  const iOwn = canManageMembers(trip, uid);

  const generateLink = async () => {
    setBusy(true);
    try {
      const token = await createInviteLink(trip.id, {
        role: linkRole,
        expiryId,
        password: password.trim() || null,
        createdBy: uid,
        createdByName: myName,
      });
      const url = `${window.location.origin}${window.location.pathname}?invite=${token}`;
      setGeneratedLink(url);
    } catch {
      showToast('링크 생성에 실패했어요');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      showToast('링크를 복사했어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };

  const sendEmailInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setEmailBusy(true);
    try {
      await invitePendingByEmail(trip.id, {
        email,
        role: inviteRole,
        invitedBy: uid,
        invitedByName: myName,
        tripDestination: trip.destination,
      });
      await logActivity(trip.id, {
        authorId: uid,
        authorName: myName,
        type: 'invite',
        message: `${email}님을 초대했어요`,
      });
      showToast('초대를 보냈어요');
      setInviteEmail('');
    } catch {
      showToast('초대에 실패했어요');
    } finally {
      setEmailBusy(false);
    }
  };

  const changeRole = async (memberUid, role) => {
    await updateDoc(doc(db, 'trips', trip.id, 'members', memberUid), { role });
  };

  const toggleCustomFlag = async (member, key) => {
    const current = member.customPermissions || {};
    await updateDoc(doc(db, 'trips', trip.id, 'members', member.uid), {
      customPermissions: { ...current, [key]: !current[key] },
    });
  };

  const removeMember = async (memberUid) => {
    if (!window.confirm('이 멤버를 여행에서 제거할까요?')) return;
    await deleteDoc(doc(db, 'trips', trip.id, 'members', memberUid));
    await updateDoc(doc(db, 'trips', trip.id), { memberIds: arrayRemove(memberUid) });
  };

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
          padding: '20px 20px 34px',
          zIndex: 41,
          boxShadow: '0 -10px 26px rgba(27,43,75,0.2)',
          maxHeight: '82%',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>여행 공유</div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <div className={`chip${tab === 'invite' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setTab('invite')}>
            초대하기
          </div>
          <div className={`chip${tab === 'members' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setTab('members')}>
            멤버 ({members.length})
          </div>
        </div>

        {tab === 'invite' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>① 링크로 초대</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {ROLE_OPTIONS.map((r) => (
                <div key={r} className={`chip${linkRole === r ? ' active' : ''}`} style={{ flex: 1, padding: '8px 4px', fontSize: 12 }} onClick={() => setLinkRole(r)}>
                  {ROLE_LABELS[r]}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {EXPIRY_OPTIONS.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setExpiryId(o.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    background: expiryId === o.id ? 'var(--navy)' : 'var(--bg)',
                    color: expiryId === o.id ? '#fff' : 'var(--navy)',
                    cursor: 'pointer',
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (선택)"
              style={inputStyle}
            />
            <div className="btn-primary" style={{ opacity: busy ? 0.6 : 1, marginBottom: 10 }} onClick={busy ? undefined : generateLink}>
              {busy ? '생성 중…' : '초대 링크 만들기'}
            </div>

            {generatedLink && (
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 10, marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {generatedLink}
                </div>
                <div onClick={copyLink} style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'var(--coral)', cursor: 'pointer' }}>
                  복사
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>② 이메일로 초대</div>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@email.com"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {ROLE_OPTIONS.map((r) => (
                <div key={r} className={`chip${inviteRole === r ? ' active' : ''}`} style={{ flex: 1, padding: '8px 4px', fontSize: 12 }} onClick={() => setInviteRole(r)}>
                  {ROLE_LABELS[r]}
                </div>
              ))}
            </div>
            <div className="btn-primary" style={{ opacity: emailBusy ? 0.6 : 1 }} onClick={emailBusy ? undefined : sendEmailInvite}>
              {emailBusy ? '보내는 중…' : '초대 보내기'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              상대방이 이 이메일로 가입/로그인하면 알림으로 초대를 받아요.
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m) => {
              const owner = isOwner(trip, m.uid);
              return (
                <div key={m.uid} className="card" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        background: owner ? 'var(--coral)' : 'var(--navy)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {(m.name || m.email || '?')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>{m.name || m.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[owner ? 'owner' : m.role] || m.role}</div>
                    </div>
                    {iOwn && !owner && (
                      <div onClick={() => removeMember(m.uid)} style={{ fontSize: 13, color: '#c4cad6', padding: 4, cursor: 'pointer' }}>
                        ✕
                      </div>
                    )}
                  </div>

                  {iOwn && !owner && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {['editor', 'viewer', 'custom'].map((r) => (
                        <div
                          key={r}
                          onClick={() => changeRole(m.uid, r)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 99,
                            fontSize: 10,
                            fontWeight: 700,
                            background: m.role === r ? 'var(--coral)' : 'var(--bg)',
                            color: m.role === r ? '#fff' : 'var(--navy)',
                            cursor: 'pointer',
                          }}
                        >
                          {ROLE_LABELS[r]}
                        </div>
                      ))}
                    </div>
                  )}

                  {iOwn && !owner && m.role === 'custom' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-soft)' }}>
                      {CUSTOM_FLAGS.map((f) => {
                        const active = Boolean((m.customPermissions || {})[f.key]);
                        return (
                          <div
                            key={f.key}
                            onClick={() => toggleCustomFlag(m, f.key)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 99,
                              fontSize: 10,
                              fontWeight: 700,
                              background: active ? 'var(--navy)' : 'var(--bg)',
                              color: active ? '#fff' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            {active ? '✓ ' : ''}
                            {f.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  outline: 'none',
  background: 'var(--bg)',
  borderRadius: 14,
  padding: '12px 14px',
  fontSize: 14,
  marginBottom: 10,
};
