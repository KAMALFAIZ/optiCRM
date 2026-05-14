import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoComplete, Input, Typography, Space } from 'antd';
import {
  SearchOutlined,
  BankOutlined,
  UserOutlined,
  FunnelPlotOutlined,
  TrophyOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import searchApi, { SearchItem } from '@/api/search';

const { Text } = Typography;

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; route: string }> = {
  ACCOUNT: { label: 'Compte', icon: <BankOutlined />, color: '#722ed1', route: '/accounts' },
  CONTACT: { label: 'Contact', icon: <UserOutlined />, color: '#1890ff', route: '/contacts' },
  LEAD: { label: 'Piste', icon: <FunnelPlotOutlined />, color: '#faad14', route: '/leads' },
  OPPORTUNITY: { label: 'Opportunité', icon: <TrophyOutlined />, color: '#52c41a', route: '/opportunities' },
  PRODUCT: { label: 'Produit', icon: <ShoppingOutlined />, color: '#13c2c2', route: '/stock/products' },
};

export default function GlobalSearchBar() {
  const [options, setOptions] = useState<any[]>([]);
  const [_searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value || value.trim().length < 2) {
      setOptions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchApi.globalSearch(value.trim(), 10);

        // Group by type
        const grouped: Record<string, SearchItem[]> = {};
        result.items.forEach((item) => {
          if (!grouped[item.type]) grouped[item.type] = [];
          grouped[item.type].push(item);
        });

        const newOptions = Object.entries(grouped).map(([type, items]) => {
          const config = TYPE_CONFIG[type] || { label: type, icon: null, color: '#999', route: '/' };
          return {
            label: (
              <Text strong style={{ fontSize: 12, color: config.color }}>
                {config.icon} {config.label}s
              </Text>
            ),
            options: items.map((item) => ({
              value: `${item.type}:${item.id}`,
              label: (
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {config.icon} {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.subtitle}
                    </Text>
                  )}
                </Space>
              ),
            })),
          };
        });

        if (result.items.length === 0) {
          setOptions([{
            label: <Text type="secondary">Aucun résultat</Text>,
            options: [{
              value: 'no-results',
              label: <Text type="secondary">Aucun résultat pour "{value}"</Text>,
              disabled: true,
            }],
          }]);
        } else {
          setOptions(newOptions);
        }
      } catch (error) {
        console.error('Search error:', error);
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = (value: string) => {
    if (value === 'no-results') return;

    const [type, id] = value.split(':');
    const config = TYPE_CONFIG[type];
    if (config) {
      navigate(`${config.route}/${id}`);
    }
    setOptions([]);
  };

  return (
    <AutoComplete
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      style={{ width: 320 }}
      popupMatchSelectWidth={400}
    >
      <Input
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        placeholder="Rechercher (comptes, contacts, pistes...)"
        allowClear
        style={{ borderRadius: 20 }}
      />
    </AutoComplete>
  );
}
