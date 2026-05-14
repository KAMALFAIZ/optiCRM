import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  Checkbox,
  DatePicker,
  message,
  Spin,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/store';
import { createLead, updateLead, fetchLeadById, clearSelectedLead } from './leadsSlice';
import {
  SALUTATIONS,
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_RATINGS,
  BUDGET_RANGES,
  DECISION_TIMEFRAMES,
  LEAD_PRIORITIES,
  INDUSTRIES,
  NUM_EMPLOYEES_RANGES,
  ANNUAL_REVENUES,
} from '@/types/lead';

interface LeadFormModalProps {
  open: boolean;
  leadId: string | null;
  onClose: (refresh?: boolean) => void;
}

const LeadFormModal: React.FC<LeadFormModalProps> = ({ open, leadId, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { selectedLead, loading } = useAppSelector((state) => state.leads);

  const isEditing = !!leadId;

  useEffect(() => {
    if (open && leadId) {
      dispatch(fetchLeadById(leadId));
    }
    return () => {
      dispatch(clearSelectedLead());
    };
  }, [open, leadId, dispatch]);

  useEffect(() => {
    if (selectedLead && isEditing) {
      form.setFieldsValue({
        salutation: selectedLead.salutation,
        firstName: selectedLead.firstName,
        lastName: selectedLead.lastName,
        email: selectedLead.email,
        phone: selectedLead.phone,
        mobile: selectedLead.mobile,
        fax: selectedLead.fax,
        linkedinUrl: selectedLead.linkedinUrl,
        companyName: selectedLead.companyName,
        jobTitle: selectedLead.jobTitle,
        website: selectedLead.website,
        industry: selectedLead.industry,
        numEmployees: selectedLead.numEmployees,
        annualRevenue: selectedLead.annualRevenue,
        street: selectedLead.street,
        city: selectedLead.city,
        state: selectedLead.state,
        postalCode: selectedLead.postalCode,
        country: selectedLead.country,
        status: selectedLead.status,
        source: selectedLead.source,
        sourceDetails: selectedLead.sourceDetails,
        rating: selectedLead.rating,
        priority: selectedLead.priority,
        leadScore: selectedLead.leadScore,
        budgetRange: selectedLead.budgetRange,
        decisionTimeframe: selectedLead.decisionTimeframe,
        doNotCall: selectedLead.doNotCall,
        doNotEmail: selectedLead.doNotEmail,
        nextFollowUpDate: selectedLead.nextFollowUpDate ? dayjs(selectedLead.nextFollowUpDate) : null,
        description: selectedLead.description,
        qualificationNotes: selectedLead.qualificationNotes,
        competitor: selectedLead.competitor,
        productDemoRequested: selectedLead.productDemoRequested,
        meetingScheduledAt: selectedLead.meetingScheduledAt ? dayjs(selectedLead.meetingScheduledAt) : null,
        interestedProducts: selectedLead.interestedProducts ?? [],
      });
    } else if (!isEditing) {
      form.resetFields();
      form.setFieldsValue({ status: 'new', leadScore: 0, doNotCall: false, doNotEmail: false });
    }
  }, [selectedLead, isEditing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.nextFollowUpDate) {
        values.nextFollowUpDate = values.nextFollowUpDate.format('YYYY-MM-DD');
      }
      if (values.meetingScheduledAt) {
        values.meetingScheduledAt = values.meetingScheduledAt.toISOString();
      }

      if (isEditing && leadId) {
        await dispatch(updateLead({ id: leadId, data: values })).unwrap();
        message.success('Piste mise à jour avec succès');
      } else {
        await dispatch(createLead(values)).unwrap();
        message.success('Piste créée avec succès');
      }

      form.resetFields();
      onClose(true);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || 'Une erreur est survenue');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose(false);
  };

  return (
    <Modal
      title={isEditing ? 'Modifier la piste' : 'Nouvelle piste'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText={isEditing ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      width={860}
      confirmLoading={loading}
      styles={{ body: { paddingTop: 8 } }}
    >
      <Spin spinning={loading && isEditing}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'new', leadScore: 0, doNotCall: false, doNotEmail: false }}
        >
          <Tabs
            type="card"
            size="small"
            items={[
              {
                key: 'contact',
                label: 'Contact',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={5}>
                        <Form.Item name="salutation" label="Civilité">
                          <Select placeholder="Sélectionner" options={SALUTATIONS} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={9}>
                        <Form.Item name="firstName" label="Prénom">
                          <Input placeholder="Prénom" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item name="lastName" label="Nom" rules={[{ required: true, message: 'Le nom est obligatoire' }]}>
                          <Input placeholder="Nom" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email invalide' }]}>
                          <Input placeholder="email@exemple.com" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="phone" label="Téléphone">
                          <Input placeholder="+212 6xx xxx xxx" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="mobile" label="Mobile">
                          <Input placeholder="+212 6xx xxx xxx" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="fax" label="Fax">
                          <Input placeholder="Fax" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="linkedinUrl" label="LinkedIn">
                          <Input placeholder="https://linkedin.com/in/..." />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label=" " style={{ paddingTop: 4 }}>
                          <Form.Item name="doNotCall" valuePropName="checked" noStyle>
                            <Checkbox>Ne pas appeler</Checkbox>
                          </Form.Item>
                          <br />
                          <Form.Item name="doNotEmail" valuePropName="checked" noStyle>
                            <Checkbox>Ne pas emailer</Checkbox>
                          </Form.Item>
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'entreprise',
                label: 'Entreprise & Adresse',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="companyName" label="Entreprise">
                          <Input placeholder="Nom de l'entreprise" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="jobTitle" label="Fonction">
                          <Input placeholder="Titre / Fonction" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="website" label="Site web">
                          <Input placeholder="https://www.exemple.com" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="industry" label="Secteur d'activité">
                          <Select placeholder="Sélectionner" options={INDUSTRIES} allowClear showSearch
                            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="numEmployees" label="Effectif">
                          <Select placeholder="Nombre d'employés" options={NUM_EMPLOYEES_RANGES} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="annualRevenue" label="CA annuel">
                          <Select placeholder="Chiffre d'affaires" options={ANNUAL_REVENUES} allowClear />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name="street" label="Rue">
                          <Input placeholder="Adresse" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="postalCode" label="Code postal">
                          <Input placeholder="Code postal" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item name="city" label="Ville">
                          <Input placeholder="Ville" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="country" label="Pays">
                          <Input placeholder="Maroc" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'qualification',
                label: 'Qualification',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="status" label="Statut">
                          <Select placeholder="Sélectionner" options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="priority" label="Priorité">
                          <Select placeholder="Sélectionner" options={LEAD_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="rating" label="Évaluation">
                          <Select placeholder="Sélectionner" options={LEAD_RATINGS.map((r) => ({ value: r.value, label: r.label }))} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="leadScore" label="Score (0-100)">
                          <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="source" label="Source">
                          <Select placeholder="Sélectionner" options={LEAD_SOURCES} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="budgetRange" label="Budget estimé">
                          <Select placeholder="Sélectionner" options={BUDGET_RANGES} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="decisionTimeframe" label="Horizon de décision">
                          <Select placeholder="Sélectionner" options={DECISION_TIMEFRAMES} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="nextFollowUpDate" label="Prochain suivi">
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Sélectionner" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name="sourceDetails" label="Détails source">
                          <Input.TextArea rows={2} placeholder="Détails supplémentaires sur la source..." />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name="interestedProducts" label="Produits d'intérêt">
                          <Select mode="tags" placeholder="Saisir un produit et appuyer sur Entrée..." tokenSeparators={[',']} style={{ width: '100%' }} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="competitor" label="Concurrent / Solution actuelle">
                          <Input placeholder="Ex : SAP, Odoo, Excel..." maxLength={200} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="meetingScheduledAt" label="Réunion / Démo planifiée le">
                          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" placeholder="Sélectionner" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="productDemoRequested" valuePropName="checked">
                          <Checkbox>Démo produit demandée</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name="description" label="Description / Notes">
                          <Input.TextArea rows={3} placeholder="Informations supplémentaires, contexte, observations..." />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="qualificationNotes" label="Notes de qualification (BANT)">
                          <Input.TextArea rows={3} placeholder="Budget confirmé ? Décideur identifié ? Besoin précisé ? Délai confirmé ?..." />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default LeadFormModal;
