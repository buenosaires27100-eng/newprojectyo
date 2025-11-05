import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { MapPin, Mail, LogOut } from 'lucide-react';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface ProfileProps {
  accessToken: string;
  onSignOut: () => void;
}

export function Profile({ accessToken, onSignOut }: ProfileProps) {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/users/me/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProfile();
  }, [accessToken]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <h2 className="text-gray-900">Mon Profil</h2>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-4">
              <span className="text-3xl">
                {profile?.pseudo?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <h3 className="text-gray-900 mb-1">{profile?.pseudo || 'Utilisateur'}</h3>
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{profile?.quartier || 'Non défini'}</span>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          {/* Email */}
          {profile?.email && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{profile.email}</span>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-900 mb-2">À propos de Voisins Solidaires</p>
            <p className="text-blue-700 text-sm">
              Cette application vous permet de créer des liens avec vos voisins et de vous 
              entraider au quotidien. Soyez respectueux et bienveillant !
            </p>
          </div>

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full py-6 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
