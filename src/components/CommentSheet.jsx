import { useEffect, useMemo, useState } from 'react';
import { addDoc, arrayRemove, arrayUnion, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity } from '../lib/activity';
import { notifyUser } from '../lib/notifications';

function extractMentions(text, members) {
  const mentioned = [];
  members.forEach((m) => {
    if (m.name && text.includes(`@${m.name}`)) mentioned.push(m.uid);
  });
  return mentioned;
}

function timeAgo(ts) {
  if (!ts) return '방금 전';
  const diffMs = Date.now() - ts.toMillis();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default function CommentSheet({ tripId, stop, members, uid, myName, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [tripId]);

  const targetComments = useMemo(() => comments.filter((c) => c.targetKey === stop.id), [comments, stop.id]);
  const topLevel = targetComments.filter((c) => !c.parentId);
  const repliesOf = (id) => targetComments.filter((c) => c.parentId === id);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return members.filter((m) => m.name && m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5);
  }, [mentionQuery, members]);

  const onTextChange = (v) => {
    setText(v);
    const m = v.match(/@([^\s@]*)$/);
    setMentionQuery(m ? m[1] : null);
  };

  const insertMention = (name) => {
    setText((t) => t.replace(/@([^\s@]*)$/, `@${name} `));
    setMentionQuery(null);
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const mentions = extractMentions(trimmed, members);
    await addDoc(collection(db, 'trips', tripId, 'comments'), {
      targetType: 'stop',
      targetKey: stop.id,
      authorId: uid,
      authorName: myName,
      text: trimmed,
      parentId: replyTo,
      likes: [],
      mentions,
      createdAt: serverTimestamp(),
    });
    await logActivity(tripId, {
      authorId: uid,
      authorName: myName,
      type: 'comment',
      message: `"${stop.name}"에 댓글을 남겼어요`,
    });
    mentions
      .filter((mUid) => mUid !== uid)
      .forEach((mUid) =>
        notifyUser(mUid, { type: 'mention', tripId, message: `${myName}님이 "${stop.name}"에서 회원님을 멘션했어요` })
      );
    setText('');
    setReplyTo(null);
    setMentionQuery(null);
  };

  const toggleLike = async (comment) => {
    const liked = (comment.likes || []).includes(uid);
    await updateDoc(doc(db, 'trips', tripId, 'comments', comment.id), {
      likes: liked ? arrayRemove(uid) : arrayUnion(uid),
    });
  };

  const renderComment = (c, isReply) => (
    <div key={c.id} style={{ marginLeft: isReply ? 24 : 0, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: 'var(--navy)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {(c.authorName || '?')[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '8px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)' }}>{c.authorName}</div>
            <div style={{ fontSize: 13, color: 'var(--navy)', wordBreak: 'break-word' }}>{c.text}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, paddingLeft: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(c.createdAt)}</span>
            <span
              onClick={() => toggleLike(c)}
              style={{ fontSize: 10, fontWeight: 700, color: (c.likes || []).includes(uid) ? 'var(--coral)' : 'var(--text-muted)', cursor: 'pointer' }}
            >
              👍 {(c.likes || []).length > 0 ? (c.likes || []).length : '좋아요'}
            </span>
            {!isReply && (
              <span onClick={() => setReplyTo(c.id)} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}>
                답글
              </span>
            )}
          </div>
        </div>
      </div>
      {!isReply && repliesOf(c.id).map((r) => renderComment(r, true))}
    </div>
  );

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
          padding: '20px 20px 20px',
          zIndex: 41,
          boxShadow: '0 -10px 26px rgba(27,43,75,0.2)',
          maxHeight: '82%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>{stop.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>댓글 {targetComments.length}개</div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
          {topLevel.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
              첫 댓글을 남겨보세요.
            </div>
          )}
          {topLevel.map((c) => renderComment(c, false))}
        </div>

        {replyTo && (
          <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 700, marginBottom: 6 }}>
            답글 작성 중 <span onClick={() => setReplyTo(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 6 }}>취소</span>
          </div>
        )}

        {mentionMatches.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {mentionMatches.map((m) => (
              <div
                key={m.uid}
                onClick={() => insertMention(m.name)}
                style={{ padding: '5px 10px', borderRadius: 99, background: 'var(--navy)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                @{m.name}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="댓글을 입력하세요 (@이름 으로 멘션)"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', fontSize: 13 }}
          />
          <div
            onClick={submit}
            style={{ flexShrink: 0, background: 'var(--coral)', color: '#fff', borderRadius: 14, padding: '12px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            등록
          </div>
        </div>
      </div>
    </>
  );
}
