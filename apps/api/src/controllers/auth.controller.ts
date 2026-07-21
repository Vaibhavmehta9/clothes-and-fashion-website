import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import { Notification } from '../models/Notification.model';
import env from '../config/env';
import { sendEmail, passwordResetEmail } from '../config/email';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const generateTokens = (userId: string, role: string, email: string) => {
  const accessToken = jwt.sign({ id: userId, role, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: userId, role, email }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

// @route   POST /api/v1/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role = 'customer' } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered. Please log in.', 400);
  }

  const allowedRoles = ['customer', 'vendor'];
  const userRole = allowedRoles.includes(role) ? role : 'customer';

  const user = await User.create({ name, email, password, phone, role: userRole });

  // Welcome notification
  await Notification.create({
    user: user._id,
    title: 'Welcome to StyleVerse! 🎉',
    body: `Hi ${name}, your account is ready. Start exploring thousands of fashion products.`,
    type: 'system',
    link: '/',
  });

  const { accessToken, refreshToken } = generateTokens(String(user._id), user.role, user.email);

  // Store refresh token
  await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    },
  });
});

// @route   POST /api/v1/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Contact support.', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = generateTokens(String(user._id), user.role, user.email);

  // Store refresh token (keep max 5 devices)
  const tokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

  // Get vendor profile if vendor
  let vendorProfile = null;
  if (user.role === 'vendor') {
    vendorProfile = await Vendor.findOne({ user: user._id }).select('_id storeName storeSlug status');
  }

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        wishlist: user.wishlist,
      },
      accessToken,
      refreshToken,
      vendorProfile,
    },
  });
});

// @route   POST /api/v1/auth/refresh
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required.', 401);
  }

  let decoded: { id: string; role: string; email: string };
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; role: string; email: string };
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    throw new AppError('Invalid refresh token.', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    String(user._id),
    user.role,
    user.email
  );

  // Rotate refresh token
  const newTokens = user.refreshTokens.filter((t) => t !== token);
  newTokens.push(newRefreshToken);
  await User.findByIdAndUpdate(user._id, { refreshTokens: newTokens });

  res.status(200).json({
    success: true,
    message: 'Tokens refreshed.',
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

// @route   POST /api/v1/auth/logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken: token } = req.body;

  if (req.user?.id && token) {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { refreshTokens: token },
    });
  }

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// @route   POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    res.status(200).json({
      success: true,
      message: 'If that email is registered, you will receive a reset link.',
    });
    return;
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset Your StyleVerse Password',
      html: passwordResetEmail(resetUrl, user.name),
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send reset email. Try again.', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset email sent.',
  });
});

// @route   POST /api/v1/auth/reset-password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Invalid or expired reset token.', 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
});

// @route   GET /api/v1/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).populate('wishlist', 'name thumbnail basePrice slug');

  res.status(200).json({ success: true, data: user });
});

// @route   PUT /api/v1/auth/update-profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, phone, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { name, phone, ...(avatar && { avatar }) },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Profile updated.', data: user });
});

// @route   PUT /api/v1/auth/change-password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!.id).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new AppError('Current password is incorrect.', 400);

  user.password = newPassword;
  // Invalidate all refresh tokens on password change
  await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed. Please log in again.' });
});
