# 🚀 Deployment Guide: Vercel & Render

This guide outlines step-by-step instructions to deploy the **StyleVerse** storefront to **Vercel** and the API backend to **Render**, connecting them to your cloud **MongoDB Atlas** database.

---

## 1. 🗄️ Database Setup (MongoDB Atlas)
Before deploying, make sure you have a cloud MongoDB database:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a free shared cluster.
3. In **Database Access**, create a user (e.g. `vaibhav`) and password.
4. In **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) so that Render can connect to it.
5. Click **Connect** -> **Drivers** and copy your connection string:
   `mongodb+srv://vaibhav:<password>@cluster0...`

---

## 2. 🧠 Backend Deployment (Render)
Render will host your Express API server.

1. Go to [Render](https://render.com/) and log in (sign in with GitHub is easiest).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository `clothes-and-fashion-website`.
4. Configure the Web Service:
   * **Name**: `styleverse-api`
   * **Language**: `Node`
   * **Root Directory**: `apps/api`
   * **Build Command**: `npm install && npm run build` (or `npm install` if compilation is bypassed)
   * **Start Command**: `npm run start` (points to `node dist/server.js`)
5. Click **Advanced** and add the following **Environment Variables**:
   * `PORT`: `10000` (or leave default, Render sets this automatically)
   * `MONGODB_URI`: *Your MongoDB Atlas connection string*
   * `JWT_SECRET`: *A secure random string*
   * `CLIENT_URL`: *Your Vercel URL (you can update this after Vercel deployment)*
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render service URL (e.g. `https://styleverse-api.onrender.com`).

---

## 3. 💻 Frontend Deployment (Vercel)
Vercel will host your React/Vite client storefront.

1. Go to [Vercel](https://vercel.com/) and log in (with GitHub).
2. Click **Add New** -> **Project**.
3. Import your `clothes-and-fashion-website` repository.
4. Configure the Project:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click *Edit* and select `apps/web`.
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   * `VITE_API_URL`: *Your Render service URL* (e.g., `https://styleverse-api.onrender.com/api`)
6. Click **Deploy**.
7. Once the build finishes, your storefront is live! Copy the live Vercel URL and add it back as the `CLIENT_URL` env variable in your Render dashboard settings to allow secure CORS requests.
