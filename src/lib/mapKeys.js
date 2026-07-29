// Map SDK keys, injected at build time via Vite env vars (must be prefixed VITE_).
// These are client-side map keys (not secrets like the Anthropic key) — Kakao/Naver
// restrict usage by registered domain, not by hiding the key. Set them in Netlify:
// Site configuration -> Environment variables -> VITE_KAKAO_MAP_KEY / VITE_NAVER_MAP_CLIENT_ID,
// then redeploy (Vite bakes them into the build, unlike server-only function env vars).
export const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY || '';
export const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '';
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
