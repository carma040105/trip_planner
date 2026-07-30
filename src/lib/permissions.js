// Role/permission helpers shared across screens. `member` is the caller's
// trips/{id}/members/{uid} doc (or null if they're not a member — e.g. the
// trip owner viewing their own trip, who has no member doc and is always
// treated as owner via isOwner()).

export const ROLE_LABELS = {
  owner: '소유자',
  editor: '편집자',
  viewer: '뷰어',
  custom: '커스텀',
};

export function isOwner(trip, uid) {
  return Boolean(trip && uid && trip.ownerId === uid);
}

export function canEdit(trip, member, uid) {
  if (isOwner(trip, uid)) return true;
  if (!member) return false;
  if (member.role === 'editor') return true;
  if (member.role === 'custom') {
    const p = member.customPermissions || {};
    return Boolean(p.editItinerary || p.editChecklist || p.editNotes);
  }
  return false;
}

export function canEditItinerary(trip, member, uid) {
  if (isOwner(trip, uid)) return true;
  if (!member) return false;
  if (member.role === 'editor') return true;
  if (member.role === 'custom') return Boolean((member.customPermissions || {}).editItinerary);
  return false;
}

export function canEditChecklist(trip, member, uid) {
  if (isOwner(trip, uid)) return true;
  if (!member) return false;
  if (member.role === 'editor') return true;
  if (member.role === 'custom') return Boolean((member.customPermissions || {}).editChecklist);
  return false;
}

export function canComment(trip, member, uid) {
  if (isOwner(trip, uid)) return true;
  if (!member) return false;
  if (member.role === 'editor' || member.role === 'viewer') return true;
  if (member.role === 'custom') return (member.customPermissions || {}).comment !== false;
  return false;
}

export function canManageMembers(trip, uid) {
  return isOwner(trip, uid);
}

export function canPropose(trip, member, uid) {
  // Anyone with access (including viewers) can propose a new stop; only
  // editors+ can add directly without approval.
  return isOwner(trip, uid) || Boolean(member);
}

export function roleOf(trip, member, uid) {
  if (isOwner(trip, uid)) return 'owner';
  return member?.role || null;
}
