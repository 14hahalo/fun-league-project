import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// StrictMode doubles useEffect calls in development to catch bugs
// Disable it if you need to measure real Firebase read counts during development
const isDevelopment = import.meta.env.DEV;
const enableStrictMode = false; // Set to true to enable StrictMode in dev

createRoot(document.getElementById('root')!).render(
  isDevelopment && enableStrictMode ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  ),
);