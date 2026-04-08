Chapati 35

Overview

- Customer website (frontend) for placing pickup orders and table reservations
- Admin portal (admin) for managing live orders, reservations, messages and analytics
- Backend API (backend) with MongoDB, Socket.IO realtime events and email notifications

Structure

- frontend/ — Vite + React single-page site
- admin/ — Vite + React admin dashboard
- backend/ — Node.js (Express) + MongoDB + Socket.IO

Tech Stack

- Client: React, Vite, plain CSS
- Admin: React, Vite, plain CSS
- Server: Node.js, Express, Mongoose, Socket.IO, Nodemailer
- Database: MongoDB (Atlas recommended)

Key Features

- Orders (pickup)
  - Customers choose items, set a requested pickup time (15/30/45/60 minutes) and submit
  - Restaurant receives a realtime “new order” event; admin can Receive/Reject and later mark Collected
  - Customer receives email updates
- Reservations (table booking)
  - Customers reserve a 2/4/6/8 seat table on available dates/times (Paris timezone); auto‑confirmed by server
  - Admin can filter reservations (single day or date range + optional time)
- Messages
  - Footer contact form posts messages to the API
  - Admin inbox with search, mark read, delete and pagination
- Analytics & Tools (admin)
  - Last 30‑day totals and a 14‑day mini chart for orders, reservations, messages
  - Retention cleanup: keep last 15/30/60 days for orders/reservations/messages
- Realtime
  - Socket.IO “new_order” pushes to admin; a short beep plays after user clicks Enable Sound

Getting Started

Prerequisites

- Node.js 18+ and npm
- A MongoDB URI (local or Atlas)
- A Gmail (or SMTP) sender for emails (uses app password)

1) Clone & Install

1. Clone this repository
2. Install dependencies in each workspace
   - cd backend && npm install
   - cd ../frontend && npm install
   - cd ../admin && npm install

2) Environment Variables

Backend (backend/.env)

- PORT=8000
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_secret
- EMAIL_USER=you@example.com
- EMAIL_PASS=your_app_password

Frontend/Admin (Vite)

- Both apps read VITE_API_URL at runtime
- For local dev: VITE_API_URL=http://localhost:8000
- For Netlify/production: set VITE_API_URL to your deployed backend base URL (https://your-api.example.com)

3) Run Locally

- Backend
  - cd backend
  - npm run dev (if nodemon configured) or node index.js
  - Server listens on PORT (default 8000)

- Frontend
  - cd frontend
  - npm run dev
  - Open the shown http://localhost:5173 (or similar) — ensure VITE_API_URL points to backend

- Admin
  - cd admin
  - npm run dev
  - Open the shown http://localhost:5174 (or similar) — ensure VITE_API_URL points to backend

Creating an Admin User

- POST /api/auth/registeradminhere (body: name, email, password) to create an admin
- Then login via /api/auth/login with the same credentials in the admin portal

API Reference (Backend)

Auth

- POST /api/auth/registeradminhere — create admin user
- POST /api/auth/login — returns JWT; send as Authorization: Bearer <token> for admin routes

Bookings (orders and reservations)

- POST /api/bookings
  - Pickup order: include items[], totalAmount, pickupRequestedInMinutes, customer{name,email,phone}, additionalInfo?
  - Reservation: include table.size (2/4/6/8), bookingDate (YYYY‑MM‑DD), bookingTime (HH:MM), customer, additionalInfo?
  - Reservations are auto‑confirmed (status=confirmed); pickup orders start as pending

- GET /api/bookings with filters and pagination
  - Query: date=YYYY‑MM‑DD OR dateFrom/dateTo, time=HH:MM, tableSize, status, orderType=pickup|booking, code, createdDate=YYYY‑MM‑DD, page, limit
  - Returns { data: [...], pagination: { page, limit, total, totalPages } }

- PATCH /api/bookings/:id/receive — confirm a pickup order
  - Body: { confirmedMinutes: number }
- PATCH /api/bookings/:id/collected — mark pickup collected
- PATCH /api/bookings/:id/confirm — confirm a reservation (kept for future; not used now)
- PATCH /api/bookings/:id/reject — reject order/reservation

Messages

- POST /api/messages — public endpoint from footer contact form
  - Body: { name, email, phone?, message }
- GET /api/messages — admin; supports search/status/page/limit
- PATCH /api/messages/:id/read — mark as read (admin)
- DELETE /api/messages/:id — delete (admin)

Admin Tools

- GET /api/admin/stats — 30‑day totals + per‑day series (Paris time grouping) for orders, reservations, messages
- POST /api/admin/cleanup — delete older data
  - Body: { resource: "orders"|"reservations"|"messages", keepDays: 15|30|60 }

Realtime Events

- Event: new_order — emitted on new pickup orders
  - Admin listens via Socket.IO and refreshes list; a short beep plays if the operator clicked Enable Sound (browser autoplay policy)

Data Models (simplified)

Booking

- orderType: "pickup" | "booking"
- customer: { name, email, phone }
- items[] (pickup): { id, label, price?, qty }
- totalAmount (pickup only)
- For reservations: table.size, bookingDate, bookingTime; status auto "confirmed"
- Status flow for pickup: pending → received → collected or rejected

Message

- name, email, phone?, message
- status: "new" | "read"
- timestamps

Build & Deploy

Frontend/Admin (Netlify)

- Build command: npm run build
- Publish directory: dist
- Environment variable: VITE_API_URL must point to your backend HTTPS URL
- If you see form inputs without proper spacing on mobile/iOS, use the latest CSS (we force font-size and line-height; appearance: none)

Backend

- Deploy to any Node host (Railway, Render, VPS). Ensure:
  - PORT is set (exposed by host or 8000)
  - MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS are configured
  - CORS is allowed for your frontend/admin origins

Admin Portal Tips

- Enable Sound: click once to allow audio context; then new orders trigger a ~1s beep
- Use tabs at top: Orders, Reservations, Messages, Analytics
- Cleanup older data with Tools (keep last 15/30/60 days)
- Pagination defaults to 10 per page; adjust via limit query if needed

Quality & Linting

- Frontend: npm run lint
- Admin: npm run lint
- Follow the repo’s conventions; avoid storing secrets in code

Troubleshooting

- EADDRINUSE on backend: another process is using the port; change PORT or stop the other process
- Inputs look cramped on iOS/Netlify:
  - Ensure Vite build uses the current App.css (we set line-height, appearance, padding, placeholder color)
- No admin sound:
  - Browsers block audio until user interaction — click Enable Sound button once

License

- Internal project (no license specified). Contact the maintainer for usage.

