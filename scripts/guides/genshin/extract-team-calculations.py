"""Read the source workbook without modifying it; preserve every exported field."""
import datetime
import hashlib
import json
import pathlib
import sys

import openpyxl

source = pathlib.Path(sys.argv[1])
destination = pathlib.Path(sys.argv[2])
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)

def rows(sheet_name):
    sheet = workbook[sheet_name]
    values = sheet.iter_rows(min_row=4, values_only=True)
    headers = next(values)
    return [dict(zip(headers, row)) for row in values if row[0] is not None]

teams = rows("Genshin Teams")
members = rows("Genshin Members")
assert len({team['team_id'] for team in teams}) == len(teams), 'Duplicate team IDs'
for team in teams:
    matches = [member for member in members if member['team_id'] == team['team_id']]
    assert sorted(member['slot'] for member in matches) == [1, 2, 3, 4], team['team_name']
assert all(member['team_id'] in {team['team_id'] for team in teams} for member in members)
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps({
    'source_file': source.name,
    'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'teams': teams,
    'members': members,
}, ensure_ascii=False, indent=2, default=lambda value: value.isoformat() if isinstance(value, (datetime.date, datetime.datetime)) else str(value)), encoding='utf-8')
workbook.close()
print(json.dumps({'teams': len(teams), 'members': len(members), 'destination': str(destination)}))
