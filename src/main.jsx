import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import App from './App.jsx';
import { TravelProvider } from './store/TravelContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TravelProvider>
      <App />
    </TravelProvider>
  </StrictMode>
);
