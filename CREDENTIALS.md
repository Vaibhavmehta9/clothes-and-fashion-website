# 🔐 Project Credentials & Configuration Guide

This document contains all seed users, roles, default passwords, and database connection details for development, testing, and QA audits.

---

## 👥 Seed User Accounts

All default user accounts share the **same password**:

> **Password:** `StyleVerse@123`

### 1. 🛡️ System Administrators
* **Super Admin**: `admin@styleverse.com` (Full access to settings, CMS, Catalogue, Reports)
* **Support Staff**: `support@styleverse.com` (Assigned tickets, order status updates)

### 2. 🏪 Registered Vendors
* **Rahul Sharma** (`UrbanThreads`): `vendor1@styleverse.com`
* **Priya Patel** (`EthnicStyles`): `vendor2@styleverse.com`
* **Arjun Mehta** (`ActiveFootwear`): `vendor3@styleverse.com`
* **Kavya Nair** (`BlingAccessories`): `vendor4@styleverse.com`
* **Vikram Singh** (`CozyWear`): `vendor5@styleverse.com`

### 3. 🛍️ Test Customers
Use any of the following accounts to browse, place orders, write reviews, and open support tickets:
* `aditya@example.com`
* `sneha@example.com`
* `rohan@example.com`
* `anjali@example.com`
* `karan@example.com`
* `divya@example.com`
* `nikhil@example.com`
* `pooja@example.com`
* `abhishek@example.com`
* `meera@example.com`

---

## ⚙️ Backend Environment Variables

The API server connects using configuration defined in `.env`:

* **API Server Port**: `5000`
* **Client Front-end URL**: `http://localhost:5173`
* **JWT Secret Key**: Specified in `.env` (generates user sessions)
* **Rate Limits**: Configured to 100 requests per window (increased in development to prevent local test lockouts)

---

## 💾 Database Configuration
* **Database URI**: `mongodb://localhost:27017/styleverse` (or MongoDB Atlas connection string parsed in `.env`)
* **Collection Indices**:
  * `email_1` (Users)
  * `storeSlug_1` (Vendors)
  * `slug_1` (Products)
  * `orderNumber_1` (Orders)
