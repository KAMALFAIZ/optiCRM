import { useEffect, useState, useCallback } from 'react';
import {
  Card, Upload, Button, Image, Space, Popconfirm,
  message, Spin, Empty, Typography, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CameraOutlined, LoadingOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import { chantiersApi, ChantierPhotoDto } from '@/api/chantiers';

const { Text } = Typography;

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8081';

interface Props {
  chantierId: string;
}

export default function ChantierPhotosSection({ chantierId }: Props) {
  const [photos, setPhotos] = useState<ChantierPhotoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chantiersApi.getPhotos(chantierId);
      setPhotos(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [chantierId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file: RcFile) => {
    if (file.size > 5 * 1024 * 1024) {
      message.error('La photo ne doit pas dépasser 5 MB');
      return false;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      message.error('Format non supporté. Utilisez JPEG, PNG, GIF ou WebP');
      return false;
    }
    setUploading(true);
    try {
      await chantiersApi.uploadPhoto(chantierId, file);
      message.success('Photo ajoutée');
      load();
    } catch {
      message.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
    return false; // prevent default upload
  };

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId);
    try {
      await chantiersApi.deletePhoto(chantierId, photoId);
      message.success('Photo supprimée');
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch {
      message.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const getPhotoUrl = (url: string) => `${API_BASE}${url}`;

  return (
    <Card
      title={
        <Space>
          <CameraOutlined />
          Galerie photos
          {photos.length > 0 && (
            <Text type="secondary" style={{ fontSize: 13 }}>({photos.length})</Text>
          )}
        </Space>
      }
      extra={
        <Upload
          accept="image/jpeg,image/png,image/gif,image/webp"
          showUploadList={false}
          beforeUpload={handleUpload}
          multiple={false}
        >
          <Button
            type="primary"
            size="small"
            icon={uploading ? <LoadingOutlined /> : <PlusOutlined />}
            loading={uploading}
          >
            Ajouter une photo
          </Button>
        </Upload>
      }
      style={{ marginTop: 16 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : photos.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Aucune photo pour ce chantier"
        >
          <Upload
            accept="image/jpeg,image/png,image/gif,image/webp"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button icon={<CameraOutlined />}>Ajouter la première photo</Button>
          </Upload>
        </Empty>
      ) : (
        <Image.PreviewGroup>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {photos.map(photo => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  width: 150,
                  height: 120,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                  flexShrink: 0,
                }}
              >
                <Image
                  src={getPhotoUrl(photo.url)}
                  alt={photo.originalName || 'photo'}
                  width={150}
                  height={120}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  preview={{ mask: 'Voir' }}
                />
                <Popconfirm
                  title="Supprimer cette photo ?"
                  okText="Supprimer"
                  okType="danger"
                  cancelText="Annuler"
                  onConfirm={() => handleDelete(photo.id)}
                >
                  <Tooltip title="Supprimer">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={deletingId === photo.id ? <LoadingOutlined /> : <DeleteOutlined />}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(255,255,255,0.85)',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    />
                  </Tooltip>
                </Popconfirm>
                {photo.originalName && (
                  <Tooltip title={photo.originalName}>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        fontSize: 11,
                        padding: '2px 6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {photo.originalName}
                    </div>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    </Card>
  );
}
