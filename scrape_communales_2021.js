/**
 * Scraper Elections Communales Maroc 2021
 * Cascade ASP.NET UpdatePanel + getListElus_Com
 * C_Election = 15
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const fs    = require('fs');

const HOST          = 'www.elections.ma';
const PAGE_PATH     = '/elections/communales/resultats.aspx?Id=UshdiNun64qlGNgh%2F73atw%3D%3D&IE=1';
const ASMX_ELUS     = '/Electionweb.asmx/getListElus_Com';
const C_ELECTION    = 15;
const DELAY_API     = 1500;
const DELAY_POST    = 2000;
const PROGRESS_FILE = 'scrape_progress_communales.json';
const OUT_FILE      = 'elections_communales_2021.csv';

// ─── helpers ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsGet(path, headers) {
  headers = headers || {};
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST, path, method: 'GET',
      headers: Object.assign({ 'User-Agent': 'Mozilla/5.0' }, headers),
      timeout: 20000
    };
    https.get(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    }).on('error', reject).on('timeout', () => reject(new Error('GET timeout')));
  });
}

function httpsPost(path, body, headers) {
  headers = headers || {};
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf8');
    const req = https.request({
      hostname: HOST, path, method: 'POST',
      headers: Object.assign({ 'User-Agent': 'Mozilla/5.0', 'Content-Length': buf.length }, headers),
      timeout: 20000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('POST timeout')));
    req.write(buf); req.end();
  });
}

// ─── Session ASP.NET ────────────────────────────────────────────────────────

async function getSession() {
  const res = await httpsGet(PAGE_PATH);
  const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  const vs  = (res.body.match(/id="__VIEWSTATE"\s+value="([^"]+)"/) || [])[1] || '';
  const vsg = (res.body.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/) || [])[1] || '';
  return { cookies, vs, vsg };
}

async function postback(session, eventTarget, fields) {
  const parts = [
    'ctl00$ScriptManager1=ctl00$ContentPlaceHolder1$decoupage|' + eventTarget,
    '__EVENTTARGET=' + eventTarget,
    '__EVENTARGUMENT=',
    '__LASTFOCUS=',
    '__VIEWSTATE=' + encodeURIComponent(session.vs),
    '__VIEWSTATEGENERATOR=' + encodeURIComponent(session.vsg),
  ].concat(
    Object.keys(fields).map(k => k + '=' + encodeURIComponent(fields[k]))
  ).concat(['__ASYNCPOST=true']).join('&');

  const res = await httpsPost(PAGE_PATH, parts, {
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-MicrosoftAjax': 'Delta=true',
    'Cookie': session.cookies,
    'Referer': 'https://' + HOST + PAGE_PATH,
  });

  const vsNew = (res.body.match(/\|__VIEWSTATE\|([^|]+)\|/) || [])[1];
  if (vsNew) session.vs = vsNew;

  return res.body;
}

function parseSelectOptions(html, selectId) {
  // Extraire uniquement le contenu du <select id="selectId">...</select>
  const re = new RegExp('<select[^>]+id="' + selectId + '"[^>]*>([\\s\\S]*?)<\\/select>', 'i');
  const match = re.exec(html);
  if (!match) return [];
  const inner = match[1];
  const optRe = /<option[^>]+value="(\d+)"[^>]*>([^<]+)<\/option>/g;
  const out = [];
  let m;
  while ((m = optRe.exec(inner)) !== null) {
    const id = parseInt(m[1]);
    if (id > 0) out.push({ id: id, name: m[2].trim() });
  }
  return out;
}

// ─── API getListElus_Com ─────────────────────────────────────────────────────

async function getElus(region, province, commune, retries) {
  retries = retries || 3;
  const body = JSON.stringify({ Region: region, province: province, Commune: commune, Circ: 0, C_Election: C_ELECTION });
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await httpsPost(ASMX_ELUS, body, {
        'Content-Type': 'application/json; charset=utf-8',
        'Referer': 'https://' + HOST + '/elections/communales/resultats.aspx',
      });
      if (res.status === 200) {
        const parsed = JSON.parse(res.body);
        return parsed.d || [];
      }
      console.log('    [warn] getElus status=' + res.status + ', retry ' + (attempt + 1));
    } catch(e) {
      console.log('    [error] getElus: ' + e.message + ', retry ' + (attempt + 1));
    }
    await sleep(6000);
  }
  return [];
}

// ─── Cascade ─────────────────────────────────────────────────────────────────

async function getProvinces(session, regionId) {
  const html = await postback(session, 'ctl00$ContentPlaceHolder1$DDLRegion', {
    'ctl00$ContentPlaceHolder1$DDLRegion':  String(regionId),
    'ctl00$ContentPlaceHolder1$DDLProvince': '0',
    'ctl00$ContentPlaceHolder1$DDLCommune':  '0',
    'ctl00$ContentPlaceHolder1$DDLCirc':     '0',
  });
  return parseSelectOptions(html, 'DDLProvince');
}

async function getCommunes(session, regionId, provinceId) {
  const html = await postback(session, 'ctl00$ContentPlaceHolder1$DDLProvince', {
    'ctl00$ContentPlaceHolder1$DDLRegion':  String(regionId),
    'ctl00$ContentPlaceHolder1$DDLProvince': String(provinceId),
    'ctl00$ContentPlaceHolder1$DDLCommune':  '0',
    'ctl00$ContentPlaceHolder1$DDLCirc':     '0',
  });
  return parseSelectOptions(html, 'DDLCommune');
}

// ─── Régions ──────────────────────────────────────────────────────────────────

const REGIONS = [
  [1,  'طنجة- تطوان -الحسيمة'],
  [2,  'الشرق'],
  [3,  'فاس- مكناس'],
  [4,  'الرباط -سلا -القنيطرة'],
  [5,  'بني ملال -خنيفرة'],
  [6,  'الدار البيضاء-سطات'],
  [7,  'مراكش- آسفي'],
  [8,  'درعة -تافيلالت'],
  [9,  'سوس- ماسة'],
  [10, 'كلميم -واد نون'],
  [11, 'العيون- الساقية الحمراء'],
  [12, 'الداخلة- وادي الذهب'],
];

// ─── Progression ──────────────────────────────────────────────────────────────

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    if (!p.doneCommunes) p.doneCommunes = {};
    return p;
  }
  return { doneRegions: {}, doneCommunes: {}, rows: [] };
}

function saveProgress(prog) {
  try {
    const tmp = PROGRESS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(prog));
    fs.renameSync(tmp, PROGRESS_FILE);
  } catch(e) {
    console.log('  [warn] progress save: ' + e.message);
  }
}

function exportCSV(rows) {
  const headers = ['region','province','commune','id_commune','circ','parti','candidat','id_candidat'];
  const csv = '﻿' + [headers.join(',')].concat(rows.map(function(r) {
    return headers.map(function(h) {
      const v = String(r[h] == null ? '' : r[h]).replace(/"/g, '""');
      return (v.indexOf(',') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) ? '"' + v + '"' : v;
    }).join(',');
  })).join('\n');
  try {
    fs.writeFileSync(OUT_FILE, csv, 'utf8');
  } catch(e) {
    if (e.code === 'EBUSY') {
      // Fichier ouvert dans Excel — écrire dans un fichier temporaire
      fs.writeFileSync(OUT_FILE + '.tmp', csv, 'utf8');
      console.log('  [warn] CSV busy, écrit dans ' + OUT_FILE + '.tmp');
    } else throw e;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Scraper Elections Communales 2021 ===');
  const prog = loadProgress();
  const doneKeys = Object.keys(prog.doneRegions);
  console.log('Reprise: ' + prog.rows.length + ' lignes, régions faites: ' + (doneKeys.length ? doneKeys.join(',') : 'aucune'));

  for (let ri = 0; ri < REGIONS.length; ri++) {
    const regionId   = REGIONS[ri][0];
    const regionName = REGIONS[ri][1];

    if (prog.doneRegions[regionId]) {
      console.log('[Région ' + regionId + '] ' + regionName + ' — skip');
      continue;
    }

    console.log('\n[Région ' + regionId + '/12] ' + regionName);

    let session = null;
    for (let t = 0; t < 3; t++) {
      try { session = await getSession(); break; }
      catch(e) { console.log('  session err: ' + e.message + ', retry'); await sleep(8000); }
    }
    if (!session) { console.log('  Session impossible, skip'); continue; }

    await sleep(DELAY_POST);

    let provinces = [];
    try {
      provinces = await getProvinces(session, regionId);
    } catch(e) {
      console.log('  Provinces err: ' + e.message);
    }
    console.log('  Provinces (' + provinces.length + '): ' + provinces.map(function(p){ return p.name; }).join(', '));

    for (let pi = 0; pi < provinces.length; pi++) {
      const province = provinces[pi];
      console.log('\n  [Province] ' + province.name + ' (id=' + province.id + ')');
      await sleep(DELAY_POST);

      let communes = [];
      try {
        communes = await getCommunes(session, regionId, province.id);
      } catch(e) {
        console.log('    Communes err: ' + e.message);
        // Renouveler session si erreur
        try { session = await getSession(); await sleep(DELAY_POST); communes = await getCommunes(session, regionId, province.id); }
        catch(e2) { console.log('    Retry failed:', e2.message); }
      }
      console.log('    Communes (' + communes.length + ')');

      for (let ci = 0; ci < communes.length; ci++) {
        const commune = communes[ci];
        const communeKey = regionId + '_' + province.id + '_' + commune.id;

        if (prog.doneCommunes[communeKey]) {
          console.log('    [' + (ci+1) + '/' + communes.length + '] ' + commune.name + ' — skip');
          continue;
        }

        process.stdout.write('    [' + (ci+1) + '/' + communes.length + '] ' + commune.name + ' → ');
        await sleep(DELAY_API);

        const elus = await getElus(regionId, province.id, commune.id);
        console.log(elus.length + ' élus');

        elus.forEach(function(e) {
          prog.rows.push({
            region:      regionName,
            province:    province.name,
            commune:     commune.name,
            id_commune:  commune.id,
            circ:        e.Circ || '',
            parti:       e.NameOrgPolitique || e.CodesymbomePartie || '',
            candidat:    e.Name || '',
            id_candidat: e.Id_Candidat || '',
          });
        });

        prog.doneCommunes[communeKey] = true;
        saveProgress(prog);
        if ((ci + 1) % 10 === 0) exportCSV(prog.rows);
      }
    }

    prog.doneRegions[regionId] = true;
    saveProgress(prog);
    exportCSV(prog.rows);
    console.log('  ✓ Région ' + regionId + ' terminée — total: ' + prog.rows.length + ' lignes');
  }

  exportCSV(prog.rows);
  console.log('\n=== TERMINÉ — ' + prog.rows.length + ' lignes → ' + OUT_FILE + ' ===');
}

main().catch(function(e) { console.error('FATAL:', e); process.exit(1); });
