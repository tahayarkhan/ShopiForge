import type { Shop } from '@shopiforge/shared';
import { supabase } from '../lib/supabase.js';
import { mapShopRow, type ShopRow } from '../mappers/shopMapper.js';

export async function findActiveShopById(id: string): Promise<Shop | null> {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        throw new Error(`findActiveShopById failed: ${error.message}`);
    }

    return data ? mapShopRow(data as ShopRow) : null;

}