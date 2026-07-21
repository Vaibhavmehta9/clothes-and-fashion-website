import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { Vendor } from '../models/Vendor.model';
import { AuthRequest } from './auth.middleware';

/**
 * Checks that the authenticated user has an approved vendor profile
 */
export const requireVendor = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const vendor = await Vendor.findOne({ user: req.user!.id });

  if (!vendor) {
    res.status(403).json({ success: false, message: 'Vendor profile not found.' });
    return;
  }

  if (vendor.status !== 'approved') {
    res.status(403).json({
      success: false,
      message: `Your vendor account is ${vendor.status}. Please wait for approval.`,
    });
    return;
  }

  // Attach vendor to request
  (req as AuthRequest & { vendor: typeof vendor }).vendor = vendor;
  next();
});

export interface VendorRequest extends AuthRequest {
  vendor?: InstanceType<typeof Vendor>;
}
