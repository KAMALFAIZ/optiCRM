const fs = require('fs');
const path = require('path');

const prog = JSON.parse(fs.readFileSync('scrape_progress_communales.json', 'utf8'));
const headers = ['region','province','commune','id_commune','circ','parti','candidat','id_candidat'];

const byRegion = {};
prog.rows.forEach(r => {
  if (!byRegion[r.region]) byRegion[r.region] = [];
  byRegion[r.region].push(r);
});

const regionFiles = {
  'طنجة- تطوان -الحسيمة': 'communales_tanger_tetouan.csv',
  'الشرق': 'communales_oriental.csv',
  'فاس- مكناس': 'communales_fes_meknes.csv',
  'الرباط -سلا -القنيطرة': 'communales_rabat_sale.csv',
  'بني ملال -خنيفرة': 'communales_beni_mellal.csv',
  'الدار البيضاء-سطات': 'communales_casablanca.csv',
  'مراكش- آسفي': 'communales_marrakech.csv',
  'درعة -تافيلالت': 'communales_draa_tafilalet.csv',
  'سوس- ماسة': 'communales_souss_massa.csv',
  'كلميم -واد نون': 'communales_guelmim.csv',
  'العيون- الساقية الحمراء': 'communales_laayoune.csv',
  'الداخلة- وادي الذهب': 'communales_dakhla.csv',
};

const outDir = path.join(__dirname, 'communales_par_region');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

let total = 0;
Object.entries(byRegion).forEach(([region, rows]) => {
  const filename = regionFiles[region] || ('communales_' + region + '.csv');
  const csvRows = rows.map(r =>
    headers.map(h => '"' + String(r[h] != null ? r[h] : '').replace(/"/g, '""') + '"').join(',')
  );
  const csv = '﻿' + headers.join(',') + '\n' + csvRows.join('\n');
  fs.writeFileSync(path.join(outDir, filename), csv, 'utf8');
  console.log(filename.padEnd(40) + rows.length + ' lignes');
  total += rows.length;
});

// Also export full CSV
const allCsvRows = prog.rows.map(r =>
  headers.map(h => '"' + String(r[h] != null ? r[h] : '').replace(/"/g, '""') + '"').join(',')
);
fs.writeFileSync('elections_communales_2021.csv', '﻿' + headers.join(',') + '\n' + allCsvRows.join('\n'), 'utf8');

console.log('\nTotal: ' + total + ' lignes dans ' + Object.keys(byRegion).length + ' fichiers');
console.log('+ elections_communales_2021.csv (complet)');
