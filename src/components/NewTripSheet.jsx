import { useRef, useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { resizeImageFile } from '../lib/imageUtils';
import DateRangePicker, { formatDateLabel, nightsBetween } from './DateRangePicker.jsx';

const BLANK = { destination: '', startDate: null, endDate: null, country: 'overseas', transport: null, coverImage: null };

export default function NewTripSheet({ onClose }) {
  const { createTrip, openTrip } = useTravel();
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const photoInputRef = useRef(null);

  const setCountry = (country) =>
    setForm((f) => ({ ...f, country, transport: country === 'overseas' ? null : f.transport || 'car' }));

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file);
      setForm((f) => ({ ...f, coverImage: dataUrl }));
    } catch {
      window.alert('사진을 처리하지 못했어요. 다른 사진으로 시도해주세요.');
    }
  };

  const nights = form.startDate && form.endDate ? nightsBetween(form.startDate, form.endDate) : 3;

  const submit = async () => {
    if (!form.destination.trim() || busy) return;
    setBusy(true);
    const days = Array.from({ length: nights + 1 }, () => ({ stops: [] }));
    try {
      const id = await createTrip({
        destination: form.destination,
        dateLabel: form.startDate ? formatDateLabel(form.startDate, form.endDate) : '날짜 미정',
        country: form.country,
        transport: form.transport,
        days,
        checklist: [],
        coverImage: form.coverImage,
      });
      setForm(BLANK);
      onClose();
      if (id) openTrip(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 40 }}
      />
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
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>새 여행 만들기</div>

        <input
          type="text"
          value={form.destination}
          onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          placeholder="여행지 (예: 도쿄)"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 14,
            marginBottom: 10,
          }}
        />
        <div
          onClick={() => setShowCalendar(true)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none',
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 14,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: form.startDate ? 'var(--navy)' : 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: 15 }}>📅</span>
          <span style={{ flex: 1 }}>
            {form.startDate
              ? `${formatDateLabel(form.startDate, form.endDate)}${form.endDate ? ` · ${nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`}` : ''}`
              : '여행 날짜 선택'}
          </span>
        </div>

        <input ref={photoInputRef} type="file" accept="image/*" onChange={onPhotoSelected} style={{ display: 'none' }} />
        <div
          onClick={() => photoInputRef.current?.click()}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: 14,
            marginBottom: 10,
            cursor: 'pointer',
            overflow: 'hidden',
            background: form.coverImage ? `url(${form.coverImage}) center/cover no-repeat` : 'var(--bg)',
            height: form.coverImage ? 110 : 54,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {!form.coverImage && (
            <>
              <span style={{ fontSize: 16 }}>📷</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>대표 사진 추가 (선택)</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[
            { id: 'overseas', label: '해외' },
            { id: 'domestic', label: '국내' },
          ].map((o) => (
            <div key={o.id} className={`chip${form.country === o.id ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setCountry(o.id)}>
              {o.label}
            </div>
          ))}
        </div>

        {form.country === 'domestic' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[
              { id: 'car', label: '🚗 자동차' },
              { id: 'bike', label: '🚴 자전거' },
            ].map((o) => (
              <div
                key={o.id}
                className={`chip${form.transport === o.id ? ' active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setForm((f) => ({ ...f, transport: o.id }))}
              >
                {o.label}
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={busy} style={{ marginTop: 6 }}>
          {busy ? '만드는 중…' : '여행 만들기'}
        </button>
      </div>

      {showCalendar && (
        <DateRangePicker
          initialStart={form.startDate}
          initialEnd={form.endDate}
          onConfirm={(start, end) => {
            setForm((f) => ({ ...f, startDate: start, endDate: end }));
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}
