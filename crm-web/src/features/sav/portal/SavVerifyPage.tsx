import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Typography, message, Input } from 'antd';
import { savAuthApi } from '@/api/sav';

const { Title, Text } = Typography;

export default function SavVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tel, accountName } = (location.state as { tel: string; accountName: string }) || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      message.warning('Entrez le code à 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await savAuthApi.verifyOtp(tel, code);
      localStorage.setItem('sav_token', data.access_token);
      localStorage.setItem('sav_client', JSON.stringify(data.client));
      message.success(`Bienvenue, ${data.client.name} !`);
      navigate('/sav/nouveau');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Code incorrect ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await savAuthApi.requestOtp(tel);
      message.success('Nouveau code envoyé !');
      setOtp(['', '', '', '', '', '']);
    } catch {
      message.error('Erreur lors du renvoi');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <div className="text-center mb-6">
          <Title level={3} className="!mb-1">Vérification OTP</Title>
          <Text type="secondary">
            Code envoyé au <strong>{tel}</strong>
          </Text>
          {accountName && (
            <div className="mt-2">
              <Text className="text-blue-600 font-medium">{accountName}</Text>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          ))}
        </div>

        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          onClick={handleVerify}
          className="rounded-lg h-12 text-base font-medium bg-blue-600 mb-3"
        >
          Valider
        </Button>

        <Button
          block
          size="large"
          loading={resending}
          onClick={handleResend}
          className="rounded-lg h-12"
        >
          Renvoyer le code
        </Button>

        <div className="text-center mt-4">
          <Button type="link" onClick={() => navigate('/sav')}>
            ← Changer de numéro
          </Button>
        </div>
      </Card>
    </div>
  );
}
