import React from 'react';
import {Property} from '../../types';
import {useTranslation} from "react-i18next";

interface PriceCardProps {
    property: Property | null;
}

const PropertyDetailsRightCard: React.FC<PriceCardProps> = ({property}) => {
    const {t} = useTranslation();
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">{t('propertyDetails')}</h3>

            <div className="space-y-3">
                {property?.furnishingStatus && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">{t('type')}</span>
                        <span className="font-medium">{t(property?.type)}</span>
                    </div>
                )}
                {property?.furnishingStatus && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">{t('purpose')}</span>
                        <span className="font-medium">{t('for')} {t(property?.contractType)}</span>
                    </div>
                )}
                {property?.furnishingStatus && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">{t('furnishing')}</span>
                        <span className="font-medium">{t(property?.furnishingStatus)}</span>
                    </div>
                )}
                {property?.completionStatus && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">{t('completion')}</span>
                        <span className="font-medium">{t(property?.completionStatus)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('parking')}</span>
                    <span className="font-medium">
            {property?.parkingAvailable ? t('available') : t('notAvailable')}
          </span>
                </div>
            </div>

            {/* Highlight Feature */}
            {property?.highlight && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
                    <h3 className="text-lg font-semibold mb-3">{t('propertyHighlight')}</h3>
                    <p className="text-gray-700">{property?.highlight}</p>
                </div>
            )}
        </div>
    );
};

export default PropertyDetailsRightCard;
