import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { BonLivraison } from '../types/vanSelling';

/**
 * Service d'impression pour les Bons de Livraison.
 *
 * Deux modes :
 *  1. PDF via expo-print  → partage natif (email, WhatsApp, etc.)
 *  2. ESC/POS texte       → compatible imprimante thermique 58/80mm BT
 *     (nécessite react-native-thermal-receipt-printer installé séparément)
 */

// ─── Génération HTML → PDF ────────────────────────────────────────────────────

function buildHtml(bl: BonLivraison): string {
  const lignesHtml = (bl.lignes ?? [])
    .map(
      (l) => `
      <tr>
        <td>${l.produitCode}</td>
        <td>${l.produitNom}</td>
        <td style="text-align:center">${l.quantite}</td>
        <td style="text-align:right">${l.prixApplique.toFixed(2)}</td>
        ${l.remisePct > 0 ? `<td style="text-align:right">${l.remisePct.toFixed(0)}%</td>` : '<td>-</td>'}
        <td style="text-align:right">${l.montantHt.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .title { font-size: 22px; font-weight: bold; color: #0D9488; }
    .numero { font-size: 14px; color: #555; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-block { background: #f9f9f9; border-radius: 6px; padding: 12px; }
    .info-block h4 { margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .info-block p { margin: 2px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #0D9488; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
    td { padding: 6px; border-bottom: 1px solid #eee; }
    tr:last-child td { border-bottom: none; }
    .totals { margin-left: auto; width: 220px; }
    .totals table td { border-bottom: none; padding: 4px 6px; }
    .totals .total-ttc { font-weight: bold; font-size: 14px; color: #0D9488; background: #f0fdfa; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-box { border: 1px solid #ccc; width: 160px; height: 70px; border-radius: 4px;
                     display: flex; align-items: center; justify-content: center; font-size: 10px; color: #aaa; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Bon de Livraison</div>
      <div class="numero">${bl.numero}</div>
    </div>
    <div style="text-align:right; font-size:11px; color:#777">
      <div>${new Date(bl.createdAt).toLocaleDateString('fr-MA')}</div>
      <div>Véhicule : ${bl.vehiculeImmatriculation}</div>
      <div>Commercial : ${bl.collaborateurNom}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h4>Client</h4>
      <p><strong>${bl.clientNom}</strong></p>
      ${bl.clientSageCode ? `<p>Code Sage : ${bl.clientSageCode}</p>` : ''}
    </div>
    <div class="info-block">
      <h4>Statut</h4>
      <p>${bl.statut}</p>
      ${bl.sageReference ? `<p>Réf. Sage : ${bl.sageReference}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th><th>Désignation</th><th style="text-align:center">Qté</th>
        <th style="text-align:right">P.U. HT</th><th>Remise</th><th style="text-align:right">Montant HT</th>
      </tr>
    </thead>
    <tbody>${lignesHtml}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Total HT</td><td style="text-align:right">${bl.montantHt.toFixed(2)} MAD</td></tr>
      <tr><td>TVA</td><td style="text-align:right">${bl.montantTva.toFixed(2)} MAD</td></tr>
      <tr class="total-ttc"><td><strong>Total TTC</strong></td>
          <td style="text-align:right"><strong>${bl.montantTtc.toFixed(2)} MAD</strong></td></tr>
    </table>
  </div>

  <div class="footer">
    <div style="font-size:10px; color:#aaa">Généré par OptiCRM</div>
    <div>
      <div style="font-size:10px; margin-bottom:4px">Signature client</div>
      <div class="signature-box">
        ${bl.signatureCapturee ? '✓ Signature enregistrée' : 'Signature client'}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function imprimerBLEnPDF(bl: BonLivraison): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(bl) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `BL ${bl.numero}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

// ─── Génération ESC/POS texte (imprimante thermique 58/80mm) ─────────────────

const ESC = '\x1B';
const BOLD_ON  = `${ESC}E\x01`;
const BOLD_OFF = `${ESC}E\x00`;
const CENTER   = `${ESC}a\x01`;
const LEFT     = `${ESC}a\x00`;
const CUT      = `${ESC}m`;
const LINE     = '--------------------------------';

function pad(text: string, width: number, right = false): string {
  if (right) return text.padStart(width).slice(-width);
  return text.padEnd(width).slice(0, width);
}

export function buildEscPosBL(bl: BonLivraison): string {
  const lines: string[] = [
    CENTER,
    BOLD_ON, 'BON DE LIVRAISON\n', BOLD_OFF,
    `${bl.numero}\n`,
    `${new Date(bl.createdAt).toLocaleDateString('fr-MA')}\n`,
    LEFT,
    LINE + '\n',
    `Client : ${bl.clientNom}\n`,
    `Commercial : ${bl.collaborateurNom}\n`,
    `Vehicule : ${bl.vehiculeImmatriculation}\n`,
    LINE + '\n',
    BOLD_ON,
    `${pad('Article', 18)}${pad('Qte', 4, true)}${pad('MontHT', 10, true)}\n`,
    BOLD_OFF,
    LINE + '\n',
    ...(bl.lignes ?? []).map(
      (l) =>
        `${pad(l.produitNom.slice(0, 18), 18)}${pad(String(l.quantite), 4, true)}` +
        `${pad(l.montantHt.toFixed(2), 10, true)}\n`
    ),
    LINE + '\n',
    `${pad('Total HT', 22)}${pad(bl.montantHt.toFixed(2) + ' MAD', 10, true)}\n`,
    `${pad('TVA', 22)}${pad(bl.montantTva.toFixed(2) + ' MAD', 10, true)}\n`,
    BOLD_ON,
    `${pad('TOTAL TTC', 22)}${pad(bl.montantTtc.toFixed(2) + ' MAD', 10, true)}\n`,
    BOLD_OFF,
    LINE + '\n',
    CENTER,
    'Merci pour votre confiance\n\n\n',
    CUT,
  ];
  return lines.join('');
}

/**
 * Pour activer l'impression BT thermique, installer :
 *   npx expo install react-native-thermal-receipt-printer-image-qr
 * Puis décommenter le bloc ci-dessous et supprimer la ligne "throw".
 */
export async function imprimerBLThermique(bl: BonLivraison): Promise<void> {
  throw new Error(
    'Impression BT thermique non activée. ' +
    'Installez react-native-thermal-receipt-printer-image-qr et configurez le service.'
  );

  // ── Décommenter après installation ──────────────────────────────────────────
  // import ThermalPrinterModule from 'react-native-thermal-receipt-printer-image-qr';
  // const escpos = buildEscPosBL(bl);
  // await ThermalPrinterModule.printBluetooth({ payload: escpos, printerNbrCharactersPerLine: 32 });
}
