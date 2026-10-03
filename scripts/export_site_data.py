"""Refresh the static site's evidence from the notebook and source expression CSV.

Run from any directory:
  python3 scripts/export_site_data.py --csv /path/to/protein_expression_data.csv
No model training or third-party Python packages are required.
"""
import argparse
import base64
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs' / 'assets'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv', type=Path, required=True)
    args = parser.parse_args()
    notebook = json.loads((ROOT / 'Notebook.ipynb').read_text())
    ASSETS.mkdir(parents=True, exist_ok=True)
    figures = {6: 'histology', 13: 'pca', 20: 'nmf', 33: 'random-forest',
               40: 'training', 42: 'cnn'}
    for index, name in figures.items():
        number = 0
        for output in notebook['cells'][index].get('outputs', []):
            png = output.get('data', {}).get('image/png')
            if png:
                (ASSETS / f'{name}-{number}.png').write_bytes(base64.b64decode(png))
                number += 1
    metrics = []
    for output in notebook['cells'][44]['outputs']:
        for line in ''.join(output.get('text', [])).splitlines():
            fields = [part.strip() for part in line.split('|')][1:-1]
            if len(fields) == 5 and fields[0] != 'Protein' and '±' in fields[1]:
                metrics.append({'protein': fields[0], **{
                    key: [float(value.strip()) for value in pair.split('±')]
                    for key, pair in zip(('rmse', 'pearson', 'spearman', 'r2'), fields[1:])
                }})
    if len(metrics) != 38 or len({r['protein'] for r in metrics}) != 38:
        raise ValueError('Expected 38 unique protein results; check notebook cell mapping.')
    spots = []
    with args.csv.open(newline='') as source:
        for row in csv.DictReader(source):
            x, y = row['id'].split('x')
            spots.append([row['VisSpot'].split('-')[2], int(x), int(y),
                          round(float(row['CDK4']), 3), round(float(row['cMYC']), 3)])
    if len(spots) != 9921 or {r[0] for r in spots} != {'A1', 'B1', 'C1', 'D1'}:
        raise ValueError('Unexpected expression data; inspect before publishing.')
    (ASSETS / 'results.json').write_text(json.dumps(metrics))
    (ASSETS / 'spatial.json').write_text(json.dumps(spots, separators=(',', ':')))
    print(f'Exported {len(metrics)} protein metrics and {len(spots)} spatial spots.')


if __name__ == '__main__':
    main()
