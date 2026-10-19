import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c2540',
              color: '#e9edf7',
              border: '1px solid #26304a',
              fontSize: '14px',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#34d39a', secondary: '#0e1220' } },
            error: { iconTheme: { primary: '#ff6b6b', secondary: '#0e1220' } },
          }}
        />
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
