import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Row, Col,
  InputNumber, DatePicker, message, Spin, Switch, Tabs, Table, Button,
} from 'antd';
import { PlusOutlined, DeleteOutlined, AimOutlined, ScanOutlined } from '@ant-design/icons';
import CarteVisiteScanModal from '@/components/CarteVisiteScanModal';
import dayjs from 'dayjs';
import { chantiersApi, ChantierDto, CreateChantierRequest } from '@/api/chantiers';
import usersApi from '@/api/users';
import { accountsApi } from '@/api/accounts';
import { referenceDataApi } from '@/api/referenceData';
import { GpsLocationPicker } from '@/components/maps';
import type { UserListItem } from '@/types/user';
import type { AccountListItem } from '@/types/account';

interface ActeurRow {
  key: string;
  roleActeur: string;
  nom: string;
  telephone?: string;
}

const ACTEUR_ROLE_OPTIONS = [
  { value: 'PROMOTEUR',      label: 'Promoteur' },
  { value: 'INSTALLATEUR',   label: 'Installateur' },
  { value: 'ARCHITECTE',     label: 'Architecte' },
  { value: 'BET',            label: "Bureau d'étude" },
  { value: 'MAITRE_OUVRAGE', label: "Maître d'ouvrage" },
  { value: 'MAITRE_OEUVRE',  label: "Maître d'œuvre" },
  { value: 'ENTREPRISE_GC',  label: 'Entreprise GC' },
  { value: 'AUTRE',          label: 'Autre' },
];

interface Props {
  open: boolean;
  chantierId: string | null;
  onClose: (refresh?: boolean) => void;
  defaultAccountId?: string;
  initialValues?: Partial<CreateChantierRequest>;
}

const STADE_OPTIONS = [
  { value: 'ETUDE_CONCEPTION',  label: 'Étude / Conception' },
  { value: 'AUTORISATION',      label: 'Autorisation' },
  { value: 'GROS_OEUVRE',       label: 'Gros œuvre' },
  { value: 'SECOND_OEUVRE',     label: 'Second œuvre' },
  { value: 'PHASE_EQUIPEMENT',  label: 'Phase équipement' },
  { value: 'LIVRAISON',         label: 'Livraison' },
  { value: 'CLOTURE',           label: 'Clôturé' },
];

const NIVEAU_OPTIONS = [
  { value: 'FERME',                label: 'Fermé' },
  { value: 'PARTIELLEMENT_OUVERT', label: 'Partiellement ouvert' },
  { value: 'LIBRE',                label: 'Libre / influençable' },
];

const DECISEUR_OPTIONS = [
  { value: 'PROMOTEUR',       label: 'Promoteur' },
  { value: 'ARCHITECTE',      label: 'Architecte' },
  { value: 'BET',             label: 'Bureau d\'études (BET)' },
  { value: 'MAITRE_OUVRAGE',  label: "Maître d'ouvrage" },
  { value: 'MAITRE_OEUVRE',   label: "Maître d'œuvre" },
  { value: 'INSTALLATEUR',    label: 'Installateur' },
  { value: 'AUTRE',           label: 'Autre' },
];

const STATUT_OPTIONS = [
  { value: 'ACTIF',       label: 'Actif' },
  { value: 'PRIORITAIRE', label: 'Prioritaire' },
  { value: 'GAGNE',       label: 'Gagné' },
  { value: 'PERDU',       label: 'Perdu' },
];

const ChantierFormModal: React.FC<Props> = ({ open, chantierId, onClose, defaultAccountId, initialValues }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [typeProjetOptions, setTypeProjetOptions] = useState<{ value: string; label: string }[]>([]);
  const [acteurs, setActeurs] = useState<ActeurRow[]>([]);
  const [scanCarteOpen, setScanCarteOpen] = useState(false);

  const autoGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        form.setFieldsValue({ latitude: lat, longitude: lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
            { headers: { 'User-Agent': 'OptiCRM/1.0' } }
          );
          const data = await res.json();
          const addr = data.display_name ?? '';
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county || '';
          const region =
            data.address?.state || data.address?.region || '';
          form.setFieldsValue({
            adresse: addr,
            ville: city,
            prefecture: region,
          });
        } catch {
          // adresse non récupérée, coordonnées conservées
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [form]);

  const addActeur = () => {
    setActeurs(prev => [...prev, { key: Date.now().toString(), roleActeur: 'PROMOTEUR', nom: '', telephone: '' }]);
  };

  const removeActeur = (key: string) => {
    setActeurs(prev => prev.filter(a => a.key !== key));
  };

  const updateActeur = (key: string, field: keyof ActeurRow, value: string) => {
    setActeurs(prev => prev.map(a => a.key === key ? { ...a, [field]: value } : a));
  };

  const isEditing = !!chantierId;

  const loadUsers = useCallback(async () => {
    try {
      const res = await usersApi.getAll({ size: 100, isActive: true });
      setUsers(res.content);
    } catch {
      // silent
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await accountsApi.getAll({ size: 200 });
      setAccounts(res.content);
    } catch {
      // silent
    }
  }, []);

  const loadTypeProjet = useCallback(async () => {
    try {
      const items = await referenceDataApi.getActiveByCategory('TYPE_PROJET');
      setTypeProjetOptions(items.map((i) => ({ value: i.value, label: i.label })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUsers();
      loadAccounts();
      loadTypeProjet();
    }
  }, [open, loadUsers, loadAccounts, loadTypeProjet]);

  useEffect(() => {
    if (open && chantierId) {
      setLoading(true);
      chantiersApi.getById(chantierId)
        .then((chantier: ChantierDto) => {
          form.setFieldsValue({
            nom: chantier.nom,
            ville: chantier.ville,
            prefecture: chantier.prefecture,
            latitude: chantier.latitude,
            longitude: chantier.longitude,
            adresse: chantier.adresse,
            typeProjet: chantier.typeProjet,
            sousTypeProjet: chantier.sousTypeProjet,
            nombreUnites: chantier.nombreUnites,
            stadeChantier: chantier.stadeChantier,
            niveauOpportunite: chantier.niveauOpportunite,
            concurrentFerme: chantier.concurrentFerme,
            deciseur: chantier.deciseur,
            statutChantier: chantier.statutChantier,
            actionSuivante: chantier.actionSuivante,
            dateProchaineAction: chantier.dateProchaineAction ? dayjs(chantier.dateProchaineAction) : null,
            assignedToId: chantier.assignedTo?.id,
            accountId: chantier.account?.id,
            temoin: chantier.temoin ?? false,
            installateur: chantier.installateur,
            promoteur: chantier.promoteur,
          });
          setActeurs((chantier.acteurs || []).map(a => ({
            key: a.id,
            roleActeur: a.roleActeur,
            nom: a.nom,
            telephone: a.telephone ?? '',
          })));
        })
        .catch(() => message.error('Erreur lors du chargement du chantier'))
        .finally(() => setLoading(false));
    } else if (open && !chantierId) {
      form.resetFields();
      setActeurs([]);
      if (defaultAccountId) {
        form.setFieldValue('accountId', defaultAccountId);
      }
      // Géolocalisation automatique à la création
      autoGeolocate();
    }
  }, [open, chantierId, form, defaultAccountId, autoGeolocate]);

  useEffect(() => {
    if (!open) return;
    if (!chantierId && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [open, initialValues, chantierId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.dateProchaineAction) {
        values.dateProchaineAction = values.dateProchaineAction.format('YYYY-MM-DD');
      }

      const payload: CreateChantierRequest = {
        nom: values.nom,
        ville: values.ville || undefined,
        prefecture: values.prefecture || undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        adresse: values.adresse || undefined,
        typeProjet: values.typeProjet || undefined,
        sousTypeProjet: values.sousTypeProjet || undefined,
        nombreUnites: values.nombreUnites ?? undefined,
        stadeChantier: values.stadeChantier || undefined,
        niveauOpportunite: values.niveauOpportunite || undefined,
        concurrentFerme: values.niveauOpportunite === 'FERME' ? (values.concurrentFerme || undefined) : undefined,
        deciseur: values.deciseur || undefined,
        statutChantier: values.statutChantier || undefined,
        actionSuivante: values.actionSuivante || undefined,
        dateProchaineAction: values.dateProchaineAction || undefined,
        accountId: values.accountId || undefined,
        assignedToId: values.assignedToId || undefined,
        temoin: values.temoin ?? false,
        installateur: values.installateur || undefined,
        promoteur: values.promoteur || undefined,
        acteurs: acteurs
          .filter(a => a.nom.trim())
          .map(a => ({ roleActeur: a.roleActeur, nom: a.nom.trim(), telephone: a.telephone || undefined })),
      };

      setSaving(true);
      if (isEditing && chantierId) {
        await chantiersApi.update(chantierId, payload);
        message.success('Chantier mis à jour');
      } else {
        await chantiersApi.create(payload);
        message.success('Chantier créé');
      }
      form.resetFields();
      onClose(true);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setActeurs([]);
    onClose(false);
  };

  return (
    <Modal
      title={isEditing ? 'Modifier le chantier' : 'Nouveau chantier'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText={isEditing ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      width={800}
      confirmLoading={saving}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Tabs type="card" size="small" items={[
            {
              key: 'identification',
              label: 'Identification',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="nom" label="Nom du chantier" rules={[{ required: true, message: 'Le nom est obligatoire' }]}>
                        <Input placeholder="Ex : Résidence les Orangers — Lot 3" maxLength={255} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="ville" label="Ville">
                        <Input placeholder="Ex : Casablanca" maxLength={100} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="prefecture" label="Préfecture / Province">
                        <Input placeholder="Ex : Casablanca-Settat" maxLength={100} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item shouldUpdate noStyle>
                        {({ getFieldValue, setFieldsValue }) => {
                          const lat = getFieldValue('latitude');
                          const lng = getFieldValue('longitude');
                          return (
                            <Form.Item
                              label={
                                <span>
                                  Localisation GPS
                                  {locating && (
                                    <span style={{ marginLeft: 8, color: '#722ed1', fontSize: 12 }}>
                                      <AimOutlined spin style={{ marginRight: 4 }} />
                                      Localisation en cours...
                                    </span>
                                  )}
                                </span>
                              }
                            >
                              <GpsLocationPicker
                                value={lat != null && lng != null ? { latitude: lat, longitude: lng } : undefined}
                                onChange={(coords) => setFieldsValue({ latitude: coords?.latitude, longitude: coords?.longitude })}
                                onAddressChange={(addr) => setFieldsValue({ adresse: addr })}
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="adresse" label="Adresse du chantier">
                        <Input.TextArea rows={2} placeholder="Adresse récupérée automatiquement via GPS ou saisie manuelle" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="latitude" label="Latitude">
                        <InputNumber style={{ width: '100%' }} placeholder="Ex : 33.9716" step={0.0001} precision={6} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="longitude" label="Longitude">
                        <InputNumber style={{ width: '100%' }} placeholder="Ex : -6.8498" step={0.0001} precision={6} disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'projet',
              label: 'Projet & Pipeline',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="typeProjet" label="Type de projet">
                        <Select placeholder="Sélectionner" options={typeProjetOptions} allowClear />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sousTypeProjet" label="Sous-type / Précision">
                        <Input placeholder="Ex : Hôtel 4 étoiles, Logement social…" maxLength={100} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="nombreUnites" label="Nombre d'unités">
                        <InputNumber style={{ width: '100%' }} placeholder="Ex : 120" min={0} precision={0} />
                      </Form.Item>
                    </Col>
                    <Col span={16}>
                      <Form.Item label="Segment taille (auto)">
                        <Input disabled placeholder="S (≤50) / M (51–200) / L (201–500) / XL (>500)" style={{ color: '#888' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="stadeChantier" label="Stade du chantier">
                        <Select placeholder="Sélectionner" options={STADE_OPTIONS} allowClear />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="niveauOpportunite" label="Niveau d'opportunité">
                        <Select placeholder="Sélectionner" options={NIVEAU_OPTIONS} allowClear />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="statutChantier" label="Statut commercial">
                        <Select placeholder="Sélectionner" options={STATUT_OPTIONS} allowClear />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="deciseur" label="Déciseur ayant validé le marché">
                        <Select placeholder="Sélectionner" options={DECISEUR_OPTIONS} allowClear />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.niveauOpportunite !== cur.niveauOpportunite}>
                        {({ getFieldValue }) =>
                          getFieldValue('niveauOpportunite') === 'FERME' ? (
                            <Form.Item name="concurrentFerme" label="Concurrent qui a pris le marché">
                              <Input placeholder="Nom du concurrent" />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'contacts',
              label: 'Contacts',
              children: (
                <>
                  <Table
                    dataSource={acteurs}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: 'Aucun contact ajouté' }}
                    columns={[
                      {
                        title: 'Rôle',
                        dataIndex: 'roleActeur',
                        width: 180,
                        render: (val: string, record: ActeurRow) => (
                          <Select
                            value={val}
                            options={ACTEUR_ROLE_OPTIONS}
                            onChange={v => updateActeur(record.key, 'roleActeur', v)}
                            style={{ width: '100%' }}
                            size="small"
                          />
                        ),
                      },
                      {
                        title: 'Nom / Société',
                        dataIndex: 'nom',
                        render: (val: string, record: ActeurRow) => (
                          <Input
                            value={val}
                            onChange={e => updateActeur(record.key, 'nom', e.target.value)}
                            placeholder="Nom ou société"
                            size="small"
                            maxLength={255}
                          />
                        ),
                      },
                      {
                        title: 'Téléphone',
                        dataIndex: 'telephone',
                        width: 150,
                        render: (val: string, record: ActeurRow) => (
                          <Input
                            value={val}
                            onChange={e => updateActeur(record.key, 'telephone', e.target.value)}
                            placeholder="0600…"
                            size="small"
                            maxLength={20}
                          />
                        ),
                      },
                      {
                        title: '',
                        width: 40,
                        render: (_: any, record: ActeurRow) => (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeActeur(record.key)}
                          />
                        ),
                      },
                    ]}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addActeur}
                      style={{ flex: 1 }}
                    >
                      Ajouter un contact
                    </Button>
                    <Button
                      icon={<ScanOutlined />}
                      onClick={() => setScanCarteOpen(true)}
                      style={{ borderColor: '#722ed1', color: '#722ed1' }}
                    >
                      Scan carte de visite
                    </Button>
                  </div>
                </>
              ),
            },
            {
              key: 'suivi',
              label: 'Suivi & Acteurs',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="accountId" label="Compte client">
                        <Select
                          placeholder="Associer à un compte..."
                          allowClear showSearch
                          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                          options={accounts.map(a => ({ value: a.id, label: a.name }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="assignedToId" label="Utilisateur" hidden>
                        <Select
                          placeholder="Sélectionner un utilisateur"
                          allowClear showSearch
                          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                          options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="dateProchaineAction" label="Date prochaine action">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Sélectionner" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="actionSuivante" label="Prochaine action">
                        <Input.TextArea rows={3} placeholder="Décrire la prochaine action à réaliser…" maxLength={500} showCount />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="promoteur" label="Promoteur">
                        <Input placeholder="Ex : Groupe Alliances, Addoha…" maxLength={255} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="installateur" label="Installateur">
                        <Input placeholder="Ex : Plomberie Dupont, Entreprise ALFA…" maxLength={255} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="temoin" label="Témoin" valuePropName="checked"
                        extra="Cocher si ce chantier est un chantier de référence livré, utilisable comme vitrine commerciale.">
                        <Switch checkedChildren="Témoin" unCheckedChildren="Non" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
          ]} />
        </Form>
      </Spin>

      <CarteVisiteScanModal
        open={scanCarteOpen}
        onClose={() => setScanCarteOpen(false)}
        title="Scan carte de visite — Ajouter un contact"
        onInsert={(contact) => {
          const newRow: ActeurRow = {
            key: String(Date.now()),
            roleActeur: contact.poste ? 'AUTRE' : 'AUTRE',
            nom: [contact.nom, contact.societe].filter(Boolean).join(' — '),
            telephone: contact.telephone || '',
          };
          setActeurs(prev => [...prev, newRow]);
        }}
      />
    </Modal>
  );
};

export default ChantierFormModal;
