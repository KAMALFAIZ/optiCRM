const fs = require('fs');
const path = require('path');

const prog = JSON.parse(fs.readFileSync('scrape_progress_communales_2015.json', 'utf8'));
const headers = ['region','province','commune','id_commune','circ','parti','candidat','id_candidat'];

const byRegion = {};
prog.rows.forEach(r => {
  if (!byRegion[r.region]) byRegion[r.region] = [];
  byRegion[r.region].push(r);
});

const regionFiles = {
  'طنجة- تطوان -الحسيمة': 'communales_2015_tanger_tetouan.csv',
  'الشرق': 'communales_2015_oriental.csv',
  'فاس- مكناس': 'communales_2015_fes_meknes.csv',
  'الرباط -سلا -القنيطرة': 'communales_2015_rabat_sale.csv',
  'بني ملال -خنيفرة': 'communales_2015_beni_mellal.csv',
  'الدار البيضاء-سطات': 'communales_2015_casablanca.csv',
  'مراكش- آسفي': 'communales_2015_marrakech.csv',
  'درعة -تافيلالت': 'communales_2015_draa_tafilalet.csv',
  'سوس- ماسة': 'communales_2015_souss_massa.csv',
  'كلميم -واد نون': 'communales_2015_guelmim.csv',
  'العيون- الساقية الحمراء': 'communales_2015_laayoune.csv',
  'الداخلة- وادي الذهب': 'communales_2015_dakhla.csv',
};

const outDir = path.join(__dirname, 'communales_2015_par_region');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

let total = 0;
Object.entries(byRegion).forEach(([region, rows]) => {
  const filename = regionFiles[region] || ('communales_2015_' + region + '.csv');
  const csvRows = rows.map(r =>
    headers.map(h => '"' + String(r[h] != null ? r[h] : '').replace(/"/g, '""') + '"').join(',')
  );
  const csv = '﻿' + headers.join(',') + '\n' + csvRows.join('\n');
  fs.writeFileSync(path.join(outDir, filename), csv, 'utf8');
  console.log(filename.padEnd(45) + rows.length + ' lignes');
  total += rows.length;
});

// Full CSV
const allCsvRows = prog.rows.map(r =>
  headers.map(h => '"' + String(r[h] != null ? r[h] : '').replace(/"/g, '""') + '"').join(',')
);
fs.writeFileSync('elections_communales_2015.csv', '﻿' + headers.join(',') + '\n' + allCsvRows.join('\n'), 'utf8');

console.log('\nTotal: ' + total + ' lignes dans ' + Object.keys(byRegion).length + ' fichiers');
console.log('+ elections_communales_2015.csv (complet)');
