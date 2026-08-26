import ReactDOM from 'react-dom/client';
import App from './App';
import { initFlightRecorder } from './app.Impl/flightRecorder';

// Before the React root renders, so early failures are captured too.
initFlightRecorder();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
