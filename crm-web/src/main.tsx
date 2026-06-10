import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import frFR from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { registerSW } from 'virtual:pwa-register';

import App from './App';
import { store } from './store';
import { useAppSelector } from './store';
import { selectThemeMode, selectDensity } from './features/settings/themeSlice';
import OfflineBanner from './components/OfflineBanner';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';

// Enregistre le Service Worker et recharge automatiquement si nouvelle version
registerSW({
  onNeedRefresh() {
    // Nouvelle version disponible — rechargement silencieux
    window.location.reload();
  },
  onOfflineReady() {
    console.info('OptiCRM est prêt pour une utilisation hors ligne.');
  },
});

// Écouter les messages du Service Worker (navigation depuis notification push)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NAVIGATE' && event.data.link) {
      window.location.href = event.data.link;
    }
  });
}

dayjs.locale('fr');

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const themeMode = useAppSelector(selectThemeMode);
  const density = useAppSelector(selectDensity);
  const isDark = themeMode === 'dark';

  const densityScale = density === 'compact' ? -1 : density === 'comfortable' ? 1 : 0;
  const controlHeight = 34 + densityScale * 4;
  const cellPaddingBlock = 7 + densityScale * 2;
  const formItemMargin = 16 + densityScale * 4;
  const cardPaddingLG = 20 + densityScale * 4;

  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        algorithm: isDark
          ? antTheme.darkAlgorithm
          : antTheme.defaultAlgorithm,
        token: {
          // Velzon brand colors
          colorPrimary: '#405189',
          colorSuccess: '#0ab39c',
          colorWarning: '#f7b84b',
          colorError: '#f06548',
          colorInfo: '#299cdb',

          // Typography
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,

          // Borders
          borderRadius: 6,
          borderRadiusSM: 4,
          borderRadiusLG: 8,

          // Layout
          colorBgLayout: isDark ? '#111316' : '#f3f6f9',
          colorBgContainer: isDark ? '#1d2228' : '#ffffff',
          colorBorder: isDark ? '#2a2f34' : '#e9ebec',
          colorBorderSecondary: isDark ? '#2a2f34' : '#e9ebec',

          // Text
          colorText: isDark ? '#adb5bd' : '#495057',
          colorTextSecondary: isDark ? '#6d7080' : '#878a99',
          colorTextHeading: isDark ? '#e9ecef' : '#212529',

          // Shadow
          boxShadow: '0 1px 3px rgba(56, 65, 74, 0.1)',
          boxShadowSecondary: '0 4px 12px rgba(56, 65, 74, 0.15)',
        },
        components: {
          Menu: {
            itemBorderRadius: 4,
          },
          Card: {
            borderRadius: 6,
            paddingLG: cardPaddingLG,
          },
          Button: {
            borderRadius: 6,
            fontWeight: 500,
            controlHeight,
            paddingContentHorizontal: 14,
          },
          Table: {
            borderRadius: 6,
            cellPaddingBlock,
            cellPaddingInline: 10,
          },
          Form: {
            itemMarginBottom: formItemMargin,
          },
          Select: {
            controlHeight,
          },
          Input: {
            controlHeight,
          },
        },
      }}
    >
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeWrapper>
          <App />
          <OfflineBanner />
        </ThemeWrapper>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
