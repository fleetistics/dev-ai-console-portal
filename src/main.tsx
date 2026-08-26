import ReactDOM from 'react-dom/client';
import App from './App';
import { initI18n } from './app.Commons/i18n/i18n';
import { initFlightRecorder } from './app.Impl/flightRecorder';

// Before the React root renders, so early failures are captured too.
initFlightRecorder();
initI18n();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
