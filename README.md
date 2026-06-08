# 🍴 SmartDine — Smart Restaurant Ordering System

A full-stack, production-ready QR-based restaurant ordering system built with the MERN stack, featuring real-time communication, AI-driven recommendations, voice ordering, and Razorpay payments.

---

## 🏗️ Tech Stack

| Layer        | Technology                         |
|--------------|-------------------------------------|
| Frontend     | React.js + Tailwind CSS + Recharts  |
| Backend      | Node.js + Express.js                |
| Database     | MongoDB + Mongoose                  |
| Real-time    | Socket.io                           |
| Auth         | JWT (Role-based: admin / kitchen)   |
| Payments     | Razorpay                            |
| QR Codes     | qrcode (backend) + qrcode.react     |
| Deployment   | Vercel (frontend) + Render (backend)|

---

## 📁 Project Structure

```
restaurant-system/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Login, register, me
│   │   ├── menuController.js    # CRUD for menu items
│   │   ├── orderController.js   # Order lifecycle
│   │   ├── tableController.js   # Table management + QR
│   │   ├── paymentController.js # Razorpay integration
│   │   └── analyticsController.js
│   ├── middleware/
│   │   └── auth.js              # JWT protect + authorize
│   ├── models/
│   │   ├── User.js
│   │   ├── Table.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── tables.js
│   │   ├── payments.js
│   │   └── analytics.js
│   ├── sockets/
│   │   └── socketHandler.js     # Socket.io event handlers
│   ├── utils/
│   │   └── seeder.js            # Database seed script
│   ├── server.js                # App entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html           # Razorpay script included
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   │   ├── OrdersPanel.js        # Live orders management
    │   │   │   ├── TablesOverview.js     # Table map + status
    │   │   │   ├── MenuManager.js        # CRUD menu UI
    │   │   │   ├── AnalyticsDashboard.js # Charts & KPIs
    │   │   │   └── QRManager.js          # Generate & download QRs
    │   │   └── customer/
    │   │       ├── MenuItemCard.js       # Menu item display
    │   │       ├── CartPanel.js          # Cart + checkout
    │   │       ├── OrderTracker.js       # Order status tracker
    │   │       ├── VoiceOrderButton.js   # Speech recognition
    │   │       └── RecommendationSection.js # AI suggestions
    │   ├── context/
    │   │   ├── AuthContext.js    # JWT auth state
    │   │   └── CartContext.js    # Cart state + localStorage
    │   ├── hooks/
    │   │   └── useAIRecommendations.js  # Logic-based AI engine
    │   ├── pages/
    │   │   ├── CustomerMenu.js   # Main customer page
    │   │   ├── AdminDashboard.js # Admin panel (tabs)
    │   │   ├── KitchenPanel.js   # Kitchen display
    │   │   ├── AdminLogin.js     # Login page
    │   │   └── OrderConfirmation.js
    │   ├── services/
    │   │   ├── api.js            # Axios API client
    │   │   └── socket.js         # Socket.io client
    │   ├── utils/
    │   │   └── translations.js   # EN / Hindi / Marathi
    │   ├── App.js
    │   ├── index.js
    │   ├── index.css
    │   └── tailwind.config.js
    ├── .env.example
    └── package.json
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant_db
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_here
REACT_APP_FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Razorpay account (test keys)

### Step 1: Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Razorpay keys

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your API URL and Razorpay key
```

### Step 3: Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- **Admin user**: `admin@restaurant.com` / `admin123`
- **Kitchen user**: `kitchen@restaurant.com` / `kitchen123`
- **27 menu items** across 8 categories
- **10 tables** with unique QR codes

### Step 4: Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

### Step 5: Access the System

| URL                              | Description             |
|----------------------------------|-------------------------|
| `http://localhost:3000/menu?table=1` | Customer menu (Table 1) |
| `http://localhost:3000/admin`    | Admin dashboard         |
| `http://localhost:3000/kitchen`  | Kitchen display         |

---

## 📡 API Reference

### Authentication

| Method | Endpoint             | Access  | Description        |
|--------|----------------------|---------|--------------------|
| POST   | `/api/auth/login`    | Public  | Login with email/password |
| GET    | `/api/auth/me`       | Private | Get current user   |
| POST   | `/api/auth/register` | Admin   | Create staff user  |

### Menu

| Method | Endpoint         | Access  | Description           |
|--------|------------------|---------|-----------------------|
| GET    | `/api/menu`      | Public  | Get all menu items    |
| GET    | `/api/menu/popular` | Public | Get popular items  |
| GET    | `/api/menu/:id`  | Public  | Get single item       |
| POST   | `/api/menu`      | Admin   | Create item           |
| PUT    | `/api/menu/:id`  | Admin   | Update item           |
| DELETE | `/api/menu/:id`  | Admin   | Delete item           |

### Orders

| Method | Endpoint                       | Access         | Description          |
|--------|--------------------------------|----------------|----------------------|
| POST   | `/api/orders`                  | Public         | Place new order      |
| GET    | `/api/orders`                  | Admin/Kitchen  | Get all orders       |
| GET    | `/api/orders/:id`              | Public         | Get order by ID      |
| GET    | `/api/orders/table/:number`    | Public         | Get active orders for table |
| PUT    | `/api/orders/:id/status`       | Admin/Kitchen  | Update order status  |
| POST   | `/api/orders/call-waiter`      | Public         | Notify waiter        |

### Tables

| Method | Endpoint                | Access | Description          |
|--------|-------------------------|--------|----------------------|
| GET    | `/api/tables`           | Admin  | Get all tables       |
| GET    | `/api/tables/:number`   | Public | Get table by number  |
| POST   | `/api/tables`           | Admin  | Create table         |
| GET    | `/api/tables/:number/qr`| Admin  | Generate QR code     |
| PUT    | `/api/tables/:id/status`| Admin  | Update table status  |

### Payments

| Method | Endpoint                       | Access | Description            |
|--------|--------------------------------|--------|------------------------|
| POST   | `/api/payments/create-order`   | Public | Create Razorpay order  |
| POST   | `/api/payments/verify`         | Public | Verify payment         |
| POST   | `/api/payments/cash`           | Admin  | Record cash payment    |

### Analytics

| Method | Endpoint                    | Access | Description         |
|--------|-----------------------------|--------|---------------------|
| GET    | `/api/analytics/dashboard`  | Admin  | Full dashboard data |

---

## 📡 Socket Events

### Client → Server

| Event         | Payload                        | Description                  |
|---------------|--------------------------------|------------------------------|
| `joinAdmin`   | —                              | Join admin notification room |
| `joinKitchen` | —                              | Join kitchen room            |
| `joinTable`   | `{ tableNumber }`              | Join table room              |

### Server → Client

| Event           | Payload           | Description                       |
|-----------------|-------------------|-----------------------------------|
| `newOrder`      | Order object      | Broadcast to admin + kitchen      |
| `orderUpdated`  | Order object      | Status change notification        |
| `orderCreated`  | Order object      | Notify customer's table           |
| `waiterCall`    | `{ tableNumber }` | Broadcast to admin room           |
| `paymentSuccess`| `{ orderId, tableNumber, amount }` | Payment confirmed |
| `tableUpdated`  | Table object      | Table status changed              |
| `waiterOnWay`   | `{ tableNumber }` | Waiter acknowledged the call      |

---

## 🤖 AI Features (Logic-based)

All AI features are implemented with pure JavaScript logic — no external ML APIs required.

### 1. Time-Based Recommendations
- **6–11 AM**: Beverages + light items
- **11–15 PM**: Main Course + Rice & Biryani
- **15–18 PM**: Starters + Beverages (snack time)
- **Evening**: Popular + Featured items

### 2. Smart Upselling
- Main Course in cart → suggest Breads + Beverages
- Starters only → suggest Main Course
- Full meal → suggest Desserts

### 3. Voice Ordering
Uses browser `SpeechRecognition` API. Supports:
- English: "2 paneer butter masala and 3 roti"
- Hindi numbers: "do paneer tikka"
- Auto-matches to menu item names

### 4. Complementary Items
Admin can set `complementaryItems` on any menu item for cross-sell suggestions.

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy /build folder to Vercel
# Set env vars in Vercel dashboard
```

### Backend → Render / Railway

```bash
# Set environment variables in Render dashboard
# Deploy from GitHub
# Start command: node server.js
```

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP (or `0.0.0.0/0` for all)
4. Copy connection string to `MONGODB_URI`

---

## 🔑 Default Credentials

| Role    | Email                         | Password    |
|---------|-------------------------------|-------------|
| Admin   | admin@restaurant.com          | admin123    |
| Kitchen | kitchen@restaurant.com        | kitchen123  |

> ⚠️ Change these immediately in production!

---

## 🌟 Feature Checklist

- [x] QR code per table (auto-detect table from URL)
- [x] Dynamic menu with categories, images, prices
- [x] Cart with quantity control and special instructions
- [x] Real-time order status (Socket.io)
- [x] Admin dashboard with live orders
- [x] Kitchen display panel
- [x] Menu CRUD (admin)
- [x] Table management with status map
- [x] QR code generator & downloader
- [x] Razorpay online payment
- [x] Cash payment recording
- [x] Analytics dashboard (charts, KPIs, peak hours)
- [x] AI recommendations (time-based + popularity)
- [x] AI upselling (cart-aware)
- [x] Voice ordering (SpeechRecognition API)
- [x] Multi-language support (EN / Hindi / Marathi)
- [x] "Call Waiter" button
- [x] Offline-first menu caching (localStorage)
- [x] JWT role-based authentication
- [x] Order confirmation page with payment
- [x] Notification sounds on new orders
- [x] Mobile-first responsive design
- [x] Database seeder with realistic data

---

## 🛠️ Troubleshooting

**MongoDB connection fails**
- Check `MONGODB_URI` format
- Ensure IP is whitelisted in Atlas
- Verify database user credentials

**Socket.io not connecting**
- Check `REACT_APP_SOCKET_URL` points to backend
- Ensure CORS `FRONTEND_URL` matches your frontend domain

**Razorpay payment fails**
- Use test keys for development (prefix `rzp_test_`)
- Ensure `RAZORPAY_KEY_SECRET` is correct on backend

**Voice ordering not working**
- Only works in Chrome/Edge (not Firefox)
- Requires HTTPS in production
- Allow microphone permission
