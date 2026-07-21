import { Router } from 'express';
import {
  getCategories, getAllCategories, createCategory, updateCategory, deleteCategory,
  getBrands, getFeaturedBrands, createBrand, updateBrand, deleteBrand,
  getBanners, getAllBanners, createBanner, updateBanner, deleteBanner,
  getCMSPages, getCMSPage, createCMSPage, updateCMSPage, deleteCMSPage,
  getBlogs, getBlog, createBlog, updateBlog, deleteBlog,
  subscribeNewsletter, unsubscribeNewsletter,
  getSettings, updateSettings,
  uploadImage, uploadMultipleImages,
  getAddresses, createAddress, updateAddress, deleteAddress,
  getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon,
  getAllUsers, toggleUserStatus,
  getHomepageData,
} from '../controllers/cms.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Homepage (public)
router.get('/homepage', getHomepageData);

// ---- CATEGORIES ----
router.get('/categories', getCategories);
router.get('/categories/all', protect, authorize('admin'), getAllCategories);
router.post('/categories', protect, authorize('admin'), createCategory);
router.put('/categories/:id', protect, authorize('admin'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

// ---- BRANDS ----
router.get('/brands', getBrands);
router.get('/brands/featured', getFeaturedBrands);
router.post('/brands', protect, authorize('admin'), createBrand);
router.put('/brands/:id', protect, authorize('admin'), updateBrand);
router.delete('/brands/:id', protect, authorize('admin'), deleteBrand);

// ---- BANNERS ----
router.get('/banners', getBanners);
router.get('/banners/all', protect, authorize('admin'), getAllBanners);
router.post('/banners', protect, authorize('admin'), createBanner);
router.put('/banners/:id', protect, authorize('admin'), updateBanner);
router.delete('/banners/:id', protect, authorize('admin'), deleteBanner);

// ---- CMS PAGES ----
router.get('/pages', getCMSPages);
router.get('/pages/:slug', getCMSPage);
router.post('/pages', protect, authorize('admin'), createCMSPage);
router.put('/pages/:id', protect, authorize('admin'), updateCMSPage);
router.delete('/pages/:id', protect, authorize('admin'), deleteCMSPage);

// ---- BLOGS ----
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlog);
router.post('/blogs', protect, authorize('admin'), createBlog);
router.put('/blogs/:id', protect, authorize('admin'), updateBlog);
router.delete('/blogs/:id', protect, authorize('admin'), deleteBlog);

// ---- NEWSLETTER ----
router.post('/newsletter/subscribe', subscribeNewsletter);
router.delete('/newsletter/unsubscribe/:email', unsubscribeNewsletter);

// ---- SETTINGS ----
router.get('/settings', getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

// ---- UPLOADS ----
router.post('/upload', protect, uploadLimiter, uploadSingle, uploadImage);
router.post('/upload/multiple', protect, uploadLimiter, uploadMultiple, uploadMultipleImages);

// ---- ADDRESSES ----
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, createAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// ---- COUPONS ----
router.get('/coupons', protect, authorize('admin', 'vendor'), getCoupons);
router.post('/coupons', protect, authorize('admin', 'vendor'), createCoupon);
router.put('/coupons/:id', protect, authorize('admin', 'vendor'), updateCoupon);
router.delete('/coupons/:id', protect, authorize('admin', 'vendor'), deleteCoupon);
router.post('/coupons/validate', validateCoupon);

// ---- USERS ----
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

export default router;
