# Full Credit Management Dashboard Upgrade

## What this adds

### New "Credit" page (regular app, owner/admin)
A dedicated Credit dashboard for your warehouse:
- Summary cards: Total Owed, Shops Owing, Overdue count, Overdue Amount
- Full table of every shop that owes money, with Record Payment right there
- Export to Excel or PDF

### Main Dashboard
A 5th summary card — **Credit Outstanding** — showing the total owed and how many shops, turning into the red "low stock" style alert color if any are overdue. Click it to jump straight to the Credit page.

### Super Admin — now shows credit across ALL warehouses
Since each warehouse is otherwise fully independent, this is the one place credit is combined:
- Overview page: a new "Credit Outstanding (all warehouses)" summary card
- Warehouse ranking table: a new "Credit Owed" column per warehouse
- Warehouse list table: same "Credit Owed" column
- Drilling into any single warehouse now shows a full credit breakdown: total owed, shops owing, overdue count/amount, and the list of shops with balances

## Files in this package
- `routes/superadmin.js` — replaces `backend/routes/superadmin.js`
- `app.js` — replaces `frontend/app.js` (adds Credit to sidebar)
- `index.html` — replaces `frontend/index.html` (adds the new script tag)
- `app-credit.js` — NEW, goes in `frontend/`
- `app-dashboard.js` — replaces `frontend/app-dashboard.js`
- `app-superadmin.js` — replaces `frontend/app-superadmin.js`

**No migration needed** — this only reads data that's already being tracked (shop credit balances from the earlier upgrade). No `server.js` edit either, since the superadmin route already exists.

## How to apply

1. Stop both servers
2. Copy `routes/superadmin.js` → replace `backend/routes/superadmin.js`
3. Copy `app.js` → replace `frontend/app.js`
4. Copy `index.html` → replace `frontend/index.html`
5. Copy `app-credit.js` → into `frontend/` (new file)
6. Copy `app-dashboard.js` → replace `frontend/app-dashboard.js`
7. Copy `app-superadmin.js` → replace `frontend/app-superadmin.js`
8. Start backend: `npm run dev`
9. Start frontend: `npx serve -p 5500`
10. Hard refresh (`Ctrl+Shift+R`)

## Suggested test flow
1. Log in normally → Dashboard should show the new Credit Outstanding card
2. Click it (or use the sidebar) → Credit page shows the same shops-owing list as before, now with summary cards and exports
3. Log in as Super Admin → Overview should show the combined credit card and the Credit Owed column in both tables
4. Drill into a warehouse → confirm the credit breakdown section appears with its shops-owing list
