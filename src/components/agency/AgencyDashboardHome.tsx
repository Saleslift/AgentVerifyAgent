import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, Briefcase, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';

export default function AgencyDashboardHome() {
  const { profile } = useUserDataContext();
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalAgents: 0,
    totalJobPostings: 0,
    recentViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        
        // Get property count
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id', { count: 'exact' })
          .eq('creator_id', profile.id)
          .eq('creator_type', 'agency');
        
        if (propertiesError) throw propertiesError;

        // Get agents count
        const { data: agents, error: agentsError } = await supabase
          .from('agency_agents')
          .select('id', { count: 'exact' })
          .eq('agency_id', profile.id)
          .eq('status', 'active');
        
        if (agentsError) throw agentsError;

        // Get job postings count
        const { data: jobPostings, error: jobsError } = await supabase
          .from('job_postings')
          .select('id', { count: 'exact' })
          .eq('agency_id', profile.id);
        
        if (jobsError) throw jobsError;

        // Get page views
        const { data: pageViews, error: viewsError } = await supabase
          .from('page_views')
          .select('id', { count: 'exact' })
          .eq('profile_id', profile.id)
          .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (viewsError) throw viewsError;

        setStats({
          totalProperties: properties?.length || 0,
          totalAgents: agents?.length || 0,
          totalJobPostings: jobPostings?.length || 0,
          recentViews: pageViews?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Agency Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Properties</h3>
            <Building className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold">{stats.totalProperties}</p>
          <Link to="/agency-dashboard/properties" className="text-sm text-primary-300 mt-2 hover:underline block">
            View all properties
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Agents</h3>
            <Users className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold">{stats.totalAgents}</p>
          <Link to="/agency-dashboard/agents" className="text-sm text-primary-300 mt-2 hover:underline block">
            Manage agents
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Job Postings</h3>
            <Briefcase className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold">{stats.totalJobPostings}</p>
          <Link to="/agency-dashboard/jobs" className="text-sm text-primary-300 mt-2 hover:underline block">
            Manage jobs
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Profile Views (30d)</h3>
            <Eye className="h-6 w-6 text-primary-300" />
          </div>
          <p className="text-3xl font-bold">{stats.recentViews}</p>
          <span className="text-sm text-gray-500 mt-2 block">
            Last 30 days
          </span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/add-property"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building className="h-6 w-6 mb-2" />
            <span>Add Property</span>
          </Link>
          
          <Link
            to="/agency-dashboard/agents/invite"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 mb-2" />
            <span>Invite Agent</span>
          </Link>
          
          <Link
            to="/agency-dashboard/jobs/create"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="h-6 w-6 mb-2" />
            <span>Post Job</span>
          </Link>
          
          <Link
            to="/agency-dashboard/settings"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <span>Update Profile</span>
          </Link>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {i === 0 && "New agent application received"}
                    {i === 1 && "Property listing updated"}
                    {i === 2 && "New property view"}
                    {i === 3 && "Job posting viewed"}
                    {i === 4 && "Agency profile updated"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {i === 0 && "John Doe applied to your job posting"}
                    {i === 1 && "Luxury Apartment in Downtown was updated"}
                    {i === 2 && "Someone viewed Marina Penthouse"}
                    {i === 3 && "5 people viewed Senior Agent job"}
                    {i === 4 && "You updated agency contact information"}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {i === 0 && "2 hours ago"}
                  {i === 1 && "Yesterday"}
                  {i === 2 && "Yesterday"}
                  {i === 3 && "3 days ago"}
                  {i === 4 && "1 week ago"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}