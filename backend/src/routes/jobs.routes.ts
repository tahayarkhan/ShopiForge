import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import {
  requireShopAuth,
  type AuthenticatedRequest,
} from '../middleware/requireShopAuth.js';
import { getJobStatusForShop } from '../services/jobStatus.service.js';

export const jobsRouter = Router();

jobsRouter.use(requireShopAuth);

jobsRouter.get('/:id', async (req, res, next) => {
  try {
    const { shop } = req as unknown as AuthenticatedRequest;
    const jobId = req.params.id;

    if (typeof jobId !== 'string' || jobId.trim() === '') {
      throw new AppError(400, 'INVALID_REQUEST', 'job id is required');
    }

    const result = await getJobStatusForShop({
      shopId: shop.id,
      jobId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(
      err instanceof AppError
        ? err
        : new AppError(500, 'JOB_STATUS_FAILED', 'Failed to load job status'),
    );
  }
});