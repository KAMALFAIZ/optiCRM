import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  App, Form, Divider, Steps, Tooltip,
} from 'antd';
import {
  BankOutlined, CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, DatabaseOutlined, CodeOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { sageQueryApi } from '../../../api/sageQuery';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

// Colonnes Sage 100C attendues (vue [Clients] — multi-entités GROUPE_ALBOUGHAZE)
// Mapping complet :
//   CT_Num                → sageCode
//   CT_Intitule           → name
//   CT_Telephone          → phone
//   CT_Telecopie          → fax
//   CT_Site               → website
//   CT_Adresse            → billingStreet
//   CT_CodePostal         → billingPostalCode
//   CT_Ville              → billingCity
//   CT_Pays               → billingCountry
//   CT_IF                 → identifiantFiscal
//   CT_RC                 → rc
//   CT_Siret / CT_Siren   → siret / siren
//   ICE                   → ice
//   CT_Encours            → creditLimit
//   CT_Categorie          → categorieClient       ([Catégorie_])
//   CT_CategorieTarifaire → categorieTarifaire    ([Catégorie tarifaire_])
//   CT_Secteur            → secteurActivite       ([Secteur_])
//   CT_TypeCompte         → typeCompteOdyssee     ([Type de compte ODYSSÉE_])
//   CT_Prefecture         → prefecture            ([Préfecture_])
//   CT_Statut             → statutCompte          ([Statut_])
//   CT_Representant       → representant          ([Représentant_])
const SAGE_HEADERS = [
  'CT_Num', 'CT_Intitule', 'CT_Email', 'CT_Telephone', 'CT_Telecopie',
  'CT_Adresse', 'CT_CodePostal', 'CT_Ville', 'CT_Pays',
  'CT_IF', 'CT_RC', 'CT_Siret', 'CT_Siren', 'ICE',
  'CT_Encours', 'CT_Site',
  'CT_Categorie', 'CT_CategorieTarifaire', 'CT_Secteur',
  'CT_TypeCompte', 'CT_Prefecture', 'CT_Statut',
  'CT_Representant',
];

// Requête Sage 100C — mapping complet depuis la vue [Clients] (multi-entités)
// Tous les champs métier sont disponibles directement dans la vue sans JOIN supplémentaire
const DEFAULT_SQL = `SELECT
  [Code client]                                       CT_Num,
  [Intitulé]                                          CT_Intitule,
  ISNULL([Email], '')                                 CT_Email,
  ISNULL([Téléphone], '')                             CT_Telephone,
  ISNULL([Télécopie], '')                             CT_Telecopie,
  [Adresse] + ISNULL(' ' + [Complément], '')          CT_Adresse,
  ISNULL([Code postal], '')                           CT_CodePostal,
  ISNULL([Ville], '')                                 CT_Ville,
  ISNULL([Pays], '')                                  CT_Pays,
  ISNULL([Identifiant fiscal_], '')                   CT_IF,
  ISNULL([RC_], '')                                   CT_RC,
  ISNULL([Siret], '')                                 CT_Siret,
  ''                                                  CT_Siren,
  ISNULL([ICE_], '')                                  ICE,
  ISNULL([Encours de l'autorisation], 0)              CT_Encours,
  ISNULL([Site], '')                                  CT_Site,
  ISNULL([Catégorie_], '')                            CT_Categorie,
  ISNULL([Catégorie tarifaire_], '')                  CT_CategorieTarifaire,
  ISNULL([Secteur_], '')                              CT_Secteur,
  ISNULL([Type de compte ODYSSÉE_], '')               CT_TypeCompte,
  ISNULL([Préfecture_], '')                           CT_Prefecture,
  ISNULL([Statut_], '')                               CT_Statut,
  ISNULL([Représentant_], '')                         CT_Representant
FROM [dbo].[Clients]
WHERE ISNULL(Catégorie_, '') NOT IN ('', 'NON AFFECTE', 'COMPTANT', 'SHOWROOM', '=', 'PARTICULIER', 'PERSONNEL')
  AND db NOT IN ('SBTATOUINE', 'ALBOUGHAZE', 'GIE')`;

const REQUIRED_HEADERS = ['CT_Num'];
const OPTIONAL_HEADERS = SAGE_HEADERS.filter(h => !REQUIRED_HEADERS.includes(h));

const FORMAT_HELP = (
  <div className="text-sm">
    <Text type="secondary">Collez un export Sage 100C (onglet Tiers / F_COMPTET) directement depuis Excel.</Text>
    <div className="mt-2">
      <Text strong className="text-xs block mb-1">Colonne obligatoire :</Text>
      <div className="flex flex-wrap gap-1 mb-2">
        {REQUIRED_HEADERS.map(h => <Tag key={h} color="red" className="font-mono text-xs">{h}</Tag>)}
      </div>
      <Text strong className="text-xs block mb-1">Colonnes optionnelles (toutes enrichissent le compte CRM) :</Text>
      <div className="flex flex-wrap gap-1">
        {OPTIONAL_HEADERS.map(h => <Tag key={h} color="blue" className="font-mono text-xs">{h}</Tag>)}
      </div>
    </div>
    <div className="mt-2">
      <Text type="secondary" className="text-xs">
        Les colonnes peuvent être dans n'importe quel ordre. La première ligne peut être un en-tête (sera ignorée).
        Séparateur : tabulation (Excel) ou point-virgule. Seuls les champs présents dans l'export sont mis à jour.
      </Text>
    </div>
  </div>
);

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Nom société',
    dataIndex: 'rawData',
    ellipsis: true,
    width: 180,
    render: (raw: any, record: SageSyncItemDto) => {
      const name = (record.mappedData as any)?.name
        ?? raw?.ct_intitule ?? raw?.CT_Intitule ?? raw?.name ?? null;
      return name ? <Text strong>{name}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Catégorie / Secteur',
    dataIndex: 'rawData',
    ellipsis: true,
    width: 160,
    render: (raw: any) => {
      const cat     = raw?.ct_categorie          ?? raw?.CT_Categorie          ?? '';
      const tarif   = raw?.ct_categorietarifaire ?? raw?.CT_CategorieTarifaire ?? '';
      const secteur = raw?.ct_secteur            ?? raw?.CT_Secteur            ?? '';
      const items = [cat, tarif, secteur].filter(Boolean);
      if (!items.length) return <Text type="secondary">—</Text>;
      return (
        <div>
          {cat     && <Tag color="blue"   className="text-xs mb-0">{cat}</Tag>}
          {tarif   && <Tag color="cyan"   className="text-xs mb-0">{tarif}</Tag>}
          {secteur && <Tag color="geekblue" className="text-xs mb-0">{secteur}</Tag>}
        </div>
      );
    },
  },
  {
    title: 'Type / Statut / Préfecture',
    dataIndex: 'rawData',
    ellipsis: true,
    width: 170,
    render: (raw: any) => {
      const type   = raw?.ct_typecompte  ?? raw?.CT_TypeCompte  ?? '';
      const statut = raw?.ct_statut      ?? raw?.CT_Statut      ?? '';
      const pref   = raw?.ct_prefecture  ?? raw?.CT_Prefecture  ?? '';
      const rep    = raw?.ct_representant ?? raw?.CT_Representant ?? '';
      if (!type && !statut && !pref && !rep) return <Text type="secondary">—</Text>;
      return (
        <div>
          {type   && <Text className="block text-xs" strong>{type}</Text>}
          {statut && <Tag color={statut === 'ACTIF' ? 'green' : statut === 'INACTIF' ? 'red' : 'orange'} className="text-xs">{statut}</Tag>}
          {pref   && <Text type="secondary" className="block text-xs">{pref}</Text>}
          {rep    && <Text type="secondary" className="block text-xs">Rep: {rep}</Text>}
        </div>
      );
    },
  },
  {
    title: 'Ville / ICE',
    dataIndex: 'rawData',
    ellipsis: true,
    width: 140,
    render: (raw: any) => {
      const city = raw?.ct_ville ?? raw?.CT_Ville ?? '';
      const ice  = raw?.ice ?? raw?.ICE ?? '';
      return (
        <div>
          {city && <Text className="block">{city}</Text>}
          {ice  && <Text type="secondary" className="text-xs font-mono">{ice}</Text>}
          {!city && !ice && <Text type="secondary">—</Text>}
        </div>
      );
    },
  },
  {
    title: 'IF / RC',
    dataIndex: 'rawData',
    ellipsis: true,
    width: 130,
    render: (raw: any) => {
      const IF = raw?.ct_if ?? raw?.CT_IF ?? '';
      const rc = raw?.ct_rc ?? raw?.CT_RC ?? '';
      if (!IF && !rc) return <Text type="secondary">—</Text>;
      return (
        <div>
          {IF && <Text className="block text-xs" type="secondary">IF: {IF}</Text>}
          {rc && <Text className="block text-xs" type="secondary">RC: {rc}</Text>}
        </div>
      );
    },
  },
  {
    title: 'Encours',
    dataIndex: 'rawData',
    width: 110,
    align: 'right' as const,
    render: (raw: any) => {
      const enc = raw?.ct_encours ?? raw?.CT_Encours;
      if (enc === undefined || enc === null || enc === '' || enc === 0 || enc === '0') {
        return <Text type="secondary">—</Text>;
      }
      const num = parseFloat(String(enc).replace(',', '.'));
      return isNaN(num) ? <Text type="secondary">—</Text>
        : <Text>{num.toLocaleString('fr-MA')} MAD</Text>;
    },
  },
];

export default function AccountsSyncTab() {
  const { message } = App.useApp();
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [sqlQuery, setSqlQuery] = useState(() => localStorage.getItem('sage.query.accounts') || DEFAULT_SQL);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [request, setRequest] = useState<SageSyncRequestDto | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const handlePreview = async () => {
    if (!pastedData.trim()) {
      message.warning('Collez des données Sage avant de prévisualiser.');
      return;
    }
    const rows = parsePastedData(pastedData, SAGE_HEADERS);
    if (!rows.length) {
      message.error('Aucune ligne valide détectée. Vérifiez le format collé.');
      return;
    }
    setLoading(true);
    try {
      const req = await sageIntegrationApi.createRequest({
        entityType: 'ACCOUNTS',
        label: label || undefined,
        rows,
      });
      setRequest(req);
      setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} ligne(s) analysée(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de la prévisualisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!request) return;
    setApplying(true);
    try {
      const updated = await sageIntegrationApi.applyRequest(request.id);
      setRequest(updated);
      setStep(2);
      message.success(`Synchronisation appliquée : ${updated.successItems} réussie(s), ${updated.errorItems} erreur(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de l\'application.');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveQuery = () => {
    localStorage.setItem('sage.query.accounts', sqlQuery);
    message.success('Requête comptes enregistrée');
  };

  const handleReset = () => {
    setPastedData('');
    setLabel('');
    setRequest(null);
    setStep(0);
  };

  const handleImportFromSage = async () => {
    if (!sqlQuery.trim()) {
      message.warning('La requête SQL est vide.');
      return;
    }
    setImporting(true);
    try {
      const rows = await sageQueryApi.executeQuery(sqlQuery, 'ACCOUNTS');
      if (!rows.length) {
        message.warning('Aucun compte client trouvé dans Sage.');
        return;
      }
      const req = await sageIntegrationApi.createRequest({
        entityType: 'ACCOUNTS',
        label: label || `Import Sage direct — ${new Date().toLocaleDateString('fr-FR')}`,
        sourceFormat: 'SQL',
        rows,
      });
      setRequest(req);
      setStep(1);
      message.success(`${rows.length} compte(s) importés depuis Sage — ${req.totalItems} ligne(s) analysée(s).`);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Erreur lors de l\'import depuis Sage.';
      message.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      {/* ── Steps ── */}
      <Steps
        size="small"
        current={step}
        className="mb-6"
        items={[
          { title: 'Saisie / Requête', icon: <CloudUploadOutlined /> },
          { title: 'Prévisualiser', icon: <InfoCircleOutlined /> },
          { title: 'Appliquer', icon: <CheckCircleOutlined /> },
        ]}
      />

      {/* ── Étape 1 : Saisie ── */}
      {step === 0 && (
        <Card
          size="small"
          title={
            <Space>
              <BankOutlined style={{ color: '#4F46E5' }} />
              <span>Import Comptes clients Sage 100</span>
            </Space>
          }
        >
          <Form layout="vertical">
            <Form.Item label="Label de la requête">
              <Input
                placeholder="Ex : Import clients Mars 2026"
                value={label}
                onChange={e => setLabel(e.target.value)}
                style={{ maxWidth: 400 }}
              />
            </Form.Item>

            {/* ── Mode SQL direct ── */}
            <Collapse
              className="mb-4"
              style={{ background: '#f9f7ff', borderColor: '#e9d5ff' }}
              items={[{
                key: 'sql',
                label: (
                  <Space>
                    <DatabaseOutlined style={{ color: '#7c3aed' }} />
                    <Text strong style={{ color: '#7c3aed' }}>Import direct depuis Sage SQL Server</Text>
                    <Tag color="purple">Recommandé</Tag>
                  </Space>
                ),
                children: (
                  <div>
                    <Alert
                      type="info"
                      showIcon
                      icon={<CodeOutlined />}
                      style={{ marginBottom: 12 }}
                      message="Requête SQL personnalisable"
                      description="Colonnes mappées : CT_Num (obligatoire), CT_Intitule, CT_Telephone, CT_Telecopie, CT_Adresse, CT_CodePostal, CT_Ville, CT_Pays, CT_IF, CT_RC, ICE, CT_Encours, CT_Site, CT_Categorie (catégorie client), CT_CategorieTarifaire, CT_Secteur (secteur d'activité), CT_TypeCompte (ODYSSÉE), CT_Prefecture, CT_Statut, CT_Representant (représentant commercial)."
                    />
                    <TextArea
                      rows={14}
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }}
                    />
                    <Space>
                      <Tooltip title="Exécute la requête SQL sur le serveur Sage configuré et importe les résultats">
                        <Button
                          type="primary"
                          icon={<DatabaseOutlined />}
                          loading={importing}
                          onClick={handleImportFromSage}
                          style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                        >
                          Exécuter et importer depuis Sage
                        </Button>
                      </Tooltip>
                      <Tooltip title="Enregistrer la requête SQL pour les prochaines sessions">
                        <Button icon={<SaveOutlined />} onClick={handleSaveQuery}>
                          Enregistrer la requête
                        </Button>
                      </Tooltip>
                    </Space>
                  </div>
                ),
              }]}
            />

            {/* ── Mode copier-coller ── */}
            <Collapse
              ghost
              className="mb-4"
              items={[{
                key: 'help',
                label: <Text type="secondary"><InfoCircleOutlined /> Ou coller manuellement depuis Excel</Text>,
                children: FORMAT_HELP,
              }]}
            />

            <Form.Item label="Données Sage (copier-coller depuis Excel)">
              <TextArea
                rows={8}
                placeholder={`CT_Num\tCT_Intitule\tCT_Telephone\tCT_Ville\tICE\tCT_Categorie\tCT_Secteur\tCT_Statut\nCLI001\tSociété ABC\t0522-123456\tCasablanca\t002012345678901\tGROSSISTE\tBTP\tACTIF`}
                value={pastedData}
                onChange={e => setPastedData(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              {pastedData && (
                <Text type="secondary" className="text-xs mt-1 block">
                  {pastedData.trim().split(/\r?\n/).filter(Boolean).length} ligne(s) détectée(s)
                </Text>
              )}
            </Form.Item>

            <Button
              type="primary"
              icon={<InfoCircleOutlined />}
              loading={loading}
              onClick={handlePreview}
              disabled={!pastedData.trim()}
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
            >
              Prévisualiser le matching
            </Button>
          </Form>
        </Card>
      )}

      {/* ── Étape 1→2 : Résultat preview ── */}
      {step >= 1 && request && (
        <Card
          size="small"
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#4F46E5' }} />
              <span>Prévisualisation — {request.totalItems} ligne(s)</span>
              {request.label && <Tag>{request.label}</Tag>}
            </Space>
          }
          extra={
            <Space>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
                Nouvelle import
              </Button>
              {request.status === 'PENDING' && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={applying}
                  onClick={handleApply}
                  style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                >
                  Appliquer la synchronisation
                </Button>
              )}
            </Space>
          }
        >
          <PreviewSummary items={request.items ?? []} />

          {request.errorItems > 0 && (
            <Alert
              type="warning"
              showIcon
              className="mb-3"
              message={`${request.errorItems} ligne(s) en erreur — vérifiez les données source avant d'appliquer.`}
            />
          )}

          {step === 2 && request.status === 'DONE' && (
            <Alert
              type="success"
              showIcon
              className="mb-3"
              message={`Synchronisation terminée — ${request.successItems} compte(s) mis à jour, ${request.skipItems} identique(s), ${request.errorItems} erreur(s).`}
            />
          )}

          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />

      {/* ── Historique ── */}
      <HistoryPanel entityType="ACCOUNTS" />
    </div>
  );
}
