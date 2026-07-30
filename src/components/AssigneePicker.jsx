export function AssigneeBadge({ name, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 9px',
        borderRadius: 99,
        background: name ? 'var(--navy)' : 'var(--bg)',
        color: name ? '#fff' : 'var(--text-muted)',
        fontSize: 11,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      {name || '담당자'}
    </div>
  );
}

export function AssigneeRow({ members, value, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
      <div onClick={() => onSelect(null)} style={chipStyle(!value)}>
        미정
      </div>
      {members.map((m) => (
        <div key={m.uid} onClick={() => onSelect(m.uid)} style={chipStyle(value === m.uid)}>
          {m.name || m.email}
        </div>
      ))}
    </div>
  );
}

function chipStyle(active) {
  return {
    padding: '6px 12px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
    background: active ? 'var(--coral)' : 'var(--bg)',
    color: active ? '#fff' : 'var(--navy)',
    cursor: 'pointer',
  };
}
