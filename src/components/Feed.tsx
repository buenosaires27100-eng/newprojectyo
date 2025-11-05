import React from 'react';
import { AnnouncementCard } from './AnnouncementCard';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface FeedProps {
  accessToken: string;
  currentUserId: string;
  onStartConversation: (userId: string) => void;
}

export function Feed({ accessToken, currentUserId, onStartConversation }: FeedProps) {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [userProfiles, setUserProfiles] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'offre' | 'demande'>('all');

  const fetchAnnouncements = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/announcements`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des annonces');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);

      // Fetch user profiles for all announcements
      const userIds = [...new Set(data.announcements?.map((a: any) => a.user_id) || [])];
      const profiles: Record<string, any> = {};

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/users/${userId}`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
              }
            );
            if (userResponse.ok) {
              const userData = await userResponse.json();
              profiles[userId as string] = userData.profile;
            }
          } catch (err) {
            console.log('Error fetching user profile:', err);
          }
        })
      );

      setUserProfiles(profiles);
    } catch (error) {
      console.log('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchAnnouncements();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAnnouncements(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredAnnouncements = announcements.filter((a) => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Fil d'Actualité</h2>
          <Button
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilter('offre')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filter === 'offre'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Offres
          </button>
          <button
            onClick={() => setFilter('demande')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filter === 'demande'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Demandes
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Aucune annonce pour le moment</p>
            <p className="text-sm mt-2">Soyez le premier à publier !</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              userProfile={userProfiles[announcement.user_id]}
              currentUserId={currentUserId}
              onContact={onStartConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
