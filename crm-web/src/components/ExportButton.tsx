import { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { importExportApi } from '@/api/importExport';

interface ExportButtonProps {
  entity: string;
  filters?: Record<string, string>;
  entityLabel?: string;
  size?: 'small' | 'middle' | 'large';
}

export default function ExportButton({
  entity,
  filters,
  entityLabel,
  size,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'excel' | 'csv') => {
    setLoading(true);
    try {
      const blob = await importExportApi.exportEntity(entity, format, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : 'csv';
      link.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success(`Export ${entityLabel || entity} réussi`);
    } catch {
      message.error("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export Excel (.xlsx)',
      onClick: () => handleExport('excel'),
    },
    {
      key: 'csv',
      icon: <FileTextOutlined />,
      label: 'Export CSV (.csv)',
      onClick: () => handleExport('csv'),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button icon={<DownloadOutlined />} loading={loading} size={size}>
        Exporter
      </Button>
    </Dropdown>
  );
}
