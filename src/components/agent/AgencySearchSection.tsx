import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface Agency {
    id: string;
    full_name?: string;
    agency_name?: string;
    agency_logo?: string;
}

interface AgencySearchSectionProps {
    onAgencySelect: (agency: Agency) => void;
    onCancel?: () => void; // Added missing onCancel prop
}

export default function AgencySearchSection({ onAgencySelect, onCancel }: AgencySearchSectionProps) {
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<Agency[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const searchAgencies = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, agency_name, agency_logo')
                .eq('role', 'agency')
                .ilike('agency_name', `%${searchTerm}%`)
                .limit(5);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('Error searching agencies:', err);
            setError('Failed to search agencies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        searchAgencies(value);
    };

    const handleAgencySelect = (agency: Agency) => {
        onAgencySelect(agency);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="w-full mb-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                    placeholder="Search for agencies..."
                    value={query}
                    onChange={handleSearchChange}
                />
            </div>

            {loading && (
                <div className="mt-2 p-2 text-center text-sm text-gray-500">
                    Searching...
                </div>
            )}

            {error && (
                <div className="mt-2 p-2 text-center text-sm text-red-500">
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg absolute z-10 w-full max-w-md">
                    <ul className="divide-y divide-gray-100">
                        {results.map((agency) => (
                            <li
                                key={agency.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                                onClick={() => handleAgencySelect(agency)}
                            >
                                {agency.agency_logo ? (
                                    <img
                                        src={agency.agency_logo}
                                        alt={agency.agency_name}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                                        {agency.agency_name?.charAt(0) || 'A'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">{agency.agency_name}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Add Cancel button if onCancel is provided */}
            {onCancel && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
