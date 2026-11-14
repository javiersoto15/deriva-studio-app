"""Independent acceptance audit against quantities in the user-provided inventory."""
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path
root=Path(__file__).resolve().parents[4]
s=json.loads((root/'docs/plans/salon-stock-2026-11-14/initial-inventory.draft.json').read_text())
expected={
 'fridge':[9,6,5,8,2,3,3,8,3,5,5,9,5,3,6,5,6,18,6,3,3,12,7,11,6,8,2,2,6,3,1,2,2,0,3,2,4,2,1,13],
 'cleaning':[6,21,0,16,25,9,0,4,2,4,32,4,0,16,5,1,2,4,15,1,'10.5',30,22,8,7,7,6,2],
 'storage':[18,5,0,18,24,18,24,36,48,30,18,36,24,36,34,11,17,24,19,12,47,28,49,18,25,36,5,8,1,1,4,1,23,12,4,3,15,4,1,3,9,6,12]
}
for location,amounts in expected.items():
 actual=[Decimal(i['quantity']) for i in s['items'] if i['location']==location]
 assert actual==[Decimal(str(x)) for x in amounts],(location,actual)
assert len(s['items'])==111
assert sum(Decimal(i['quantity'])==0 for i in s['items'])==5
assert sum(i['unit'] is None for i in s['items'])==102
assert all(i['observation']['observed_at'] is None for i in s['items'])
assert all(i['observation']['date']=='2026-11-14' and i['observation']['period']=='morning' for i in s['items'] if i['location']=='storage')
pack=next(i for i in s['items'] if i['display_name']=='Pack gorro clip');assert pack['quantity']=='1' and pack['unit']=='pack' and '100' in pack['package_note']
assert next(i for i in s['items'] if i['display_name']=='Pack cofias')['quantity']=='2'
assert next(i for i in s['items'] if i['display_name']=='Fanta pero')['quantity']=='18'
assert len([i for i in s['items'] if i['source_markers']==['*']])==2
report={'items':111,'by_location':dict(Counter(i['location'] for i in s['items'])),'zeros':5,'unknown_units':102,'all_source_amounts_exact':True,'gorro_clip_pack_of100_confirmed':True,'partial_observations_preserved':True}
print(json.dumps(report,indent=2))
