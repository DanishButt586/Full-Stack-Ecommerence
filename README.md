<div align="center">

# 🛍️ Full-Stack E-Commerce Platform

### _Premium MERN Stack Application_

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)](https://stripe.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A modern, production-ready e-commerce platform featuring real-time notifications, secure payments, and comprehensive admin tools.**

[🚀 Live Demo](#) • [📖 Documentation](#features) • [🐛 Report Bug](https://github.com/DanishButt586/Full-Stack-Web-Development/issues) • [✨ Request Feature](https://github.com/DanishButt586/Full-Stack-Web-Development/issues)

</div>

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 **Authentication & Security**

- 🔑 JWT-based authentication
- 🌐 Google OAuth 2.0 integration
- 🔒 Bcrypt password hashing
- 👥 Role-based access control (Admin/User)
- 📧 Session management with Passport.js

</td>
<td width="50%">

### 💳 **Payment Integration**

- 💰 Stripe PaymentIntents API
- 🔔 Webhook event handling
- 💵 Secure card validation (Luhn algorithm)
- 📊 Payment status tracking
- 🎫 Promo code & coupon system

</td>
</tr>
<tr>
<td width="50%">

### 🛒 **E-Commerce Core**

- 📦 Product catalog with filters
- 🔍 Advanced search & pagination
- 🛍️ Shopping cart management
- 📝 Order processing & tracking
- ⭐ Product reviews & ratings
- 🏷️ Category management

</td>
<td width="50%">

### ⚡ **Real-Time Features**

- 🔴 Socket.IO notifications
- 🔔 Live order updates
- 📢 Admin notification center
- 🎯 Customer alerts
- 🔄 Live coupon updates
- 📊 Real-time dashboard metrics

</td>
</tr>
<tr>
<td width="50%">

### 👨‍💼 **Admin Dashboard**

- 📊 Sales & inventory reports
- 📦 Order management system
- 🎟️ Coupon creation & tracking
- 👥 Customer management
- 📈 Analytics & insights
- 🔧 Product CRUD operations

</td>
<td width="50%">

### 🎨 **Modern UI/UX**

- 🌙 Dark mode support
- 📱 Fully responsive design
- 🎭 Smooth animations
- 🎨 Tailwind CSS styling
- ✨ Premium banners & effects
- 🖼️ Image optimization

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

### **Backend Technologies**

| Technology                                                                                                  | Version | Purpose                 |
| ----------------------------------------------------------------------------------------------------------- | ------- | ----------------------- |
| ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)         | 18+     | Runtime Environment     |
| ![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=flat&logo=express&logoColor=white)       | 5.1.0   | Web Framework           |
| ![MongoDB](https://img.shields.io/badge/MongoDB-8.20.0-47A248?style=flat&logo=mongodb&logoColor=white)      | 8.20.0  | Database (Mongoose ORM) |
| ![Stripe](https://img.shields.io/badge/Stripe-20.1.0-008CDD?style=flat&logo=stripe&logoColor=white)         | 20.1.0  | Payment Gateway         |
| ![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=flat&logo=socket.io&logoColor=white) | 4.8.1   | Real-time Communication |
| ![Passport](https://img.shields.io/badge/Passport-0.7.0-34E27A?style=flat&logo=passport&logoColor=white)    | 0.7.0   | Authentication          |

### **Frontend Technologies**

| Technology                                                                                                           | Version | Purpose               |
| -------------------------------------------------------------------------------------------------------------------- | ------- | --------------------- |
| ![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react&logoColor=black)                     | 19.2.0  | UI Library            |
| ![React Router](https://img.shields.io/badge/React_Router-7.9.6-CA4245?style=flat&logo=react-router&logoColor=white) | 7.9.6   | Client-side Routing   |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.18-06B6D4?style=flat&logo=tailwind-css&logoColor=white)     | 3.4.18  | Utility-first CSS     |
| ![Axios](https://img.shields.io/badge/Axios-1.13.2-5A29E4?style=flat&logo=axios&logoColor=white)                     | 1.13.2  | HTTP Client           |
| ![Stripe.js](https://img.shields.io/badge/Stripe.js-8.6.0-008CDD?style=flat&logo=stripe&logoColor=white)             | 8.6.0   | Payment UI Components |

</div>

---

## 📂 Project Structure

```
📦 Full-Stack-Web-Development
┣ 📂 Backend
┃ ┣ 📂 Config                    # Configuration files
┃ ┃ ┗ 📜 passport.js             # Google OAuth strategy
┃ ┣ 📂 Controllers               # Business logic layer
┃ ┃ ┣ 📜 authController.js       # Authentication & authorization
┃ ┃ ┣ 📜 cartController.js       # Shopping cart operations
┃ ┃ ┣ 📜 categoryController.js   # Category management
┃ ┃ ┣ 📜 couponController.js     # Coupon CRUD & validation
┃ ┃ ┣ 📜 notificationController.js # Real-time notifications
┃ ┃ ┣ 📜 orderController.js      # Order processing
┃ ┃ ┣ 📜 paymentController.js    # Stripe integration
┃ ┃ ┣ 📜 productController.js    # Product CRUD
┃ ┃ ┣ 📜 reportController.js     # Analytics & reports
┃ ┃ ┗ 📜 reviewController.js     # Product reviews
┃ ┣ 📂 Library
┃ ┃ ┗ 📜 helper.js               # Utility functions
┃ ┣ 📂 Middleware
┃ ┃ ┗ 📜 authMiddleware.js       # JWT & admin guards
┃ ┣ 📂 Models                    # Mongoose schemas
┃ ┃ ┣ 📜 cartModel.js
┃ ┃ ┣ 📜 categoryModel.js
┃ ┃ ┣ 📜 couponModel.js
┃ ┃ ┣ 📜 notificationModel.js
┃ ┃ ┣ 📜 orderModel.js
┃ ┃ ┣ 📜 productModel.js
┃ ┃ ┣ 📜 reviewModel.js
┃ ┃ ┗ 📜 userModel.js
┃ ┣ 📂 Routes                    # API endpoints
┃ ┣ 📂 uploads                   # Static file storage
┃ ┃ ┗ 📂 products
┃ ┣ 📜 database.js               # MongoDB connection
┃ ┣ 📜 index.js                  # Server entry point
┃ ┣ 📜 notificationSocket.js     # Socket.IO config
┃ ┗ 📜 package.json
┣ 📂 frontend
┃ ┣ 📂 public
┃ ┃ ┣ 📜 index.html
┃ ┃ ┣ 📜 manifest.json
┃ ┃ ┗ 📜 robots.txt
┃ ┣ 📂 src
┃ ┃ ┣ 📂 components
┃ ┃ ┃ ┣ 📂 auth                  # Authentication pages
┃ ┃ ┃ ┣ 📂 common                # Reusable components
┃ ┃ ┃ ┣ 📂 legal                 # Terms & Privacy
┃ ┃ ┃ ┣ 📜 AdminDashboard.jsx    # Admin control panel
┃ ┃ ┃ ┣ 📜 Carousel3D.jsx        # 3D product carousel
┃ ┃ ┃ ┣ 📜 Checkout.jsx          # Checkout flow
┃ ┃ ┃ ┣ 📜 CouponManagement.jsx
┃ ┃ ┃ ┣ 📜 Dashboard.jsx         # User dashboard
┃ ┃ ┃ ┣ 📜 NotificationDropdown.jsx
┃ ┃ ┃ ┣ 📜 OrderManagement.jsx
┃ ┃ ┃ ┣ 📜 ProductCatalog.jsx
┃ ┃ ┃ ┣ 📜 ProductDetails.jsx
┃ ┃ ┃ ┣ 📜 ReviewManagement.jsx
┃ ┃ ┃ ┗ 📜 ShoppingCart.jsx
┃ ┃ ┣ 📂 context
┃ ┃ ┃ ┗ 📜 CartContext.js        # Global cart state
┃ ┃ ┣ 📂 services                # API service layer
┃ ┃ ┣ 📂 utils                   # Helper utilities
┃ ┃ ┣ 📜 App.js
┃ ┃ ┗ 📜 index.js
┃ ┣ 📜 tailwind.config.js
┃ ┗ 📜 package.json
┣ 📜 .gitignore
┣ 📜 package.json                # Root workspace scripts
┗ 📜 README.md
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5.0+) - [Local](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas)
- **Stripe Account** - [Sign up](https://dashboard.stripe.com/register)
- **Google OAuth Credentials** - [Console](https://console.cloud.google.com/)

### 📥 Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/DanishButt586/Full-Stack-Web-Development.git
cd Full-Stack-Web-Development

# 2️⃣ Install root dependencies
npm install

# 3️⃣ Install backend dependencies
cd Backend
npm install

# 4️⃣ Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### ⚙️ Environment Setup

Create a `.env` file in the **Backend** folder:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ecommerce

# Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
SESSION_SECRET=your_session_secret_key_min_32_characters

# Admin Credentials (for seeding)
ADMIN_EMAIL=Admin123@gmail.com
ADMIN_PASSWORD=Admin123@

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 🏃‍♂️ Running the Application

#### Option 1: Run Both Servers Concurrently (Recommended)

```bash
# From the root directory
npm run dev
```

This will start:

- ⚡ Backend API on `http://localhost:5000`
- 🎨 Frontend UI on `http://localhost:3000`

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**

```bash
cd Backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm start
```

---

## 📜 Available Scripts

### Root Level

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `npm run dev`            | 🚀 Run both servers concurrently with hot reload |
| `npm run dev:backend`    | ⚙️ Run only backend server (nodemon)             |
| `npm run dev:frontend`   | 🎨 Run only frontend (React dev server)          |
| `npm run start:backend`  | 🏭 Start backend in production mode              |
| `npm run start:frontend` | 🏭 Start frontend in production mode             |

### Backend Scripts

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `npm start`   | Start production server              |
| `npm run dev` | Development server with auto-restart |

### Frontend Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm start`     | Start development server |
| `npm run build` | Create production build  |
| `npm test`      | Run test suite           |

---

## 🎯 Core Features Deep Dive

### 🔐 Authentication System

- **Email/Password Registration**: Secure signup with bcrypt hashing
- **JWT Token Management**: Stateless authentication with refresh tokens
- **Google OAuth 2.0**: One-click social login via Passport.js
- **Role-Based Access**: User and Admin role segregation
- **Session Persistence**: Express-session for OAuth flows

### 💳 Payment Processing

- **Stripe Integration**:
  - PaymentIntent API for secure transactions
  - Webhook handlers for payment events (`payment_intent.succeeded`, `payment_intent.failed`)
  - Card validation using Luhn algorithm
  - Support for multiple currencies
- **Coupon System**:
  - Percentage and fixed amount discounts
  - Minimum purchase requirements
  - Usage limits and expiration dates
  - Real-time validation

### 🛒 Shopping Experience

1. **Product Catalog**

   - Advanced filtering (category, price range, ratings)
   - Full-text search
   - Pagination with customizable page size
   - Product variants & specifications

2. **Cart Management**

   - Persistent cart storage (MongoDB)
   - Real-time price calculations
   - Stock validation
   - Coupon application

3. **Checkout Flow**
   - Multi-step checkout process
   - Address management (multiple addresses)
   - Payment method selection
   - Order confirmation

### ⚡ Real-Time Notifications

**Socket.IO Implementation:**

- Admin notifications for new orders
- Customer order status updates
- Review submission alerts
- Coupon activation broadcasts
- Mark as read functionality
- Unread badge counts

### 📊 Admin Dashboard

**Management Panels:**

- 📦 **Products**: Create, edit, delete products with image uploads
- 🛍️ **Orders**: View, process, update order statuses
- 🎟️ **Coupons**: Generate and manage discount codes
- ⭐ **Reviews**: Moderate customer reviews
- 👥 **Customers**: View user accounts and purchase history
- 📈 **Reports**: Sales analytics and inventory reports

---

## 🔌 API Documentation

### Authentication Endpoints

```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login with credentials
GET    /api/auth/profile           # Get user profile (Protected)
PUT    /api/auth/profile           # Update profile (Protected)
GET    /api/auth/google            # Initiate Google OAuth
GET    /api/auth/google/callback   # Google OAuth callback
POST   /api/auth/logout            # Logout user
```

### Product Endpoints

```http
GET    /api/products               # Get all products (with filters)
GET    /api/products/:id           # Get single product
POST   /api/products               # Create product (Admin)
PUT    /api/products/:id           # Update product (Admin)
DELETE /api/products/:id           # Delete product (Admin)
```

**Query Parameters for GET /api/products:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Filter by category ID
- `search` - Search in name/description
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sort` - Sort by: `price_asc`, `price_desc`, `newest`, `rating`

### Order Endpoints

```http
POST   /api/orders                 # Create new order (Protected)
GET    /api/orders                 # Get all orders (Admin)
GET    /api/orders/myorders        # Get user's orders (Protected)
GET    /api/orders/:id             # Get order details (Protected)
PUT    /api/orders/:id/status      # Update order status (Admin)
POST   /api/orders/:id/cancel      # Cancel order (Protected)
```

### Payment Endpoints

```http
POST   /api/payment/create-intent  # Create Stripe PaymentIntent (Protected)
POST   /api/payment/confirm        # Confirm payment (Protected)
GET    /api/payment/status/:id     # Get payment status (Protected)
POST   /api/payment/webhook        # Stripe webhook handler (Public)
```

### Notification Endpoints

```http
GET    /api/notifications          # Get admin notifications (Admin)
GET    /api/notifications/customer # Get customer notifications (Protected)
PUT    /api/notifications/:id/read # Mark notification as read (Protected)
PUT    /api/notifications/mark-all-read # Mark all as read (Admin)
DELETE /api/notifications/:id      # Delete notification (Protected)
```

---

## 🎨 Frontend Components

### User-Facing Components

- **ProductCatalog**: Grid view with filters and search
- **ProductDetails**: Detailed product page with image gallery
- **ShoppingCart**: Cart items with quantity controls
- **Checkout**: Multi-step payment flow
- **Dashboard**: User account overview
- **Orders**: Order history and tracking
- **PostOrderReview**: Review submission modal

### Admin Components

- **AdminDashboard**: Centralized admin control panel
- **ProductManagement**: CRUD operations for products
- **OrderManagement**: Order processing interface
- **CouponManagement**: Coupon creation and tracking
- **ReviewManagement**: Review moderation
- **CustomerReportModal**: Customer analytics
- **SalesReportModal**: Revenue reports
- **InventoryReportModal**: Stock management

### Shared Components

- **NotificationDropdown**: Real-time notification center
- **Carousel3D**: 3D product carousel
- **Toast**: Notification toasts
- **Button**: Custom styled buttons
- **Input**: Form input components
- **PremiumBanner**: Featured product banners

---

## 🔧 Configuration

### Stripe Setup

1. **Get API Keys:**

   ```bash
   # Test mode keys from: https://dashboard.stripe.com/test/apikeys
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. **Webhook Setup:**

   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:5000/api/payment/webhook

   # Copy webhook signing secret
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

---

## 🧪 Testing

### Backend Testing

```bash
cd Backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Google OAuth flow
- [ ] Product browsing and filtering
- [ ] Add to cart and quantity updates
- [ ] Apply coupon code
- [ ] Checkout and payment
- [ ] Order creation and status updates
- [ ] Review submission
- [ ] Admin product management
- [ ] Real-time notifications

---

## 🚀 Deployment

### Backend Deployment (Example: Heroku)

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set STRIPE_SECRET_KEY=your_stripe_key

# Deploy
git subtree push --prefix Backend heroku main
```

### Frontend Deployment (Example: Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend folder
cd frontend
vercel --prod
```

### Environment Variables for Production

Ensure all production URLs are updated:

- Update `MONGODB_URI` to MongoDB Atlas
- Update frontend API URLs to production backend
- Update Stripe keys to live mode
- Update OAuth redirect URIs

---

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**

```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# Or use MongoDB Atlas connection string
```

**2. React Hook Warnings**

```javascript
// Add ESLint disable comment above useEffect
// eslint-disable-next-line react-hooks/exhaustive-deps
```

**3. Socket.IO Not Connecting**

```javascript
// Verify SOCKET_SERVER_URL in frontend services
const SOCKET_SERVER_URL = "http://localhost:5000";
```

**4. Stripe Payment Fails**

```bash
# Test with Stripe test cards
# Card Number: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits
```

**5. Google OAuth Errors**

- Verify redirect URI matches exactly (including http/https)
- Ensure Google+ API is enabled
- Check client ID and secret are correct

---

## 📚 Learning Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines

- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---

## 👤 Author

**Danish Butt**

- GitHub: [@DanishButt586](https://github.com/DanishButt586)
- Project Link: [Full-Stack-Web-Development](https://github.com/DanishButt586/Full-Stack-Web-Development)

---

## 🙏 Acknowledgments

- [Stripe](https://stripe.com/) for payment infrastructure
- [MongoDB](https://www.mongodb.com/) for database solutions
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [React Icons](https://react-icons.github.io/react-icons/) for iconography
- [Socket.IO](https://socket.io/) for real-time features

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Built with ❤️ using the MERN Stack**

[![Made with MongoDB](https://img.shields.io/badge/Made%20with-MongoDB-green?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Made with Express](https://img.shields.io/badge/Made%20with-Express-black?style=flat&logo=express)](https://expressjs.com/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-blue?style=flat&logo=react)](https://reactjs.org/)
[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green?style=flat&logo=node.js)](https://nodejs.org/)

</div>
