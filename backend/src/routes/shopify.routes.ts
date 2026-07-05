import { Router } from "express";
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { beginInstall, completeInstall } from '../services/shopifyOAuth.service.js';
import { normalizeShopDomain } from '../utils/shopifyDomain.js';
import { findActiveShopById } from '../repositories/shopRepository.js';
import { toShopSafe } from '../mappers/shopMapper.js';

export const shopifyRouter = Router();


shopifyRouter.get('/auth', async (req, res, next) => {
    try {
        const shop = req.query.shop;
        
        if (typeof shop !== 'string' || shop.trim() === '') {
            throw new AppError(400, 'INVALID_SHOP', 'Shop query parameter is required');
        }

        let normalizedShop: string;

        try {
            normalizedShop = normalizeShopDomain(shop);
        } catch {
            throw new AppError(400, 'INVALID_SHOP', 'Invalid shop domain');
        }

        await beginInstall(req, res, normalizedShop);
    } catch (err) {
        next(err);
    }
    
});



shopifyRouter.get('/auth/callback', async (req, res, next) => {
    
    try {
        const shopId = await completeInstall(req, res);
        
        res.cookie('shopiforge_shop_id', shopId, {
          httpOnly: true,
          signed: true,
          sameSite: 'lax',
          secure:
            env.NODE_ENV === 'production' ||
            env.SHOPIFY_APP_URL.startsWith('https'),
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.redirect(`${env.FRONTEND_URL}/dashboard?installed=1`);
    } catch (err) {
        next(err);
    }

});



shopifyRouter.get('/current', async (req, res, next) => {
    try {
        const shopId = req.signedCookies?.shopiforge_shop_id;

        if (typeof shopId !== 'string' || shopId.trim() === '') {
            throw new AppError(401, 'SHOP_AUTH_REQUIRED', 'Shop authentication required');
        }

        const shop = await findActiveShopById(shopId);

        if (!shop) {
            throw new AppError(401, 'SHOP_AUTH_REQUIRED', 'Shop authentication required');
        }

        res.status(200).json({
            shop: toShopSafe(shop),
        });
    } catch (err) {
        next(err);
    }
    
});