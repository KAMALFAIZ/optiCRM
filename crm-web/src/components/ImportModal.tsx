import { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Select,
  Alert,
  Steps,
  message,
  Space,
  Tag,
  Result,
} from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  importExportApi,
  type ImportPreview,
  type ImportResult,
} from '@/api/importExport';

const { Dragger } = Upload;

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  entity: string;
  entityLabel: string;
  expectedColumns: { key: string; label: string }[];
}

export default function ImportModal({
  open,
  onClose,
  onSuccess,
  entity,
  entityLabel,
  expectedColumns,
}: ImportModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleReset = () => {
    setCurrentStep(0);
    setFile(null);
    setFileList([]);
    setPreview(null);
    setMapping({});
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
    setPreviewLoading(true);
    try {
      const previewData = await importExportApi.previewImport(entity, file);
      setPreview(previewData);
      // Auto-detect mapping from file headers to expected columns
      const detectedMapping: Record<string, string> = {};
      expectedColumns.forEach((col) => {
        const match = previewData.headers.find(
          (h) =>
            h.toLowerCase().replace(/[_\s]/g, '') ===
              col.key.toLowerCase().replace(/[_\s]/g, '') ||
            h.toLowerCase().includes(col.label.toLowerCase()),
        );
        if (match) {
          detectedMapping[col.key] = match;
        }
      });
      setMapping({ ...previewData.detectedMapping, ...detectedMapping });
      setCurrentStep(1);
    } catch {
      message.error('Erreur lors de la lecture du fichier');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const importResult = await importExportApi.importEntity(
        entity,
        file,
        mapping,
      );
      setResult(importResult);
      setCurrentStep(2);
      if (importResult.importedRows > 0) {
        onSuccess?.();
      }
    } catch {
      message.error("Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const previewColumns =
    preview?.headers.map((header, index) => ({
      title: header,
      dataIndex: `col_${index}`,
      key: `col_${index}`,
      ellipsis: true,
      width: 150,
    })) || [];

  const previewData =
    preview?.sampleRows.map((row, rowIndex) => {
      const rowData: Record<string, string> = { key: String(rowIndex) };
      row.forEach((cell, colIndex) => {
        rowData[`col_${colIndex}`] = cell;
      });
      return rowData;
    }) || [];

  return (
    <Modal
      title={`Importer des ${entityLabel}`}
      open={open}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnHidden
    >
      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Fichier' },
          { title: 'Mapping' },
          { title: 'Résultat' },
        ]}
      />

      {/* Step 0: File Upload */}
      {currentStep === 0 && (
        <div>
          <Dragger
            accept=".csv,.xlsx,.xls"
            maxCount={1}
            fileList={fileList}
            beforeUpload={(f) => {
              setFile(f);
              setFileList([
                {
                  uid: '-1',
                  name: f.name,
                  status: 'done',
                  originFileObj: f,
                } as UploadFile,
              ]);
              return false;
            }}
            onRemove={() => {
              setFile(null);
              setFileList([]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Cliquez ou glissez un fichier ici
            </p>
            <p className="ant-upload-hint">
              Formats supportés : CSV, Excel (.xlsx, .xls)
            </p>
          </Dragger>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleUpload}
              disabled={!file}
              loading={previewLoading}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Column Mapping & Preview */}
      {currentStep === 1 && preview && (
        <div>
          <Alert
            message={`${preview.totalRows} lignes détectées dans le fichier`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontWeight: 500, marginBottom: 8 }}>
              Mapping des colonnes
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {expectedColumns.map((col) => (
                <div
                  key={col.key}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ width: 128, fontSize: 14 }}>
                    {col.label} :
                  </span>
                  <Select
                    size="small"
                    style={{ flex: 1 }}
                    placeholder="Sélectionner une colonne"
                    value={mapping[col.key]}
                    onChange={(value) =>
                      setMapping({ ...mapping, [col.key]: value })
                    }
                    allowClear
                  >
                    {preview.headers.map((header) => (
                      <Select.Option key={header} value={header}>
                        {header}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <h4 style={{ fontWeight: 500, marginBottom: 8 }}>
            Aperçu des données
          </h4>
          <Table
            columns={previewColumns}
            dataSource={previewData}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            bordered
          />

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Button onClick={() => setCurrentStep(0)}>Précédent</Button>
            <Button type="primary" onClick={handleImport} loading={importing}>
              Importer
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Import Result */}
      {currentStep === 2 && result && (
        <div>
          <Result
            status={result.errors.length === 0 ? 'success' : 'warning'}
            icon={
              result.errors.length === 0 ? (
                <CheckCircleOutlined />
              ) : (
                <WarningOutlined />
              )
            }
            title="Import terminé"
            subTitle={
              <Space direction="vertical" size="small">
                <span>
                  Total de lignes : <Tag>{result.totalRows}</Tag>
                </span>
                <span>
                  Importées : <Tag color="green">{result.importedRows}</Tag>
                </span>
                {result.skippedRows > 0 && (
                  <span>
                    Ignorées : <Tag color="orange">{result.skippedRows}</Tag>
                  </span>
                )}
                {result.errors.length > 0 && (
                  <span>
                    Erreurs : <Tag color="red">{result.errors.length}</Tag>
                  </span>
                )}
              </Space>
            }
          />

          {result.errors.length > 0 && (
            <Table
              size="small"
              style={{ marginTop: 8 }}
              dataSource={result.errors.map((e, i) => ({ ...e, key: i }))}
              columns={[
                { title: 'Ligne', dataIndex: 'row', width: 80 },
                { title: 'Champ', dataIndex: 'field', width: 120 },
                { title: 'Message', dataIndex: 'message' },
              ]}
              pagination={{ pageSize: 5 }}
            />
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
