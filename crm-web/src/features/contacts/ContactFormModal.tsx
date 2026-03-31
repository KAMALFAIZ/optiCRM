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
} from 'antd';
import { useAppDispatch, useAppSelector } from '@/store';
import { createContact, updateContact, fetchContactById } from './contactsSlice';
import { SALUTATIONS, CreateContactRequest } from '@/types/contact';
import accountsApi from '@/api/accounts';

interface OptionItem {
  value: string;
  label: string;
}

interface ContactFormModalProps {
  open: boolean;
  contactId: string | null;
  onClose: (refresh?: boolean) => void;
}

const FONCTIONS_MAROC = [
  'Directeur Général',
  'Gérant',
  'Directeur Commercial',
  'Responsable Achats',
  'Responsable Commercial',
  'Responsable Logistique',
  'Comptable',
  'Directeur Financier',
  'Responsable Technique',
  'Ingénieur',
  'Architecte',
  'Conducteur de travaux',
  'Chef de chantier',
  'Assistant(e)',
  'Autre',
];

const REGIONS_MAROC = [
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Tanger-Tétouan-Al Hoceïma',
  'Fès-Meknès',
  'Marrakech-Safi',
  'Souss-Massa',
  'Béni Mellal-Khénifra',
  'Oriental',
  'Drâa-Tafilalet',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
  'Guelmim-Oued Noun',
];

const ContactFormModal: React.FC<ContactFormModalProps> = ({ open, contactId, onClose }) => {
  const dispatch = useAppDispatch();
  const { selectedContact, loading } = useAppSelector((state) => state.contacts);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [accountOptions, setAccountOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchingAccounts, setSearchingAccounts] = useState(false);

  const isEditing = !!contactId;

  useEffect(() => {
    if (open && contactId) {
      dispatch(fetchContactById(contactId));
    } else if (!open) {
      form.resetFields();
    }
  }, [open, contactId, dispatch, form]);

  useEffect(() => {
    if (selectedContact && isEditing) {
      form.setFieldsValue({
        salutation:     selectedContact.salutation,
        firstName:      selectedContact.firstName,
        lastName:       selectedContact.lastName,
        email:          selectedContact.email,
        phoneOffice:    selectedContact.phoneOffice,
        phoneMobile:    selectedContact.phoneMobile,
        jobTitle:       selectedContact.jobTitle,
        department:     selectedContact.department,
        contactRole:    selectedContact.contactRole,
        accountId:      selectedContact.account?.id,
        addressStreet:  selectedContact.addressStreet,
        addressCity:    selectedContact.addressCity,
        addressState:   selectedContact.addressState,
        addressPostalCode: selectedContact.addressPostalCode,
        addressCountry: selectedContact.addressCountry || 'Maroc',
        linkedinUrl:    selectedContact.linkedinUrl,
        twitterHandle:  selectedContact.twitterHandle,
        doNotCall:      selectedContact.doNotCall,
        doNotEmail:     selectedContact.doNotEmail,
      });
      if (selectedContact.account) {
        setAccountOptions([{
          value: selectedContact.account.id,
          label: selectedContact.account.name,
        }]);
      }
    }
  }, [selectedContact, isEditing, form]);

  const handleAccountSearch = async (value: string) => {
    if (value.length < 2) return;
    setSearchingAccounts(true);
    try {
      const accounts = await accountsApi.search(value);
      setAccountOptions(accounts.map(a => ({ value: a.id, label: a.name })));
    } catch (error) {
      console.error('Error searching accounts:', error);
    } finally {
      setSearchingAccounts(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const data: CreateContactRequest = { ...values };

      if (isEditing && contactId) {
        await dispatch(updateContact({ id: contactId, data })).unwrap();
        message.success('Contact mis à jour avec succès');
      } else {
        await dispatch(createContact(data)).unwrap();
        message.success('Contact créé avec succès');
      }
      onClose(true);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || 'Une erreur est survenue');
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
          <Col span={6}>
            <Form.Item name="salutation" label="Civilité">
              <Select
                placeholder="Civilité"
                options={SALUTATIONS.map((s: OptionItem) => ({ value: s.value, label: s.label }))}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item
              name="firstName"
              label="Prénom"
              rules={[{ required: true, message: 'Le prénom est requis' }]}
            >
              <Input placeholder="Mohamed" />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item
              name="lastName"
              label="Nom"
              rules={[{ required: true, message: 'Le nom est requis' }]}
            >
              <Input placeholder="Alaoui" />
            </Form.Item>
          </Col>

          {/* Compte */}
          <Col span={12}>
            <Form.Item name="accountId" label="Compte client">
              <Select
                showSearch
                placeholder="Rechercher un compte..."
                filterOption={false}
                onSearch={handleAccountSearch}
                loading={searchingAccounts}
                options={accountOptions}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contactRole" label="Rôle dans le compte">
              <Select
                placeholder="Sélectionner"
                allowClear
                options={[
                  { value: 'decision_maker', label: 'Décideur' },
                  { value: 'buyer',          label: 'Acheteur' },
                  { value: 'influencer',     label: 'Prescripteur' },
                  { value: 'technical',      label: 'Contact technique' },
                  { value: 'billing',        label: 'Contact facturation' },
                  { value: 'director',       label: 'Directeur / Gérant' },
                  { value: 'user',           label: 'Utilisateur' },
                ]}
              />
            </Form.Item>
          </Col>

          {/* Coordonnées */}
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: "Format d'email invalide" }]}
            >
              <Input placeholder="m.alaoui@entreprise.ma" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phoneOffice" label="Téléphone fixe">
              <Input placeholder="+212 5 22 XX XX XX" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phoneMobile" label="Mobile">
              <Input placeholder="+212 6 XX XX XX XX" />
            </Form.Item>
          </Col>

          {/* Fonction */}
          <Col span={12}>
            <Form.Item name="jobTitle" label="Fonction">
              <Select
                placeholder="Sélectionner ou saisir"
                showSearch
                allowClear
                options={FONCTIONS_MAROC.map(f => ({ value: f, label: f }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department" label="Service / Département">
              <Input placeholder="Commercial, Achats, Technique..." />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'address',
      label: 'Adresse',
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="addressStreet" label="Adresse">
              <Input.TextArea rows={2} placeholder="N° Rue, Quartier..." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="addressCity" label="Ville">
              <Input placeholder="Casablanca" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="addressPostalCode" label="Code postal">
              <Input placeholder="20000" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="addressCountry" label="Pays" initialValue="Maroc">
              <Input placeholder="Maroc" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="addressState" label="Région">
              <Select
                placeholder="Sélectionner"
                showSearch
                allowClear
                options={REGIONS_MAROC.map(r => ({ value: r, label: r }))}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'social',
      label: 'Réseaux sociaux',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="linkedinUrl" label="LinkedIn">
              <Input placeholder="https://linkedin.com/in/username" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="twitterHandle" label="Twitter / X">
              <Input placeholder="@username" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <Modal
      title={isEditing ? 'Modifier le contact' : 'Nouveau contact'}
      open={open}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      width={800}
      okText={isEditing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Spin spinning={loading && isEditing}>
        <Form form={form} layout="vertical" requiredMark="optional">
          <Tabs items={tabItems} />
        </Form>
      </Spin>
    </Modal>
  );
};

export default ContactFormModal;
