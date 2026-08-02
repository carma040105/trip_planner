import { useState } from 'react';
import { useAuth } from '../store/AuthContext.jsx';
import { FIREBASE_CONFIGURED } from '../lib/firebaseKeys';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, authError, busy } = useAuth();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!FIREBASE_CONFIGURED) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🔧</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>Firebase 설정 필요</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            협업 기능을 사용하려면 Firebase 프로젝트를 연결해야 해요.
            <br />
            README의 Firebase 설정 가이드를 참고해주세요.
          </div>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!email.trim() || !password) return;
    try {
      if (mode === 'signup') {
        if (!name.trim()) return;
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch {
      // authError already set by AuthContext
    }
  };

  const submitGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // authError already set by AuthContext (unless the user just closed the popup)
    }
  };

  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>MyWay</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>친구, 가족과 함께 만드는 여행</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <div className={`chip${mode === 'signin' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setMode('signin')}>
              로그인
            </div>
            <div className={`chip${mode === 'signup' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setMode('signup')}>
              회원가입
            </div>
          </div>

          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              style={inputStyle}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="비밀번호 (6자 이상)"
            style={{ ...inputStyle, marginBottom: 6 }}
          />

          {authError && <div style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 700, marginBottom: 10 }}>{authError}</div>}

          <button className="btn-primary" style={{ marginTop: 8 }} onClick={submit} disabled={busy}>
            {busy ? '처리 중…' : mode === 'signup' ? '가입하고 시작하기' : '로그인'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>또는</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          </div>

          <div
            onClick={busy ? undefined : submitGoogle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              boxSizing: 'border-box',
              border: '1.5px solid var(--border-soft)',
              borderRadius: 14,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--navy)',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <GoogleIcon />
            Google로 계속하기
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  outline: 'none',
  background: 'var(--bg)',
  borderRadius: 14,
  padding: '13px 14px',
  fontSize: 14,
  marginBottom: 10,
};
