import { initializeApiClient } from './lib/api-client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
// Initialize API client
initializeApiClient();

// Rest of your app initialization code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
