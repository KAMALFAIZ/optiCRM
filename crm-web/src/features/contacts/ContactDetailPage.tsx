import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Spin,
  Divider,
  Modal,
  message,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  MobileOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  UserOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchContactById, deleteContact } from './contactsSlice';
import { CONTACT_STATUSES } from '@/types/contact';

interface ContactStatusItem {
  value: string;
  label: string;
  color: string;
}
import ContactFormModal from './ContactFormModal';

const { Title, Text } = Typography;

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedContact: contact, loading, error } = useAppSelector((state) => state.contacts);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchContactById(id));
    }
  }, [id, dispatch]);

  const handleDelete = () => {
    Modal.confirm({
      title: 'Supprimer le contact',
      content: 'Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteContact(id!)).unwrap();
          message.success('Contact supprimé avec succès');
          navigate('/contacts');
        } catch (error) {
          message.error('Erreur lors de la suppression du contact');
        }
      },
    });
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'default';
    const statusObj = CONTACT_STATUSES.find((s: ContactStatusItem) => s.value === status);
    return statusObj?.color || 'default';
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    if (refresh && id) {
      dispatch(fetchContactById(id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!contact || contact.id !== id) {
    return (
      <div className="flex justify-center items-center h-96">
        <Text type="secondary">{error || 'Contact introuvable'}</Text>
      </div>
    );
  }

  const fullName = `${contact.salutation || ''} ${contact.firstName} ${contact.lastName}`.trim();

  const tabItems = [
    {
      key: 'details',
      label: 'Détails',
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Informations personnelles" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Civilité">{contact.salutation || '-'}</Descriptions.Item>
                <Descriptions.Item label="Prénom">{contact.firstName}</Descriptions.Item>
                <Descriptions.Item label="Nom">{contact.lastName}</Descriptions.Item>
                <Descriptions.Item label="Email">
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`}>
                      <MailOutlined /> {contact.email}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone fixe">
                  {(contact.phoneOffice || contact.phone) ? (
                    <a href={`tel:${contact.phoneOffice || contact.phone}`}>
                      <PhoneOutlined /> {contact.phoneOffice || contact.phone}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Mobile">
                  {(contact.phoneMobile || contact.mobile) ? (
                    <a href={`tel:${contact.phoneMobile || contact.mobile}`}>
                      <MobileOutlined /> {contact.phoneMobile || contact.mobile}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Informations professionnelles" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Compte">
                  {contact.account ? (
                    <a onClick={() => navigate(`/accounts/${contact.account!.id}`)}>
                      <BankOutlined /> {contact.account.name}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Fonction">{contact.jobTitle || '-'}</Descriptions.Item>
                <Descriptions.Item label="Service">{contact.department || '-'}</Descriptions.Item>
                <Descriptions.Item label="Rôle">{contact.contactRole || '-'}</Descriptions.Item>
                <Descriptions.Item label="Responsable">
                  {contact.assignedTo?.fullName || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12} className="mt-4">
            <Card title="Adresse" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Rue">
                  {contact.addressStreet || contact.mailingStreet || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Ville">
                  {contact.addressCity || contact.mailingCity || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Code postal">
                  {contact.addressPostalCode || contact.mailingPostalCode || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Région">
                  {contact.addressState || contact.mailingState || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Pays">
                  {contact.addressCountry || contact.mailingCountry || 'Maroc'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12} className="mt-4">
            <Card title="Réseaux sociaux" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="LinkedIn">
                  {contact.linkedinUrl ? (
                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <LinkedinOutlined /> Voir le profil
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Twitter">
                  {contact.twitterHandle ? (
                    <a href={`https://twitter.com/${contact.twitterHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <TwitterOutlined /> {contact.twitterHandle}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          {contact.description && (
            <Col span={24} className="mt-4">
              <Card title="Notes" size="small">
                <Text>{contact.description}</Text>
              </Card>
            </Col>
          )}
        </Row>
      ),
    },
    {
      key: 'activities',
      label: 'Activités',
      children: (
        <Card>
          <Text type="secondary">Les activités seront affichées ici</Text>
        </Card>
      ),
    },
    {
      key: 'opportunities',
      label: 'Opportunités',
      children: (
        <Card>
          <Text type="secondary">Les opportunités seront affichées ici</Text>
        </Card>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/contacts')}
        className="!pl-0 mb-4"
      >
        Retour à la liste
      </Button>

      <Card>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar size={80} icon={<UserOutlined />} className="bg-blue-500" />
          </Col>
          <Col flex="auto">
            <div className="flex items-center gap-3 mb-2">
              <Title level={3} className="!mb-0">{fullName}</Title>
              <Tag color={getStatusColor(contact.status)}>{contact.status}</Tag>
            </div>
            {contact.jobTitle && (
              <Text type="secondary" className="block">{contact.jobTitle}</Text>
            )}
            {contact.account && (
              <Text type="secondary">
                <BankOutlined className="mr-1" />
                {contact.account.name}
              </Text>
            )}
          </Col>
          <Col>
            <Space>
              <Button icon={<EditOutlined />} onClick={() => setModalOpen(true)}>
                Modifier
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                Supprimer
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16} className="mb-6">
          {contact.email && (
            <Col>
              <a href={`mailto:${contact.email}`} className="text-blue-500">
                <MailOutlined className="mr-1" /> {contact.email}
              </a>
            </Col>
          )}
          {(contact.phoneOffice || contact.phone) && (
            <Col>
              <a href={`tel:${contact.phoneOffice || contact.phone}`} className="text-blue-500">
                <PhoneOutlined className="mr-1" /> {contact.phoneOffice || contact.phone}
              </a>
            </Col>
          )}
          {(contact.phoneMobile || contact.mobile) && (
            <Col>
              <a href={`tel:${contact.phoneMobile || contact.mobile}`} className="text-blue-500">
                <MobileOutlined className="mr-1" /> {contact.phoneMobile || contact.mobile}
              </a>
            </Col>
          )}
        </Row>

        <Tabs items={tabItems} />
      </Card>

      <ContactFormModal
        open={modalOpen}
        contactId={id || null}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default ContactDetailPage;
