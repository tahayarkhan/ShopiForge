import { AppError } from "../middleware/errorHandler.js";

export function parsePushToShopify(value: unknown): boolean {
    
    if (value === undefined || value === null) {
      return true;
    }
  
    if (typeof value !== 'boolean') {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'pushToShopify must be a boolean',
      );
    }
  
    return value;
}