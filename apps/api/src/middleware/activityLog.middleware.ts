import { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../models/ActivityLog.model';
import { AuthRequest } from './auth.middleware';

export const logActivity = (action: string, entity: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      await ActivityLog.create({
        user: req.user?.id,
        action,
        entity,
        entityId: req.params.id || req.body?.id,
        description: `${action} on ${entity}`,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: {
          method: req.method,
          url: req.originalUrl,
          body: req.method !== 'GET' ? req.body : undefined,
        },
      });
    } catch (err) {
      // Log silently - don't block the request
      console.error('Activity log error:', err);
    }
    next();
  };
};
