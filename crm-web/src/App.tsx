import { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { Spin } from 'antd';

import { useAppDispatch, useAppSelector } from '@/store';
import { checkAuth, selectAuthLoading } from '@/features/auth/authSlice';
import { routes } from '@/routes';

function App() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  const element = useRoutes(routes);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Chargement..."><div /></Spin>
      </div>
    );
  }

  return element;
}

export default App;
