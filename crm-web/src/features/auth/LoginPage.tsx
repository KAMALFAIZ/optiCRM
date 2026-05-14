import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '@/store';
import { login, clearError, selectAuthError, selectAuthLoading, selectIsAuthenticated } from './authSlice';
import type { LoginRequest } from '@/types/auth';
import type { RootState } from '@/store';

const { Title, Text } = Typography;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const publicInfo = useAppSelector((state: RootState) => state.tenant.publicInfo);

  const brandName = publicInfo?.name || 'OptiCRM';
  const brandColor = publicInfo?.primaryColor || '#405189';
  const brandLogo = publicInfo?.logoUrl;

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onFinish = (values: LoginRequest) => {
    dispatch(login(values));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 50%, ${brandColor}88 100%)`,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            top: -80,
            left: -80,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            bottom: -60,
            right: -60,
          }}
        />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={brandName}
              style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'contain', margin: '0 auto 24px' }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 36,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {brandName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1
            style={{
              color: '#fff',
              fontSize: 40,
              fontWeight: 700,
              margin: '0 0 16px',
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '-0.5px',
            }}
          >
            {brandName}
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 16,
              maxWidth: 360,
              lineHeight: 1.7,
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Gérez vos relations clients, vos ventes et votre équipe terrain depuis une seule plateforme.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: 48, textAlign: 'left' }}>
            {[
              'Gestion des contacts & comptes',
              'Pipeline de ventes & opportunités',
              'Reporting & KPIs commerciaux',
              'Planification terrain & tournées',
            ].map((feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#0ab39c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 11,
                    color: '#fff',
                  }}
                >
                  ✓
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: '#fff',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden" style={{ justifyContent: 'center', marginBottom: 32 }}>
            {brandLogo ? (
              <img src={brandLogo} alt={brandName} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: brandColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <Title
              level={3}
              style={{
                margin: 0,
                color: '#212529',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
            >
              Bienvenue !
            </Title>
            <Text style={{ color: '#878a99', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
              Connectez-vous pour accéder à votre espace
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => dispatch(clearError())}
              style={{ marginBottom: 24, borderRadius: 8 }}
            />
          )}

          <Form
            name="login"
            initialValues={{ rememberMe: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              label={<span style={{ fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, color: '#495057' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Veuillez entrer votre email' },
                { type: 'email', message: 'Email invalide' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#878a99' }} />}
                placeholder="email@exemple.com"
                autoComplete="email"
                style={{ borderRadius: 8, fontFamily: 'Poppins' }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, color: '#495057' }}>Mot de passe</span>}
              name="password"
              rules={[{ required: true, message: 'Veuillez entrer votre mot de passe' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#878a99' }} />}
                placeholder="Mot de passe"
                autoComplete="current-password"
                style={{ borderRadius: 8, fontFamily: 'Poppins' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox style={{ fontFamily: 'Poppins', fontSize: 13, color: '#495057' }}>
                    Se souvenir de moi
                  </Checkbox>
                </Form.Item>
                <Link
                  to="/forgot-password"
                  style={{ color: brandColor, fontFamily: 'Poppins', fontSize: 13 }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                style={{
                  height: 46,
                  borderRadius: 8,
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  fontSize: 15,
                  background: brandColor,
                  border: 'none',
                }}
              >
                Se connecter
              </Button>
            </Form.Item>
          </Form>

          {/* Demo account */}
          <div
            style={{
              background: '#f8f9ff',
              border: '1px solid #e8ebf5',
              borderRadius: 10,
              padding: '16px 20px',
              textAlign: 'center',
            }}
          >
            <Text style={{ color: '#878a99', fontSize: 12, fontFamily: 'Poppins', display: 'block', marginBottom: 6 }}>
              Compte de démonstration
            </Text>
            <Text
              code
              style={{ fontSize: 12, fontFamily: 'Poppins', background: 'rgba(64,81,137,0.08)', color: '#405189' }}
            >
              admin@opticrm.com
            </Text>
            <Text style={{ color: '#878a99', fontSize: 12, fontFamily: 'Poppins', display: 'block', marginTop: 4 }}>
              Mot de passe :{' '}
              <Text code style={{ fontSize: 12, background: 'rgba(64,81,137,0.08)', color: '#405189' }}>
                Admin123!
              </Text>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
