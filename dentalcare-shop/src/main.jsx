import { initializeSupabase } from './lib/supabase';
import { ConfirmProvider } from './components/ConfirmDialog';
import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import './styles/design-system.css'; import App from './App'; import { AppProvider } from './store';
async function start() {
    // Provider initial state must see the final client, not a client added later.
    await initializeSupabase();
    createRoot(document.getElementById('root')).render(<AppProvider><BrowserRouter><ConfirmProvider><App /></ConfirmProvider></BrowserRouter></AppProvider>);
}
void start();
