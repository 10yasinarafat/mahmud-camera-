# Mahmud Camera Stock

Premium camera & photo/video equipment sales management software.

## Included
- Dashboard with sales, profit, due and low-stock KPIs
- Camera/lens/accessory product management
- SKU + serial number tracking
- Point of Sale (POS)
- Customer management
- Supplier management
- Inventory tracking
- Expense management
- Sales reports
- Invoice printing
- Backup export to JSON
- Settings
- Responsive premium dark UI
- All UI text in English
- Browser localStorage persistence (no database required)

## Run locally
No build tools are required.

1. Download/clone this repository.
2. Open `index.html` in a browser.

For a local development server, you can use any static server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages
1. Create a GitHub repository.
2. Upload all files/folders from this project.
3. Go to **Settings → Pages**.
4. Select **Deploy from a branch** and choose `main` / root.
5. Save. GitHub Pages will publish `index.html`.

## Important
This version is a fully client-side starter. Data is stored in the browser's localStorage. Use **Export Backup** regularly. For a multi-user/cloud version, the next upgrade should add a secure backend/database and authentication.
