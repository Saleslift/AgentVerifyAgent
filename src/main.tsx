import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { I18nextProvider } from 'react-i18next'; // Added
import i18n from './utils/i18n';
import {APIProvider} from "@vis.gl/react-google-maps"; // Added

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>

        <App />
        </APIProvider>
    </I18nextProvider>
  </React.StrictMode>
);
