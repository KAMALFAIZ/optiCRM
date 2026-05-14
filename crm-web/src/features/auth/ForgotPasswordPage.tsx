import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authApi } from '@/api/auth';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async ({ email }: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #405189 0%, #2e3b6e 50%, #1a2340 100%)',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
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
              background: '#405189',
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

          {success ? null : (
            <>
              <Title
                level={4}
                style={{ margin: 0, color: '#212529', fontFamily: 'Poppins', fontWeight: 600 }}
              >
                Mot de passe oublié ?
              </Title>
              <Text style={{ color: '#878a99', fontSize: 13, fontFamily: 'Poppins' }}>
                Entrez votre email pour recevoir un lien de réinitialisation
              </Text>
            </>
          )}
        </div>

        {success ? (
          <Result
            status="success"
            title="Email envoyé !"
            subTitle={
              <span style={{ fontFamily: 'Poppins', fontSize: 13, color: '#495057' }}>
                Si un compte est associé à cette adresse, vous recevrez un email avec les
                instructions pour réinitialiser votre mot de passe.
              </span>
            }
            extra={
              <Link to="/login">
                <Button type="primary" style={{ background: '#405189', borderColor: '#405189' }}>
                  Retour à la connexion
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

            <Form name="forgot-password" onFinish={onFinish} layout="vertical" size="large">
              <Form.Item
                label={
                  <span style={{ fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, color: '#495057' }}>
                    Adresse email
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: 'Veuillez entrer votre email' },
                  { type: 'email', message: 'Email invalide' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#878a99' }} />}
                  placeholder="email@exemple.com"
                  autoComplete="email"
                  style={{ borderRadius: 8, fontFamily: 'Poppins' }}
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
                    fontFamily: 'Poppins',
                    fontWeight: 600,
                    fontSize: 15,
                    background: '#405189',
                    border: 'none',
                  }}
                >
                  Envoyer le lien
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                style={{ color: '#405189', fontFamily: 'Poppins', fontSize: 13 }}
              >
                <ArrowLeftOutlined style={{ marginRight: 6 }} />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
