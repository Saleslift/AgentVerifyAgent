import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  Home,
  MessageSquare,
  User,
  Users
} from 'lucide-react';

interface DealsListProps {
  deals: any[];
  onRefresh: () => void;
}

const DealsList: React.FC<DealsListProps> = ({ deals }) => {
  const navigate = useNavigate();

  const handleDealClick = (dealId: string) => {
    console.log('Deal ID:', dealId);
    navigate(`/crm/deals/${dealId}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Docs Sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'Signed':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-purple-100 text-purple-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageForStatus = (status: string) => {
    switch(status) {
      case 'Draft':
        return 'Initial';
      case 'In Progress':
        return 'Viewing';
      case 'Docs Sent':
        return 'Negotiation';
      case 'Signed':
        return 'MOU';
      case 'Closed':
        return 'Done';
      default:
        return 'Initial';
    }
  };

  const getDealTypeColor = (dealType: string) => {
    const isCollaboration = dealType === 'Collaboration' || dealType === 'Marketplace Property';
    return isCollaboration ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getDealTypeLabel = (dealType: string) => {
    switch(dealType) {
      case 'Own Property':
        return 'Solo';
      case 'Marketplace Property':
        return 'Collaboration';
      case 'Collaboration':
        return 'Collaboration';
      case 'Off-plan Project':
        return 'Project';
      default:
        return dealType;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Desktop Table Header */}
      <div className="hidden lg:grid lg:grid-cols-7 bg-gray-50 p-4 border-b border-gray-200">
        <div className="font-semibold text-gray-600">Property</div>
        <div className="font-semibold text-gray-600">Contact</div>
        <div className="font-semibold text-gray-600">Type</div>
        <div className="font-semibold text-gray-600">Status</div>
        <div className="font-semibold text-gray-600">Stage</div>
        <div className="font-semibold text-gray-600">Partner</div>
        <div className="font-semibold text-gray-600">Updated</div>
      </div>

      {/* Deals List */}
      <div className="divide-y divide-gray-200">
        {deals.map(deal => (
          <div
            key={deal.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            onClick={() => handleDealClick(deal.id)}
          >
            {/* Mobile View */}
            <div className="lg:hidden">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    {deal.property?.title || deal.project?.title || 'Unnamed Property'}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <User className="h-4 w-4 mr-1 flex-shrink-0" />
                    {deal.lead?.full_name || 'No contact'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                    {deal.status}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {formatDate(deal.updated_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDealTypeColor(deal.deal_type)}`}>
                    {deal.deal_type === 'Collaboration' || deal.deal_type === 'Marketplace Property' ? (
                      <Users className="h-3 w-3 mr-1" />
                    ) : (
                      <Home className="h-3 w-3 mr-1" />
                    )}
                    {getDealTypeLabel(deal.deal_type)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {getStageForStatus(deal.status)}
                  </span>
                </div>

                {deal.co_agent && (
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="truncate max-w-[100px]">{deal.co_agent.full_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:grid lg:grid-cols-7 lg:gap-4 lg:items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden mr-3 bg-gray-100">
                  {deal.property?.images?.[0] ? (
                    <img
                      src={deal.property.images[0]}
                      alt={deal.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Home className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-[200px]">
                    {deal.property?.title || deal.project?.title || 'Unnamed Property'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {deal.property?.location || deal.project?.location || 'No location'}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-900 truncate max-w-[150px]">
                  {deal.lead?.full_name || 'No contact'}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {deal.lead?.phone_number || ''}
                </p>
              </div>

              <div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDealTypeColor(deal.deal_type)}`}>
                  {deal.deal_type === 'Collaboration' || deal.deal_type === 'Marketplace Property' ? (
                    <Users className="h-3 w-3 mr-1" />
                  ) : (
                    <Home className="h-3 w-3 mr-1" />
                  )}
                  {getDealTypeLabel(deal.deal_type)}
                </span>
              </div>

              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                  {deal.status}
                </span>
              </div>

              <div>
                {getStageForStatus(deal.status)}
              </div>

              <div className="truncate max-w-[150px]">
                {deal.co_agent ? (
                  <div className="flex items-center">
                    {deal.co_agent.avatar_url ? (
                      <img
                        src={deal.co_agent.avatar_url}
                        alt={deal.co_agent.full_name}
                        className="w-6 h-6 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full mr-2 bg-gray-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-500" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {deal.co_agent.full_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">
                  {formatDate(deal.updated_at)}
                </span>
              </div>
            </div>

            {/* Activity Indicators - Desktop */}
            <div className="hidden lg:flex lg:justify-end lg:mt-2 lg:space-x-2">
              {deal.deal_type === 'Collaboration' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-50 text-blue-500">
                  <MessageSquare className="h-3 w-3" />
                </div>
              )}
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-50 text-green-500">
                <FileText className="h-3 w-3" />
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-50 text-purple-500">
                <Calendar className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsList;
