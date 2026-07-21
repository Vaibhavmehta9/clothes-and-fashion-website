# 🛍️ StyleVerse – Premium Multi-Vendor Fashion Marketplace

Welcome to **StyleVerse**, a premium, modern, and high-performance multi-vendor e-commerce marketplace built for fashion enthusiasts. The platform provides a sleek storefront, interactive categories, dynamic search, a complete checkout flow, and custom dashboards for Vendors, Support Staff, and Administrators.

---

## 🚀 Key Features

* **Rich Visual Aesthetics**: A gorgeous design featuring harmonic color palettes, dark mode options, and clean typography.
* **Micro-Animations**: Custom page loader transitions, hover card effects, image zoom highlights, and button press feedback powered by **Framer Motion**.
* **Fail-Safe Curated Media**: Dynamically rotates and resolves high-quality Unsplash image pools for sneakers, t-shirts, dresses, and sarees, ensuring that no two items share identical thumbnails.
* **Complete E-Commerce Flow**: Detailed shopping cart controls, a secure checkout simulation, coupons, review ratings, wishlist tracking, and order history.
* **Multi-Vendor Ecosystem**: Segmented dashboard metrics for vendors, product listing management, and sales reports.
* **Support Ticket Desk**: Complete customer inquiry assignment and resolution interface for Support staff.
* **Super Admin Console**: Manage site-wide configurations, CMS pages, official partner logos, and banners.

---

## 🛠️ Project Architecture

StyleVerse is structured as a Monorepo managed with **Turbo**:

* `apps/web`: Front-end single-page application built with **Vite**, **React**, **TypeScript**, and **Tailwind CSS**.
* `apps/api`: Back-end RESTful API server built with **Express**, **Node.js**, **TypeScript**, and **Mongoose**.
* `scripts`: Database seeder and setup utilities to clean and populate MongoDB.

---

## ⚙️ Development Setup

### 1. Prerequisites
* **Node.js** version 20 or higher.
* **MongoDB** server running locally (or MongoDB Atlas connection string).

### 2. Environment Configuration
Create a `.env` file in the root directory (or inside `apps/api/`) based on the `.env.example` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/styleverse
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
```

### 3. Installation
Install all monorepo dependencies from the project root:
```bash
npm install
```

### 4. Database Seeding
To populate MongoDB with unique products, active coupons, blogs, partners, and test users:
```bash
node scripts/seed.js
```

### 5. Running Dev Servers
Start the backend API and frontend Vite server in parallel:
```bash
npm run dev
```

The services will be available at:
* **Storefront**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔐 Credentials Guide

All seeded test accounts share the **same password**:
> **Password**: `StyleVerse@123`

### 1. System Roles
* **Super Administrator**: `admin@styleverse.com` (Manages settings, CMS, catalog)
* **Support Staff**: `support@styleverse.com` (Manages support tickets & enquiries)

### 2. Verified Vendors
Use these to log into the Vendor Console and manage inventory:
* **UrbanThreads**: `vendor1@styleverse.com`
* **EthnicStyles**: `vendor2@styleverse.com`
* **ActiveFootwear**: `vendor3@styleverse.com`
* **BlingAccessories**: `vendor4@styleverse.com`
* **CozyWear**: `vendor5@styleverse.com`

### 3. Test Customers
Use these to browse, write reviews, order items, and open tickets:
* `aditya@example.com`
* `sneha@example.com`
* `rohan@example.com`
* `anjali@example.com`
* `karan@example.com`
