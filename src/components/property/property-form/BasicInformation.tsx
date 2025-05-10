import React from 'react';
import { Property, UnitType } from '../../../types';

const defaultContractTypes: Array<'Sale' | 'Rent'> = ['Sale', 'Rent'];
const defaultCompletionStatus: Array<'Ready' | 'Off-plan resale' | 'Off Plan'> = ['Ready', 'Off-plan resale', 'Off Plan'];

const contractTypesLabels: Record<'Sale' | 'Rent', string> = {
    Sale: 'For Sale',
    Rent: 'For Rent',
};

interface BasicInformationProps {
  formData: Partial<Property | UnitType>;
  setFormData: (newAttributes: Partial<Property | UnitType>) => void;
  withLand?: boolean;
  contractTypes?: Array<'Sale' | 'Rent'>;
  completionStatus?: Array<'Ready' | 'Off-plan resale' | 'Off Plan' >;
}

export default function BasicInformation(props: BasicInformationProps) {
  const {
    formData,
    setFormData,
    withLand = true,
    contractTypes = defaultContractTypes,
    completionStatus = defaultCompletionStatus
  } = props;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            required
            value={formData.title || ''}
            onChange={(e) => setFormData({ title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            placeholder="e.g., Luxury Waterfront Villa"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            required
            rows={5}
            value={formData.description || ''}
            onChange={(e) => setFormData({ description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            placeholder="Provide a detailed description of the property..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type *
          </label>
          <select
            required
            value={formData.type || 'Apartment'}
            onChange={(e) => setFormData({ type: e.target.value as Property['type'] | UnitType['type'] })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          >
            <option value="Apartment">Apartment</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Townhouse">Townhouse</option>
            <option value="House">House</option>
            <option value="Villa">Villa</option>
            {withLand && <option value="Land">Land</option>}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Type *
          </label>
          <select
            required
            value={formData?.contractType || 'Sale'}
            onChange={(e) => setFormData({ contractType: e.target.value as Property['contractType']  })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          >
            {contractTypes.map(contract => (<option key={contract}
                                                     value={contract}>{contractTypesLabels[contract]}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price *
          </label>
          <input
            type="number"
            required
            value={formData.price || ''}
            onChange={(e) => setFormData({ price: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            placeholder="Enter price"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Furnishing Status
          </label>
          <select
            value={formData.furnishingStatus || 'Unfurnished'}
            onChange={(e) => setFormData({ furnishingStatus: e.target.value as Property['furnishingStatus'] })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          >
            <option value="Furnished">Furnished</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Semi-Furnished">Semi-Furnished</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Completion Status
          </label>
          <select
            value={formData.completionStatus || 'Ready'}
            onChange={(e) => setFormData({ completionStatus: e.target.value as Property['completionStatus'] })}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          >
            {completionStatus.map(status => (<option key={status}
                                                     value={status}>{status}</option>))}

          </select>
        </div>

        {formData.completionStatus === 'Off-plan resale' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handover Date *
            </label>
            <input
              type="date"
              required={formData.completionStatus === 'Off-plan resale'}
              value={formData?.handoverDate || ''}
              onChange={(e) => setFormData({ handoverDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Expected handover date for this off-plan property
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

