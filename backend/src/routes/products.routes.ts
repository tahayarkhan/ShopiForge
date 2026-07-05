import { Router } from 'express';
import { requireShopAuth, type AuthenticatedRequest } from '../middleware/requireShopAuth.js';

export const productsRouter = Router();

productsRouter.use(requireShopAuth);



productsRouter.get('/', (req, res) => {
    res.json({ products: [] }); 
});

productsRouter.post('/sync', (req, res) => {
    const { shop } = req as AuthenticatedRequest;
    res.json({ synced: 0, shopifyDomain: shop.shopifyDomain }); 
});