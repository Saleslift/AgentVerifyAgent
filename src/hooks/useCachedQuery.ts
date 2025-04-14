import { useState, useEffect, useRef, useCallback } from 'react';

// Define cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Create a global cache to share across hook instances
const globalCache = new Map<string, CacheEntry<any>>();

export function useCachedQuery<T>(
  queryFn: () => Promise<T>,
  key: string,
  options: {
    ttl?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    staleTime?: number;
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    enabled = true,
    onSuccess,
    onError
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Use global cache instead of local ref
  const cache = useRef(globalCache);
  const lastFetchTime = useRef<number>(0);
  
  // Clean up expired cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [cacheKey, entry] of cache.current.entries()) {
        if (now - entry.timestamp > ttl) {
          cache.current.delete(cacheKey);
        }
      }
    }, 60000); // Clean up every minute
    
    return () => clearInterval(cleanupInterval);
  }, [ttl]);
  
  useEffect(() => {
    if (!enabled) return;
    
    let isMounted = true;
    const now = Date.now();
    const shouldFetch = 
      !cache.current.has(key) || 
      now - (cache.current.get(key)?.timestamp || 0) > staleTime;
    
    // Only set loading if we're actually fetching
    if (shouldFetch) {
      setLoading(true);
    }
    
    const fetchData = async () => {
      try {
        // Check cache first
        const cacheEntry = cache.current.get(key);
        
        // Use cached data if available and not stale
        if (cacheEntry && now - cacheEntry.timestamp < staleTime) {
          if (isMounted) {
            setData(cacheEntry.data);
            setLoading(false);
            onSuccess?.(cacheEntry.data);
          }
          return;
        }
        
        // If we have stale data, use it while fetching fresh data
        if (cacheEntry && now - cacheEntry.timestamp < ttl) {
          if (isMounted) {
            setData(cacheEntry.data);
          }
        }
        
        // Track fetch time to prevent duplicate fetches
        lastFetchTime.current = now;
        
        // Fetch fresh data
        const result = await queryFn();
        
        if (isMounted) {
          // Update cache
          cache.current.set(key, {
            data: result,
            timestamp: Date.now()
          });
          
          setData(result);
          setError(null);
          onSuccess?.(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          onError?.(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Only fetch if needed
    if (shouldFetch) {
      fetchData();
    } else if (cache.current.has(key)) {
      // Use cached data
      const cachedData = cache.current.get(key)!.data;
      setData(cachedData);
      onSuccess?.(cachedData);
    }
    
    return () => {
      isMounted = false;
    };
  }, [key, enabled, queryFn, ttl, staleTime, onSuccess, onError]);
  
  // Add refetch function to allow manual refreshing
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await queryFn();
      cache.current.set(key, {
        data: result,
        timestamp: Date.now()
      });
      setData(result);
      setError(null);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, onSuccess, onError]);
  
  return { data, error, loading, refetch };
}