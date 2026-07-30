// Firebase project config, injected at build time via Vite env vars (must be
// prefixed VITE_). Same pattern as the map SDK keys — get these from
// Firebase Console -> Project settings -> General -> Your apps -> SDK setup
// and configuration, then set them in Netlify: Site configuration ->
// Environment variables, then redeploy (Deploy without cache, since Vite
// bakes these into the build).
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const FIREBASE_CONFIGURED = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
