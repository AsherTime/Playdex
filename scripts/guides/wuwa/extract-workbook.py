"""Read-only workbook extraction. Outputs stay inside the Playdex workspace."""
import hashlib
import json
import pathlib
import sys
import openpyxl

source = pathlib.Path(sys.argv[1]).resolve()
destination = pathlib.Path('reports/wuwa-comparisons/workbook.json')
before = hashlib.sha256(source.read_bytes()).hexdigest()
book = openpyxl.load_workbook(source, read_only=True, data_only=True)
sheets = {}
for sheet in book:
    cells = []
    for row in sheet.iter_rows():
        for cell in row:
            if cell.value is not None:
                cells.append({'row': cell.row, 'col': cell.column, 'address': cell.coordinate,
                              'value': cell.value, 'format': cell.number_format})
    sheets[sheet.title] = cells
book.close()
assert hashlib.sha256(source.read_bytes()).hexdigest() == before
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps({'file': source.name, 'sha256': before, 'sheets': sheets}, default=str, ensure_ascii=False), encoding='utf8')
print(json.dumps({'sheets': {key: len(value) for key, value in sheets.items()}, 'sha256': before}))
