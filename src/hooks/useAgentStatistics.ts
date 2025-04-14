import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

interface AgentStatistics {
  totalProperties: number;
  sharedProperties: number;
  newProperties30d: number;
  totalViews: number;
  views30d: number;
  uniqueViewingDays: number;
  totalShares: number;
  uniquePropertiesShared: number;
  shares30d: number;
  refreshedAt: string;
}

// Default statistics with zero values
const defaultStatistics: AgentStatistics = {
  totalProperties: 0,
  sharedProperties: 0,
  newProperties30d: 0,
  totalViews: 0,
  views30d: 0,
  uniqueViewingDays: 0,
  totalShares: 0,
  uniquePropertiesShared: 0,
  shares30d: 0,
  refreshedAt: new Date().toISOString()
};

export function useAgentStatistics(agentId: string) {
  const [stats, setStats] = useState<AgentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agent_statistics')
        .select('*')
        .eq('agent_id', agentId)
        .maybeSingle(); // Using maybeSingle instead of single to handle no rows case

      if (fetchError) throw fetchError;

      // If no data is found, use default statistics instead of throwing an error
      if (!data) {
        console.log('No statistics found for this agent, using default values');
        setStats(defaultStatistics);
        return;
      }

      // Transform data to match our interface
      const transformedStats: AgentStatistics = {
        totalProperties: data.total_properties || 0,
        sharedProperties: data.shared_properties || 0,
        newProperties30d: data.new_properties_30d || 0,
        totalViews: data.total_views || 0,
        views30d: data.views_30d || 0,
        uniqueViewingDays: data.unique_viewing_days || 0,
        totalShares: data.total_shares || 0,
        uniquePropertiesShared: data.unique_properties_shared || 0,
        shares30d: data.shares_30d || 0,
        refreshedAt: data.refreshed_at || new Date().toISOString()
      };

      setStats(transformedStats);
    } catch (err) {
      console.error('Error fetching agent statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      // Set default statistics even when there's an error, to avoid UI showing nothing
      setStats(defaultStatistics);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics, timeRange]);

  return { stats, loading, error, timeRange, setTimeRange, refresh: fetchStatistics };
}