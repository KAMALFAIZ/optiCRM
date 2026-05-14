/**
 * PrintReceiptModal — Modal d'impression pour les documents de livraison.
 * Supporte : bon de livraison (ligne), rapport de règlement, bon de déchargement.
 */
import { Modal, Button, Space, Divider, Tag, Table } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

export type PrintDocType = 'RECEIPT' | 'SETTLEMENT' | 'UNLOAD';

// ── Shared types (subset of what we need for printing) ────────────────────

interface PrintLine {
  id: string;
  customerName?: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMode?: string;
  visitResult?: string;
}

interface PrintSettlement {
  tourDate: string;
  zone?: string;
  representativeName?: string;
  totalAmount: number;
  cashAmount: number;
  chequeAmount: number;
  creditAmount: number;
  unloadedValue?: number;
  discrepancy?: number;
}

interface PrintUnloadItem {
  itemName?: string;
  loadedQty: number;
  soldQty: number;
  returnedQty: number;
  confirmedQty?: number;
}

export interface PrintReceiptModalProps {
  open: boolean;
  onClose: () => void;
  docType: PrintDocType;
  title?: string;
  // For RECEIPT
  lines?: PrintLine[];
  tourDate?: string;
  zone?: string;
  // For SETTLEMENT
  settlement?: PrintSettlement;
  // For UNLOAD
  unloadItems?: PrintUnloadItem[];
}

// ── Print CSS injected into the document head ─────────────────────────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden; }
  #print-zone, #print-zone * { visibility: visible; }
  #print-zone {
    position: absolute; left: 0; top: 0; width: 100%;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
  .no-print { display: none !important; }
  .ant-modal-footer { display: none !important; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 11px; }
  th { background: #f0f0f0; }
}
`;

function injectPrintStyle() {
  if (document.getElementById('opticrm-print-style')) return;
  const style = document.createElement('style');
  style.id = 'opticrm-print-style';
  style.textContent = PRINT_STYLE;
  document.head.appendChild(style);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ReceiptDoc({ lines = [], tourDate, zone }: { lines: PrintLine[]; tourDate?: string; zone?: string }) {
  const total = lines.reduce((s, l) => s + l.totalAmount, 0);
  const collected = lines.reduce((s, l) => s + (l.paidAmount ?? 0), 0);

  const cols: ColumnsType<PrintLine> = [
    { title: 'Client', dataIndex: 'customerName', key: 'c', render: (v: string) => v ?? '—' },
    { title: 'Article', dataIndex: 'itemName', key: 'i', render: (v: string) => v ?? '—' },
    { title: 'Qté', dataIndex: 'quantity', key: 'q', align: 'center' },
    { title: 'P.U', dataIndex: 'unitPrice', key: 'pu', render: (v: number) => v.toFixed(2) },
    { title: 'Total', dataIndex: 'totalAmount', key: 't', render: (v: number) => v.toFixed(2) },
    {
      title: 'Encaissé', dataIndex: 'paidAmount', key: 'p',
      render: (v: number) => v != null ? v.toFixed(2) : '—',
    },
    {
      title: 'Mode', dataIndex: 'paymentMode', key: 'm',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Résultat', dataIndex: 'visitResult', key: 'r',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
    },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>OptiCRM — Bon de Livraison</h2>
        {tourDate && <div>Tournée du {tourDate}{zone ? ` — Zone: ${zone}` : ''}</div>}
        <div style={{ fontSize: 11, color: '#888' }}>
          Imprimé le {new Date().toLocaleString('fr-FR')}
        </div>
      </div>
      <Table dataSource={lines} columns={cols} rowKey="id" size="small" pagination={false} />
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
        <span>Total : <strong>{total.toFixed(2)} DH</strong></span>
        <span>Encaissé : <strong>{collected.toFixed(2)} DH</strong></span>
        <span>Crédit : <strong>{(total - collected).toFixed(2)} DH</strong></span>
      </div>
    </div>
  );
}

function SettlementDoc({ s }: { s: PrintSettlement }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>OptiCRM — Rapport de Règlement</h2>
        <div>Tournée du {s.tourDate}{s.zone ? ` — Zone: ${s.zone}` : ''}</div>
        {s.representativeName && <div>Représentant : {s.representativeName}</div>}
        <div style={{ fontSize: 11, color: '#888' }}>
          Imprimé le {new Date().toLocaleString('fr-FR')}
        </div>
      </div>
      <Divider />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            ['Total ventes', s.totalAmount.toFixed(2) + ' DH'],
            ['Espèces', s.cashAmount.toFixed(2) + ' DH'],
            ['Chèques', s.chequeAmount.toFixed(2) + ' DH'],
            ['Crédit accordé', s.creditAmount.toFixed(2) + ' DH'],
            ...(s.unloadedValue != null ? [['Valeur retournée', s.unloadedValue.toFixed(2) + ' DH']] : []),
            ...(s.discrepancy != null ? [['Écart caisse', (s.discrepancy >= 0 ? '+' : '') + s.discrepancy.toFixed(2) + ' DH']] : []),
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '6px 12px', border: '1px solid #ddd', width: '60%' }}>{label}</td>
              <td style={{ padding: '6px 12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: 160, marginBottom: 4 }} />
          <div>Représentant</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: 160, marginBottom: 4 }} />
          <div>Responsable</div>
        </div>
      </div>
    </div>
  );
}

function UnloadDoc({ items = [], tourDate }: { items: PrintUnloadItem[]; tourDate?: string }) {
  const cols: ColumnsType<PrintUnloadItem> = [
    { title: 'Article', dataIndex: 'itemName', key: 'n', render: (v: string) => v ?? '—' },
    { title: 'Chargé', dataIndex: 'loadedQty', key: 'l', align: 'center' },
    { title: 'Vendu', dataIndex: 'soldQty', key: 's', align: 'center' },
    { title: 'Retourné', dataIndex: 'returnedQty', key: 'r', align: 'center' },
    {
      title: 'Écart',
      key: 'e',
      align: 'center',
      render: (_: unknown, row: PrintUnloadItem) => {
        const ecart = row.loadedQty - row.soldQty - row.returnedQty;
        return <span style={{ color: ecart !== 0 ? 'red' : 'inherit' }}>{ecart}</span>;
      },
    },
    { title: 'Confirmé', dataIndex: 'confirmedQty', key: 'c', align: 'center', render: (v: number) => v ?? '—' },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>OptiCRM — Bon de Déchargement</h2>
        {tourDate && <div>Tournée du {tourDate}</div>}
        <div style={{ fontSize: 11, color: '#888' }}>
          Imprimé le {new Date().toLocaleString('fr-FR')}
        </div>
      </div>
      <Table dataSource={items} columns={cols} rowKey="itemName" size="small" pagination={false} />
      <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: 160, marginBottom: 4 }} />
          <div>Représentant</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: 160, marginBottom: 4 }} />
          <div>Responsable magasin</div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PrintReceiptModal({
  open, onClose, docType, title,
  lines = [], tourDate, zone,
  settlement,
  unloadItems = [],
}: PrintReceiptModalProps) {

  const handlePrint = () => {
    injectPrintStyle();
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      title={title ?? 'Aperçu avant impression'}
      footer={
        <Space className="no-print">
          <Button onClick={onClose}>Fermer</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Imprimer
          </Button>
        </Space>
      }
    >
      <div id="print-zone" style={{ padding: '8px 0' }}>
        {docType === 'RECEIPT' && (
          <ReceiptDoc lines={lines} tourDate={tourDate} zone={zone} />
        )}
        {docType === 'SETTLEMENT' && settlement && (
          <SettlementDoc s={settlement} />
        )}
        {docType === 'UNLOAD' && (
          <UnloadDoc items={unloadItems} tourDate={tourDate} />
        )}
      </div>
    </Modal>
  );
}
