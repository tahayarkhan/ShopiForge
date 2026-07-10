import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import {
    requireShopAuth,
    type AuthenticatedRequest,
} from '../middleware/requireShopAuth.js';
import { listProductsByShop } from '../repositories/productRepository.js';
import { syncProductsForShop } from '../services/shopifyProductSync.service.js';
import { getProductCompare } from '../services/productCompare.service.js';


export const productsRouter = Router();

productsRouter.use(requireShopAuth);

productsRouter.post('/sync', async (req, res, next) => {
    
    try {
        const { shop } = req as AuthenticatedRequest;
        const summary = await syncProductsForShop(shop.id);

        res.status(200).json(summary);
    } catch (err) {
        next(
            err instanceof AppError
              ? err
              : new AppError(502, 'SHOPIFY_SYNC_FAILED', 'Failed to sync products from Shopify')
        );
    }
});

productsRouter.get('/', async (req, res, next) => {

    try {
        const { shop } = req as AuthenticatedRequest;
        const products = await listProductsByShop(shop.id);

        res.status(200).json({ products });
    } catch (err) {
        next(
            err instanceof AppError
                ? err 
                : new AppError(500, 'PRODUCTS_FETCH_FAILED', 'Failed to load products')
        );
    }
});


productsRouter.get('/:id/compare', async (req, res, next) => {
    try {
        const { shop } = req as unknown as AuthenticatedRequest;
        const productId = req.params.id;
        const jobId =
            typeof req.query.jobId === 'string' && req.query.jobId.trim() !== ''
            ? req.query.jobId
            : undefined;
        const result = await getProductCompare({
            shopId: shop.id,
            productId,
            jobId,
        });
        res.status(200).json(result);
    } catch (err) {
      next(
        err instanceof AppError
          ? err
          : new AppError(500, 'COMPARE_FETCH_FAILED', 'Failed to load compare data'),
      );
    }
});