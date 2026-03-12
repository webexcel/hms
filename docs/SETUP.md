# Hotel Udhayam International — Setup & Testing Guide

Complete guide to set up, run, and test every module of the Hotel Management System.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| MySQL | 5.7+ / 8.x | Via XAMPP or standalone |
| npm | 9+ | Comes with Node.js |
| Git | Any | Optional — only if cloning |

---

## 2. Installation

```bash
# Navigate to the project
cd C:/xampp/htdocs/hotel

# Install all dependencies (root + client + server via workspaces)
npm install
```

### Environment Variables

The server expects a `.env` file at `server/.env`. One should already exist; if not, create it:

```bash
cp .env.example server/.env
```

**Default values (development):**

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_NAME=hotel_management
DB_USER=root
DB_PASS=

JWT_SECRET=hotel-mgmt-jwt-secret-dev-2024
JWT_REFRESH_SECRET=hotel-mgmt-refresh-secret-dev-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `DB_HOST` | MySQL host |
| `DB_NAME` | Database name |
| `DB_USER` / `DB_PASS` | MySQL credentials (XAMPP default: root / empty) |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (15 minutes) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (7 days) |

---

## 3. Database Setup

### Start MySQL

- **XAMPP**: Open XAMPP Control Panel → click **Start** next to MySQL
- **Standalone**: Ensure your MySQL service is running

### Create the Database

Open a MySQL shell (or phpMyAdmin) and run:

```sql
CREATE DATABASE hotel_management;
```

### Seed Sample Data

```bash
npm run seed
```

This populates the database with:

| Data | Count | Details |
|------|-------|---------|
| Users | 5 | Admin, Manager, Front Desk, Housekeeping, Restaurant |
| Rooms | 58 | Standard (25), Deluxe (20), Suite (10), Premium (3) |
| Menu Items | 27 | Starters, Soups, Main Course, Desserts, Beverages, Breakfast, Snacks |
| Hotel Settings | 1 | Hotel Udhayam International config (GST, timings, etc.) |

**Room breakdown:**

| Type | Count | Rate/Night | Room Numbers |
|------|-------|------------|--------------|
| Standard | 25 | ₹2,500 | 101–110, 201–210, 301–305 |
| Deluxe | 20 | ₹4,500 | 211–215, 306–315, 401–405 |
| Suite | 10 | ₹8,000 | 406–415 |
| Premium | 3 | ₹15,000 | 501–503 |

---

## 4. Running the Application

| Command | What it does |
|---------|-------------|
| `npm run dev` | Starts **both** client and server concurrently |
| `npm run dev:client` | Client only (Vite dev server) |
| `npm run dev:server` | Server only (nodemon) |
| `npm run build` | Production build of the client |
| `npm run seed` | Seed/re-seed the database |
| `npm run migrate` | Run database migrations |

### URLs

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:5173](http://localhost:5173) |
| API Server | [http://localhost:5000](http://localhost:5000) |
| Health Check | [http://localhost:5000/api/health](http://localhost:5000/api/health) |
| API Proxy | Frontend proxies `/api/*` requests to port 5000 automatically |

### Verify it's working

1. Run `npm run dev`
2. Wait for both "Vite ready" and "Server running on port 5000" messages
3. Open [http://localhost:5000/api/health](http://localhost:5000/api/health) — should return `{ "status": "ok" }`
4. Open [http://localhost:5173](http://localhost:5173) — should show the login page

---

## 5. Login Credentials

All passwords are seeded in plain text and hashed with bcrypt on insert.

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | `admin` | `admin123` | admin@hotel.com |
| Manager | `manager` | `manager123` | manager@hotel.com |
| Front Desk | `frontdesk` | `front123` | frontdesk@hotel.com |
| Housekeeping | `housekeeper` | `house123` | hk@hotel.com |
| Restaurant | `restaurant` | `rest123` | restaurant@hotel.com |

**Role permissions:**
- **Admin** — Full access to all modules including Settings
- **Manager** — All modules except Settings
- **Front Desk** — Front desk, guests, reservations, billing
- **Housekeeping** — Housekeeping tasks only
- **Restaurant** — Restaurant orders and menu management

---

## 6. Testing Each Module — Step by Step

### 6.1 Login

1. Open [http://localhost:5173](http://localhost:5173)
2. Enter username `admin` and password `admin123`
3. Click **Login**
4. Verify you are redirected to the Front Desk dashboard
5. Check the sidebar shows all menu items (Admin has full access)
6. Test logout by clicking your profile → **Logout**
7. Try logging in as `frontdesk` / `front123` — verify limited sidebar items

### 6.2 Front Desk

1. Navigate to **Front Desk** from the sidebar
2. Verify the room grid loads showing all 58 rooms
3. Rooms should be color-coded by status (Available, Occupied, Reserved, Maintenance)
4. Click on any room to see its details
5. Check the stats bar at the top (total rooms, available, occupied, etc.)
6. Verify room filtering works (by floor, by type, by status)

### 6.3 Guests

1. Navigate to **Guests** from the sidebar
2. Click **Add Guest**
3. Fill in: Name, Phone, Email, ID Type, ID Number, Address
4. Save and verify the guest appears in the list
5. Use the search box to find the guest by name or phone
6. Click on the guest to view their profile/details
7. Click **Edit**, change a field, and save
8. Verify the updated info is reflected

### 6.4 Reservations

1. Navigate to **Reservations** from the sidebar
2. Click **New Reservation**
3. Select a guest (or create a new one), room type, check-in/check-out dates
4. Select a room from available options
5. Confirm and save the reservation
6. Switch between **List View** and **Calendar View** to see the reservation
7. Verify the reserved room now shows as "Reserved" on the Front Desk grid
8. Try editing and cancelling a reservation

### 6.5 Check-In Flow

1. First create a reservation (see 6.4) with today's date as check-in
2. Go to **Front Desk**
3. Find the reserved room (shown in reserved color)
4. Click on the room → click **Check In**
5. Fill in the check-in modal (verify guest details, any advance payment)
6. Complete check-in
7. Verify the room status changes to **Occupied**
8. A billing record should be auto-created

### 6.6 Check-Out Flow

1. Find an occupied room on the **Front Desk** grid
2. Click the room → click **Check Out**
3. Review the billing summary (room charges, restaurant orders, extras)
4. Verify all charges are correct
5. Record payment (cash/card/UPI)
6. Complete check-out
7. Verify room status changes to **Available** (or **Needs Cleaning**)

### 6.7 Billing

1. Navigate to **Billing** from the sidebar
2. View the list of all bills (active and closed)
3. Click on an active bill to view details
4. Add extra items/charges (minibar, laundry, etc.)
5. Record a payment against the bill
6. Click **Generate Invoice** to create a PDF
7. Verify GST calculations (CGST 6% + SGST 6% = 12% total)

### 6.8 Restaurant

1. Navigate to **Restaurant** from the sidebar
2. Click **New Order**
3. Select a room (for in-room dining) or mark as walk-in
4. Add items from the menu (e.g., Butter Chicken, Masala Chai)
5. Adjust quantities
6. Place the order
7. Update order status (Preparing → Ready → Delivered)
8. For in-room orders, click **Post to Room** to add charges to the room's bill
9. Test menu management: add a new item, edit price, toggle availability

### 6.9 Housekeeping

1. Navigate to **Housekeeping** from the sidebar
2. View the housekeeping dashboard with task overview
3. Create a new cleaning task for a room
4. Assign the task to a housekeeper
5. Update task status: Pending → In Progress → Completed
6. Create a maintenance request for a room
7. Verify room status updates reflect housekeeping state

### 6.10 Staff

1. Navigate to **Staff** from the sidebar
2. Click **Add Staff** — fill in name, role, department, contact details
3. Save and verify the staff member appears in the list
4. View/edit staff details
5. Go to **Schedules** — create a shift schedule
6. Assign staff to shifts (Morning, Afternoon, Night)
7. Edit or delete schedules

### 6.11 Inventory

1. Navigate to **Inventory** from the sidebar
2. View current inventory items
3. Click **Add Item** — enter name, category, quantity, unit, reorder level
4. Save the item
5. Click on an item → **Adjust Stock** (add or remove quantity with reason)
6. Check the **Low Stock** alerts for items below reorder level
7. Verify stock history/transactions are recorded

### 6.12 Rates

1. Navigate to **Rates** from the sidebar
2. **Rate Plans**: Create a new rate plan (e.g., Weekend Special) with room type and pricing
3. Edit or deactivate a rate plan
4. **Packages**: Create a package (e.g., Honeymoon Package — room + dinner + spa)
5. **Promotions**: Create a promotion with discount percentage and valid date range
6. Verify rate plans appear as options during reservation creation

### 6.13 Shift Handover

1. Navigate to **Shift Handover** from the sidebar
2. Click **Create Handover**
3. Fill in: shift summary, pending tasks, important notes, cash summary
4. Submit the handover
5. Log out and log in as the next shift user (e.g., `frontdesk`)
6. Go to Shift Handover → view **Pending** handovers
7. Click **Accept** or **Reject** the handover with comments

### 6.14 Reports

1. Navigate to **Reports** from the sidebar
2. **Revenue Report**: View revenue charts (daily/weekly/monthly)
3. **Occupancy Report**: View occupancy rate over time
4. **Daily Summary**: Check today's summary (check-ins, check-outs, revenue)
5. **Guest Stats**: View guest demographics and return rates
6. Try changing date ranges and verify charts update

### 6.15 Settings (Admin Only)

1. Log in as `admin` / `admin123`
2. Navigate to **Settings** from the sidebar
3. **Hotel Info**: Update hotel name, address, phone, email
4. **Billing Settings**: Configure GST rates (CGST/SGST), tax settings
5. **Check-in/Check-out Times**: Modify default times
6. Save changes and verify they persist after page refresh
7. Log in as `manager` — verify Settings is not accessible

---

## 7. API Endpoints Reference

All endpoints are prefixed with `/api/v1/`. Authentication required unless noted.

### Auth
```
POST   /api/v1/auth/login            # Login (no auth required)
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Logout
GET    /api/v1/auth/me                # Get current user
PUT    /api/v1/auth/change-password   # Change password
```

### Rooms
```
GET    /api/v1/rooms                  # List all rooms
GET    /api/v1/rooms/dashboard        # Room dashboard stats
GET    /api/v1/rooms/:id              # Get room details
PUT    /api/v1/rooms/:id              # Update room
PUT    /api/v1/rooms/:id/status       # Update room status
```

### Guests
```
GET    /api/v1/guests                 # List guests (with search)
GET    /api/v1/guests/:id             # Get guest details
POST   /api/v1/guests                 # Create guest
PUT    /api/v1/guests/:id             # Update guest
```

### Reservations
```
GET    /api/v1/reservations           # List reservations
GET    /api/v1/reservations/arrivals  # Today's arrivals
GET    /api/v1/reservations/departures # Today's departures
GET    /api/v1/reservations/calendar  # Calendar view data
GET    /api/v1/reservations/:id       # Get reservation
POST   /api/v1/reservations           # Create reservation
PUT    /api/v1/reservations/:id       # Update reservation
PUT    /api/v1/reservations/:id/check-in   # Check in
PUT    /api/v1/reservations/:id/check-out  # Check out
PUT    /api/v1/reservations/:id/cancel     # Cancel reservation
```

### Billing
```
GET    /api/v1/billing                # List bills
GET    /api/v1/billing/stats          # Billing statistics
GET    /api/v1/billing/:id            # Get bill details
POST   /api/v1/billing                # Create bill
POST   /api/v1/billing/:id/items      # Add item to bill
DELETE /api/v1/billing/:id/items/:itemId  # Remove bill item
POST   /api/v1/billing/:id/payments   # Record payment
GET    /api/v1/billing/:id/invoice/pdf    # Download PDF invoice
GET    /api/v1/billing/:id/gst-invoice    # GST invoice
```

### Restaurant
```
GET    /api/v1/restaurant/orders      # List orders
POST   /api/v1/restaurant/orders      # Create order
PUT    /api/v1/restaurant/orders/:id  # Update order
PUT    /api/v1/restaurant/orders/:id/post-to-room  # Post charges to room
GET    /api/v1/restaurant/menu        # Get menu items
POST   /api/v1/restaurant/menu        # Add menu item
PUT    /api/v1/restaurant/menu/:id    # Update menu item
```

### Housekeeping
```
GET    /api/v1/housekeeping/tasks     # List tasks
GET    /api/v1/housekeeping/dashboard # Dashboard stats
POST   /api/v1/housekeeping/tasks     # Create task
PUT    /api/v1/housekeeping/tasks/:id # Update task
GET    /api/v1/housekeeping/maintenance   # List maintenance requests
POST   /api/v1/housekeeping/maintenance   # Create maintenance request
```

### Staff
```
GET    /api/v1/staff                  # List staff
POST   /api/v1/staff                  # Add staff member
GET    /api/v1/staff/:id              # Get staff details
PUT    /api/v1/staff/:id              # Update staff
GET    /api/v1/staff/schedules        # List schedules
POST   /api/v1/staff/schedules        # Create schedule
PUT    /api/v1/staff/schedules/:id    # Update schedule
```

### Inventory
```
GET    /api/v1/inventory              # List items
GET    /api/v1/inventory/low-stock    # Low stock alerts
GET    /api/v1/inventory/:id          # Get item details
POST   /api/v1/inventory              # Add item
PUT    /api/v1/inventory/:id          # Update item
POST   /api/v1/inventory/:id/adjust   # Adjust stock
```

### Rates
```
GET    /api/v1/rates/plans            # List rate plans
POST   /api/v1/rates/plans            # Create rate plan
PUT    /api/v1/rates/plans/:id        # Update rate plan
GET    /api/v1/rates/packages         # List packages
POST   /api/v1/rates/packages         # Create package
PUT    /api/v1/rates/packages/:id     # Update package
GET    /api/v1/rates/promotions       # List promotions
POST   /api/v1/rates/promotions       # Create promotion
PUT    /api/v1/rates/promotions/:id   # Update promotion
```

### Reports
```
GET    /api/v1/reports/revenue        # Revenue report
GET    /api/v1/reports/occupancy      # Occupancy report
GET    /api/v1/reports/daily-summary  # Daily summary
GET    /api/v1/reports/guest-stats    # Guest statistics
```

### Settings
```
GET    /api/v1/settings               # Get hotel settings
PUT    /api/v1/settings               # Update settings (admin only)
```

### Shift Handover
```
GET    /api/v1/shift-handover         # List handovers
GET    /api/v1/shift-handover/pending # Pending handovers
POST   /api/v1/shift-handover         # Create handover
PUT    /api/v1/shift-handover/:id/accept  # Accept handover
PUT    /api/v1/shift-handover/:id/reject  # Reject handover
```

### Health Check
```
GET    /api/health                    # Server health (no auth)
```

**Rate Limiting:** 500 requests per 15 minutes per IP on all `/api/` routes.

---

## 8. Troubleshooting

### Port already in use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Fix:** Kill the process using the port, or change `PORT` in `server/.env`:
```bash
# Find what's using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change the port in server/.env
PORT=5001
```

### MySQL connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Fix:**
- Ensure MySQL is running (XAMPP → Start MySQL)
- Check `DB_HOST`, `DB_USER`, `DB_PASS` in `server/.env`
- Verify MySQL is on port 3306 (default)
- For XAMPP: make sure another MySQL instance isn't blocking the port

### Database does not exist

```
Error: Unknown database 'hotel_management'
```

**Fix:** Create it manually:
```sql
CREATE DATABASE hotel_management;
```
Then run `npm run seed`.

### CORS errors in browser

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix:**
- Make sure you're accessing the frontend at `http://localhost:5173` (not port 5000)
- The Vite dev server proxies `/api/*` requests to the backend
- If accessing the API directly, the server has CORS enabled for development

### JWT token expired / 401 Unauthorized

**Fix:**
- The access token expires every 15 minutes — the app auto-refreshes it
- If you're stuck, log out and log back in
- Clear browser localStorage if tokens are corrupted:
  ```js
  localStorage.clear()
  ```

### Seeder errors

```
Error: Table already has data
```

**Fix:** The seeder may skip if data exists. To re-seed from scratch:
```sql
DROP DATABASE hotel_management;
CREATE DATABASE hotel_management;
```
Then run `npm run seed` again.

### npm install fails

**Fix:**
- Delete `node_modules` and `package-lock.json`, then retry:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Ensure Node.js v18+ is installed: `node --version`

---

## 9. Project Structure

```
hotel/
├── package.json                  # Workspace root (scripts: dev, seed, migrate)
├── client/                       # React frontend (Vite)
│   ├── package.json
│   ├── vite.config.js            # Dev server on :5173, proxies /api to :5000
│   ├── index.html
│   └── src/
│       ├── main.jsx              # Entry point
│       ├── App.jsx               # Root component with routing
│       ├── context/              # AuthContext, SidebarContext
│       ├── hooks/                # useApi, useDebounce
│       ├── services/
│       │   └── api.js            # Axios instance with auth interceptors
│       ├── routes/
│       │   ├── index.jsx         # Route definitions
│       │   └── ProtectedRoute.jsx
│       ├── components/
│       │   ├── common/           # DataTable, FormModal, StatCard, SearchBox, etc.
│       │   └── layout/           # AppLayout, Sidebar, TopHeader
│       └── pages/                # One page per module
│           ├── LoginPage.jsx
│           ├── FrontDeskPage.jsx
│           ├── GuestsPage.jsx
│           ├── ReservationsPage.jsx
│           ├── BillingPage.jsx
│           ├── RestaurantPage.jsx
│           ├── HousekeepingPage.jsx
│           ├── StaffPage.jsx
│           ├── InventoryPage.jsx
│           ├── RatesPage.jsx
│           ├── ReportsPage.jsx
│           ├── SettingsPage.jsx
│           ├── ShiftHandoverPage.jsx
│           ├── AcceptHandoverPage.jsx
│           ├── GuestDetailPage.jsx
│           └── InvoicePage.jsx
│
├── server/                       # Express backend
│   ├── package.json
│   ├── .env                      # Environment variables
│   └── src/
│       ├── server.js             # Entry point — starts Express
│       ├── app.js                # Express app setup, middleware, route mounting
│       ├── config/
│       │   └── database.js       # Sequelize MySQL connection
│       ├── middleware/
│       │   ├── auth.js           # JWT authentication
│       │   ├── rbac.js           # Role-based access control
│       │   └── errorHandler.js   # Global error handler
│       ├── models/               # Sequelize models (23 models)
│       ├── controllers/          # Route handlers (13 controllers)
│       ├── routes/               # Express route definitions (13 route files)
│       ├── seeders/
│       │   └── index.js          # Database seeder (users, rooms, menu, settings)
│       ├── migrations/           # Database migrations
│       ├── services/             # Business logic
│       └── utils/                # Helpers
```

**Tech Stack:**
- **Frontend:** React 18, Vite, Axios, React Router, Recharts
- **Backend:** Express 4, Sequelize 6, MySQL2, JWT, bcryptjs
- **Database:** MySQL (via XAMPP or standalone)
- **Other:** PDFKit (invoices), Multer (file uploads), Helmet (security), CORS

---

## Quick Start (TL;DR)

```bash
# 1. Install
cd C:/xampp/htdocs/hotel
npm install

# 2. Start MySQL (via XAMPP Control Panel)
# 3. Create database
mysql -u root -e "CREATE DATABASE hotel_management;"

# 4. Seed data
npm run seed

# 5. Start the app
npm run dev

# 6. Open http://localhost:5173
# 7. Login: admin / admin123
```
