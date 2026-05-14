import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Alert } from 'antd';
import { MailOutlined, PaperClipOutlined } from '@ant-design/icons';

interface SendDatasheetModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  datasheetName: string;
  datasheetUrl: string;
}

const SendDatasheetModal: React.FC<SendDatasheetModalProps> = ({
  open,
  onClose,
  productName,
  datasheetName,
  datasheetUrl,
}) => {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    const baseUrl = window.location.origin;
    const fullUrl = datasheetUrl.startsWith('http') ? datasheetUrl : `${baseUrl}${datasheetUrl}`;
    const subject = encodeURIComponent(`Fiche technique - ${productName}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-dessous le lien vers la fiche technique du produit "${productName}" :\n\n${fullUrl}\n\nCordialement`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
    setEmail('');
    onClose();
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          Envoyer la fiche technique
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          type="info"
          icon={<PaperClipOutlined />}
          showIcon
          message={
            <Typography.Text>
              <strong>Fiche :</strong> {datasheetName}
            </Typography.Text>
          }
        />

        <Form layout="vertical" onFinish={handleSend}>
          <Form.Item
            label="Adresse email du client"
            required
            rules={[
              { required: true, message: "L'email est obligatoire" },
              { type: 'email', message: "Format d'email invalide" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#aaa' }} />}
              placeholder="client@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              size="large"
            />
          </Form.Item>

          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Cela ouvrira votre client email avec un message pré-rempli contenant le lien vers la fiche technique.
          </Typography.Text>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleClose}>Annuler</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<MailOutlined />}
                disabled={!email}
              >
                Ouvrir dans le client email
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default SendDatasheetModal;
