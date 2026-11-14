"""Compare a saved local API snapshot to every field of the approved111-row source."""
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[4]
source=json.loads((root/'docs/plans/salon-stock-2026-11-14/initial-inventory.draft.json').read_text())
snapshot=json.loads(Path(sys.argv[1]).read_text())
actual={i['source_row_id']:i for i in snapshot['items']}
assert len(actual)==len(snapshot['items'])==111
for row in source['items']:
 item=actual[row['source_row_id']]
 expected={'name':row['display_name'],'location':row['location'],'category':row['category'],'category_label':row['category_label'],'category_is_inferred':row['category_is_inferred'],'quantity':row['quantity'],'unit':row['unit'],'package_note':row['package_note'] or '', 'source_markers':row['source_markers'],'source_line':row['source_line'],'source_section':row['source_section'],'observation':row['observation']}
 for field,value in expected.items():
  assert item[field]==value,(row['source_row_id'],field,item[field],value)
 assert item['revision']==1
assert snapshot['withdrawal_takers']==['Benja','Mari','Nacha','Luis','Cristobal','Marvin','Nadia','Cony','Macarena','Paulina']
print('PASS all111 imported quantities, units, categories, notes, source markers/lines/sections and partial observations; exact10takers')
