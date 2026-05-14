"""
Scraper elections legislatives marocaines 2021
API: https://www.elections.ma/ElectionLegislatives.asmx/getListResultVoix
"""

import time
import json
import csv
import sys
from bs4 import BeautifulSoup
import requests

BASE_URL = "https://www.elections.ma/elections/legislatives/resultats.aspx?Id=T1uzm+f7U%2fWFF+rn+x03Zg%3d%3d&IE=1"
API_URL = "https://www.elections.ma/ElectionLegislatives.asmx/getListResultVoix"
C_ELECTION = 17
API_DELAY = 3.0   # seconds between API calls

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,ar;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

API_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
}


def get_hidden_fields(soup):
    fields = {}
    for inp in soup.find_all("input", type="hidden"):
        name = inp.get("name") or inp.get("id")
        if name:
            fields[name] = inp.get("value", "")
    return fields


def get_select_options(soup, select_id):
    sel = soup.find("select", id=select_id)
    if not sel:
        # Try partial id match
        sel = soup.find("select", id=lambda x: x and select_id in x)
    if not sel:
        return []
    return [
        {"value": opt.get("value", ""), "text": opt.get_text(strip=True)}
        for opt in sel.find_all("option")
        if opt.get("value", "") not in ("0", "")
    ]


def post_form(session, state, overrides, delay=0.8):
    data = {**state, **overrides}
    resp = session.post(
        BASE_URL,
        data=data,
        headers={**HEADERS, "Content-Type": "application/x-www-form-urlencoded", "Referer": BASE_URL},
        allow_redirects=True,
        timeout=30,
    )
    resp.raise_for_status()
    time.sleep(delay)
    return BeautifulSoup(resp.text, "html.parser")


def call_api(session, region_code, province_code, circ_code, retries=3):
    payload = {
        "Region": str(region_code),
        "province": str(province_code),
        "Circ_Leg": str(circ_code),
        "C_Election": C_ELECTION,
    }
    for attempt in range(retries):
        try:
            resp = session.post(
                API_URL,
                json=payload,
                headers={**API_HEADERS, "Referer": BASE_URL},
                timeout=20,
            )
            if resp.status_code == 503:
                wait = (attempt + 1) * 5
                print(f"    503 rate limit, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            data = resp.json()
            return data.get("d", [])
        except Exception as e:
            wait = (attempt + 1) * 5
            print(f"    API error (attempt {attempt+1}): {e} — waiting {wait}s")
            time.sleep(wait)
    return []


def scrape_all():
    session = requests.Session()
    session.headers.update(HEADERS)
    all_data = []

    print("Chargement page initiale...")
    resp = session.get(BASE_URL, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    base_state = get_hidden_fields(soup)
    print(f"  ViewState: {len(base_state.get('__VIEWSTATE', ''))} chars")

    regions = get_select_options(soup, "DDLRegion")
    print(f"  Regions trouvees: {len(regions)}")

    for reg in regions:
        reg_val = reg["value"]
        reg_name = reg["text"]
        print(f"\n▶ Region {reg_val}: {reg_name}")

        soup = post_form(session, base_state, {
            "__EVENTTARGET": "ctl00$ContentPlaceHolder1$DDLRegion",
            "__EVENTARGUMENT": "",
            "ctl00$ContentPlaceHolder1$DDLRegion": reg_val,
            "ctl00$ContentPlaceHolder1$DDLProvince": "0",
            "ctl00$ContentPlaceHolder1$DDLCirc_Leg": "0",
        })
        reg_state = get_hidden_fields(soup)

        provinces = get_select_options(soup, "DDLProvince")
        j_circs = [
            c for c in get_select_options(soup, "DDLCirc_Leg")
            if int(c["value"]) >= 900
        ]
        print(f"  Provinces: {len(provinces)}, Circuits جهوية: {len(j_circs)}")

        # Regional circuits
        for jc in j_circs:
            print(f"  جهوية circuit {jc['value']}: {jc['text']}")
            rows = call_api(session, reg_val, "0", jc["value"])
            print(f"    → {len(rows)} partis")
            for r in rows:
                all_data.append({
                    "region": reg_name, "province": "", "daire": jc["text"],
                    "type": "جهوية",
                    "parti": r.get("Nom_Partis", ""),
                    "candidat": r.get("PrenomNom_Cand", ""),
                    "voix": r.get("N_Voix", ""),
                    "sieges": r.get("N_Elus", ""),
                })
            time.sleep(API_DELAY)

        # Local circuits per province
        for prov in provinces:
            prov_val = prov["value"]
            prov_name = prov["text"]
            print(f"  Province {prov_val}: {prov_name}")

            soup_p = post_form(session, reg_state, {
                "__EVENTTARGET": "ctl00$ContentPlaceHolder1$DDLProvince",
                "__EVENTARGUMENT": "",
                "ctl00$ContentPlaceHolder1$DDLRegion": reg_val,
                "ctl00$ContentPlaceHolder1$DDLProvince": prov_val,
                "ctl00$ContentPlaceHolder1$DDLCirc_Leg": "0",
            })
            prov_state = get_hidden_fields(soup_p)
            l_circs = [
                c for c in get_select_options(soup_p, "DDLCirc_Leg")
                if int(c["value"]) < 900
            ]
            print(f"    Circuits locaux: {len(l_circs)}")

            for lc in l_circs:
                print(f"    Circuit {lc['value']}: {lc['text']}")
                rows = call_api(session, reg_val, prov_val, lc["value"])
                print(f"      → {len(rows)} partis")
                for r in rows:
                    all_data.append({
                        "region": reg_name, "province": prov_name,
                        "daire": lc["text"], "type": "محلية",
                        "parti": r.get("Nom_Partis", ""),
                        "candidat": r.get("PrenomNom_Cand", ""),
                        "voix": r.get("N_Voix", ""),
                        "sieges": r.get("N_Elus", ""),
                    })
                time.sleep(API_DELAY)

        base_state = reg_state
        print(f"  ✓ Total cumule: {len(all_data)} lignes")

    return all_data


def save_csv(data, filename="elections_2021.csv"):
    if not data:
        print("Aucune donnee a sauvegarder.")
        return
    fieldnames = ["region", "province", "daire", "type", "parti", "candidat", "voix", "sieges"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"\n✅ CSV: {filename} ({len(data)} lignes)")


def save_json(data, filename="elections_2021.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ JSON: {filename} ({len(data)} entrees)")


if __name__ == "__main__":
    print("=" * 60)
    print("Scraper Elections Legislatives Maroc 2021")
    print("=" * 60)

    try:
        data = scrape_all()
        print(f"\n🏁 Scraping termine: {len(data)} lignes")
        save_csv(data)
        save_json(data)
    except Exception as e:
        print(f"\n❌ Erreur: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
