import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import env from './config/env';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reviewRoutes from './routes/review.routes';
import vendorRoutes from './routes/vendor.routes';
import cmsRoutes from './routes/cms.routes';
import reportRoutes from './routes/report.routes';
import supportRoutes from './routes/support.routes';

const app = express();

// ---- SECURITY ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ---- CORS ----
app.use(cors({
  origin: [env.CLIENT_URL, env.ADMIN_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- BODY PARSING ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- COMPRESSION ----
app.use(compression());

// ---- LOGGING ----
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ---- RATE LIMITING ----
app.use('/api', apiLimiter);

// ---- HEALTH CHECK ----
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'StyleVerse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ---- API ROUTES ----
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/vendors`, vendorRoutes);
app.use(`${API_PREFIX}`, cmsRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/support-tickets`, supportRoutes);

// ---- ERROR HANDLING ----
app.use(notFound);
app.use(errorHandler);

export default app;
