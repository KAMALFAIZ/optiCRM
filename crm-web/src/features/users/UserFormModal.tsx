import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Tabs, Switch, Upload, Avatar, message, Alert } from 'antd';
import { UserOutlined, CameraOutlined, LoadingOutlined, MailOutlined } from '@ant-design/icons';
import { UserListItem, CreateUserRequest, UpdateUserRequest, LANGUAGES, TIMEZONES } from '../../types/user';
import { useAppSelector } from '../../store';
import usersApi from '../../api/users';

interface UserFormModalProps {
  open: boolean;
  editingUser: UserListItem | null;
  loading: boolean;
  onSubmit: (values: CreateUserRequest | UpdateUserRequest) => void;
  onCancel: () => void;
}

export default function UserFormModal({ open, editingUser, loading, onSubmit, onCancel }: UserFormModalProps) {
  const [form] = Form.useForm();
  const { roles, teams, territories } = useAppSelector((state) => state.users);
  const isEditing = !!editingUser;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingUser) {
        form.setFieldsValue({
          email: editingUser.email,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          phone: editingUser.phone || '',
          roleId: editingUser.role?.id,
          teamId: editingUser.team?.id,
          territoryId: editingUser.territory?.id,
          preferredLanguage: editingUser.preferredLanguage || 'fr',
          timezone: editingUser.timezone || 'Europe/Paris',
          isActive: editingUser.isActive,
        });
        setAvatarUrl(editingUser.avatarUrl || null);
      } else {
        form.resetFields();
        form.setFieldsValue({
          preferredLanguage: 'fr',
          timezone: 'Europe/Paris',
          isActive: true,
        });
        setAvatarUrl(null);
      }
    }
  }, [open, editingUser, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const cleaned = { ...values };
      if (!cleaned.password) delete cleaned.password;
      if (!cleaned.phone) delete cleaned.phone;
      if (!cleaned.teamId) delete cleaned.teamId;
      if (!cleaned.territoryId) delete cleaned.territoryId;
      onSubmit(cleaned);
    });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!editingUser) return;
    setUploading(true);
    try {
      const result = await usersApi.uploadAvatar(editingUser.id, file);
      setAvatarUrl(result.avatarUrl || null);
      message.success('Avatar mis à jour');
    } catch {
      message.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const tabItems = [
    {
      key: 'info',
      label: 'Informations',
      children: (
        <>
          {/* Avatar upload (only when editing) */}
          {isEditing && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Upload
                name="avatar"
                showUploadList={false}
                accept="image/jpeg,image/png,image/gif,image/webp"
                beforeUpload={(file) => {
                  if (file.size > 2 * 1024 * 1024) {
                    message.error('Le fichier dépasse 2 MB');
                    return false;
                  }
                  handleAvatarUpload(file);
                  return false;
                }}
              >
                <div style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    size={72}
                    src={avatarUrl || undefined}
                    icon={!avatarUrl ? <UserOutlined /> : undefined}
                    style={{ backgroundColor: avatarUrl ? undefined : '#1677ff' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#fff',
                    borderRadius: '50%',
                    padding: 4,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    lineHeight: 1,
                  }}>
                    {uploading ? <LoadingOutlined style={{ fontSize: 14 }} /> : <CameraOutlined style={{ fontSize: 14 }} />}
                  </div>
                </div>
              </Upload>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Cliquez pour changer l'avatar</div>
            </div>
          )}

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "L'email est obligatoire" },
              { type: 'email', message: "Format d'email invalide" },
            ]}
          >
            <Input placeholder="email@exemple.com" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="firstName"
              label="Prénom"
              rules={[{ required: true, message: 'Le prénom est obligatoire' }]}
            >
              <Input placeholder="Prénom" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Nom"
              rules={[{ required: true, message: 'Le nom est obligatoire' }]}
            >
              <Input placeholder="Nom" />
            </Form.Item>
          </div>
          <Form.Item name="phone" label="Téléphone">
            <Input placeholder="+212 6XX XXX XXX" />
          </Form.Item>
          {!isEditing && (
            <>
              <Form.Item
                name="password"
                label="Mot de passe"
                extra="Laissez vide pour générer automatiquement"
                rules={[{ min: 8, message: 'Minimum 8 caractères' }]}
              >
                <Input.Password placeholder="Mot de passe" />
              </Form.Item>
              <Alert
                type="info"
                showIcon
                icon={<MailOutlined />}
                message="Un email de bienvenue contenant les identifiants de connexion sera automatiquement envoyé à l'utilisateur."
                style={{ marginBottom: 0, borderRadius: 8 }}
              />
            </>
          )}
        </>
      ),
    },
    {
      key: 'role',
      label: 'Rôle & Équipe',
      children: (
        <>
          <Form.Item
            name="roleId"
            label="Rôle"
            rules={[{ required: true, message: 'Le rôle est obligatoire' }]}
          >
            <Select placeholder="Sélectionner un rôle">
              {roles.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}{r.description ? ` — ${r.description}` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="teamId" label="Équipe">
            <Select placeholder="Sélectionner une équipe" allowClear>
              {teams.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="territoryId" label="Territoire">
            <Select placeholder="Sélectionner un territoire" allowClear>
              {territories.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}{t.region ? ` (${t.region})` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </>
      ),
    },
    {
      key: 'settings',
      label: 'Paramètres',
      children: (
        <>
          <Form.Item name="preferredLanguage" label="Langue">
            <Select>
              {LANGUAGES.map((l) => (
                <Select.Option key={l.value} value={l.value}>
                  {l.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="timezone" label="Fuseau horaire">
            <Select>
              {TIMEZONES.map((t) => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {isEditing && (
            <Form.Item name="isActive" label="Actif" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </>
      ),
    },
  ];

  return (
    <Modal
      title={isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      width={560}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" size="middle">
        <Tabs items={tabItems} size="small" />
      </Form>
    </Modal>
  );
}
