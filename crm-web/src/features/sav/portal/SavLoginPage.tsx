import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { PhoneOutlined, ToolOutlined } from '@ant-design/icons';
import { savAuthApi } from '@/api/sav';

const { Title, Text } = Typography;

export default function SavLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { tel_whatsapp: string }) => {
    setLoading(true);
    try {
      const { data } = await savAuthApi.requestOtp(values.tel_whatsapp);
      message.success('Code OTP envoyé sur WhatsApp !');
      navigate('/sav/verify', {
        state: { tel: values.tel_whatsapp, accountName: data.accountName },
      });
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Numéro non trouvé. Contactez KASOFT.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-blue-600 rounded-full p-3">
              <ToolOutlined className="text-white text-2xl" />
            </div>
          </div>
          <Title level={3} className="!mb-1">Support KASOFT</Title>
          <Text type="secondary" className="text-base">
            كيف يمكننا مساعدتك؟ / Comment pouvons-nous vous aider ?
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            label="Numéro WhatsApp"
            name="tel_whatsapp"
            rules={[
              { required: true, message: 'Numéro WhatsApp requis' },
              { pattern: /^\+212[0-9]{9}$/, message: 'Format : +212XXXXXXXXX' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="+212 6XX XXX XXX"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="rounded-lg h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              icon={<PhoneOutlined />}
            >
              Recevoir le code OTP par WhatsApp
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary" className="text-sm">
            Vous n'êtes pas encore client ?{' '}
            <a href="mailto:contact@kasoft.ma">Contactez-nous</a>
          </Text>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Space>
            <img src="/logo.png" alt="KASOFT" className="h-6 opacity-60" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <Text type="secondary" className="text-xs">KASOFT Informatique & Conseil — Casablanca</Text>
          </Space>
        </div>
      </Card>
    </div>
  );
}
