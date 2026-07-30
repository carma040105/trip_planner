import { useState } from 'react';
import { useAuth } from '../store/AuthContext.jsx';
import { FIREBASE_CONFIGURED } from '../lib/firebaseKeys';

export default function AuthScreen() {
  const { signIn, signUp, authError, busy } = useAuth();
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
        </div>
      </div>
    </div>
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
