import React from 'react';
import { Building2, Users, Eye, TrendingUp } from 'lucide-react';
import { useAgentStatistics, TimeRange } from '../../hooks/useAgentStatistics';

interface StatisticsPanelProps {
  agentId: string;
}

export default function StatisticsPanel({ agentId }: StatisticsPanelProps) {
  const { stats, loading, error, timeRange, setTimeRange } = useAgentStatistics(agentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 p-4">
        No statistics available
      </div>
    );
  }

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="space-y-8">
      {/* Time Frame Filter */}
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent"
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <Building2 className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              {stats.sharedProperties} shared properties
            </p>
            <p className="text-sm text-gray-500">
              {stats.newProperties30d} new in 30 days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Profile Views</h3>
            <Eye className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              {stats.views30d} views in 30 days
            </p>
            <p className="text-sm text-gray-500">
              {stats.uniqueViewingDays} unique days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Marketplace</h3>
            <TrendingUp className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalShares}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              {stats.uniquePropertiesShared} unique properties
            </p>
            <p className="text-sm text-gray-500">
              {stats.shares30d} shares in 30 days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shared By Others</h3>
            <Users className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalShares}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              {stats.uniquePropertiesShared} unique properties
            </p>
            <p className="text-sm text-gray-500">
              {stats.shares30d} shares in 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(stats.refreshedAt).toLocaleString()}
      </div>
    </div>
  );
}