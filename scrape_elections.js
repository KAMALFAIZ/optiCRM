/**
 * Scraper Elections Legislatives Maroc 2021
 * Node.js - TLS verification disabled to reach elections.ma
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_HOST = 'www.elections.ma';
const API_IP   = '194.204.212.11';  // fallback when DNS fails
const API_PATH = '/ElectionLegislatives.asmx/getListResultVoix';
const OUT_DIR = path.join(__dirname);
const DELAY = 22000;
const C_ELECTION = 17;

// circ -> {regionCode, provinceCode, type}
const CIRCUITS = [
  [1,4,1,0],[2,4,1,0],[3,4,4,0],[4,4,5,0],[5,4,5,0],
  [6,6,14,0],[7,9,15,0],[8,9,16,0],[9,9,17,0],[10,9,18,0],
  [11,9,18,0],[12,9,19,0],[13,8,20,0],[14,8,21,0],[15,1,22,0],
  [16,3,23,0],[17,3,24,0],[18,3,24,0],[19,5,25,0],[20,5,26,0],
  [21,5,26,0],[22,3,29,0],[23,3,30,0],[24,3,31,0],[25,10,32,0],
  [26,9,33,0],[27,10,34,0],[28,11,35,0],[29,10,36,0],[30,4,37,0],
  [31,4,37,0],[32,4,38,0],[33,11,39,0],[34,11,40,0],[35,7,44,0],
  [36,7,45,0],[37,7,46,0],[38,7,47,0],[39,3,50,0],[40,3,51,0],
  [41,5,52,0],[42,8,53,0],[43,12,54,0],[44,12,55,0],[45,2,56,0],
  [46,2,57,0],[47,2,58,0],[48,2,59,0],[49,2,60,0],[50,2,61,0],
  [51,7,62,0],[52,6,63,0],[53,6,64,0],[54,5,65,0],[55,6,66,0],
  [56,1,67,0],[57,1,69,0],[58,1,70,0],[59,1,71,0],[60,4,72,0],
  [61,4,72,0],[62,6,73,0],[63,6,74,0],[64,6,75,0],[65,6,76,0],
  [66,6,77,0],[67,6,78,0],[68,6,79,0],[69,6,80,0],[70,6,81,0],
  [71,6,82,0],[72,3,83,0],[73,3,83,0],[74,7,84,0],[75,7,84,0],
  [76,7,84,0],[77,3,85,0],[78,1,86,0],[79,1,87,0],[80,10,90,0],
  [81,8,91,0],[82,2,92,0],[83,5,93,0],[84,4,94,0],[85,11,95,0],
  [86,7,96,0],[87,8,97,0],[88,2,98,0],[89,7,99,0],[90,6,100,0],
  [91,6,101,0],[92,1,102,0],
  [901,1,0,1],[902,2,0,1],[903,3,0,1],[904,4,0,1],[905,5,0,1],
  [906,6,0,1],[907,7,0,1],[908,8,0,1],[909,9,0,1],[910,10,0,1],
  [911,11,0,1],[912,12,0,1]
];

const REGIONS = {
  1:'طنجة- تطوان -الحسيمة', 2:'الشرق', 3:'فاس- مكناس',
  4:'الرباط -سلا -القنيطرة', 5:'بني ملال -خنيفرة', 6:'الدار البيضاء-سطات',
  7:'مراكش- آسفي', 8:'درعة -تافيلالت', 9:'سوس- ماسة',
  10:'كلميم -واد نون', 11:'العيون- الساقية الحمراء', 12:'الداخلة- وادي الذهب'
};

const PROVINCES = {
  0:'', 1:'الرباط', 4:'الصخيرات تمارة', 5:'الخميسات', 14:'المحمدية',
  15:'أكادير- إدا وتنان', 16:'إنزكان أيت ملول', 17:'اشتوكة ايت باها',
  18:'تارودانت', 19:'تيزنيت', 20:'ورزازات', 21:'زاكورة', 22:'الحسيمة',
  23:'تازة', 24:'تاونات', 25:'بني ملال', 26:'أزيلال', 29:'مولاي يعقوب',
  30:'صفرو', 31:'بولمان', 32:'كلميم', 33:'طاطا', 34:'أسا - الزاك',
  35:'السمارة', 36:'طانطان', 37:'القنيطرة', 38:'سيدي قاسم', 39:'العيون',
  40:'بوجدور', 44:'شيشاوة', 45:'الحوز', 46:'قلعة السراغنة', 47:'الصويرة',
  50:'الحاجب', 51:'ايفران', 52:'خنيفرة', 53:'الرشيدية', 54:'وادي الذهب',
  55:'أوسرد', 56:'وجدة أنكاد', 57:'جرادة', 58:'بركان', 59:'تاوريرت',
  60:'فجيج', 61:'الناضور', 62:'أسفي', 63:'الجديدة', 64:'سطات',
  65:'خريبكة', 66:'بنسليمان', 67:'طنجة أصيلة', 69:'تطوان', 70:'العرائش',
  71:'شفشاون', 72:'سلا', 73:'عمالة مقاطعة الدار البيضاء أنفا',
  74:'عمالة مقاطعات الفداء مرس السلطان',
  75:'عمالة مقاطعات عين السبع الحي المحمدي',
  76:'عمالة مقاطعة عين الشق', 77:'عمالة مقاطعة الحي الحسني',
  78:'عمالة مقاطعات سيدي البرنوصي', 79:'عمالة مقاطعات ابن مسيك',
  80:'عمالة مقاطعات مولاي رشيد', 81:'النواصر', 82:'مديونة',
  83:'فاس', 84:'مراكش', 85:'مكناس', 86:'فحص أنجرة', 87:'المضيق الفنيدق',
  90:'سيدي إفني', 91:'تنغير', 92:'جرسيف', 93:'الفقيه بنصالح',
  94:'سيدي سليمان', 95:'طرفاية', 96:'الرحامنة', 97:'ميدلت',
  98:'الدريوش', 99:'اليوسفية', 100:'سيدي بنور', 101:'برشيد', 102:'وزان'
};

const DAIRES = {
  1:'الرباط - المحيط', 2:'الرباط - شالة', 3:'الصخيرات - تمارة',
  4:'الخميسات - أولماس', 5:'تيفلت - الرماني', 6:'المحمدية',
  7:'أكادير -إدا وتنان', 8:'إنزكان-آيت ملول', 9:'اشتوكة-آيت باها',
  10:'تارودانت الجنوبية', 11:'تارودانت الشمالية', 12:'تيزنيت',
  13:'ورزازات', 14:'زاكورة', 15:'الحسيمة', 16:'تازة',
  17:'تاونات - تيسة', 18:'القرية - غفساي', 19:'بني ملال',
  20:'بزو - واويزاغت', 21:'أزيلال - دمنات', 22:'مولاي يعقوب',
  23:'صفرو', 24:'بولمان', 25:'كلميم', 26:'طاطا', 27:'أسا - الزاك',
  28:'السمارة', 29:'طانطان', 30:'القنيطرة', 31:'الغرب', 32:'سيدي قاسم',
  33:'العيون', 34:'بوجدور', 35:'شيشاوة', 36:'الحوز',
  37:'قلعة السراغنة', 38:'الصويرة', 39:'الحاجب', 40:'إفران',
  41:'خنيفرة', 42:'الرشيدية', 43:'وادي الذهب', 44:'أوسرد',
  45:'وجدة - أنجاد', 46:'جرادة', 47:'بركان', 48:'تاوريرت',
  49:'فجيج', 50:'الناضور', 51:'آسفي', 52:'الجديدة', 53:'سطات',
  54:'خريبكة', 55:'بنسليمان', 56:'طنجة - أصيلة', 57:'تطوان',
  58:'العرائش', 59:'شفشاون', 60:'سلا المدينة', 61:'سلا الجديدة',
  62:'الدار البيضاء - أنفا', 63:'الفداء - مرس السلطان',
  64:'عين السبع - الحي المحمدي', 65:'عين الشق', 66:'الحي الحسني',
  67:'سيدي البرنوصي', 68:'ابن امسيك', 69:'مولاي رشيد',
  70:'النواصر', 71:'مديونة', 72:'فاس الجنوبية', 73:'فاس الشمالية',
  74:'المنارة', 75:'جليز - النخيل', 76:'المدينة - سيدي يوسف بن علي',
  77:'مكناس', 78:'الفحص - أنجرة', 79:'المضيق - الفنيدق',
  80:'سيدي إفني', 81:'تنغير', 82:'جرسيف', 83:'الفقيه بن صالح',
  84:'سيدي سليمان', 85:'طرفاية', 86:'الرحامنة', 87:'ميدلت',
  88:'الدريوش', 89:'اليوسفية', 90:'سيدي بنور', 91:'برشيد', 92:'وزان',
  901:'الدائرة الجهوية : طنجة- تطوان -الحسيمة',
  902:'الدائرة الجهوية : الشرق',
  903:'الدائرة الجهوية : فاس- مكناس',
  904:'الدائرة الجهوية : الرباط -سلا -القنيطرة',
  905:'الدائرة الجهوية : بني ملال -خنيفرة',
  906:'الدائرة الجهوية : الدار البيضاء-سطات',
  907:'الدائرة الجهوية : مراكش- آسفي',
  908:'الدائرة الجهوية : درعة -تافيلالت',
  909:'الدائرة الجهوية : سوس- ماسة',
  910:'الدائرة الجهوية : كلميم -واد نون',
  911:'الدائرة الجهوية : العيون- الساقية الحمراء',
  912:'الدائرة الجهوية : الداخلة- وادي الذهب'
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function apiCall(regionCode, provinceCode, circCode, retries = 6) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      Region: String(regionCode),
      province: String(provinceCode),
      Circ_Leg: String(circCode),
      C_Election: C_ELECTION
    });
    const attempt = (n) => {
      // After 2nd failure, use hardcoded IP to bypass DNS
      const useIP = n >= 2;
      const opts = {
        host: useIP ? API_IP : API_HOST,
        port: 443,
        path: API_PATH,
        method: 'POST',
        servername: API_HOST,   // SNI always uses real hostname
        headers: {
          'Host': API_HOST,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.elections.ma/',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 30000
      };
      if (useIP) console.log(`  retry ${n} via IP ${API_IP}`);
      const req = https.request(opts, (res) => {
        if (res.statusCode === 503) {
          const wait = (n + 1) * 8000;
          console.log(`  503 – waiting ${wait/1000}s`);
          setTimeout(() => attempt(n + 1), wait);
          return;
        }
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try { resolve(JSON.parse(body).d || []); }
          catch(e) { console.log('  parse error:', e.message); resolve([]); }
        });
      });
      req.on('error', (e) => {
        if (n < retries) {
          const wait = Math.min((n + 1) * 8000, 40000);
          console.log(`  error: ${e.message} – retry in ${wait/1000}s`);
          setTimeout(() => attempt(n + 1), wait);
        } else { console.log('  gave up:', e.message); resolve([]); }
      });
      req.on('timeout', () => { req.destroy(); });
      req.write(payload);
      req.end();
    };
    attempt(0);
  });
}

async function main() {
  const allData = [];
  const progressFile = path.join(OUT_DIR, 'scrape_progress.json');
  let startIdx = 0;

  if (fs.existsSync(progressFile)) {
    try {
      const prog = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      startIdx = prog.nextIdx || 0;
      prog.rows.forEach(r => allData.push(r));
      console.log(`Resumed from circuit index ${startIdx}, ${allData.length} rows loaded`);
    } catch(e) { console.log('Progress file error, starting fresh'); }
  }

  for (let i = startIdx; i < CIRCUITS.length; i++) {
    const [circ, reg, prov, isReg] = CIRCUITS[i];
    const regionName = REGIONS[reg] || String(reg);
    const provinceName = PROVINCES[prov] || String(prov);
    const daireName = DAIRES[circ] || String(circ);
    const type = isReg ? 'جهوية' : 'محلية';

    console.log(`[${i+1}/${CIRCUITS.length}] Circuit ${circ}: ${daireName}`);

    const rows = await apiCall(reg, prov, circ);
    console.log(`  → ${rows.length} rows`);

    rows.forEach(r => allData.push({
      region: regionName,
      province: provinceName,
      daire: daireName,
      type,
      parti: r.Nom_Partis || '',
      candidat: r.PrenomNom_Cand || '',
      voix: r.N_Voix || 0,
      sieges: r.N_Elus || 0
    }));

    // Save progress after each circuit
    fs.writeFileSync(progressFile, JSON.stringify({ nextIdx: i + 1, rows: allData }));

    if (i < CIRCUITS.length - 1) {
      console.log(`  waiting ${DELAY/1000}s...`);
      await delay(DELAY);
    }
  }

  // Write JSON
  const jsonPath = path.join(OUT_DIR, 'elections_2021.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2), 'utf8');
  console.log(`\nJSON: ${jsonPath} (${allData.length} rows)`);

  // Write CSV (UTF-8 BOM)
  const fields = ['region','province','daire','type','parti','candidat','voix','sieges'];
  const header = fields.join(',');
  const csvRows = allData.map(r =>
    fields.map(f => '"' + String(r[f] ?? '').replace(/"/g, '""') + '"').join(',')
  );
  const csvPath = path.join(OUT_DIR, 'elections_2021.csv');
  fs.writeFileSync(csvPath, '﻿' + header + '\n' + csvRows.join('\n'), 'utf8');
  console.log(`CSV: ${csvPath} (${allData.length} rows)`);

  // Clean up progress file
  if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
  console.log('\nDone!');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
