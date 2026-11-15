import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installTooltips } from './tooltips';
import './index.css';
import './styles/ui.css';
import './styles/settings.css';
import './styles/profile.css';
import './styles/studio.css';
import './styles/governance.css';
import './styles/progression.css';
import './styles/charts.css';
import './styles/reader.css';
import './styles/landing.css';
import './styles/retouches.css';
import './styles/angles.css';

installTooltips();

createRoot(document.getElementById('root')!).render(<App />);
