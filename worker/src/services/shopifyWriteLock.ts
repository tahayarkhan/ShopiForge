const locks = new Map<string, Promise<void>>();

export async function withShopWriteLock<T>(
    shopId: string, 
    fn: () => Promise<T>,
): Promise<T> {
    const prev = locks.get(shopId) ?? Promise.resolve();
    
    let release!: () => void;

    const gate = new Promise<void>((resolve) => {
        release = resolve
    });

    locks.set(
        shopId,
        prev.then(() => gate),
    );
    
    await prev;


    try {
        return await fn();
      } finally {
        release();
        
        if (locks.get(shopId) === gate) {
          locks.delete(shopId);
        }
    }


}