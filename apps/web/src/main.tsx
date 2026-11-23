import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './ui/tokens.css';
import './ui/base.css';
import './ui/components.css';

const container = document.getElementById('root');
if (!container) throw new Error('Élément #root introuvable');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
