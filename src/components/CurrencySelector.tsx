import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as 'AED' | 'USD' | 'EUR')}
      className="h-11 px-3 py-2 bg-gray-100 border-none rounded-lg text-gray-700 hover:bg-gray-200 transition-colors focus:ring-0 focus:outline-none w-full"
    >
      <option value="AED">AED</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
    </select>
  );
}