import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const isDevelopment = import.meta.env.DEV;
const enableStrictMode = false; 

createRoot(document.getElementById('root')!).render(
  isDevelopment && enableStrictMode ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  ),
);