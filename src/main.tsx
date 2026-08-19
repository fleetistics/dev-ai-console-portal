import ReactDOM from 'react-dom/client';
import App from './App';
import { AppConfig } from './app.Impl/configs/AppConfig';

AppConfig.init().finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
