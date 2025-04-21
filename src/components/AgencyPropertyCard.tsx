import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Share2, Users } from 'lucide-react';
import { Property } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface PropertyCardProps {
    property: Property;
    onEdit?: (property: Property) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
    showVisibilityBadge?: boolean;
    sharedAgentCount?: number;
    isSharedWithAllAgents?: boolean;
}

export default function PropertyCard({
                                         property,
                                         onEdit,
                                         onDelete,
                                         onShare,
                                         showVisibilityBadge = false,
                                         sharedAgentCount = 0,
                                         isSharedWithAllAgents = false
                                     }: PropertyCardProps) {
    const { formatPrice } = useCurrency();

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="relative">
                <Link to={`/property/${property.slug || property.id}`} className="block aspect-video overflow-hidden">
                    <img
                        src={property.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                </Link>
                <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm font-medium text-black">
                    {property.contractType === 'Sale' ? 'For Sale' : 'For Rent'}
                </div>

                {showVisibilityBadge && (
                    <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-75 rounded-full px-3 py-1 text-xs font-medium text-white flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {isSharedWithAllAgents ?
                            "Shared with all agents" :
                            `Shared with ${sharedAgentCount} agent${sharedAgentCount !== 1 ? 's' : ''}`}
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-1">{property.location}</p>

                <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-xl">{formatPrice(property.price)}</p>
                    <div className="flex space-x-2 text-sm text-gray-500">
                        {property.bedrooms && <span>{property.bedrooms} bed</span>}
                        {property.bathrooms && <span>• {property.bathrooms} bath</span>}
                        {property.sqft && <span>• {property.sqft} sqft</span>}
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between">
                    <Link
                        to={`/property/${property.slug || property.id}`}
                        target="_blank"
                        className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-50"
                        title="View property"
                    >
                        <Eye className="h-5 w-5" />
                    </Link>

                    {onEdit && (
                        <button
                            onClick={() => onEdit(property)}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-50"
                            title="Edit property"
                        >
                            <Edit className="h-5 w-5" />
                        </button>
                    )}

                    {onShare && (
                        <button
                            onClick={() => onShare(property.id)}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-50"
                            title="Share with agents"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => onDelete(property.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                            title="Delete property"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
