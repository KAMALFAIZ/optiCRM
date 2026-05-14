import json, urllib.request, urllib.error, time

# Login
login_data = json.dumps({'email': 'admin@opticrm.local', 'password': 'Admin@2026'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8081/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=10) as resp:
    token = json.loads(resp.read())['data']['accessToken']
print('Token OK')

with open(r'D:\kasoft-platform\OptiCRM\kb_supporia_errors.json', encoding='utf-8') as f:
    articles = json.load(f)

print(f'Articles a inserer: {len(articles)}')
headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}

ok = 0; fail = 0; fail_list = []

for i, a in enumerate(articles):
    payload = json.dumps(a).encode('utf-8')
    req = urllib.request.Request('http://localhost:8081/api/v1/sav/kb', data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            ok += 1
            if (i + 1) % 50 == 0:
                print(f'  [{i+1}/{len(articles)}] {ok} OK, {fail} FAIL')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')[:120]
        fail += 1
        fail_list.append(f'{a["codeArticle"]}: HTTP {e.code} - {body}')
        if fail <= 5:
            print(f'FAIL {a["codeArticle"]}: HTTP {e.code} - {body}')
    except Exception as e:
        fail += 1
        fail_list.append(f'{a["codeArticle"]}: {e}')

print(f'\n=== RESULTAT FINAL ===')
print(f'Total: {ok} OK, {fail} FAIL')
if fail_list:
    print('Echecs:')
    for f in fail_list[:10]:
        print(f'  {f}')
