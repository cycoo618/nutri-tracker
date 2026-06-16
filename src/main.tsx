import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Bundle fonts locally — no Google Fonts network dependency
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/zcool-qingke-huangyou/chinese-simplified-400.css';
import '@fontsource/zcool-qingke-huangyou/latin-400.css';
import '@fontsource/ma-shan-zheng/chinese-simplified-400.css';
import '@fontsource/ma-shan-zheng/latin-400.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
