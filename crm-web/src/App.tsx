import { useEffect, useState } from 'react';
import { useRoutes, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';

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
  const [searchParams] = useSearchParams();
  const [setupChecked, setSetupChecked] = useState(false);
  const [tenantResolved, setTenantResolved] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Step 1: Resolve tenant from ?client= param or localStorage
  useEffect(() => {
    const clientSlug = searchParams.get('client');
    const savedSlug = localStorage.getItem(TENANT_SLUG_KEY);
    const slug = clientSlug || savedSlug;

    if (slug) {
      dispatch(resolveSlug(slug)).finally(() => setTenantResolved(true));
    } else {
      setTenantResolved(true);
    }
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

  // Step 3: Auth check (runs after tenant is resolved so X-Tenant-ID is available)
  useEffect(() => {
    if (!tenantResolved) return;
    dispatch(checkAuth());
    const timeout = setTimeout(() => setAuthTimedOut(true), 8000);
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

  return element;
}

export default App;
