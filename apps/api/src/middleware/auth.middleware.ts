import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { User } from '../models/User.model';
import env from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * Protect routes – verifies JWT access token
 */
export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string; email: string };

    const user = await User.findById(decoded.id).select('_id role email isActive');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ success: false, message: 'Account has been deactivated.' });
      return;
    }

    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
});

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized to access this resource.`,
      });
      return;
    }
    next();
  };
};

/**
 * Optional auth – attaches user if token present, continues if not
 */
export const optionalAuth = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string; email: string };
      const user = await User.findById(decoded.id).select('_id role email isActive');
      if (user?.isActive) {
        req.user = { id: String(user._id), role: user.role, email: user.email };
      }
    } catch {
      // Silently ignore invalid token in optional auth
    }
  }
  next();
});
