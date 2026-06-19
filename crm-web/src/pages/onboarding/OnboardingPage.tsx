import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Select, Steps, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { tenantApi } from '@/api/tenant';
import { fetchPlans } from '@/features/tenant/tenantSlice';
import { useAppDispatch, useAppSelector } from '@/store';
import type { SubscriptionPlan } from '@/types/tenant';

const { Title, Text } = Typography;
const { Step } = Steps;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const plans = useAppSelector((s) => s.tenant.plans);

  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await tenantApi.registerTenant({
        slug: values.slug,
        companyName: values.companyName,
        adminEmail: values.adminEmail,
        planId: values.planId,
      });
      if (res.data.success) {
        message.success('Compte créé avec succès !');
        // Redirect to the new tenant's login page
        window.location.href = `https://${res.data.data!.slug}.kasoft.ma/login`;
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Entreprise' },
    { title: 'Admin' },
    { title: 'Plan' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 560, borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Créer votre compte OptiCRM
        </Title>

        <Steps current={current} style={{ marginBottom: 32 }}>
          {steps.map((s) => <Step key={s.title} title={s.title} />)}
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {/* Étape 1 : Entreprise */}
          {current === 0 && (
            <>
              <Form.Item label="Nom de l'entreprise" name="companyName" rules={[{ required: true, min: 2 }]}>
                <Input placeholder="ACME Maroc" />
              </Form.Item>
              <Form.Item
                label="Sous-domaine"
                name="slug"
                rules={[
                  { required: true },
                  { pattern: /^[a-z0-9-]{3,50}$/, message: 'Lettres minuscules, chiffres et tirets uniquement (3-50 car.)' },
                ]}
                extra="Votre CRM sera accessible sur : monentreprise.kasoft.ma"
              >
                <Input addonAfter=".kasoft.ma" placeholder="monentreprise" />
              </Form.Item>
            </>
          )}

          {/* Étape 2 : Admin */}
          {current === 1 && (
            <>
              <Form.Item label="Email administrateur" name="adminEmail" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="admin@monentreprise.ma" />
              </Form.Item>
            </>
          )}

          {/* Étape 3 : Plan */}
          {current === 2 && (
            <Form.Item label="Plan d'abonnement" name="planId" rules={[{ required: true }]}>
              <Select placeholder="Choisir un plan">
                {plans.map((p: SubscriptionPlan) => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.name} — {p.priceMonthly > 0 ? `${p.priceMonthly} MAD/mois` : 'Gratuit'}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {current > 0 && (
              <Button onClick={() => setCurrent(current - 1)}>Précédent</Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={() => form.validateFields().then(() => setCurrent(current + 1))}>
                Suivant
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" htmlType="submit" loading={loading}>
                Créer mon compte
              </Button>
            )}
          </div>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">Déjà un compte ? </Text>
          <Button type="link" onClick={() => navigate('/login')}>Se connecter</Button>
        </div>
      </Card>
    </div>
  );
}
