import { useEffect } from 'react';
import { Modal, Form, Input, Checkbox, Typography, Divider, Alert } from 'antd';
import { RoleItem, RolePermissions, MODULES, ACTIONS, ACTION_LABELS, DEFAULT_PERMISSIONS } from '@/types/role';

const { Text } = Typography;

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description?: string; permissions: RolePermissions }) => void;
  loading?: boolean;
  role?: RoleItem | null;
}

export default function RoleFormModal({ open, onClose, onSubmit, loading, role }: RoleFormModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!role;

  useEffect(() => {
    if (open) {
      if (role) {
        // Merge with defaults to ensure all modules are present
        const mergedPermissions: RolePermissions = { ...DEFAULT_PERMISSIONS };
        if (role.permissions) {
          for (const [key, value] of Object.entries(role.permissions)) {
            if (mergedPermissions[key]) {
              mergedPermissions[key] = { ...mergedPermissions[key], ...value };
            } else {
              mergedPermissions[key] = value;
            }
          }
        }
        form.setFieldsValue({
          name: role.name,
          description: role.description,
          permissions: mergedPermissions,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ permissions: { ...DEFAULT_PERMISSIONS } });
      }
    }
  }, [open, role, form]);

  const handleFinish = (values: any) => {
    const permissions = form.getFieldValue('permissions');
    onSubmit({
      name: values.name,
      description: values.description,
      permissions: permissions,
    });
  };

  const handleToggleAll = (moduleKey: string, checked: boolean) => {
    const currentPerms = form.getFieldValue('permissions') || {};
    const updated = { ...currentPerms };
    updated[moduleKey] = {
      view: checked,
      create: checked,
      edit: checked,
      delete: checked,
    };
    form.setFieldsValue({ permissions: updated });
  };

  const handleToggleAction = (moduleKey: string, action: string, checked: boolean) => {
    const currentPerms = form.getFieldValue('permissions') || {};
    const updated = { ...currentPerms };
    const modulePerms = { ...(updated[moduleKey] || { view: false, create: false, edit: false, delete: false }) };
    modulePerms[action as keyof typeof modulePerms] = checked;
    // If enabling create/edit/delete, auto-enable view
    if (checked && action !== 'view') {
      modulePerms.view = true;
    }
    // If disabling view, disable all
    if (!checked && action === 'view') {
      modulePerms.create = false;
      modulePerms.edit = false;
      modulePerms.delete = false;
    }
    updated[moduleKey] = modulePerms;
    form.setFieldsValue({ permissions: updated });
  };

  const selectAll = () => {
    const allTrue: RolePermissions = {};
    MODULES.forEach((mod) => {
      allTrue[mod.key] = { view: true, create: true, edit: true, delete: true };
    });
    form.setFieldsValue({ permissions: allTrue });
  };

  const deselectAll = () => {
    form.setFieldsValue({ permissions: { ...DEFAULT_PERMISSIONS } });
  };

  return (
    <Modal
      title={isEdit ? `Modifier le rôle : ${role?.name}` : 'Nouveau rôle'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      okText={isEdit ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {role?.isSystem && (
          <Alert
            message="Rôle système"
            description="Le nom de ce rôle ne peut pas être modifié. Vous pouvez modifier sa description et ses permissions."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="name"
            label="Nom du rôle"
            rules={[{ required: true, message: 'Le nom est obligatoire' }]}
            style={{ flex: 1 }}
          >
            <Input
              placeholder="Ex: COMMERCIAL, SUPPORT..."
              disabled={role?.isSystem}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item name="description" label="Description" style={{ flex: 2 }}>
            <Input placeholder="Description du rôle" />
          </Form.Item>
        </div>

        <Divider orientation="left">Matrice des permissions</Divider>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <a onClick={selectAll}>Tout sélectionner</a>
          <span>|</span>
          <a onClick={deselectAll}>Tout désélectionner</a>
        </div>

        {/* Permission Matrix Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '250px repeat(5, 1fr)',
            gap: 4,
            padding: '8px 0',
            borderBottom: '2px solid #f0f0f0',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <div>Module</div>
          {ACTIONS.map((action) => (
            <div key={action} style={{ textAlign: 'center' }}>
              {ACTION_LABELS[action]}
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>Tout</div>
        </div>

        {/* Permission Matrix Rows */}
        <Form.Item noStyle shouldUpdate>
          {() => {
            const permissions: RolePermissions = form.getFieldValue('permissions') || {};
            return (
              <>
                {MODULES.map((mod, index) => {
                  const modPerms = permissions[mod.key] || {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                  };
                  const allChecked = ACTIONS.every((a) => modPerms[a]);
                  const someChecked = ACTIONS.some((a) => modPerms[a]);

                  return (
                    <div
                      key={mod.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '250px repeat(5, 1fr)',
                        gap: 4,
                        padding: '10px 0',
                        borderBottom: '1px solid #f5f5f5',
                        background: index % 2 === 0 ? '#fafafa' : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ paddingLeft: 8 }}>
                        <Text strong style={{ fontSize: 13 }}>
                          {mod.label}
                        </Text>
                      </div>
                      {ACTIONS.map((action) => (
                        <div key={action} style={{ textAlign: 'center' }}>
                          <Checkbox
                            checked={modPerms[action]}
                            onChange={(e) => handleToggleAction(mod.key, action, e.target.checked)}
                          />
                        </div>
                      ))}
                      <div style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked && !allChecked}
                          onChange={(e) => handleToggleAll(mod.key, e.target.checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}
