import type { NextFunction, Request, Response } from 'express';
import type { ShopSafe } from '@shopiforge/shared';
import { toShopSafe } from '../mappers/shopMapper.js';
import { findActiveShopById } from '../repositories/shopRepository.js';
import { AppError } from './errorHandler.js';

export type AuthenticatedShop = ShopSafe;

export interface AuthenticatedRequest extends Request {
  shop: AuthenticatedShop;
}

export async function requireShopAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.signedCookies?.shopiforge_shop_id;
        
        if (typeof shopId !== 'string' || shopId.trim() === '') {
            throw new AppError(401, 'SHOP_AUTH_REQUIRED', 'Shop authentication required');
        }
        
        const shop = await findActiveShopById(shopId);
        
        if (!shop) {
            throw new AppError(401, 'SHOP_AUTH_REQUIRED', 'Shop authentication required');
        }

        (req as AuthenticatedRequest).shop = toShopSafe(shop);

        next();
        
    } catch (err) {
        next(err);
    }
}