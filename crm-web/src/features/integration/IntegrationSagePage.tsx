import { useState } from 'react';
import { Tabs, Typography, Alert, Space, Tag } from 'antd';
import {
  BankOutlined,
  UserOutlined,
  LineChartOutlined,
  AimOutlined,
  ApiOutlined,
  SettingOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import AccountsSyncTab from './tabs/AccountsSyncTab';
import ContactsSyncTab from './tabs/ContactsSyncTab';
import CaSyncTab from './tabs/CaSyncTab';
import ObjectivesSyncTab from './tabs/ObjectivesSyncTab';
import SageConfigTab from './tabs/SageConfigTab';
import ProductsSyncTab from './tabs/ProductsSyncTab';
import InventaireSyncTab from './tabs/InventaireSyncTab';
import VentesSyncTab from './tabs/VentesSyncTab';
import BalanceAgeeSyncTab from './tabs/BalanceAgeeSyncTab';

const { Title, Text } = Typography;

export default function IntegrationSagePage() {
  const [activeTab, setActiveTab] = useState('accounts');

  const tabItems = [
    {
      key: 'accounts',
      label: (
        <span className="flex items-center gap-2">
          <BankOutlined />
          Comptes clients
        </span>
      ),
      children: <AccountsSyncTab />,
    },
    {
      key: 'contacts',
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Contacts
        </span>
      ),
      children: <ContactsSyncTab />,
    },
    {
      key: 'ca',
      label: (
        <span className="flex items-center gap-2">
          <LineChartOutlined />
          Chiffre d'affaires
        </span>
      ),
      children: <CaSyncTab />,
    },
    {
      key: 'objectives',
      label: (
        <span className="flex items-center gap-2">
          <AimOutlined />
          Objectifs
        </span>
      ),
      children: <ObjectivesSyncTab />,
    },
    {
      key: 'products',
      label: (
        <span className="flex items-center gap-2">
          <AppstoreOutlined />
          Produits
        </span>
      ),
      children: <ProductsSyncTab />,
    },
    {
      key: 'inventory',
      label: (
        <span className="flex items-center gap-2">
          <InboxOutlined />
          Inventaire
        </span>
      ),
      children: <InventaireSyncTab />,
    },
    {
      key: 'ventes',
      label: (
        <span className="flex items-center gap-2">
          <ShoppingCartOutlined />
          Ventes
        </span>
      ),
      children: <VentesSyncTab />,
    },
    {
      key: 'balance-agee',
      label: (
        <span className="flex items-center gap-2">
          <DollarOutlined />
          Balance Âgée
        </span>
      ),
      children: <BalanceAgeeSyncTab />,
    },
    {
      key: 'config',
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          Configuration serveur
        </span>
      ),
      children: <SageConfigTab />,
    },
  ];

  return (
    <div className="p-6">
      {/* ── En-tête ── */}
      <div className="mb-6">
        <Space align="center" className="mb-2">
          <ApiOutlined style={{ fontSize: 28, color: '#405189' }} />
          <Title level={3} className="!mb-0">
            Intégration Sage 100
          </Title>
          <Tag color="blue">Synchronisation bidirectionnelle</Tag>
        </Space>
        <Text type="secondary">
          Importez et synchronisez les données entre OptiCRM et Sage 100.
          Collez vos exports Sage directement depuis Excel, prévisualisez les correspondances,
          puis appliquez la synchronisation.
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        className="mb-6"
        message="Mode de synchronisation par requête"
        description={
          <ul className="mt-1 mb-0 pl-4 text-sm">
            <li><strong>Étape 1</strong> — Collez vos données export Sage (ou saisissez manuellement).</li>
            <li><strong>Étape 2</strong> — Prévisualisez le matching : Nouveau / Mise à jour / Identique / Conflit.</li>
            <li><strong>Étape 3</strong> — Appliquez la requête pour écrire les données dans OptiCRM.</li>
          </ul>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
        size="large"
      />
    </div>
  );
}
