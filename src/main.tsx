import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and suppress benign WebSocket errors or unhandled rejections related to HMR in the sandbox
if (typeof window !== 'undefined') {
  const isBenignWsError = (msg: string): boolean => {
    const lower = msg.toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('web socket') ||
      lower.includes('fechado sem ter sido aberto') ||
      lower.includes('closed without having been opened') ||
      lower.includes('failed to connect') ||
      lower.includes('connection to')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const message = String(reason.message || reason);
      if (isBenignWsError(message)) {
        event.preventDefault();
        event.stopPropagation();
        console.info('[Sandbox Config] Suprimida rejeição de WebSocket inofensiva.');
      }
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (message && isBenignWsError(message)) {
      event.preventDefault();
      event.stopPropagation();
      console.info('[Sandbox Config] Suprimido erro de WebSocket inofensivo.');
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

