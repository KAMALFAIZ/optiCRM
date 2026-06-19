import { useEffect, useState } from 'react';
import { useRoutes, useNavigate, useLocation } from 'react-router-dom';
import { Result, Spin, Button } from 'antd';

import { useAppDispatch, useAppSelector } from '@/store';
import { checkAuth, selectAuthLoading } from '@/features/auth/authSlice';
import { resolveSlug } from '@/features/tenant/tenantSlice';
import { routes } from '@/routes';

const TENANT_SLUG_KEY = 'opticrm_tenant_slug';

function App() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const navigate = useNavigate();
  const location = useLocation();
  const [setupChecked, setSetupChecked] = useState(false);
  const [tenantResolved, setTenantResolved] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Step 1: Resolve tenant from the subdomain ({client}.kasoft.ma), then localStorage
  useEffect(() => {
    const savedSlug = localStorage.getItem(TENANT_SLUG_KEY);

    // Detect slug from subdomain: odyssee.kasoft.ma → "odyssee"
    let subdomainSlug: string | null = null;
    const hostname = window.location.hostname; // e.g. "odyssee.kasoft.ma"
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const candidate = parts[0];
      // Ignore generic subdomains
      if (!['www', 'app', 'localhost', 'kasoft'].includes(candidate)) {
        subdomainSlug = candidate;
      }
    }

    // Priority: subdomain ({client}.kasoft.ma) > localStorage > "default" (base maître)
    const slug = subdomainSlug || savedSlug || 'default';

    dispatch(resolveSlug(slug))
      .unwrap()
      .catch(() => {
        // "default" slug failing is not an error — it means the master DB works via backend fallback
        if (slug !== 'default') setTenantError(slug);
      })
      .finally(() => setTenantResolved(true));
  }, []);

  // Step 2: Check on-premise setup status
  useEffect(() => {
    if (!tenantResolved) return;
    if (location.pathname === '/setup') {
      setSetupChecked(true);
      return;
    }
    fetch('/api/v1/public/setup-status')
      .then((r) => r.json())
      .then((data) => {
        if (data.configured === false) {
          navigate('/setup', { replace: true });
        }
      })
      .catch(() => { /* réseau indisponible — laisser continuer */ })
      .finally(() => setSetupChecked(true));
  }, [tenantResolved]);

  // Step 3: Auth check — validate JWT client-side first, skip entirely if expired/invalid
  useEffect(() => {
    if (!tenantResolved) return;

    const token = localStorage.getItem('opticrm_access_token');
    let hasValidToken = false;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          hasValidToken = true;
        }
      } catch {
        // Malformed token — treat as invalid
      }

      if (!hasValidToken) {
        // Expired or malformed token — clean up silently, no HTTP call needed
        localStorage.removeItem('opticrm_access_token');
        localStorage.removeItem('opticrm_refresh_token');
      }
    }

    if (hasValidToken) {
      dispatch(checkAuth());
    }

    const timeout = setTimeout(() => setAuthTimedOut(true), hasValidToken ? 8000 : 0);
    return () => clearTimeout(timeout);
  }, [dispatch, tenantResolved]);

  const element = useRoutes(routes);

  if (!tenantResolved || (!authTimedOut && isLoading) || !setupChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Chargement..."><div /></Spin>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Result
          status="404"
          title="Espace client introuvable"
          subTitle={`Le client « ${tenantError} » n'existe pas ou a été désactivé.`}
          extra={
            <Button type="primary" onClick={() => { localStorage.removeItem(TENANT_SLUG_KEY); window.location.href = '/'; }}>
              Retour à l'accueil
            </Button>
          }
        />
      </div>
    );
  }

  return element;
}

export default App;
