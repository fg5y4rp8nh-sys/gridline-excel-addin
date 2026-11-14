import React from 'react';
// Sidebar entry. Loads the document's stored settings/snapshot first, then mounts the React app.
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadStore } from '../lib/store';
import './sidebar.css';

const root = document.getElementById('root')!;
loadStore().catch(() => { /* first run: empty store */ }).finally(() => createRoot(root).render(<App />));
