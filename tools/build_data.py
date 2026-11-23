"""Rebuild assets/survey.json from the workbook (Deliverable B V3, Raw Data sheet).
Run: python tools/build_data.py   (needs openpyxl)"""
import openpyxl, json, collections, os
HERE = os.path.dirname(os.path.abspath(__file__))
wb = openpyxl.load_workbook(os.path.join(HERE, 'source-workbook.xlsx'), data_only=True)
rows = list(wb['Raw Data'].iter_rows(min_row=3, max_row=110, values_only=True))
AREAS = [('Basilan', 'Basilan'), ('Sulu', 'Sulu'), ('Tawi', 'Tawi-Tawi'), ('Lanao', 'Lanao del Sur'), ('Maguindanao', 'Maguindanao (combined)')]
S = lambda v: str(v).strip() if v is not None else ''
recs, area = [], None
for r in rows:
    if isinstance(r[0], str) and r[0].strip():
        for k, n in AREAS:
            if r[0].strip().startswith(k): area = n
    elif isinstance(r[0], int):
        yn = lambda v: {'1': 'Yes', '2': 'No'}.get(S(v))
        lvl = lambda v: int(S(v)) if S(v) in ('1', '2', '3', '4') else None
        recs.append(dict(id=r[0], area=area, heard=yn(r[1]), aware={'L': 'Low', 'M': 'Medium', 'H': 'High'}.get(S(r[21]).upper()),
                         part=yn(r[22]), self=lvl(r[42]), lgu=lvl(r[43])))
assert len(recs) == 98
RL = {1: 'Not ready', 2: 'A little ready', 3: 'Ready', 4: 'Very much ready'}

def dist(rs, key, cats):
    vals = [x[key] for x in rs if x[key] is not None]
    c = collections.Counter(vals); n = len(vals)
    return dict(n=n, missing=len(rs) - n, counts=[dict(cat=RL.get(k, k), count=c.get(k, 0), pct=round(100 * c.get(k, 0) / n, 1) if n else None) for k in cats])

def block(rs):
    return dict(records=len(rs), heard=dist(rs, 'heard', ['Yes', 'No']), aware=dist(rs, 'aware', ['Low', 'Medium', 'High']),
                part=dist(rs, 'part', ['Yes', 'No']), self=dist(rs, 'self', [1, 2, 3, 4]), lgu=dist(rs, 'lgu', [1, 2, 3, 4]))

out = dict(generated='2026-11-23', source='Deliverable B V3 workbook, Raw Data sheet (98 records), recalculated',
           all=block(recs), current=block([x for x in recs if x['area'] != 'Sulu']),
           areas={n: block([x for x in recs if x['area'] == n]) for _, n in AREAS})
a = out['all']  # reconcile with the workbook's Executive Dashboard and Deliverable A
assert (a['heard']['counts'][0]['count'], a['heard']['n']) == (56, 94)
assert (a['aware']['counts'][0]['count'], a['aware']['n']) == (46, 85)
assert (a['part']['counts'][0]['count'], a['part']['n']) == (24, 81)
assert [c['count'] for c in a['self']['counts']] == [20, 39, 22, 9]
assert [c['count'] for c in a['lgu']['counts']] == [13, 35, 22, 12]
assert [out['areas'][n]['records'] for _, n in AREAS] == [9, 7, 4, 21, 57]
json.dump(out, open(os.path.join(HERE, '..', 'assets', 'survey.json'), 'w'), ensure_ascii=False, indent=1)
print('reconciled OK; current-BARMM heard:', out['current']['heard'])
