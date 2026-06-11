import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tabs,
  message,
  Spin,
  InputNumber,
  Upload,
  Avatar,
  DatePicker,
  Button,
  Space,
  Alert,
} from 'antd';
import dayjs from 'dayjs';
import { CameraOutlined, BankOutlined, EnvironmentOutlined, ScanOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { scanRcDocument, type RcExtractedData } from '@/services/scanRc';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { GpsLocationPicker } from '@/components/maps';
import { useAppDispatch, useAppSelector } from '@/store';
import { createAccount, updateAccount, fetchAccountById } from './accountsSlice';
import { ACCOUNT_TYPES, SOCIETES_AFFECTATION, CreateAccountRequest } from '@/types/account';
import { pricingCategoriesApi } from '@/api/pricingCategories';
import { PricingCategory } from '@/types/pricingCategory';
import accountsApi from '@/api/accounts';
import { referenceDataApi, REFERENCE_CATEGORIES, type ReferenceDataItem } from '@/api/referenceData';

interface TypeItem {
  value: string;
  label: string;
  color: string;
}

interface AccountFormModalProps {
  open: boolean;
  accountId: string | null;
  onClose: (refresh?: boolean) => void;
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({ open, accountId, onClose }) => {
  const dispatch = useAppDispatch();
  const { selectedAccount, loading } = useAppSelector((state) => state.accounts);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pricingCategories, setPricingCategories] = useState<PricingCategory[]>([]);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<string | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  // ── Données de référence dynamiques ──
  const [refCategorieClient, setRefCategorieClient] = useState<ReferenceDataItem[]>([]);
  const [refSocieteAffectation, setRefSocieteAffectation] = useState<ReferenceDataItem[]>([]);
  const [refTypeCompte, setRefTypeCompte] = useState<ReferenceDataItem[]>([]);
  const [refTypeCompteOdyssee, setRefTypeCompteOdyssee] = useState<ReferenceDataItem[]>([]);

  useEffect(() => {
    if (!open) return;
    referenceDataApi.getAll().then((data) => {
      setRefCategorieClient(data[REFERENCE_CATEGORIES.CATEGORIE_CLIENT] ?? []);
      setRefSocieteAffectation(data[REFERENCE_CATEGORIES.SOCIETE_AFFECTATION] ?? []);
      setRefTypeCompte(data[REFERENCE_CATEGORIES.TYPE_COMPTE] ?? []);
      setRefTypeCompteOdyssee(data[REFERENCE_CATEGORIES.TYPE_COMPTE_ODYSSEE] ?? []);
    }).catch(() => { /* fallback to empty - hardcoded values still in constants */ });
  }, [open]);

  const isEditing = !!accountId;

  // ── Scan RC via Claude Vision ──
  const handleScanRc = async (file: File) => {
    setLoadingScan(true);
    setScanSummary(null);
    try {
      const extracted: RcExtractedData = await scanRcDocument(file);

      // Get current form values
      const current = form.getFieldsValue([
        'name', 'rc', 'ice', 'identifiantFiscal', 'cnss', 'patente',
        'capitalSocial', 'associes', 'secteurActivite',
        'billingStreet', 'billingCity', 'billingPostalCode', 'billingState', 'billingCountry',
        'phone', 'whatsapp',
      ]);

      // Fill only empty fields
      const updates: Record<string, string | number> = {};
      const filled: string[] = [];

      const fieldLabels: Record<string, string> = {
        name: 'Raison sociale', rc: 'RC', ice: 'ICE', identifiantFiscal: 'IF',
        cnss: 'CNSS', patente: 'Patente', capitalSocial: 'Capital social',
        associes: 'Associés', secteurActivite: 'Activité',
        billingStreet: 'Adresse', billingCity: 'Ville', billingPostalCode: 'Code postal',
        billingState: 'Région', billingCountry: 'Pays', phone: 'Tél', whatsapp: 'WhatsApp',
      };

      for (const [key, value] of Object.entries(extracted)) {
        if (value != null && value !== '' && !current[key]) {
          updates[key] = value as string | number;
          filled.push(fieldLabels[key] ?? key);
        }
      }

      if (Object.keys(updates).length > 0) {
        form.setFieldsValue(updates);
        setScanSummary(`Champs remplis : ${filled.join(', ')}`);
        message.success(`RC scanné — ${filled.length} champ(s) rempli(s)`);
      } else {
        setScanSummary('Tous les champs sont déjà remplis');
        message.info('Aucun champ vide à remplir');
      }
    } catch (err) {
      const e = err as Error & { isOverloaded?: boolean };
      if (e.isOverloaded) {
        message.warning({
          content: 'IA temporairement surchargée — saisissez les champs manuellement.',
          duration: 6,
        });
        setScanSummary('⚠️ IA indisponible — saisie manuelle requise.');
      } else {
        message.error(e.message ?? 'Erreur lors du scan RC');
      }
    } finally {
      setLoadingScan(false);
    }
  };

  // ── Reverse geocoding via Nominatim (OpenStreetMap) ──
  const handleReverseGeocode = async (lat: number, lng: number) => {
    setLoadingGeocode(true);
    setGeocodeResult(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
        { headers: { 'User-Agent': 'OptiCRM/1.0 (contact@opticrm.ma)' } }
      );
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      const addr = data.address || {};

      // Construire la rue
      const streetParts = [addr.house_number, addr.road, addr.neighbourhood].filter(Boolean);
      const street = streetParts.join(', ');
      // Ville : city > town > village > municipality > quarter
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
      // Région
      const state = addr.state || addr.region;

      const current = form.getFieldsValue([
        'billingStreet', 'billingCity', 'billingPostalCode', 'billingCountry', 'billingState',
      ]);

      const updates: Record<string, string> = {};
      if (!current.billingStreet && street)          updates.billingStreet    = street;
      if (!current.billingCity && city)               updates.billingCity      = city;
      if (!current.billingPostalCode && addr.postcode) updates.billingPostalCode = addr.postcode;
      if (!current.billingCountry && addr.country)    updates.billingCountry   = addr.country;
      if (!current.billingState && state)             updates.billingState     = state;

      if (Object.keys(updates).length > 0) {
        form.setFieldsValue(updates);
        const preview = [city, addr.country].filter(Boolean).join(', ');
        setGeocodeResult(`Adresse récupérée${preview ? ` : ${preview}` : ''}`);
        message.success('Adresse récupérée et champs vides remplis');
      } else {
        setGeocodeResult('Tous les champs adresse sont déjà remplis');
        message.info('Les champs d\'adresse sont déjà remplis — aucune modification');
      }
    } catch {
      message.error('Impossible de récupérer l\'adresse depuis ces coordonnées GPS');
    } finally {
      setLoadingGeocode(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (accountId) {
        dispatch(fetchAccountById(accountId));
      }
      pricingCategoriesApi.getActive()
        .then(data => setPricingCategories(data))
        .catch(() => {});
    } else {
      form.resetFields();
      setGeocodeResult(null);
      setScanSummary(null);
    }
  }, [open, accountId, dispatch, form]);

  useEffect(() => {
    if (selectedAccount && isEditing) {
      form.setFieldsValue({
        ...selectedAccount,
        parentAccountId: selectedAccount.parentAccount?.id,
        pricingCategoryId: selectedAccount.pricingCategory?.id,
        dateProchaineAction: selectedAccount.dateProchaineAction
          ? dayjs(selectedAccount.dateProchaineAction)
          : undefined,
      });
      setLogoUrl(selectedAccount.logoUrl);
    } else if (!isEditing) {
      setLogoUrl(undefined);
    }
  }, [selectedAccount, isEditing, form]);

  const handleLogoUpload = async (options: UploadRequestOption) => {
    if (!accountId) {
      // For new accounts, we upload after creation — just preview locally
      const file = options.file as File;
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      options.onSuccess?.({});
      return;
    }
    setUploadingLogo(true);
    try {
      const result = await accountsApi.uploadLogo(accountId, options.file as File);
      setLogoUrl(result.logoUrl);
      options.onSuccess?.({});
      message.success('Logo mis à jour');
    } catch (error: any) {
      message.error(error.message || 'Erreur lors de l\'upload du logo');
      options.onError?.(error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: CreateAccountRequest = {
        ...values,
      };

      if (isEditing && accountId) {
        await dispatch(updateAccount({ id: accountId, data })).unwrap();
        message.success('Compte mis à jour avec succès');
      } else {
        await dispatch(createAccount(data)).unwrap();
        message.success('Compte créé avec succès');
      }

      onClose(true);
    } catch (error: any) {
      if (error?.errorFields) return;

      // Mutation mise en file d'attente (hors ligne)
      if (error === 'OFFLINE_QUEUED' || error?.isOfflineQueued || error?.message === 'OFFLINE_QUEUED') {
        message.warning({
          content: 'Vous êtes hors ligne — la modification sera synchronisée au retour du réseau.',
          duration: 5,
        });
        onClose(false);
        return;
      }

      const errorMsg = typeof error === 'string' ? error : (error?.message || 'Une erreur est survenue');
      console.error('Erreur création/mise à jour compte:', error);
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    {
      key: 'general',
      label: 'Informations générales',
      children: (
        <Row gutter={16}>
          {/* Logo upload */}
          <Col span={24} className="mb-4 flex items-center gap-4">
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={handleLogoUpload}
              maxCount={1}
              disabled={uploadingLogo}
            >
              {logoUrl ? (
                <Avatar
                  src={logoUrl}
                  size={72}
                  style={{ cursor: 'pointer', border: '2px solid #d9d9d9', opacity: uploadingLogo ? 0.6 : 1 }}
                />
              ) : (
                <Avatar
                  size={72}
                  icon={<BankOutlined />}
                  style={{ cursor: 'pointer', background: '#7c3aed', opacity: uploadingLogo ? 0.6 : 1 }}
                />
              )}
            </Upload>
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={handleLogoUpload}
              maxCount={1}
            >
              <span
                style={{ color: '#1677ff', cursor: 'pointer', fontSize: 13 }}
              >
                <CameraOutlined className="mr-1" />
                {logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
              </span>
            </Upload>
          </Col>
          <Col span={8}>
            <Form.Item
              name="name"
              label="Enseigne"
              rules={[{ required: true, message: 'Le nom est requis' }]}
            >
              <Input placeholder="Entreprise SAS" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="legalName" label="Raison sociale">
              <Input placeholder="Entreprise Société par Actions Simplifiée" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="codeClientCrm"
              label="Code client CRM"
              tooltip="Référence interne OptiCRM — unique par compte"
            >
              <Input placeholder="Ex : CLI-0001" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="societeAffectation"
              label="Société d'affectation"
              tooltip="Entité commerciale à laquelle ce compte est rattaché"
            >
              <Select
                placeholder="Sélectionner une société"
                allowClear
                options={refSocieteAffectation.length > 0
                  ? refSocieteAffectation.filter(r => r.active).map(r => ({ value: r.value, label: r.label }))
                  : SOCIETES_AFFECTATION}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="accountType"
              label="Type de compte"
              rules={[{ required: true, message: 'Le type est requis' }]}
              initialValue="Prospect"
            >
              <Select
                options={refTypeCompte.length > 0
                  ? refTypeCompte.filter(r => r.active).map(r => ({ value: r.value, label: r.label }))
                  : ACCOUNT_TYPES.map((t: TypeItem) => ({ value: t.value, label: t.label }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="secteurActivite" label="Secteur d'activité">
              <Input placeholder="Ex: BTP, Industrie, Commerce..." />
            </Form.Item>
          </Col>
          {/* Champ Société mère masqué */}
          <Col span={12}>
            <Form.Item name="phone" label="Téléphone">
              <Input prefix={<PhoneOutlined style={{ color: '#1890ff' }} />} placeholder="+212 5 22 12 34 56" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="whatsapp" label="WhatsApp">
              <Input prefix={<WhatsAppOutlined style={{ color: '#25D366' }} />} placeholder="+212 6 12 34 56 78" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="website"
              label="Site web"
              rules={[{ type: 'url', message: 'URL invalide', warningOnly: true }]}
            >
              <Input placeholder="https://www.exemple.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="categorieClient" label="Catégorie client">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={refCategorieClient.filter(r => r.active).map(r => ({ value: r.value, label: r.label }))}
              />
            </Form.Item>
          </Col>
          {/* GPS + Reverse geocoding */}
          <Col span={24}>
            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue, setFieldsValue }) => {
                const lat = getFieldValue('latitude');
                const lng = getFieldValue('longitude');
                const hasCoords = lat != null && lng != null;
                return (
                  <Form.Item label="Localisation GPS">
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <GpsLocationPicker
                        value={hasCoords ? { latitude: lat, longitude: lng } : undefined}
                        onChange={(coords) => {
                          setFieldsValue({ latitude: coords?.latitude, longitude: coords?.longitude });
                          setGeocodeResult(null);
                        }}
                        autoCapture={!isEditing}
                      />
                      {hasCoords && (
                        <Button
                          icon={<EnvironmentOutlined />}
                          size="small"
                          loading={loadingGeocode}
                          onClick={() => handleReverseGeocode(lat, lng)}
                          type="dashed"
                          style={{ borderColor: '#52c41a', color: '#52c41a' }}
                        >
                          Récupérer l'adresse depuis ces coordonnées GPS
                        </Button>
                      )}
                      {geocodeResult && (
                        <Alert
                          message={geocodeResult}
                          type="success"
                          showIcon
                          closable
                          onClose={() => setGeocodeResult(null)}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        />
                      )}
                    </Space>
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Col>
          {/* Latitude / Longitude sont gérés automatiquement par le GpsLocationPicker — champs cachés */}
          <Form.Item name="latitude" hidden><InputNumber /></Form.Item>
          <Form.Item name="longitude" hidden><InputNumber /></Form.Item>
        </Row>
      ),
    },
    {
      key: 'legal',
      label: 'Identification légale',
      children: (
        <Row gutter={16}>
          {/* ── Scan RC via IA ── */}
          <Col span={24} style={{ marginBottom: 8 }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
              border: '1px dashed #764ba2',
              borderRadius: 8,
              padding: '12px 16px',
            }}>
              <Space wrap align="center">
                <ScanOutlined style={{ fontSize: 18, color: '#764ba2' }} />
                <span style={{ fontWeight: 600, color: '#333' }}>
                  Scan RC par Intelligence Artificielle
                </span>
                <span style={{ color: '#666', fontSize: 12 }}>
                  — Importez une photo ou PDF du Registre de Commerce
                </span>
                <Button
                  icon={<ScanOutlined />}
                  type="primary"
                  size="small"
                  loading={loadingScan}
                  style={{ background: '#764ba2', borderColor: '#764ba2' }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';
                    input.onchange = () => {
                      const file = input.files?.[0];
                      if (file) handleScanRc(file);
                    };
                    input.click();
                  }}
                >
                  {loadingScan ? 'Analyse en cours…' : 'Scanner le document RC'}
                </Button>
              </Space>
              {scanSummary && (
                <Alert
                  message={scanSummary}
                  type={scanSummary.startsWith('⚠️') ? 'warning' : 'success'}
                  showIcon
                  closable
                  onClose={() => setScanSummary(null)}
                  style={{ marginTop: 8, padding: '4px 10px', fontSize: 12 }}
                />
              )}
            </div>
          </Col>
          {/* Identification Maroc */}
          <Col span={8}>
            <Form.Item
              name="ice"
              label="ICE"
              tooltip="Identifiant Commun d'Entreprise (15 chiffres)"
              rules={[{ pattern: /^\d{15}$/, message: "L'ICE doit contenir exactement 15 chiffres" }]}
            >
              <Input placeholder="000000000000000" maxLength={15} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="identifiantFiscal"
              label="IF (Identifiant Fiscal)"
              tooltip="Identifiant Fiscal délivré par la DGI"
            >
              <Input placeholder="12345678" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="rc"
              label="RC"
              tooltip="Registre de Commerce"
            >
              <Input placeholder="123456 - Casablanca" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="cnss"
              label="CNSS"
              tooltip="Numéro d'affiliation à la CNSS"
            >
              <Input placeholder="1234567" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="patente"
              label="Patente"
              tooltip="Numéro de Patente"
            >
              <Input placeholder="12345678" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="vatNumber" label="N° TVA">
              <Input placeholder="MA12345678" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="capitalSocial"
              label="Capital social"
              tooltip="Capital social de l'entreprise (en DH)"
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={v => v!.replace(/\s/g, '')}
                placeholder="100 000"
                addonAfter="DH"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="associes"
              label="Associés / Actionnaires"
              tooltip="Liste des associés ou actionnaires extraite du RC"
            >
              <Input.TextArea
                rows={3}
                placeholder="Ex: Mohammed Benali (60%), Fatima Alaoui (40%)"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'finance',
      label: 'Données financières',
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="annualRevenue" label="CA annuel">
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={value => value!.replace(/\s/g, '')}
                placeholder="1 000 000"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="revenueCurrency" label="Devise" initialValue="MAD">
              <Select
                options={[
                  { value: 'MAD', label: 'MAD (DH)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'GBP', label: 'GBP (£)' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="employeeCount" label="Effectif">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="50" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="creditLimit" label="Limite de crédit">
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={value => value!.replace(/\s/g, '')}
                placeholder="10 000"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="insuranceAmount" label="Montant assuré (assurance crédit)">
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={value => value!.replace(/\s/g, '')}
                placeholder="0"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="insuranceCompany" label="Compagnie d'assurance">
              <Input placeholder="Ex: Euler Hermes, Atradius..." />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="pricingCategoryId"
              label="Catégorie tarifaire"
              tooltip="Détermine les prix appliqués automatiquement lors de la création de devis et factures pour ce compte."
            >
              <Select
                placeholder="Sélectionner une catégorie tarifaire"
                allowClear
                options={pricingCategories.map(pc => ({
                  value: pc.id,
                  label: pc.isDefault ? `${pc.name} (défaut)` : pc.name,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'billing',
      label: 'Adresse de facturation',
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="billingStreet" label="Rue">
              <Input.TextArea rows={2} placeholder="123 Avenue des Champs-Élysées" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="billingCity" label="Ville">
              <Input placeholder="Casablanca" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="billingPostalCode" label="Code postal">
              <Input placeholder="20000" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="billingCountry" label="Pays" initialValue="Maroc">
              <Input placeholder="Maroc" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="billingState" label="Région">
              <Input placeholder="Casablanca-Settat" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'distribution',
      label: 'Distribution',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="famille" label="Famille">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={[{ value: 'DISTRIBUTION', label: 'Distribution' }]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="typeCompteOdyssee" label="Type de compte">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={refTypeCompteOdyssee.filter(r => r.active).map(r => ({ value: r.value, label: r.label }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="prefecture" label="Préfecture">
              <Input placeholder="Ex: Casablanca, Marrakech, Fès..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="rolePrincipal" label="Rôle principal">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={[
                  { value: 'ACHETEUR',     label: 'Acheteur' },
                  { value: 'PRESCRIPTEUR', label: 'Prescripteur' },
                  { value: 'MIXTE',        label: 'Mixte' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="statutCompte" label="Statut du compte">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={[
                  { value: 'ACTIF',        label: 'Actif' },
                  { value: 'A_DEVELOPPER', label: 'À développer' },
                  { value: 'INACTIF',      label: 'Inactif' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="representant" label="Représentant commercial">
              <Input placeholder="Ex: Ahmed Benali, VEN001..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="potentiel" label="Potentiel business">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={[
                  { value: 'FAIBLE', label: 'Faible' },
                  { value: 'MOYEN',  label: 'Moyen' },
                  { value: 'FORT',   label: 'Fort' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="actionSuivante" label="Action suivante">
              <Input placeholder="Ex: Rappel, Visite de qualification, Envoi offre..." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dateProchaineAction" label="Date prochaine action">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="jj/mm/aaaa" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'shipping',
      label: 'Adresse de livraison',
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="shippingStreet" label="Rue">
              <Input.TextArea rows={2} placeholder="456 Rue de la Livraison" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shippingCity" label="Ville">
              <Input placeholder="Rabat" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shippingPostalCode" label="Code postal">
              <Input placeholder="10000" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shippingCountry" label="Pays" initialValue="Maroc">
              <Input placeholder="Maroc" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="shippingState" label="Région">
              <Input placeholder="Rabat-Salé-Kénitra" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <Modal
      title={isEditing ? 'Modifier le compte' : 'Nouveau compte'}
      open={open}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      width={900}
      okText={isEditing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Spin spinning={loading && isEditing}>
        <Form
          form={form}
          layout="vertical"
        >
          <Tabs items={tabItems} />
        </Form>
      </Spin>
    </Modal>
  );
};

export default AccountFormModal;
