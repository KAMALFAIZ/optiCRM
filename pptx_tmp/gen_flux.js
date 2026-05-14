/**
 * OptiCRM — Flux des Modules
 * Generates a 10-slide PPTX showing all module workflows
 */
const pptxgen = require("pptxgenjs");
const path = require("path");

const OUT = path.join(__dirname, "..", "OptiCRM_Flux_Modules.pptx");

// ─── COLOR PALETTE ─────────────────────────────────────────────────────────
const C = {
  navy:     "0D2B45",   // dark bg
  blue:     "1A5C8A",   // primary
  teal:     "0D8F8F",   // secondary
  cyan:     "17A8C4",   // accent
  green:    "16A34A",
  orange:   "E07B39",
  red:      "C0392B",
  purple:   "7C3D8C",
  gold:     "D4A017",
  light:    "E8F4F8",   // very light blue
  white:    "FFFFFF",
  offwhite: "F5F9FC",
  gray:     "64748B",
  darkgray: "334155",
  mid:      "94A3B8",
};

// Module color map
const MOD = {
  crm:       "1A5C8A",
  stock:     "16A34A",
  finance:   "E07B39",
  odyssee:   "7C3D8C",
  terrain:   "0D8F8F",
  marketing: "D4A017",
  pilotage:  "17A8C4",
  admin:     "64748B",
  ia:        "C0392B",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────
const makeShadow = () => ({
  type: "outer", blur: 6, offset: 3, angle: 135, color: "000000", opacity: 0.12
});

function bgDark(slide) {
  slide.background = { color: C.navy };
}
function bgLight(slide) {
  slide.background = { color: C.offwhite };
}

/** Full-width top accent bar */
function topBar(slide, color) {
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 0.08, fill: { color } });
}

/** Slide title (for dark slides) */
function darkTitle(slide, title, sub) {
  slide.addText(title, {
    x: 0.5, y: 0.18, w: 9, h: 0.65, margin: 0,
    fontSize: 30, bold: true, color: C.white, fontFace: "Calibri"
  });
  if (sub) {
    slide.addText(sub, {
      x: 0.5, y: 0.82, w: 9, h: 0.3, margin: 0,
      fontSize: 13, color: C.mid, fontFace: "Calibri", italic: true
    });
  }
}

/** Slide title (for light slides) */
function lightTitle(slide, title, sub) {
  slide.addText(title, {
    x: 0.5, y: 0.18, w: 9, h: 0.6, margin: 0,
    fontSize: 28, bold: true, color: C.navy, fontFace: "Calibri"
  });
  if (sub) {
    slide.addText(sub, {
      x: 0.5, y: 0.76, w: 9, h: 0.28, margin: 0,
      fontSize: 12, color: C.gray, fontFace: "Calibri", italic: true
    });
  }
}

/** Horizontal divider line */
function hline(slide, y, color) {
  slide.addShape("line", {
    x: 0.5, y, w: 9, h: 0,
    line: { color: color || C.mid, width: 0.5 }
  });
}

/**
 * Draw a horizontal flow: boxes connected by arrows
 * steps = [{label, sub, color}]
 * startX, y, boxW, boxH, gapW
 */
function hFlow(slide, steps, opts = {}) {
  const {
    startX = 0.4, y = 1.2, boxW = 1.4, boxH = 0.7,
    gapW = 0.35, textColor = C.white, fontSize = 10.5
  } = opts;

  steps.forEach((s, i) => {
    const bx = startX + i * (boxW + gapW);
    // Box
    slide.addShape("roundRect", {
      x: bx, y, w: boxW, h: boxH,
      fill: { color: s.color || C.blue },
      rectRadius: 0.06,
      shadow: makeShadow()
    });
    // Label
    slide.addText(s.label, {
      x: bx, y: y + 0.03, w: boxW, h: s.sub ? boxH * 0.54 : boxH,
      margin: 3, align: "center", valign: s.sub ? "middle" : "middle",
      fontSize, bold: true, color: textColor, fontFace: "Calibri"
    });
    if (s.sub) {
      slide.addText(s.sub, {
        x: bx, y: y + boxH * 0.54, w: boxW, h: boxH * 0.44,
        margin: 3, align: "center", valign: "top",
        fontSize: fontSize - 2, color: textColor, fontFace: "Calibri",
        transparency: 20
      });
    }
    // Arrow (not after last)
    if (i < steps.length - 1) {
      const ax = bx + boxW;
      const ay = y + boxH / 2;
      slide.addShape("line", {
        x: ax, y: ay, w: gapW, h: 0,
        line: { color: C.mid, width: 1.2, endArrowType: "open" }
      });
    }
  });
}

/**
 * Module card (for overview slide)
 */
function moduleCard(slide, x, y, w, h, label, items, color) {
  // Card background
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.white },
    line: { color, width: 1.5 },
    shadow: makeShadow()
  });
  // Top colored header
  slide.addShape("rect", {
    x, y, w, h: 0.3,
    fill: { color }
  });
  slide.addText(label, {
    x: x + 0.08, y: y + 0.03, w: w - 0.1, h: 0.25,
    margin: 0, fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri"
  });
  // Items
  items.forEach((item, i) => {
    slide.addText("• " + item, {
      x: x + 0.1, y: y + 0.34 + i * 0.22, w: w - 0.15, h: 0.2,
      margin: 0, fontSize: 8, color: C.darkgray, fontFace: "Calibri"
    });
  });
}

/**
 * Info row (icon box + text)
 */
function infoRow(slide, x, y, w, color, label, desc) {
  slide.addShape("rect", {
    x, y, w: 0.28, h: 0.28,
    fill: { color }
  });
  slide.addText(label, {
    x: x + 0.34, y: y + 0.02, w: w - 0.34, h: 0.14,
    margin: 0, fontSize: 10, bold: true, color: C.navy, fontFace: "Calibri"
  });
  slide.addText(desc, {
    x: x + 0.34, y: y + 0.15, w: w - 0.34, h: 0.14,
    margin: 0, fontSize: 8.5, color: C.gray, fontFace: "Calibri"
  });
}

// ─── BUILD PRESENTATION ──────────────────────────────────────────────────
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "OptiCRM — Flux des Modules";
pres.author = "OptiCRM";

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgDark(s);

  // Left accent bar
  s.addShape("rect", { x: 0, y: 0, w: 0.25, h: 5.625, fill: { color: C.teal } });

  // Decorative circles
  s.addShape("ellipse", { x: 7.5, y: -0.5, w: 3.5, h: 3.5,
    fill: { color: C.blue, transparency: 65 }, line: { color: C.blue, transparency: 65 } });
  s.addShape("ellipse", { x: 6.5, y: 2.5, w: 2.5, h: 2.5,
    fill: { color: C.teal, transparency: 70 }, line: { color: C.teal, transparency: 70 } });

  // Title text
  s.addText("OptiCRM", {
    x: 0.6, y: 1.1, w: 6.5, h: 0.9, margin: 0,
    fontSize: 46, bold: true, color: C.white, fontFace: "Calibri",
    charSpacing: 3
  });
  s.addText("Flux des Modules", {
    x: 0.6, y: 1.95, w: 6.5, h: 0.7, margin: 0,
    fontSize: 26, color: C.cyan, fontFace: "Calibri"
  });
  s.addText("Processus, interactions et workflows de toutes les fonctionnalités", {
    x: 0.6, y: 2.75, w: 6.8, h: 0.4, margin: 0,
    fontSize: 13, color: C.mid, fontFace: "Calibri", italic: true
  });

  // Bottom separator
  s.addShape("line", { x: 0.6, y: 3.4, w: 5.5, h: 0,
    line: { color: C.teal, width: 1.5 } });

  s.addText("Version 1.0  •  Mars 2026  •  Usage Interne", {
    x: 0.6, y: 3.6, w: 8, h: 0.3, margin: 0,
    fontSize: 11, color: C.gray, fontFace: "Calibri"
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — VUE D'ENSEMBLE DES MODULES
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, C.navy);

  lightTitle(s, "Vue d'Ensemble — Cartographie des Modules",
    "9 modules interconnectés autour d'une base de données centralisée");

  hline(s, 1.08);

  // Central hub
  s.addShape("ellipse", {
    x: 4.05, y: 1.85, w: 1.9, h: 1.0,
    fill: { color: C.navy }, shadow: makeShadow()
  });
  s.addText("BASE\nOptiCRM", {
    x: 4.05, y: 1.85, w: 1.9, h: 1.0,
    margin: 0, align: "center", valign: "middle",
    fontSize: 10, bold: true, color: C.white, fontFace: "Calibri"
  });

  // Modules around the hub (3 per row, 3 rows)
  const modules = [
    // Row 1 (top)
    { x: 0.3,  y: 1.2,  label: "CRM",       sub: "Comptes · Contacts\nPistes · Opportunités", color: MOD.crm },
    { x: 3.9,  y: 1.15, label: "STOCK",      sub: "Produits\nInventaire", color: MOD.stock },  // overlaps hub — adjust below
    { x: 7.5,  y: 1.2,  label: "FINANCE",    sub: "Factures · Paiements\nCommandes · Balance", color: MOD.finance },
    // Row 2 (middle)
    { x: 0.3,  y: 2.6,  label: "ODYSSÉE",    sub: "Chantiers\nCarte interactive", color: MOD.odyssee },
    { x: 7.5,  y: 2.6,  label: "TERRAIN",    sub: "Activités · Visites\nTournées · Frais", color: MOD.terrain },
    // Row 3 (bottom)
    { x: 0.3,  y: 4.0,  label: "MARKETING",  sub: "Campagnes\nTemplates Email", color: MOD.marketing },
    { x: 3.4,  y: 4.0,  label: "PILOTAGE",   sub: "KPIs · Objectifs\nRapports · Prévisions", color: MOD.pilotage },
    { x: 6.5,  y: 4.0,  label: "ADMIN",      sub: "Utilisateurs · Tarifs\nIntégrations · Paramètres", color: MOD.admin },
    { x: 8.6,  y: 4.0,  label: "IA",         sub: "Assistant Claude\nAnalyse & Rédaction", color: MOD.ia },
  ];

  const bw = 1.65, bh = 0.88;

  modules.forEach(m => {
    // Adjust stock box to avoid hub overlap
    let bx = m.x, by = m.y;
    if (m.label === "STOCK") { bx = 2.0; }

    slide_drawModBox(s, bx, by, bw, bh, m.label, m.sub, m.color);

    // Connector line to center
    const cx = 4.05 + 0.95, cy = 1.85 + 0.5;
    const bCenterX = bx + bw / 2, bCenterY = by + bh / 2;
    // Don't draw if too close
    const dx = cx - bCenterX, dy = cy - bCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1.2) {
      s.addShape("line", {
        x: bCenterX, y: bCenterY, w: dx, h: dy,
        line: { color: C.mid, width: 0.5, dashType: "dash" }
      });
    }
  });
}

function slide_drawModBox(s, x, y, w, h, label, sub, color) {
  s.addShape("rect", {
    x, y, w, h,
    fill: { color },
    shadow: makeShadow()
  });
  s.addText(label, {
    x, y: y + 0.04, w, h: 0.32,
    margin: 4, align: "center", valign: "middle",
    fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri"
  });
  s.addText(sub, {
    x, y: y + 0.36, w, h: h - 0.36,
    margin: 4, align: "center", valign: "top",
    fontSize: 8.5, color: C.white, fontFace: "Calibri",
    transparency: 15
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — FLUX COMMERCIAL PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.crm);

  lightTitle(s, "Flux Commercial Principal",
    "Du premier contact à l'encaissement — cycle de vente complet");
  hline(s, 1.08);

  // Main flow — 7 steps
  const steps = [
    { label: "PISTE",       sub: "Lead entrant",        color: "3B82F6" },
    { label: "CONTACT",     sub: "Qualification",        color: "2563EB" },
    { label: "COMPTE",      sub: "Création client",      color: "1D4ED8" },
    { label: "OPPORTUNITÉ", sub: "Pipeline",             color: MOD.crm },
    { label: "DEVIS",       sub: "Proposition",          color: "1A5C8A" },
    { label: "COMMANDE",    sub: "Bon de commande",      color: MOD.finance },
    { label: "FACTURE",     sub: "Émission",             color: "D97706" },
  ];

  // Draw top row (7 boxes)
  const bw = 1.16, bh = 0.78, gap = 0.22, startX = 0.32, rowY = 1.3;
  steps.forEach((st, i) => {
    const bx = startX + i * (bw + gap);
    s.addShape("rect", { x: bx, y: rowY, w: bw, h: bh,
      fill: { color: st.color }, shadow: makeShadow() });
    s.addText(st.label, {
      x: bx, y: rowY + 0.05, w: bw, h: 0.38,
      margin: 2, align: "center", valign: "middle",
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri"
    });
    s.addText(st.sub, {
      x: bx, y: rowY + 0.43, w: bw, h: 0.3,
      margin: 2, align: "center", valign: "top",
      fontSize: 7.5, color: C.white, fontFace: "Calibri", transparency: 20
    });
    if (i < steps.length - 1) {
      s.addShape("line", {
        x: bx + bw, y: rowY + bh / 2, w: gap, h: 0,
        line: { color: C.mid, width: 1.5, endArrowType: "open" }
      });
    }
  });

  // Payment arrow + box at end
  const lastX = startX + 6 * (bw + gap);
  s.addShape("line", {
    x: lastX + bw, y: rowY + bh / 2, w: 0.25, h: 0,
    line: { color: C.mid, width: 1.5, endArrowType: "open" }
  });
  const payX = lastX + bw + 0.25;
  s.addShape("rect", { x: payX, y: rowY, w: 1.02, h: bh,
    fill: { color: MOD.stock }, shadow: makeShadow() });
  s.addText("PAIEMENT", { x: payX, y: rowY + 0.05, w: 1.02, h: 0.38,
    margin: 2, align: "center", valign: "middle",
    fontSize: 9, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Règlement", { x: payX, y: rowY + 0.43, w: 1.02, h: 0.3,
    margin: 2, align: "center", fontSize: 7.5, color: C.white, fontFace: "Calibri", transparency: 20 });

  // ── Detail cards below each box ──
  const details = [
    ["Source", "Score", "Statut"],
    ["Infos", "Poste", "Email"],
    ["ICE / RC", "Adresse", "Tarif"],
    ["Étape", "Montant", "Proba."],
    ["Lignes", "Remise", "TVA"],
    ["Prépa.", "Livraison", "BL"],
    ["Solde", "Échéance", "PDF"],
    ["Mode", "Date", "Reçu"],
  ];
  const allBoxes = [...steps, { label: "PAIEMENT", color: MOD.stock }];
  const allX = [...steps.map((_, i) => startX + i * (bw + gap)), payX];
  const allW = [...steps.map(() => bw), 1.02];

  details.forEach((d, i) => {
    const bx = allX[i], bw2 = allW[i];
    const cardY = rowY + bh + 0.25;
    s.addShape("rect", {
      x: bx, y: cardY, w: bw2, h: 0.72,
      fill: { color: C.white }, line: { color: allBoxes[i].color, width: 1 },
      shadow: makeShadow()
    });
    d.forEach((item, j) => {
      s.addText("• " + item, {
        x: bx + 0.05, y: cardY + 0.05 + j * 0.2, w: bw2 - 0.1, h: 0.19,
        margin: 0, fontSize: 7.5, color: C.darkgray, fontFace: "Calibri"
      });
    });
    // Connector
    s.addShape("line", {
      x: bx + bw2 / 2, y: rowY + bh, w: 0, h: 0.25,
      line: { color: C.mid, width: 0.5, dashType: "dash" }
    });
  });

  // Feedback arrow (bottom)
  s.addShape("line", {
    x: 0.5, y: 4.95, w: 9, h: 0,
    line: { color: MOD.crm, width: 1, dashType: "dash", endArrowType: "open" }
  });
  s.addText("Chronologie 360° — Historique complet de toutes les interactions par compte",
    { x: 0.5, y: 5.05, w: 9, h: 0.25, margin: 0, align: "center",
      fontSize: 9, color: C.gray, fontFace: "Calibri", italic: true });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — MODULE CRM
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.crm);

  lightTitle(s, "Module CRM — Gestion des Comptes, Contacts & Pistes",
    "De la prospection à la qualification commerciale");
  hline(s, 1.08);

  // Left column: Compte flow
  const col1X = 0.3;
  s.addShape("rect", { x: col1X, y: 1.2, w: 2.6, h: 0.42,
    fill: { color: MOD.crm }, shadow: makeShadow() });
  s.addText("COMPTE CLIENT", { x: col1X, y: 1.2, w: 2.6, h: 0.42,
    margin: 0, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const accountTabs = [
    { label: "Détails", desc: "Infos légales, ICE, IF, RC", color: "3B82F6" },
    { label: "Contacts", desc: "Interlocuteurs rattachés", color: "2563EB" },
    { label: "Situation", desc: "Solde, encours, retards", color: "D97706" },
    { label: "Factures", desc: "Historique facturation", color: "D97706" },
    { label: "Commandes", desc: "Bons de commande", color: "D97706" },
    { label: "Chantiers", desc: "Projets associés", color: MOD.odyssee },
    { label: "Opportunités", desc: "Pipeline actif", color: MOD.crm },
    { label: "Activités", desc: "Appels, visites, réunions", color: MOD.terrain },
    { label: "Chrono 360°", desc: "Historique complet", color: C.navy },
  ];

  accountTabs.forEach((t, i) => {
    const ty = 1.75 + i * 0.36;
    s.addShape("rect", { x: col1X, y: ty, w: 0.22, h: 0.28, fill: { color: t.color } });
    s.addText(t.label, { x: col1X + 0.28, y: ty + 0.01, w: 1.3, h: 0.15,
      margin: 0, fontSize: 9.5, bold: true, color: C.navy, fontFace: "Calibri" });
    s.addText(t.desc, { x: col1X + 0.28, y: ty + 0.15, w: 2.2, h: 0.13,
      margin: 0, fontSize: 8, color: C.gray, fontFace: "Calibri" });
  });

  // Middle column: Contact flow
  const col2X = 3.3;
  s.addShape("rect", { x: col2X, y: 1.2, w: 2.6, h: 0.42,
    fill: { color: "2563EB" }, shadow: makeShadow() });
  s.addText("CONTACT", { x: col2X, y: 1.2, w: 2.6, h: 0.42,
    margin: 0, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const contactFields = [
    "Prénom / Nom / Poste",
    "Téléphone / Mobile / Email",
    "Rattaché à un Compte",
    "Historique des activités",
    "Dernière interaction",
  ];
  contactFields.forEach((f, i) => {
    s.addText("• " + f, { x: col2X + 0.1, y: 1.75 + i * 0.38, w: 2.4, h: 0.3,
      margin: 0, fontSize: 10, color: C.darkgray, fontFace: "Calibri" });
  });

  // Contact → Opportunité arrow
  s.addShape("line", { x: col2X + 1.3, y: 3.7, w: 0, h: 0.4,
    line: { color: MOD.crm, width: 1.5, endArrowType: "open" } });
  s.addShape("rect", { x: col2X + 0.3, y: 4.1, w: 2.0, h: 0.38,
    fill: { color: MOD.crm }, shadow: makeShadow() });
  s.addText("→ Opportunité", { x: col2X + 0.3, y: 4.1, w: 2.0, h: 0.38,
    margin: 0, align: "center", valign: "middle",
    fontSize: 10, bold: true, color: C.white, fontFace: "Calibri" });

  // Right column: Lead flow
  const col3X = 6.3;
  s.addShape("rect", { x: col3X, y: 1.2, w: 3.3, h: 0.42,
    fill: { color: "3B82F6" }, shadow: makeShadow() });
  s.addText("PISTE (LEAD)", { x: col3X, y: 1.2, w: 3.3, h: 0.42,
    margin: 0, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const leadSteps = [
    { label: "Nouveau", color: "3B82F6", desc: "Lead entrant (web, appel, salon)" },
    { label: "En contact", color: "2563EB", desc: "Premier échange effectué" },
    { label: "Qualifié", color: "1A5C8A", desc: "Besoin identifié, budget estimé" },
    { label: "Disqualifié", color: C.gray, desc: "Hors cible ou sans suite" },
  ];

  leadSteps.forEach((ls, i) => {
    const ly = 1.75 + i * 0.52;
    s.addShape("rect", { x: col3X, y: ly, w: 1.5, h: 0.38,
      fill: { color: ls.color }, shadow: makeShadow() });
    s.addText(ls.label, { x: col3X, y: ly, w: 1.5, h: 0.38,
      margin: 0, align: "center", valign: "middle",
      fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(ls.desc, { x: col3X + 1.6, y: ly + 0.08, w: 1.6, h: 0.26,
      margin: 0, fontSize: 8.5, color: C.gray, fontFace: "Calibri" });
    if (i < leadSteps.length - 2) {
      s.addShape("line", { x: col3X + 0.75, y: ly + 0.38, w: 0, h: 0.14,
        line: { color: C.mid, width: 0.8, endArrowType: "open" } });
    }
  });

  // Qualified → Convert
  s.addShape("line", { x: col3X + 0.75, y: 3.45, w: 0, h: 0.45,
    line: { color: MOD.crm, width: 1.5, dashType: "dash", endArrowType: "open" } });
  s.addShape("rect", { x: col3X, y: 3.9, w: 3.3, h: 0.42,
    fill: { color: MOD.crm }, shadow: makeShadow() });
  s.addText("CONVERSION → Compte + Contact + Opportunité",
    { x: col3X, y: 3.9, w: 3.3, h: 0.42,
      margin: 4, align: "center", valign: "middle",
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri" });

  // IA Button
  s.addShape("rect", { x: col1X, y: 4.9, w: 2.6, h: 0.4,
    fill: { color: MOD.ia }, shadow: makeShadow() });
  s.addText("🤖  Analyser avec l'IA",
    { x: col1X, y: 4.9, w: 2.6, h: 0.4,
      margin: 0, align: "center", valign: "middle",
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri" });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — MODULE FINANCE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.finance);

  lightTitle(s, "Module Finance — Facturation, Paiements & Analyses",
    "Flux de facturation et suivi des encaissements");
  hline(s, 1.08);

  // Top flow: BdC → Facture → Paiement → Clôturé
  const finFlow = [
    { label: "BON DE\nCOMMANDE",   sub: "Livraison confirmée",  color: "D97706" },
    { label: "FACTURE",            sub: "Émission + TVA",        color: "B45309" },
    { label: "ENVOI EMAIL",        sub: "PDF automatique",       color: MOD.crm },
    { label: "PAIEMENT",          sub: "Chèque / Virement\nTraite / Espèces", color: MOD.stock },
    { label: "SOLDÉE",             sub: "Encaissement total",    color: "16A34A" },
  ];
  hFlow(s, finFlow, { startX: 0.4, y: 1.25, boxW: 1.65, boxH: 0.82, gapW: 0.38, fontSize: 10 });

  // Statuses row
  const statuses = [
    { label: "BROUILLON", color: C.gray },
    { label: "ÉMISE", color: "3B82F6" },
    { label: "EN RETARD", color: MOD.ia },
    { label: "PART. PAYÉE", color: C.orange },
    { label: "SOLDÉE", color: "16A34A" },
    { label: "ANNULÉE", color: C.gray },
  ];
  s.addText("Statuts de facture :", { x: 0.4, y: 2.38, w: 2.2, h: 0.28,
    margin: 0, fontSize: 9.5, bold: true, color: C.navy, fontFace: "Calibri" });
  statuses.forEach((st, i) => {
    const sx = 2.55 + i * 1.25;
    s.addShape("rect", { x: sx, y: 2.38, w: 1.1, h: 0.28,
      fill: { color: st.color } });
    s.addText(st.label, { x: sx, y: 2.38, w: 1.1, h: 0.28,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8, bold: true, color: C.white, fontFace: "Calibri" });
  });

  hline(s, 2.82);

  // Two bottom sections
  // Left: Balance Âgée
  s.addShape("rect", { x: 0.3, y: 2.95, w: 4.3, h: 2.35,
    fill: { color: C.white }, line: { color: MOD.finance, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 0.3, y: 2.95, w: 4.3, h: 0.35, fill: { color: MOD.finance } });
  s.addText("Balance Âgée", { x: 0.3, y: 2.95, w: 4.3, h: 0.35,
    margin: 4, align: "center", valign: "middle",
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });

  const aged = [
    { tranche: "Courant", color: "16A34A", w: 1.1 },
    { tranche: "1–30 j", color: "3B82F6", w: 0.85 },
    { tranche: "31–60 j", color: C.orange, w: 0.72 },
    { tranche: "61–90 j", color: "D97706", w: 0.55 },
    { tranche: "> 90 j", color: MOD.ia, w: 0.4 },
  ];
  aged.forEach((a, i) => {
    const bx = 0.45 + i * 0.83;
    const barH = a.w * 1.3;
    s.addShape("rect", { x: bx, y: 4.85 - barH, w: 0.65, h: barH,
      fill: { color: a.color } });
    s.addText(a.tranche, { x: bx, y: 5.0, w: 0.65, h: 0.2,
      margin: 0, align: "center", fontSize: 7.5, color: C.darkgray, fontFace: "Calibri" });
  });
  s.addText("Analyse par tranche d'échéance • Export Excel disponible",
    { x: 0.4, y: 5.22, w: 4.2, h: 0.22,
      margin: 0, align: "center", fontSize: 8, color: C.gray, fontFace: "Calibri", italic: true });

  // Right: Ventes Saisies + Paiements
  s.addShape("rect", { x: 5.0, y: 2.95, w: 4.6, h: 1.05,
    fill: { color: C.white }, line: { color: MOD.terrain, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 5.0, y: 2.95, w: 4.6, h: 0.35, fill: { color: MOD.terrain } });
  s.addText("Ventes Saisies (terrain)", { x: 5.0, y: 2.95, w: 4.6, h: 0.35,
    margin: 4, align: "center", valign: "middle",
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Saisie rapide des ventes par les commerciaux terrain\nSynchronisation automatique avec les KPIs et rapports",
    { x: 5.1, y: 3.36, w: 4.4, h: 0.55,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });

  s.addShape("rect", { x: 5.0, y: 4.1, w: 4.6, h: 1.2,
    fill: { color: C.white }, line: { color: MOD.finance, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 5.0, y: 4.1, w: 4.6, h: 0.35, fill: { color: MOD.finance } });
  s.addText("Modes de Paiement", { x: 5.0, y: 4.1, w: 4.6, h: 0.35,
    margin: 4, align: "center", valign: "middle",
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });
  const payModes = ["Espèces", "Chèque", "Virement", "Traite", "LCN"];
  payModes.forEach((pm, i) => {
    s.addShape("rect", { x: 5.1 + i * 0.88, y: 4.55, w: 0.78, h: 0.32,
      fill: { color: i < 3 ? "16A34A" : "D97706" } });
    s.addText(pm, { x: 5.1 + i * 0.88, y: 4.55, w: 0.78, h: 0.32,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri" });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — MODULE STOCK
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.stock);

  lightTitle(s, "Module Stock — Catalogue Produits & Inventaire",
    "Gestion des articles, tarification et mouvements de stock");
  hline(s, 1.08);

  // Stock flow
  const stockFlow = [
    { label: "PRODUIT",      sub: "Catalogue",           color: "16A34A" },
    { label: "STOCK DISPO",  sub: "Niveaux par dépôt",   color: "15803D" },
    { label: "RÉSERVÉ",      sub: "Sur commande",         color: "D97706" },
    { label: "LIVRÉ",        sub: "Bon de livraison",     color: "2563EB" },
    { label: "FACTURÉ",      sub: "Lié à facture",        color: MOD.finance },
  ];
  hFlow(s, stockFlow, { startX: 0.5, y: 1.25, boxW: 1.6, boxH: 0.75, gapW: 0.4, fontSize: 10 });

  hline(s, 2.3);

  // Left: Product card
  s.addShape("rect", { x: 0.3, y: 2.45, w: 4.5, h: 2.9,
    fill: { color: C.white }, line: { color: MOD.stock, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 0.3, y: 2.45, w: 4.5, h: 0.38, fill: { color: MOD.stock } });
  s.addText("Fiche Produit", { x: 0.3, y: 2.45, w: 4.5, h: 0.38,
    margin: 4, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const prodFields = [
    ["Référence / Code-barres", "Désignation / Description"],
    ["Catégorie / Famille", "Unité de mesure"],
    ["Prix de vente HT / TTC", "Prix d'achat / Marge"],
    ["Taux TVA applicable", "Stock minimum (alerte)"],
    ["Disponibilité en temps réel", "Historique des mouvements"],
  ];
  prodFields.forEach((row, i) => {
    row.forEach((f, j) => {
      s.addText("• " + f, {
        x: 0.5 + j * 2.2, y: 2.95 + i * 0.42, w: 2.1, h: 0.36,
        margin: 0, fontSize: 9, color: C.darkgray, fontFace: "Calibri"
      });
    });
  });

  // Right: Inventory card
  s.addShape("rect", { x: 5.1, y: 2.45, w: 4.5, h: 2.9,
    fill: { color: C.white }, line: { color: MOD.stock, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 5.1, y: 2.45, w: 4.5, h: 0.38, fill: { color: "15803D" } });
  s.addText("Inventaire & Mouvements", { x: 5.1, y: 2.45, w: 4.5, h: 0.38,
    margin: 4, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const invItems = [
    { label: "Entrée stock", color: "16A34A", desc: "Réception fournisseur" },
    { label: "Réservation", color: "D97706", desc: "Commande client en cours" },
    { label: "Sortie stock", color: MOD.ia, desc: "Livraison / BL émis" },
    { label: "Ajustement", color: C.gray, desc: "Inventaire physique" },
    { label: "Transfert", color: "2563EB", desc: "Entre dépôts" },
  ];
  invItems.forEach((inv, i) => {
    const iy = 2.95 + i * 0.46;
    s.addShape("rect", { x: 5.2, y: iy, w: 1.1, h: 0.32, fill: { color: inv.color } });
    s.addText(inv.label, { x: 5.2, y: iy, w: 1.1, h: 0.32,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(inv.desc, { x: 6.4, y: iy + 0.05, w: 3.0, h: 0.24,
      margin: 0, fontSize: 9, color: C.darkgray, fontFace: "Calibri" });
  });

  // PMP indicator
  s.addShape("rect", { x: 5.2, y: 5.15, w: 4.2, h: 0.26,
    fill: { color: "15803D", transparency: 10 } });
  s.addText("Valorisation : Prix Moyen Pondéré (PMP) | Alerte stock min configurable",
    { x: 5.2, y: 5.15, w: 4.2, h: 0.26,
      margin: 4, align: "center", valign: "middle",
      fontSize: 8.5, color: C.white, fontFace: "Calibri" });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — MODULE TERRAIN
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.terrain);

  lightTitle(s, "Module Terrain — Activités, Visites & Tournées",
    "Pilotage de la force de vente terrain en temps réel");
  hline(s, 1.08);

  // Top flow: planning → activité → visite → CR → tournée
  const terrainFlow = [
    { label: "PLANNING",    sub: "Agenda semaine",     color: MOD.terrain },
    { label: "ACTIVITÉ",    sub: "Appel / Visite",     color: "0D7F7F" },
    { label: "VISITE",      sub: "Check-in géo",       color: "0D6E6E" },
    { label: "COMPTE-RENDU", sub: "Notes + Actions",   color: MOD.crm },
    { label: "TOURNÉE",     sub: "Itinéraire optimisé",color: MOD.odyssee },
  ];
  hFlow(s, terrainFlow, { startX: 0.5, y: 1.25, boxW: 1.65, boxH: 0.75, gapW: 0.38, fontSize: 9.5 });

  hline(s, 2.28);

  // 3 columns below
  const col = [0.3, 3.5, 6.7];
  const colW = 2.9;
  const sections = [
    {
      title: "Visites Client",
      color: MOD.terrain,
      items: [
        "Check-in / Check-out géolocalisé",
        "Objectif de visite défini",
        "Compte-rendu structuré",
        "Photos et pièces jointes",
        "Actions de suivi planifiées",
        "Sync avec agenda commercial",
      ]
    },
    {
      title: "Notes de Frais",
      color: C.orange,
      items: [
        "Types : carburant, repas, hôtel",
        "Justificatifs photos",
        "Workflow : Brouillon → Soumis",
        "Validation manager requise",
        "Statut : Approuvé / Rejeté",
        "Export pour remboursement",
      ]
    },
    {
      title: "Tableau Terrain",
      color: "16A34A",
      items: [
        "KPIs quotidiens commerciaux",
        "Nb visites réalisées vs objectif",
        "Carte des clients du jour",
        "Alertes clients sans visite récente",
        "Classement équipe (gamification)",
        "Vue manager sur toute l'équipe",
      ]
    }
  ];

  sections.forEach((sec, i) => {
    const cx = col[i];
    s.addShape("rect", { x: cx, y: 2.42, w: colW, h: 2.95,
      fill: { color: C.white }, line: { color: sec.color, width: 1.5 }, shadow: makeShadow() });
    s.addShape("rect", { x: cx, y: 2.42, w: colW, h: 0.36, fill: { color: sec.color } });
    s.addText(sec.title, { x: cx, y: 2.42, w: colW, h: 0.36,
      margin: 4, align: "center", valign: "middle",
      fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri" });
    sec.items.forEach((item, j) => {
      s.addText("• " + item, { x: cx + 0.1, y: 2.87 + j * 0.38, w: colW - 0.2, h: 0.34,
        margin: 0, fontSize: 9, color: C.darkgray, fontFace: "Calibri" });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — MODULE ODYSSÉE & MARKETING
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.odyssee);

  lightTitle(s, "ODYSSÉE & Marketing — Chantiers, Carte & Campagnes",
    "Gestion de projets terrain et communication marketing");
  hline(s, 1.08);

  // Left half: Odyssée
  s.addShape("rect", { x: 0.3, y: 1.2, w: 4.5, h: 0.42, fill: { color: MOD.odyssee } });
  s.addText("MODULE ODYSSÉE", { x: 0.3, y: 1.2, w: 4.5, h: 0.42,
    margin: 0, align: "center", valign: "middle",
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri" });

  // Chantier flow
  const chantierFlow = [
    { label: "COMPTE", color: MOD.crm },
    { label: "CHANTIER", color: MOD.odyssee },
    { label: "JALONS", color: "5B21B6" },
    { label: "CLÔTURE", color: "16A34A" },
  ];
  chantierFlow.forEach((c, i) => {
    const bx = 0.4 + i * 1.1;
    s.addShape("rect", { x: bx, y: 1.75, w: 0.85, h: 0.45,
      fill: { color: c.color }, shadow: makeShadow() });
    s.addText(c.label, { x: bx, y: 1.75, w: 0.85, h: 0.45,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri" });
    if (i < chantierFlow.length - 1) {
      s.addShape("line", { x: bx + 0.85, y: 1.975, w: 0.25, h: 0,
        line: { color: C.mid, width: 1, endArrowType: "open" } });
    }
  });

  const chantierItems = [
    "Adresse et superficie du chantier",
    "Statut d'avancement (0–100%)",
    "Documents et plans attachés",
    "Photos galerie chantier",
    "Lié à : Compte, Opportunité, Commande",
  ];
  chantierItems.forEach((item, i) => {
    s.addText("• " + item, { x: 0.4, y: 2.35 + i * 0.36, w: 4.2, h: 0.32,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });
  });

  // Map
  s.addShape("rect", { x: 0.4, y: 4.2, w: 4.1, h: 0.42,
    fill: { color: "065A82" }, shadow: makeShadow() });
  s.addText("🗺  Carte Interactive — Localisation de tous les clients & prospects",
    { x: 0.4, y: 4.2, w: 4.1, h: 0.42,
      margin: 4, align: "center", valign: "middle",
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri" });

  // Right half: Marketing
  s.addShape("rect", { x: 5.2, y: 1.2, w: 4.5, h: 0.42, fill: { color: MOD.marketing } });
  s.addText("MODULE MARKETING", { x: 5.2, y: 1.2, w: 4.5, h: 0.42,
    margin: 0, align: "center", valign: "middle",
    fontSize: 13, bold: true, color: C.navy, fontFace: "Calibri" });

  // Campaign flow
  const campFlow = [
    { label: "CIBLAGE", color: "D4A017" },
    { label: "TEMPLATE", color: "B8860B" },
    { label: "ENVOI", color: "8B6914" },
    { label: "RÉSULTATS", color: "16A34A" },
  ];
  campFlow.forEach((c, i) => {
    const bx = 5.3 + i * 1.1;
    s.addShape("rect", { x: bx, y: 1.75, w: 0.85, h: 0.45,
      fill: { color: c.color }, shadow: makeShadow() });
    s.addText(c.label, { x: bx, y: 1.75, w: 0.85, h: 0.45,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri" });
    if (i < campFlow.length - 1) {
      s.addShape("line", { x: bx + 0.85, y: 1.975, w: 0.25, h: 0,
        line: { color: C.mid, width: 1, endArrowType: "open" } });
    }
  });

  const campItems = [
    "Segmentation : région, type, commercial",
    "Types : Email, SMS, Appel, Événement",
    "Templates avec variables dynamiques",
    "Métriques : ouvertures, clics, conversions",
    "Leads générés par campagne traçables",
  ];
  campItems.forEach((item, i) => {
    s.addText("• " + item, { x: 5.3, y: 2.35 + i * 0.36, w: 4.2, h: 0.32,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });
  });

  s.addShape("rect", { x: 5.3, y: 4.2, w: 4.2, h: 0.42,
    fill: { color: MOD.marketing }, shadow: makeShadow() });
  s.addText("📧  Templates Email — Bibliothèque de modèles avec éditeur visuel",
    { x: 5.3, y: 4.2, w: 4.2, h: 0.42,
      margin: 4, align: "center", valign: "middle",
      fontSize: 9, bold: true, color: C.navy, fontFace: "Calibri" });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — MODULE PILOTAGE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.pilotage);

  lightTitle(s, "Module Pilotage — KPIs, Objectifs & Rapports",
    "Outils d'analyse et de pilotage de la performance commerciale");
  hline(s, 1.08);

  // KPIs grid (2x3)
  const kpis = [
    { label: "Taux de conversion",   sub: "Pistes → Opportunités → Commandes", color: MOD.pilotage },
    { label: "Cycle de vente moyen", sub: "Durée par étape du pipeline", color: MOD.crm },
    { label: "CA par commercial",    sub: "Classement et comparaison N/N-1", color: "16A34A" },
    { label: "Pipeline pondéré",     sub: "Forecast basé sur les probabilités", color: MOD.finance },
    { label: "Taux de visite",       sub: "Clients actifs vs sans contact", color: MOD.terrain },
    { label: "Retard de paiement",   sub: "Encours échu / balance âgée", color: MOD.ia },
  ];

  kpis.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = 0.3 + col * 3.2;
    const ky = 1.2 + row * 1.1;
    s.addShape("rect", { x: kx, y: ky, w: 3.0, h: 0.92,
      fill: { color: C.white }, line: { color: k.color, width: 1.5 }, shadow: makeShadow() });
    s.addShape("rect", { x: kx, y: ky, w: 0.22, h: 0.92, fill: { color: k.color } });
    s.addText(k.label, { x: kx + 0.3, y: ky + 0.08, w: 2.6, h: 0.34,
      margin: 0, fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri" });
    s.addText(k.sub, { x: kx + 0.3, y: ky + 0.44, w: 2.6, h: 0.38,
      margin: 0, fontSize: 9, color: C.gray, fontFace: "Calibri" });
  });

  hline(s, 3.5);

  // Bottom: Objectifs + Prévisions
  // Objectifs
  s.addShape("rect", { x: 0.3, y: 3.62, w: 4.5, h: 1.65,
    fill: { color: C.white }, line: { color: MOD.pilotage, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 0.3, y: 3.62, w: 4.5, h: 0.35, fill: { color: MOD.pilotage } });
  s.addText("Objectifs Commerciaux", { x: 0.3, y: 3.62, w: 4.5, h: 0.35,
    margin: 4, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
  [
    "Objectifs mensuels et annuels par commercial",
    "Jauge de progression visuelle (0–100%)",
    "Alertes automatiques si retard sur objectif",
    "Vue équipe consolidée pour le manager",
  ].forEach((item, i) => {
    s.addText("• " + item, { x: 0.45, y: 4.08 + i * 0.3, w: 4.2, h: 0.26,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });
  });

  // Prévisions
  s.addShape("rect", { x: 5.1, y: 3.62, w: 4.5, h: 1.65,
    fill: { color: C.white }, line: { color: MOD.crm, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 5.1, y: 3.62, w: 4.5, h: 0.35, fill: { color: MOD.crm } });
  s.addText("Prévisions de Ventes (Forecast)", { x: 5.1, y: 3.62, w: 4.5, h: 0.35,
    margin: 4, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
  [
    "Forecast basé sur le pipeline pondéré",
    "Comparaison Prévu vs Réalisé",
    "Segmentation produit / région / équipe",
    "Alertes si objectif en risque détecté",
  ].forEach((item, i) => {
    s.addText("• " + item, { x: 5.25, y: 4.08 + i * 0.3, w: 4.2, h: 0.26,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — ADMINISTRATION & INTÉGRATIONS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bgLight(s);
  topBar(s, MOD.admin);

  lightTitle(s, "Administration, Intégrations & Assistant IA",
    "Configuration, sécurité, Sage 100C et intelligence artificielle");
  hline(s, 1.08);

  // Users roles
  s.addShape("rect", { x: 0.3, y: 1.2, w: 4.5, h: 0.38, fill: { color: MOD.admin } });
  s.addText("Gestion des Utilisateurs & Rôles", { x: 0.3, y: 1.2, w: 4.5, h: 0.38,
    margin: 4, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const roles = [
    { role: "SUPER_ADMIN", desc: "Accès complet + paramètres système", color: MOD.ia },
    { role: "ADMIN",       desc: "Gestion utilisateurs + configuration", color: MOD.crm },
    { role: "MANAGER",     desc: "Supervision équipe + objectifs",       color: MOD.terrain },
    { role: "COMMERCIAL",  desc: "CRM + terrain + finance",              color: "16A34A" },
    { role: "READ_ONLY",   desc: "Consultation uniquement",              color: C.gray },
  ];
  roles.forEach((r, i) => {
    const ry = 1.68 + i * 0.44;
    s.addShape("rect", { x: 0.3, y: ry, w: 1.35, h: 0.34, fill: { color: r.color } });
    s.addText(r.role, { x: 0.3, y: ry, w: 1.35, h: 0.34,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(r.desc, { x: 1.75, y: ry + 0.04, w: 2.9, h: 0.28,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });
  });

  // Sage 100C integration
  s.addShape("rect", { x: 0.3, y: 3.95, w: 4.5, h: 1.38,
    fill: { color: C.white }, line: { color: "0891B2", width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 0.3, y: 3.95, w: 4.5, h: 0.36, fill: { color: "0891B2" } });
  s.addText("Intégration Sage 100C", { x: 0.3, y: 3.95, w: 4.5, h: 0.36,
    margin: 4, align: "center", valign: "middle",
    fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });

  const sageItems = [
    "Comptes ↔ Tiers Sage (sync bidirectionnelle)",
    "Articles Sage → Catalogue produits OptiCRM",
    "Pièces comptables (factures, règlements) synchronisées",
  ];
  sageItems.forEach((item, i) => {
    s.addText("• " + item, { x: 0.45, y: 4.4 + i * 0.3, w: 4.2, h: 0.26,
      margin: 0, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri" });
  });

  // IA Block (right)
  s.addShape("rect", { x: 5.2, y: 1.2, w: 4.5, h: 3.35,
    fill: { color: C.navy }, shadow: makeShadow() });
  s.addShape("rect", { x: 5.2, y: 1.2, w: 4.5, h: 0.4, fill: { color: MOD.ia } });
  s.addText("🤖  Assistant IA — Claude (Anthropic)", { x: 5.2, y: 1.2, w: 4.5, h: 0.4,
    margin: 4, align: "center", valign: "middle",
    fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri" });

  const iaCapabilities = [
    { cap: "Chat contextuel",        desc: "Réponses sur le CRM en langage naturel" },
    { cap: "Rédaction email",         desc: "Génération de propositions personnalisées" },
    { cap: "Analyse de lead",         desc: "Score, recommandations, points clés" },
    { cap: "Analyse de compte",       desc: "Synthèse des KPIs et historique client" },
    { cap: "Streaming temps réel",    desc: "Réponse affichée mot par mot (SSE)" },
  ];
  iaCapabilities.forEach((ia, i) => {
    const iy = 1.72 + i * 0.46;
    s.addShape("rect", { x: 5.3, y: iy, w: 1.4, h: 0.32, fill: { color: MOD.ia } });
    s.addText(ia.cap, { x: 5.3, y: iy, w: 1.4, h: 0.32,
      margin: 0, align: "center", valign: "middle",
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(ia.desc, { x: 6.8, y: iy + 0.04, w: 2.8, h: 0.26,
      margin: 0, fontSize: 9, color: C.mid, fontFace: "Calibri" });
  });

  // Tech note
  s.addText("Modèle : claude-opus-4  •  API : Anthropic  •  Streaming : SSE",
    { x: 5.3, y: 4.05, w: 4.3, h: 0.26,
      margin: 0, align: "center", fontSize: 8, color: C.gray, fontFace: "Calibri", italic: true });

  // Tarifs block
  s.addShape("rect", { x: 5.2, y: 4.4, w: 4.5, h: 0.94,
    fill: { color: C.white }, line: { color: MOD.finance, width: 1.5 }, shadow: makeShadow() });
  s.addShape("rect", { x: 5.2, y: 4.4, w: 4.5, h: 0.33, fill: { color: MOD.finance } });
  s.addText("Catégories Tarifaires", { x: 5.2, y: 4.4, w: 4.5, h: 0.33,
    margin: 4, align: "center", valign: "middle",
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Grilles de prix par segment client  •  Remises par profil commercial\nTarifs spéciaux par produit ou famille — synchronisés avec Sage 100C",
    { x: 5.3, y: 4.8, w: 4.3, h: 0.46,
      margin: 0, fontSize: 9, color: C.darkgray, fontFace: "Calibri" });
}

// ════════════════════════════════════════════════════════════════════════════
// SAVE
// ════════════════════════════════════════════════════════════════════════════
pres.writeFile({ fileName: OUT }).then(() => {
  console.log("✅  Saved:", OUT);
}).catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
