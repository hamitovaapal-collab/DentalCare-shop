import { ConfirmProvider } from './components/ConfirmDialog';
import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import './styles/design-system.css'; import App from './App'; import { AppProvider } from './store';
createRoot(document.getElementById('root')).render(<AppProvider><BrowserRouter><ConfirmProvider><App /></ConfirmProvider></BrowserRouter></AppProvider>);
