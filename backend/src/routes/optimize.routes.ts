import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import {
  requireShopAuth,
  type AuthenticatedRequest,
} from '../middleware/requireShopAuth.js';
import { optimizeProductForShop } from '../services/optimizeProduct.service.js';


export const optimizeRouter = Router();

optimizeRouter.use(requireShopAuth);

optimizeRouter.post('/product', async (req, res, next) => {

    try {
        const { shop } = req as AuthenticatedRequest;
        const { productId, tone } = req.body ?? {};

        if (typeof productId !== 'string' || productId.trim() === '') {
            throw new AppError(400, 'INVALID_REQUEST', 'productId is required');
        }

        const result = await optimizeProductForShop({
            shopId: shop.id,
            productId,
            tone,
        });

        res.status(200).json(result);

    } catch (err) {
        next(
            err instanceof AppError
              ? err
              : new AppError(500, 'OPTIMIZE_FAILED', 'Product optimization failed'),
        );
    }
});


