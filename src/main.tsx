import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.scss';
import { ShowsExplorer } from './ShowsExplorer';
import { QueryProvider } from './QueryProvider';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root is missing in index.html');
}

createRoot(root).render(
  <StrictMode>
    <QueryProvider>
      <ShowsExplorer />
    </QueryProvider>
  </StrictMode>,
);
