# Interactive case study

Live site: [Spatial — Seeing beyond the tissue](https://devs2611.github.io/Spatial-protein-expression-prediction/)

The website is served by GitHub Pages from `main` → `/docs`. Updates to that folder are published automatically.

## Run locally

```sh
python3 -m http.server 4173 --directory docs
```

Open http://localhost:4173/. No build step or API keys are needed.

## Files

- `docs/index.html`: case-study content and code examples.
- `docs/style.css`: appearance, responsive layout, and animation styles.
- `docs/app.js`: data visualisations, results, and expanded views.
- `docs/motion.js`: scrolling, animated menus, disclosures, and code controls.
- `docs/assets/`: recorded notebook results, figures, and spatial measurements.
- `scripts/export_site_data.py`: refreshes website data from `Notebook.ipynb` and the original expression CSV.

## Data and figures

Figures and results are extracted from `Notebook.ipynb`. The spatial atlas uses the [University of Warwick expression dataset](https://warwick.ac.uk/fac/sci/dcs/teaching/material/cs909/protein_expression_data.csv), preserving image-grid coordinates and CDK4/cMYC measurements rounded to three decimals. The hero's visual depth is illustrative; it is not measured tissue geometry.

The website presents saved measurements and experiment outputs, without running new model inference. Each atlas view scales its colours independently.

To refresh the assets:

```sh
python3 scripts/export_site_data.py --csv /path/to/protein_expression_data.csv
```

The site cites the dedicated Random Forest evaluation rather than the notebook's consolidated summary, where reused metric variables produced inconsistent values. Original notebook contents remain unchanged.
