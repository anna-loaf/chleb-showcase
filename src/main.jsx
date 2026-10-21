import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonty lokalnie (offline): tylko alfabet łaciński + polskie znaki, dwie wagi.
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-ext-400.css';
import '@fontsource/nunito/latin-500.css';
import '@fontsource/nunito/latin-ext-500.css';
import '@fontsource/chonburi/latin-400.css';
import '@fontsource/chonburi/latin-ext-400.css';
import './styles/app.css';
import App from './App.jsx';
import { changed } from './db/db.js';

// Poproś przeglądarkę, żeby nie czyściła danych przy braku miejsca.
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Push przyszedł przy otwartej apce → odśwież „Świeże z pieca”.
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'inbox-updated') changed('inbox');
});
