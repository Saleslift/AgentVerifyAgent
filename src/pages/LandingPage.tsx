import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Shield,
  MessageSquare,
  Star,
  User,
  Loader2,
  ArrowRight
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAuth } from '../hooks/useRoleAuth';

interface Agent {
  id: string;
  full_name: string;
  avatar_url: string | null;
  agency_name: string | null;
  verified: boolean;
  slug: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useRoleAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Agent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Handle click outside search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      // Set flag to allow navigation
      sessionStorage.setItem('intentional_navigation', 'true');

      // Redirect based on role
      if (role === 'agency') {
        navigate('/agency-dashboard');
      } else if (role === 'developer') {
        navigate('/developer-dashboard');
      } else {
        navigate('/agent-dashboard');
      }
    }
  }, [user, role, navigate]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearching(true);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const { data: agents, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, agency_name, verified, slug')
          .eq('role', 'agent')
          .ilike('full_name', `%${query}%`)
          .order('verified', { ascending: false })
          .order('full_name')
          .limit(5);

        if (error) throw error;
        setSuggestions(agents || []);
      } catch (err) {
        console.error('Error searching agents:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleAgentSelect = (agent: Agent) => {
    setShowSuggestions(false);
    navigate(`/agent/${agent.slug || agent.id}`);
  };

  // If user is logged in, show loading spinner while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header  />

      {/* Hero Section */}
      <section className="relative min-h-[120vh] flex items-center pt-20">
        {/* Background Image with Gradient */}
        <div className="absolute inset-0 bg-[url('https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//photo-1512453979798-5ea266f8880c.jpeg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-black/90"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black">
              Real estate and<br />real agents in UAE
            </h1>
            <p className="text-2xl text-gray-600 mb-12">
              Let us connect you with a top-rated agent
            </p>

            {/* Search Component */}
            <div className="relative mb-12" ref={searchContainerRef}>
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search by agent name"
                    className="w-full px-6 py-4 pl-14 pr-12 rounded-full bg-white shadow-xl border border-gray-200 text-gray-900 text-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {searching && (
                    <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Agent Suggestions Dropdown */}
                {showSuggestions && (searchQuery.length >= 2 || suggestions.length > 0) && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {searching ? (
                      <div className="p-4 text-center text-gray-500">
                        Searching...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {suggestions.map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => handleAgentSelect(agent)}
                            className="w-full px-4 py-3 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="relative flex-shrink-0">
                              {agent.avatar_url ? (
                                <img
                                  src={agent.avatar_url}
                                  alt={agent.full_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              {agent.verified && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                  <Shield className="w-4 h-4 text-black" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">{agent.full_name}</div>
                              {agent.agency_name && (
                                <div className="text-sm text-gray-500">{agent.agency_name}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        No matching agents found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <a
              href="https://wa.me/971543106444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-brand-lime text-black rounded-full hover:bg-brand-yellow transition-colors text-lg font-medium group"
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Why investors use AgentVerify</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <MessageSquare className="h-12 w-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Direct WhatsApp Access</h3>
              <p className="text-gray-600">
                Speak directly with agents. No middlemen or gatekeepers between you and your next investment.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Shield className="h-12 w-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Agent Certification</h3>
              <p className="text-gray-600">
                All profiles include Dubai RERA registration. Know you're working with licensed professionals.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Star className="h-12 w-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Verified Reviews</h3>
              <p className="text-gray-600">
                See real reviews from past buyers and investors. Make informed decisions about your representation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Built for investors like you</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-gray-600 mb-6 text-lg">
                "AgentVerify helped me find a serious agent in 2 minutes. The direct WhatsApp access made everything so much faster."
              </p>
              <div>
                <p className="font-medium">A.S.</p>
                <p className="text-gray-500">France</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-gray-600 mb-6 text-lg">
                "I never expected to chat directly with Dubai agents this easily. Found exactly what I was looking for."
              </p>
              <div>
                <p className="font-medium">T.J.</p>
                <p className="text-gray-500">UK</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Find your trusted Dubai real estate expert
          </h2>
          <a
            href="https://wa.me/971543106444"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-white text-black rounded-full hover:bg-gray-100 transition-colors text-lg font-medium group"
          >
            Get Started
            <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
