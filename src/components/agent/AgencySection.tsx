import React from 'react';
import { Building2, ExternalLink, MapPin, Phone, Mail, Calendar, Users, LogOut } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AgencyDetails {
    id: string;
    agency_name?: string;
    full_name: string;
    agency_logo?: string;
    agency_website?: string;
    location?: string;
    whatsapp?: string;
    email?: string;
    agency_formation_date?: string;
    agency_team_size?: number;
}

interface AgencySectionProps {
    agency: AgencyDetails | null;
    onRefresh: () => void;
}

export default function AgencySection({ agency, onRefresh }: AgencySectionProps) {
    const { user } = useAuth();
    const [leaving, setLeaving] = React.useState(false);

    const handleLeaveAgency = async () => {
        if (!user || !agency) return;

        if (!confirm('Are you sure you want to leave this agency team?')) {
            return;
        }

        try {
            setLeaving(true);

            // 1. Remove agency_id from profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ agency_id: null })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update agency_agents status
            const { error: agentsError } = await supabase
                .from('agency_agents')
                .update({ status: 'inactive', updated_at: new Date().toISOString() })
                .eq('agent_id', user.id)
                .eq('agency_id', agency.id);

            if (agentsError) throw agentsError;

            // 3. Create notification
            await supabase
                .from('notifications')
                .insert({
                    recipient_id: user.id,
                    type: 'system',
                    title: 'Left Agency Team',
                    message: `You have left ${agency.agency_name || agency.full_name}.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                });

            // Refresh profile
            onRefresh();
        } catch (err) {
            console.error('Error leaving agency:', err);
            alert('Failed to leave agency. Please try again.');
        } finally {
            setLeaving(false);
        }
    };

    if (!agency) {
        return null;
    }

    const agencyName = agency.agency_name || agency.full_name;
    const formattedDate = agency.agency_formation_date
        ? new Date(agency.agency_formation_date).toLocaleDateString()
        : null;

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold">Your Agency</h2>

                <div className="flex-1 md:text-right">
                    <button
                        onClick={handleLeaveAgency}
                        disabled={leaving}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center"
                    >
                        {leaving ? (
                            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-red-600 rounded-full"></div>
                        ) : (
                            <LogOut className="h-4 w-4 mr-2" />
                        )}
                        Leave Agency Team
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
                        {agency.agency_logo ? (
                            <img
                                src={agency.agency_logo}
                                alt={agencyName}
                                className="w-32 h-32 object-contain mb-4"
                            />
                        ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                                <Building2 className="h-16 w-16 text-gray-400" />
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-center">{agencyName}</h3>
                    </div>
                </div>

                <div className="md:w-2/3 space-y-4">
                    {agency.agency_website && (
                        <div className="flex items-start">
                            <ExternalLink className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Website</p>
                                <a
                                    href={agency.agency_website.startsWith('http') ? agency.agency_website : `https://${agency.agency_website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:text-gray-700"
                                >
                                    {agency.agency_website}
                                </a>
                            </div>
                        </div>
                    )}

                    {agency.location && (
                        <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Address</p>
                                <p>{agency.location}</p>
                            </div>
                        </div>
                    )}

                    {agency.whatsapp && (
                        <div className="flex items-start">
                            <Phone className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Phone</p>
                                <a href={`tel:${agency.whatsapp}`} className="text-black hover:text-gray-700">
                                    {agency.whatsapp}
                                </a>
                            </div>
                        </div>
                    )}

                    {agency.email && (
                        <div className="flex items-start">
                            <Mail className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <a
                                    href={`mailto:${agency.email}`}
                                    className="text-black hover:text-gray-700"
                                >
                                    {agency.email}
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                        {formattedDate && (
                            <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Established</p>
                                    <p>{formattedDate}</p>
                                </div>
                            </div>
                        )}

                        {agency.agency_team_size && (
                            <div className="flex items-start">
                                <Users className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Team Size</p>
                                    <p>{agency.agency_team_size} members</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
