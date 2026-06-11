import { useEffect } from 'react';
import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CrownOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentTenant, fetchPlans } from '@/features/tenant/tenantSlice';

const { Title, Text, Paragraph } = Typography;

export default function SubscriptionPage() {
  const dispatch = useAppDispatch();
  const { tenant, plans } = useAppSelector((s) => s.tenant);

  useEffect(() => {
    dispatch(fetchCurrentTenant());
    dispatch(fetchPlans());
  }, [dispatch]);

  const currentPlan = tenant?.plan;
  const maxUsers = tenant?.maxUsers ?? currentPlan?.maxUsers ?? -1;

  const planColor: Record<string, string> = {
    FREE: 'default',
    STARTER: 'blue',
    PRO: 'purple',
    ENTERPRISE: 'gold',
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={3}>Abonnement</Title>

      {/* Plan actuel */}
      {tenant && (
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Row align="middle" gutter={16}>
            <Col>
              <CrownOutlined style={{ fontSize: 32, color: '#faad14' }} />
            </Col>
            <Col flex="auto">
              <Text strong style={{ fontSize: 18 }}>{tenant.name}</Text>
              <br />
              <Tag color={planColor[currentPlan?.id ?? 'FREE']}>
                {currentPlan?.name ?? 'Gratuit'}
              </Tag>
              {tenant.status === 'TRIAL' && tenant.trialEndsAt && (
                <Tag color="orange">
                  Essai jusqu'au {new Date(tenant.trialEndsAt).toLocaleDateString('fr-FR')}
                </Tag>
              )}
            </Col>
          </Row>

          {maxUsers > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Utilisateurs</Text>
              <Progress
                percent={Math.min(100, Math.round(0 / maxUsers * 100))}
                format={() => `0 / ${maxUsers}`}
                status="active"
              />
            </div>
          )}
        </Card>
      )}

      {/* Plans disponibles */}
      <Title level={4}>Changer de plan</Title>
      <Row gutter={16}>
        {plans.map((plan) => (
          <Col key={plan.id} xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: 12,
                borderColor: plan.id === currentPlan?.id ? '#1890ff' : undefined,
                borderWidth: plan.id === currentPlan?.id ? 2 : 1,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Tag color={planColor[plan.id]}>{plan.name}</Tag>
              <Title level={4} style={{ margin: '12px 0 4px' }}>
                {plan.priceMonthly > 0 ? `${plan.priceMonthly} MAD` : 'Gratuit'}
                {plan.priceMonthly > 0 && <Text type="secondary" style={{ fontSize: 13 }}>/mois</Text>}
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 12 }}>
                {plan.maxUsers > 0 ? `${plan.maxUsers} utilisateurs` : 'Utilisateurs illimités'}
              </Paragraph>
              <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 12 }}>
                {Object.entries(plan.features).map(([feature, enabled]) => (
                  <Text key={feature} style={{ fontSize: 12 }}>
                    <CheckCircleOutlined style={{ color: enabled ? '#52c41a' : '#d9d9d9', marginRight: 6 }} />
                    {feature.replace(/_/g, ' ')}
                  </Text>
                ))}
              </Space>
              <Button
                type={plan.id === currentPlan?.id ? 'default' : 'primary'}
                block
                disabled={plan.id === currentPlan?.id}
              >
                {plan.id === currentPlan?.id ? 'Plan actuel' : 'Choisir'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
