import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { DB_Profile } from '../../global.d';
import { useTranslation } from 'react-i18next'; // Added

interface AgentAgencyProfileProps {
  agent: DB_Profile;
}

const AgentAgencyProfile: React.FC<AgentAgencyProfileProps> = ({ agent }) => {
  const { t } = useTranslation(); // Added
  const [agencyProfile, setAgencyProfile] = useState<DB_Profile | null>(null);

  const profile = agencyProfile || {
    name: agent.agencyName,
    logo: agent.agencyLogo,
    website: agent.agencyWebsite,
    location: agent.location,
    phone: agent.whatsapp,
    license: agent.registrationNumber,
    email: `${agent.name.toLowerCase().replace(/\s+/g, '.')}@${agent.agencyName?.toLowerCase().replace(/\s+/g, '')}.com`,
    formation_date: agent.agencyFormationDate,
    team_size: agent.agencyTeamSize,
  };

  useEffect(() => {
    const fetchAgencyProfile = async () => {
      if (agent.agencyId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', agent.agencyId)
          .single();

        if (error) {
          console.error('Error fetching agency profile:', error);
        } else {
          const agencyProfile = {
            ...data,
            name: data.full_name,
            logo: data.agency_logo,
            website: data.agency_website,
            location: data.location,
            phone: data.whatsapp,
            license: data.registration_number,
            formation_date: data.agency_formation_date,
            team_size: data.agency_team_size,
          };
          setAgencyProfile(agencyProfile);
        }
      }
    };

    fetchAgencyProfile();
  }, [agent.agency_id]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">{t('myAgency')}</h2>
        {profile.logo && (
          <img
            src={profile.logo}
            alt={profile.name}
            className="h-12 md:h-16 object-contain"
          />
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">{profile.name}</h3>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-300 hover:text-primary-400 break-all"
            >
              {profile.website}
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block">{t('address')}</label>
              <div className="flex items-start mt-1">
                <span className="text-gray-800">{profile.location}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block">{t('phone')}</label>
              <div className="flex items-center mt-1">
                <a
                  href={`tel:${profile.phone}`}
                  className="text-primary-300 hover:text-primary-400"
                >
                  {profile.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block">{t('license')}</label>
              <div className="flex items-center mt-1">
                <span className="text-gray-800">{profile.license}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block">{t('email')}</label>
              <div className="flex items-center mt-1">
                <a
                  href={`mailto:${profile.email}`}
                  className="text-primary-300 hover:text-primary-400 break-all"
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
          {profile.formation_date && (
            <div>
              <label className="text-sm text-gray-500 block">{t('agencyFormationDate')}</label>
              <div className="flex items-center mt-1">
                <span className="text-gray-800">
                  {new Date(profile.formation_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {profile.team_size && (
            <div>
              <label className="text-sm text-gray-500 block">{t('agencyTeamSize')}</label>
              <div className="flex items-center mt-1">
                <span className="text-gray-800">{t('teamMembers', { count: profile.team_size })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentAgencyProfile;
