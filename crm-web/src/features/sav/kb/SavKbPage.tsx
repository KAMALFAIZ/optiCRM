import { useEffect, useState } from 'react';
import {
  Table, Button, Input, Select, Tag, Space, Card, Typography, Modal,
  Form, message, Tabs, Badge, Popconfirm,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, CheckCircleOutlined, EditOutlined,
  DeleteOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { savKbApi } from '@/api/sav';

const { Title, Text } = Typography;

const CATEGORIES = [
  'SAGE100_GC', 'SAGE100_PAIE', 'SAGE100_COMPTA', 'OPTICRM', 'OPTIBOARD', 'INFRA_SQL', 'ERPNEXT',
];

export default function SavKbPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchArticles = async () => {
    try {
      const { data } = await savKbApi.listArticles(filterCategorie);
      setArticles(Array.isArray(data) ? data : []);
    } catch {
      message.error('Erreur chargement KB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, [filterCategorie]);

  const filteredArticles = articles.filter(a =>
    !searchText || [a.codeArticle, a.titreFr, a.tags].join(' ').toLowerCase().includes(searchText.toLowerCase())
  );

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    form.setFieldsValue(article);
    setModalVisible(true);
  };

  const handleNew = () => {
    setEditingArticle(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingArticle?.id) {
        await savKbApi.updateArticle(editingArticle.id, values);
        message.success('Article mis à jour');
      } else {
        await savKbApi.createArticle(values);
        message.success('Article créé');
      }
      setModalVisible(false);
      fetchArticles();
    } finally {
      setSaving(false);
    }
  };

  const handleValider = async (id: string) => {
    await savKbApi.validerArticle(id);
    message.success('Article validé pour production ✓');
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    await savKbApi.deactivateArticle(id);
    message.success('Article désactivé');
    fetchArticles();
  };

  const handleRegenEmbed = async (id: string) => {
    try {
      await savKbApi.regenererEmbedding(id);
      message.success('Embedding régénéré');
    } catch {
      message.error('Erreur régénération embedding');
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'codeArticle',
      key: 'code',
      width: 90,
      render: (v: string) => <span className="font-mono text-xs font-semibold">{v}</span>,
    },
    {
      title: 'Catégorie',
      dataIndex: 'categorie',
      key: 'categorie',
      width: 130,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Titre',
      dataIndex: 'titreFr',
      key: 'titre',
      ellipsis: true,
    },
    {
      title: 'Criticité',
      dataIndex: 'criticiteDefaut',
      key: 'criticite',
      width: 80,
      render: (v: string) => <Tag color={v === 'P1' ? 'red' : v === 'P2' ? 'orange' : 'blue'}>{v}</Tag>,
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 100,
      render: (_: any, a: any) => (
        <Space>
          {a.valideParKamal ? <Tag color="success">Validé</Tag> : <Tag color="warning">Brouillon</Tag>}
          {!a.actif && <Tag color="default">Inactif</Tag>}
        </Space>
      ),
    },
    {
      title: 'Succès',
      key: 'succes',
      width: 80,
      render: (_: any, a: any) => (
        <Text type="secondary" className="text-xs">
          {a.nbUtilisations > 0 ? `${Math.round((a.nbSucces / a.nbUtilisations) * 100)}%` : '—'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, a: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(a)} className="rounded">
            Éditer
          </Button>
          {!a.valideParKamal && (
            <Button size="small" icon={<CheckCircleOutlined />} type="primary"
              onClick={() => handleValider(a.id)} className="rounded bg-green-600">
              Valider
            </Button>
          )}
          <Button size="small" icon={<ThunderboltOutlined />}
            onClick={() => handleRegenEmbed(a.id)} className="rounded" title="Régénérer embedding">
          </Button>
          <Popconfirm title="Désactiver cet article ?" onConfirm={() => handleDelete(a.id)}>
            <Button size="small" icon={<DeleteOutlined />} danger className="rounded" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="!mb-0">🧠 Gestion Knowledge Base SAV</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew} className="rounded-lg bg-blue-600">
          Nouvel article
        </Button>
      </div>

      <Card className="rounded-xl shadow mb-4">
        <Space size="middle" wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Rechercher..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-64 rounded-lg"
          />
          <Select
            placeholder="Catégorie"
            allowClear
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            onChange={setFilterCategorie}
            className="w-48"
          />
          <Badge count={filteredArticles.length} showZero>
            <Text type="secondary">articles</Text>
          </Badge>
        </Space>
      </Card>

      <Card className="rounded-xl shadow">
        <Table
          columns={columns}
          dataSource={filteredArticles}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20 }}
          rowClassName={(r) => !r.actif ? 'opacity-50' : ''}
        />
      </Card>

      {/* Modal création/édition article */}
      <Modal
        title={editingArticle ? `Éditer ${editingArticle.codeArticle}` : 'Nouvel article KB'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
        width={800}
        okText="Sauvegarder"
      >
        <Form form={form} layout="vertical" size="small">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="codeArticle" label="Code article" rules={[{ required: true }]}>
              <Input placeholder="ex: GC-15" />
            </Form.Item>
            <Form.Item name="categorie" label="Catégorie" rules={[{ required: true }]}>
              <Select options={CATEGORIES.map(c => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="criticiteDefaut" label="Criticité">
              <Select options={[{ value: 'P1' }, { value: 'P2' }, { value: 'P3' }]} />
            </Form.Item>
            <Form.Item name="niveauDifficulte" label="Niveau">
              <Select options={['DEBUTANT', 'INTERMEDIAIRE', 'EXPERT'].map(v => ({ value: v, label: v }))} />
            </Form.Item>
          </div>
          <Form.Item name="titreFr" label="Titre (FR)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="symptomesFr" label="Symptômes (FR)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="causesFr" label="Causes (FR)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="solutionInterFr" label="Solution intermédiaire (FR)" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="solutionExpertFr" label="Solution expert (FR)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="solutionDebutFr" label="Solution débutant (FR)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="tags" label="Tags (séparés par virgule)">
            <Input placeholder="sage100,comptabilite,cloture" />
          </Form.Item>
          <Form.Item name="motsClesFr" label="Mots-clés FR">
            <Input.TextArea rows={1} placeholder="période clôturée,exercice fermé,..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
