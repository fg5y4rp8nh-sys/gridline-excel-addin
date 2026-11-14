import { createRoot } from 'react-dom/client';
import App from './App';
import './taskpane.css';

/** Mount the task pane once Office is ready. In the demo host the mount point is passed in. */
export function mount(el: HTMLElement) { createRoot(el).render(<App />); }

if (!(window as unknown as { __GRIDLINE_HOST?: boolean }).__GRIDLINE_HOST) {
  Office.onReady(info => {
    const root = document.getElementById('root')!;
    if (info.host !== Office.HostType.Excel) { root.innerHTML = '<p style="padding:20px;font:14px sans-serif">Gridline runs in Excel.</p>'; return; }
    mount(root);
  });
}
