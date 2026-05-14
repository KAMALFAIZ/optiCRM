const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9876;
const OUT_DIR = 'D:\kasoft-platform\OptiCRM';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const rows = JSON.parse(body).rows;
        const jsonPath = path.join(OUT_DIR, 'elections_2021.json');
        fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
        const fields = ['region','province','daire','type','parti','candidat','voix','sieges'];
        const header = fields.join(',');
        const csvRows = rows.map(r => fields.map(f => '"'+String(r[f]??'').replace(/"/g,'""')+'"').join(','));
        const csvPath = path.join(OUT_DIR, 'elections_2021.csv');
        fs.writeFileSync(csvPath, '﻿'+header+'\n'+csvRows.join('\n'), 'utf8');
        console.log('SAVED', rows.length, 'rows to', OUT_DIR);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, rows:rows.length}));
        setTimeout(() => server.close(), 500);
      } catch(e) { res.writeHead(500); res.end(e.message); }
    });
  } else { res.writeHead(404); res.end(); }
});

server.listen(PORT, '127.0.0.1', () => console.log('Ready on http://127.0.0.1:'+PORT));
setTimeout(() => { console.log('Timeout'); server.close(); }, 120000);
