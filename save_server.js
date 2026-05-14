const http = require('http');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname);

const PAGE = `<!DOCTYPE html><html><body>
<h2 id="s">Reading window.name...</h2>
<script>
var d = window.name;
if (d && d.length > 100) {
  document.getElementById('s').textContent = 'Got ' + d.length + ' chars, saving...';
  fetch('/save', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({data: d})
  }).then(function(r){return r.json();}).then(function(j){
    document.getElementById('s').textContent = 'DONE! ' + j.rows + ' rows saved!';
    window.name = '';
  }).catch(function(e){
    document.getElementById('s').textContent = 'ERROR: ' + e.message;
  });
} else {
  document.getElementById('s').textContent = 'No data in window.name (' + (d?d.length:0) + ' chars)';
}
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/page') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(PAGE);
    return;
  }
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const raw = JSON.parse(body).data;
        const rows = JSON.parse(raw);
        fs.writeFileSync(path.join(OUT,'elections_2021.json'), JSON.stringify(rows,null,2), 'utf8');
        const fields = ['region','province','daire','type','parti','candidat','voix','sieges'];
        const csvLines = [fields.join(',')];
        rows.forEach(r => {
          csvLines.push(fields.map(f => '"'+String(r[f]??'').replace(/"/g,'""')+'"').join(','));
        });
        fs.writeFileSync(path.join(OUT,'elections_2021.csv'), '﻿'+csvLines.join('\n'), 'utf8');
        console.log('SAVED ' + rows.length + ' rows!');
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, rows:rows.length}));
      } catch(e) {
        console.error('Error:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({error:e.message}));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(9877, '127.0.0.1', () => console.log('Ready: http://127.0.0.1:9877/page'));
setTimeout(() => { console.log('Timeout'); process.exit(1); }, 300000);
