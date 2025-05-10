import {CamelizeKeys, CamelKeysToSnake} from "../types";

/**
 * Debounce function to limit how often a function can be called
 * @param func The function to debounce
 * @param wait The time to wait in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a price with currency symbol and thousands separators
 * @param price The price to format
 * @param currency The currency code (default: AED)
 * @returns Formatted price string
 */
function formatPrice(price: number, currency: string = 'AED'): string {
  return `${currency} ${price.toLocaleString('en-US', {
    maximumFractionDigits: 0
  })}`;
}

/**
 * Truncate text to a specified length and add ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculate time ago from a date
 * @param date The date to calculate from
 * @returns String representation of time ago
 */
function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Fuzzy search function to find matches in an array of strings
 * @param query The search query
 * @param items Array of strings to search in
 * @returns Filtered array of matching items
 */
function fuzzySearch(query: string, items: string[]): string[] {
  const lowerQuery = query.toLowerCase();
  return items
    .filter(item => item.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Sort by position of match (earlier matches first)
      const aIndex = a.toLowerCase().indexOf(lowerQuery);
      const bIndex = b.toLowerCase().indexOf(lowerQuery);
      if (aIndex !== bIndex) return aIndex - bIndex;

      // Then by length (shorter items first)
      return a.length - b.length;
    });
}

/**
 * Parse price range string into min and max values
 * @param priceRange Price range string (e.g., "500000-1000000" or "10000000+")
 * @returns Object with min and max values
 */
function parsePriceRange(priceRange: string): { min?: number; max?: number } {
  if (!priceRange) return {};

  if (priceRange.endsWith('+')) {
    const min = parseInt(priceRange.replace('+', ''));
    return { min };
  }

  const [min, max] = priceRange.split('-').map(p => parseInt(p));
  return { min, max };
}

/**
 * Convert an object with snake_case keys to camelCase keys
 * @param obj The object to convert
 * @returns A new object with camelCase keys
 */
export function convertSnakeToCamel<T extends object>(obj: T): CamelizeKeys<T> {
  if (typeof obj !== 'object' || obj === null) return obj as CamelizeKeys<T>;

  if (Array.isArray(obj)) {
    return obj.map(item => convertSnakeToCamel(item)) as unknown as CamelizeKeys<T>;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = convertSnakeToCamel(obj[key]);
    return acc;
  }, {} as any);
}

export const convertCamelToSnake = <T extends Record<string, any>>(
    input: T
): CamelKeysToSnake<T> => {
  return Object.keys(input).reduce((acc, cur) => {
    const key = cur.replace(
        /[A-Z]/g,
        (k) => `_${k.toLowerCase()}`
    ) as keyof CamelKeysToSnake<T>;
    acc[key] = input[cur];
    return acc;
  }, {} as CamelKeysToSnake<T>);
};
