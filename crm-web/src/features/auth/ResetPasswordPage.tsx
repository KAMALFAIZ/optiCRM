import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async ({ newPassword }: { newPassword: string }) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4F46E5 0%, #2e3b6e 50%, #1a2340 100%)',
          padding: '24px',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '40px 36px',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}
        >
          <Result
            status="error"
            title="Lien invalide"
            subTitle="Ce lien de réinitialisation est invalide ou a expiré."
            extra={
              <Link to="/forgot-password">
                <Button type="primary" style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                  Nouvelle demande
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4F46E5 0%, #2e3b6e 50%, #1a2340 100%)',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#4F46E5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            O
          </div>

          {!success && (
            <>
              <Title
                level={4}
                style={{ margin: 0, color: '#212529', fontFamily: 'Inter', fontWeight: 600 }}
              >
                Nouveau mot de passe
              </Title>
              <Text style={{ color: '#878a99', fontSize: 13, fontFamily: 'Inter' }}>
                Choisissez un mot de passe sécurisé (min. 8 caractères)
              </Text>
            </>
          )}
        </div>

        {success ? (
          <Result
            status="success"
            title="Mot de passe modifié !"
            subTitle={
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#495057' }}>
                Votre mot de passe a été réinitialisé avec succès. Redirection vers la connexion…
              </span>
            }
            extra={
              <Link to="/login">
                <Button type="primary" style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                  Se connecter
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 20, borderRadius: 8 }}
              />
            )}

            <Form name="reset-password" onFinish={onFinish} layout="vertical" size="large">
              <Form.Item
                label={
                  <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: '#495057' }}>
                    Nouveau mot de passe
                  </span>
                }
                name="newPassword"
                rules={[
                  { required: true, message: 'Veuillez entrer un mot de passe' },
                  { min: 8, message: 'Minimum 8 caractères' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#878a99' }} />}
                  placeholder="Nouveau mot de passe"
                  autoComplete="new-password"
                  style={{ borderRadius: 8, fontFamily: 'Inter' }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: '#495057' }}>
                    Confirmer le mot de passe
                  </span>
                }
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Veuillez confirmer votre mot de passe' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#878a99' }} />}
                  placeholder="Confirmer le mot de passe"
                  autoComplete="new-password"
                  style={{ borderRadius: 8, fontFamily: 'Inter' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: 46,
                    borderRadius: 8,
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 15,
                    background: '#4F46E5',
                    border: 'none',
                  }}
                >
                  Réinitialiser le mot de passe
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/forgot-password"
                style={{ color: '#878a99', fontFamily: 'Inter', fontSize: 13 }}
              >
                Renvoyer un nouveau lien
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
