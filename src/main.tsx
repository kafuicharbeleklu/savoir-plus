import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/ui.css';
import './styles/settings.css';
import './styles/studio.css';
import './styles/governance.css';

createRoot(document.getElementById('root')!).render(<App />);
