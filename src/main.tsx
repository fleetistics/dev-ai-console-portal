import ReactDOM from 'react-dom/client';
import App from './App';
import { initFlightRecorder } from './app.Commons/flightRecorder';
import { AppConfig } from './app.Impl/configs/AppConfig';

// Before the React root renders, so early failures are captured too.
initFlightRecorder();

//AppConfig.init().finally(() => {
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
//});
