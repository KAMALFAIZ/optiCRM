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
          // Indigo Pro brand colors
          colorPrimary: '#4F46E5',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#0EA5E9',

          // Typography — Inter avec chiffres tabulaires pour les montants
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,

          // Borders — radius plus généreux, look moderne
          borderRadius: 10,
          borderRadiusSM: 6,
          borderRadiusLG: 12,

          // Layout — échelle Slate
          colorBgLayout: isDark ? '#0F172A' : '#F8FAFC',
          colorBgContainer: isDark ? '#1E293B' : '#ffffff',
          colorBorder: isDark ? '#334155' : '#E2E8F0',
          colorBorderSecondary: isDark ? '#334155' : '#E2E8F0',

          // Text — Slate
          colorText: isDark ? '#CBD5E1' : '#334155',
          colorTextSecondary: isDark ? '#94A3B8' : '#64748B',
          colorTextHeading: isDark ? '#F1F5F9' : '#0F172A',

          // Shadow — teintée slate, subtile
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)',
          boxShadowSecondary: '0 4px 16px rgba(15, 23, 42, 0.12)',
        },
        components: {
          Menu: {
            itemBorderRadius: 8,
          },
          Card: {
            borderRadius: 12,
            paddingLG: cardPaddingLG,
          },
          Button: {
            borderRadius: 8,
            fontWeight: 500,
            controlHeight,
            paddingContentHorizontal: 16,
            primaryShadow: '0 1px 2px rgba(79, 70, 229, 0.25)',
          },
          Table: {
            borderRadius: 10,
            cellPaddingBlock,
            cellPaddingInline: 12,
            headerBg: isDark ? '#1E293B' : '#F8FAFC',
          },
          Form: {
            itemMarginBottom: formItemMargin,
          },
          Select: {
            controlHeight,
            borderRadius: 8,
          },
          Input: {
            controlHeight,
            borderRadius: 8,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Modal: {
            borderRadiusLG: 14,
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
