import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import './index.css'; import './App.css'; import './styles/reference.css'; import App from './App'; import { AppProvider } from './store';
createRoot(document.getElementById('root')).render(<AppProvider><BrowserRouter><App /></BrowserRouter></AppProvider>);
