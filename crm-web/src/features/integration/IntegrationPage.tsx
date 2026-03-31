import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, Table, Button, Select, Input, Space,
  message, Spin, Upload, Modal, Result, Tooltip, Alert, AutoComplete, Tabs,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SaveOutlined, UploadOutlined,
  InfoCircleOutlined, PlayCircleOutlined,
  ThunderboltOutlined, ClearOutlined,
  BankOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { integrationApi, FieldMappingDto, MappingItem, EntityType } from '@/api/integration';
import { handleApiError } from '@/api/client';

const { Text } = Typography;

// ─── Field definitions per entity type ────────────────────────────────────────

const ACCOUNT_FIELDS = [
  { value: 'name',              label: 'Nom (name)' },
  { value: 'legalName',         label: 'Raison sociale (legalName)' },
  { value: 'sageCode',          label: 'Code source (sageCode)' },
  { value: 'ice',               label: 'ICE' },
  { value: 'phone',             label: 'Téléphone (phone)' },
  { value: 'website',           label: 'Site web (website)' },
  { value: 'billingStreet',     label: 'Adresse (billingStreet)' },
  { value: 'billingCity',       label: 'Ville (billingCity)' },
  { value: 'billingPostalCode', label: 'Code postal (billingPostalCode)' },
  { value: 'billingState',      label: 'Région / État (billingState)' },
  { value: 'billingCountry',    label: 'Pays (billingCountry)' },
  { value: 'fax',               label: 'Fax' },
  { value: 'identifiantFiscal', label: 'Identifiant fiscal (IF)' },
  { value: 'rc',                label: 'Registre de commerce (RC)' },
  { value: 'accountType',       label: 'Type compte (accountType)' },
  { value: 'famille',           label: 'Famille (famille)' },
  { value: 'typeCompteOdyssee', label: 'Type compte ODYSSÉE' },
  { value: 'prefecture',        label: 'Préfecture (prefecture)' },
  { value: 'statutCompte',      label: 'Statut (statutCompte)' },
  { value: 'potentiel',         label: 'Potentiel (potentiel)' },
  { value: 'secteurActivite',   label: "Secteur d'activité" },
  { value: 'categorieClient',   label: 'Catégorie client' },
  { value: 'representant',      label: 'Représentant' },
  { value: 'latitude',          label: 'Latitude GPS' },
  { value: 'longitude',         label: 'Longitude GPS' },
];

const PRODUCT_FIELDS = [
  { value: 'sageCode',     label: 'Code Sage (AR_Ref)' },
  { value: 'code',         label: 'Code article interne' },
  { value: 'name',         label: 'Désignation (name)' },
  { value: 'description',  label: 'Description' },
  { value: 'unitPrice',    label: 'Prix de vente HT (unitPrice)' },
  { value: 'costPrice',    label: "Prix d'achat (costPrice)" },
  { value: 'unitOfMeasure', label: 'Unité (unitOfMeasure)' },
  { value: 'categoryCode', label: 'Famille / Catégorie (code)' },
  { value: 'isActive',     label: 'Actif (0=actif, 1=sommeil)' },
];

const FIELDS_BY_TYPE: Record<EntityType, typeof ACCOUNT_FIELDS> = {
  ACCOUNTS: ACCOUNT_FIELDS,
  PRODUCTS: PRODUCT_FIELDS,
};

// ─── SQL placeholder by entity type ───────────────────────────────────────────

const SQL_PLACEHOLDER: Record<EntityType, string> = {
  ACCOUNTS: `SELECT CT_Num, CT_Intitule, CT_Email, CT_Telephone\nFROM [dbo].[F_COMPTET]\nWHERE CT_Type = 0`,
  PRODUCTS: `SELECT AR_Ref, AR_Design, AR_PrixVen, AR_PrixAch, AR_Unite, FA_CodeFamille, AR_Sommeil\nFROM [dbo].[F_ARTICLE]\nWHERE AR_Sommeil = 0`,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RowItem extends MappingItem {
  key: string;
}

type ImportResult = { total: number; created: number; updated: number; errors: number; message: string };

function toRows(dtos: FieldMappingDto[]): RowItem[] {
  return dtos.map(d => ({
    key: d.id,
    champSource: d.champSource,
    champOpticrm: d.champOpticrm,
    actif: d.actif,
  }));
}

/** Parse column names from the SELECT clause of a SQL query. */
function parseSelectColumns(sql: string): string[] {
  const match = sql.match(/SELECT\s+([\s\S]+?)\s+FROM[\s\W]/i);
  if (!match) return [];
  const selectClause = match[1];

  const parts: string[] = [];
  let depth = 0, inStr = false, current = '';
  for (const ch of selectClause) {
    if (ch === "'" && !inStr) { inStr = true; current += ch; continue; }
    if (ch === "'" && inStr)  { inStr = false; current += ch; continue; }
    if (!inStr) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue; }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());

  const identRe = /[\w\u00C0-\u024F]/;
  const stripNonIdent = (s: string) => s.replace(/[^\w\u00C0-\u024F]/g, '');

  return parts.map(part => {
    part = part.trim();
    const asBracket = part.match(/\bAS\s+\[([^\]]+)\]\s*$/i);
    if (asBracket) return asBracket[1];
    const asWord = part.match(/\bAS\s+([\w\u00C0-\u024F]+)\s*$/i);
    if (asWord) return asWord[1];
    const bracketAlias = part.match(/\[([^\]]+)\]\s*$/);
    if (bracketAlias) return bracketAlias[1];
    const implicitWord = part.match(/\s+([\w\u00C0-\u024F]+)\s*$/);
    if (implicitWord) {
      const alias = implicitWord[1];
      const before = part.slice(0, part.lastIndexOf(alias)).trim();
      if (before.length > 0) return alias;
    }
    const simpleBracket = part.match(/^\[([^\]]+)\]$/);
    if (simpleBracket) return simpleBracket[1];
    const dotParts = part.split('.');
    const last = dotParts[dotParts.length - 1];
    return stripNonIdent(last.replace(/^\[|\]$/g, '')).trim();
  }).filter(s => !!s && identRe.test(s));
}

// ─── Entity tab panel ─────────────────────────────────────────────────────────

function EntityMappingPanel({ entityType }: { entityType: EntityType }) {
  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingProducts, setDeletingProducts] = useState(false);
  const [sqlQuery, setSqlQuery] = useState(
    () => localStorage.getItem(`opticrm_integration_sql_query_${entityType}`) ?? ''
  );
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  const opticrmFields = FIELDS_BY_TYPE[entityType];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await integrationApi.getMappings(entityType);
      setRows(toRows(data));
    } catch {
      message.error('Erreur lors du chargement des mappings');
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const saved = localStorage.getItem(`opticrm_integration_sql_query_${entityType}`) ?? '';
    if (saved.trim()) {
      const cols = parseSelectColumns(saved);
      if (cols.length) setDetectedColumns(cols);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  const addRow = () => {
    setRows(prev => [...prev, { key: `new-${Date.now()}`, champSource: '', champOpticrm: '', actif: true }]);
  };

  const updateRow = (key: string, field: keyof RowItem, value: string | boolean) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  };

  const deleteRow = (key: string) => {
    setRows(prev => prev.filter(r => r.key !== key));
  };

  const handleSave = async () => {
    const valid = rows.filter(r => r.champSource.trim() && r.champOpticrm.trim());
    setSaving(true);
    try {
      const saved = await integrationApi.saveMappings({ mappings: valid }, entityType);
      setRows(toRows(saved));
      message.success(`${saved.length} mapping(s) sauvegardé(s)`);
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDetectColumns = () => {
    const cols = parseSelectColumns(sqlQuery);
    if (!cols.length) {
      message.warning("Impossible de détecter les colonnes. Vérifiez que la requête contient SELECT … FROM.");
      return;
    }
    setDetectedColumns(cols);
    setRows(prev => {
      const existing = new Set(prev.map(r => r.champSource.toLowerCase()));
      const newRows = cols
        .filter(c => !existing.has(c.toLowerCase()))
        .map(c => ({ key: `auto-${Date.now()}-${c}`, champSource: c, champOpticrm: '', actif: true }));
      if (!newRows.length) {
        message.info('Toutes les colonnes sont déjà présentes dans le mapping.');
        return prev;
      }
      message.success(`${newRows.length} colonne(s) ajoutée(s) au mapping.`);
      return [...prev, ...newRows];
    });
  };

  const handleDeleteProducts = () => {
    Modal.confirm({
      title: 'Supprimer tous les produits',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: 'Cette action supprimera définitivement TOUS les produits du catalogue. Continuer ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        setDeletingProducts(true);
        try {
          const count = await integrationApi.deleteAllProducts();
          message.success(`${count} produit(s) supprimé(s).`);
        } catch (e: any) {
          message.error(handleApiError(e));
        } finally {
          setDeletingProducts(false);
        }
      },
    });
  };

  const handleDeleteAll = () => {
    let confirmText = '';
    Modal.confirm({
      title: 'Supprimer TOUS les comptes',
      icon: <ClearOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Alert
            type="error"
            message="Action irréversible"
            description="Cela supprimera définitivement TOUS les comptes et toutes leurs données liées (contacts, opportunités, devis, visites…)."
            style={{ marginBottom: 12 }}
          />
          <p>Tapez <b>CONFIRMER</b> pour continuer :</p>
          <Input onChange={e => { confirmText = e.target.value; }} placeholder="CONFIRMER" />
        </div>
      ),
      okText: 'Supprimer tout',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        if (confirmText !== 'CONFIRMER') {
          message.error('Tapez exactement "CONFIRMER" pour valider.');
          return Promise.reject();
        }
        setDeletingAll(true);
        try {
          await integrationApi.deleteAllAccounts();
          message.success('Tous les comptes ont été supprimés.');
          load();
        } catch {
          message.error('Erreur lors de la suppression.');
        } finally {
          setDeletingAll(false);
        }
      },
    });
  };

  const handleDeleteImported = () => {
    Modal.confirm({
      title: 'Supprimer les données importées',
      content: 'Cette action supprimera définitivement tous les comptes dont le nom commence par "Import-". Continuer ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        setDeleting(true);
        try {
          const count = await integrationApi.deleteImportedAccounts();
          message.success(`${count} compte(s) importé(s) supprimé(s).`);
          load();
        } catch {
          message.error('Erreur lors de la suppression.');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      message.warning('Veuillez saisir une requête SQL.');
      return;
    }
    setExecuting(true);
    try {
      const result = await integrationApi.executeQuery(sqlQuery.trim(), entityType);
      setImportResult(result); setLastImport(result);
    } catch (e: any) {
      message.error(handleApiError(e));
    } finally {
      setExecuting(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: async (file) => {
      setImporting(true);
      try {
        const result = await integrationApi.importCsv(file, entityType);
        setImportResult(result); setLastImport(result);
      } catch {
        message.error("Erreur lors de l'import");
      } finally {
        setImporting(false);
      }
      return false;
    },
  };

  const columns = [
    {
      title: (
        <Space>
          Champ source
          <Tooltip title="Nom exact de la colonne dans votre fichier CSV / résultat de requête">
            <InfoCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'champSource',
      render: (_: string, row: RowItem) => (
        <AutoComplete
          value={row.champSource}
          placeholder="Ex : CT_Intitule…"
          size="small"
          style={{ width: '100%' }}
          options={detectedColumns.map(c => ({ value: c }))}
          filterOption={false}
          listHeight={160}
          popupMatchSelectWidth={180}
          dropdownStyle={{ fontSize: 12 }}
          onChange={val => updateRow(row.key, 'champSource', val)}
        />
      ),
    },
    {
      title: (
        <Space>
          Champ OptiCRM
          <Tooltip title={`Champ de la table ${entityType === 'PRODUCTS' ? 'Produits' : 'Comptes'} qui recevra la valeur`}>
            <InfoCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'champOpticrm',
      render: (_: string, row: RowItem) => (
        <Select
          value={row.champOpticrm || undefined}
          placeholder="Sélectionner…"
          showSearch
          size="small"
          style={{ width: '100%' }}
          options={opticrmFields}
          filterOption={(input, opt) =>
            (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={val => updateRow(row.key, 'champOpticrm', val)}
        />
      ),
    },
    {
      title: 'Actif',
      dataIndex: 'actif',
      width: 90,
      render: (_: boolean, row: RowItem) => (
        <Select
          value={row.actif}
          style={{ width: 90 }}
          options={[
            { value: true, label: 'Oui' },
            { value: false, label: 'Non' },
          ]}
          onChange={val => updateRow(row.key, 'actif', val)}
        />
      ),
    },
    {
      title: '',
      width: 48,
      render: (_: unknown, row: RowItem) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteRow(row.key)} />
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Mapping card */}
      <Card style={{ marginBottom: 16 }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <Button icon={<PlusOutlined />} onClick={addRow}>Ajouter une ligne</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Sauvegarder le mapping
            </Button>
          </Space>
          <Space wrap>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={importing}>Importer CSV</Button>
            </Upload>
            {entityType === 'PRODUCTS' && (
              <Button danger icon={<DeleteOutlined />} loading={deletingProducts} onClick={handleDeleteProducts}>
                Supprimer les produits
              </Button>
            )}
            {entityType === 'ACCOUNTS' && (
              <>
                <Button danger icon={<ClearOutlined />} loading={deleting} onClick={handleDeleteImported}>
                  Supprimer les importés
                </Button>
                <Button danger type="primary" icon={<DeleteOutlined />} loading={deletingAll} onClick={handleDeleteAll}>
                  Vider tous les comptes
                </Button>
              </>
            )}
          </Space>
        </div>

        <Spin spinning={loading || importing}>
          <Table
            dataSource={rows}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="key"
            locale={{ emptyText: 'Aucun mapping configuré.' }}
          />
        </Spin>
      </Card>

      {/* Last import status */}
      {lastImport && (
        <Alert
          style={{ marginBottom: 16 }}
          type={lastImport.errors > 0 ? 'warning' : 'success'}
          showIcon
          closable
          onClose={() => setLastImport(null)}
          message={
            <Space size={20}>
              <span><strong>Dernier import :</strong> {lastImport.message}</span>
              <span>Total <strong>{lastImport.total}</strong></span>
              <span style={{ color: '#52c41a' }}>✔ Créés <strong>{lastImport.created}</strong></span>
              <span style={{ color: '#1890ff' }}>↻ Mis à jour <strong>{lastImport.updated}</strong></span>
              {lastImport.errors > 0 && (
                <span style={{ color: '#ff4d4f' }}>✖ Erreurs <strong>{lastImport.errors}</strong></span>
              )}
            </Space>
          }
        />
      )}

      {/* SQL query card */}
      <Card size="small">
        <Input.TextArea
          value={sqlQuery}
          onChange={e => {
            setSqlQuery(e.target.value);
            localStorage.setItem(`opticrm_integration_sql_query_${entityType}`, e.target.value);
          }}
          rows={5}
          placeholder={SQL_PLACEHOLDER[entityType]}
          style={{ fontFamily: 'monospace', fontSize: 13, marginBottom: 8 }}
        />
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={handleDetectColumns}>
            Détecter les colonnes
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />} loading={executing} onClick={handleExecuteQuery}>
            Exécuter et importer
          </Button>
        </Space>
      </Card>

      {/* Result modal */}
      <Modal
        open={!!importResult}
        onOk={() => setImportResult(null)}
        onCancel={() => setImportResult(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
        title="Résultat de l'import"
      >
        {importResult && (
          <Result
            status={importResult.errors > 0 ? 'warning' : 'success'}
            title={importResult.message}
            subTitle={
              <Space direction="vertical" size={4}>
                <Text>Total lignes : <strong>{importResult.total}</strong></Text>
                <Text style={{ color: '#52c41a' }}>Créés : <strong>{importResult.created}</strong></Text>
                <Text style={{ color: '#1890ff' }}>Mis à jour : <strong>{importResult.updated}</strong></Text>
                {importResult.errors > 0 && (
                  <Text type="danger">Erreurs : <strong>{importResult.errors}</strong></Text>
                )}
              </Space>
            }
          />
        )}
      </Modal>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('ACCOUNTS');

  const tabItems = [
    {
      key: 'ACCOUNTS',
      label: <span><BankOutlined style={{ marginRight: 6 }} />Comptes clients</span>,
      children: <EntityMappingPanel entityType="ACCOUNTS" />,
    },
    {
      key: 'PRODUCTS',
      label: <span><AppstoreOutlined style={{ marginRight: 6 }} />Produits</span>,
      children: <EntityMappingPanel entityType="PRODUCTS" />,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs
        activeKey={activeTab}
        onChange={k => setActiveTab(k as EntityType)}
        items={tabItems}
        type="card"
      />
    </div>
  );
}
