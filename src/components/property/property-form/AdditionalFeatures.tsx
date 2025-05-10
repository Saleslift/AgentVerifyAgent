import React from 'react';
import {Property, UnitType} from '../../../types';
import {Car, Info} from "lucide-react";

interface AdditionalFeaturesProps {
    formData: Property | UnitType;
    setFormData: (newAttributes: Partial<Property | UnitType>) => void;
    withListInMarketplace: boolean;
}

export default function AdditionalFeatures({formData, setFormData, withListInMarketplace}: AdditionalFeaturesProps) {
    return (
        <section>
            <h2 className="text-lg font-semibold mb-4">Additional Features</h2>
            <div className="space-y-4">
                <label className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        checked={!!formData.parkingAvailable}
                        onChange={(e) => setFormData({parkingAvailable: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300"
                    />
                    <span className="flex items-center text-gray-700">
              <Car className="w-5 h-5 mr-2"/>
              Parking Available
            </span>
                </label>

                {withListInMarketplace && <label className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        checked={formData?.shared || false}
                        onChange={(e) => setFormData({shared: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300"
                    />
                    <span className="flex items-center text-gray-700">
              <Info className="w-5 h-5 mr-2"/>
              List in Marketplace
            </span>
                </label>
                }
            </div>
        </section>
    );
}
