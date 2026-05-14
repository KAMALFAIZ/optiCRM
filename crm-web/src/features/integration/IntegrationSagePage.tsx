import { useState } from 'react';
import { Tabs, Typography, Space } from 'antd';
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
  ThunderboltOutlined,
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
import AutoSyncTab from './tabs/AutoSyncTab';

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
      key: 'auto-sync',
      label: (
        <span className="flex items-center gap-2">
          <ThunderboltOutlined />
          Auto-Sync SQL
        </span>
      ),
      children: <AutoSyncTab />,
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
        </Space>
      </div>

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
