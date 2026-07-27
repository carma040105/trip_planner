import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';

export default function Login() {
  const { updateData, setScreen } = useTravel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Demo-only: no real auth. Wire up Firebase Auth signInWithEmailAndPassword /
  // createUserWithEmailAndPassword here for production.
  const doLogin = () => {
    updateData((d) => ({ ...d, loggedIn: true }));
    setScreen('home');
  };

  return (
    <div className="screen" style={{ justifyContent: 'center', padding: '0 28px 40px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>MyWay</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          개인 여행 플래너에 로그인하세요
        </div>

        <div className="field-label">이메일</div>
        <input
          type="text"
          className="text-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@myway.app"
          style={{ marginBottom: 14 }}
        />

        <div className="field-label">비밀번호</div>
        <input
          type="password"
          className="text-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{ marginBottom: 22 }}
        />

        <button className="btn-primary" onClick={doLogin}>
          로그인
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          계정이 없나요? <span style={{ color: 'var(--coral)', fontWeight: 700 }}>회원가입</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#c4cad6', marginTop: 26 }}>
          ※ 데모용 화면입니다 — 실제 인증 로직은 없어요
        </div>
      </div>
    </div>
  );
}
