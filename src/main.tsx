import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installTooltips } from './tooltips';
// Police de lecture du lecteur de modules, servie avec le site (aucun appel extérieur).
import '@fontsource-variable/inter';
import './index.css';
import './styles/ui.css';
import './styles/settings.css';
import './styles/profile.css';
import './styles/studio.css';
import './styles/governance.css';
import './styles/progression.css';
import './styles/charts.css';
import './styles/art.css';
import './styles/reader.css';
import './styles/landing.css';
import './styles/calendar.css';
import './styles/school.css';
import './styles/planning.css';
import './styles/offers.css';
import './styles/info.css';
import './styles/retouches.css';
import './styles/work.css';
import './styles/learner.css';
import './styles/teaching.css';
import './styles/pricing.css';
import './styles/angles.css';

installTooltips();

createRoot(document.getElementById('root')!).render(<App />);
