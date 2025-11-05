import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MessageCircle, MapPin, Clock } from 'lucide-react';

interface Announcement {
  id: string;
  user_id: string;
  type: 'offre' | 'demande';
  title: string;
  description: string;
  quartier: string;
  created_at: string;
}

interface UserProfile {
  pseudo: string;
  quartier: string;
  bio?: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  userProfile?: UserProfile;
  onContact: (userId: string) => void;
  currentUserId?: string;
}

export function AnnouncementCard({ 
  announcement, 
  userProfile, 
  onContact,
  currentUserId 
}: AnnouncementCardProps) {
  const isOffre = announcement.type === 'offre';
  const isOwnAnnouncement = currentUserId === announcement.user_id;

  // Generate a consistent color based on user_id
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-yellow-500',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Card 
      className={`p-4 border-l-4 ${
        isOffre 
          ? 'border-l-green-500 bg-green-50/30' 
          : 'border-l-blue-500 bg-blue-50/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
              getAvatarColor(announcement.user_id)
            }`}
          >
            {userProfile?.pseudo?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-gray-900">{userProfile?.pseudo || 'Utilisateur'}</p>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <MapPin className="w-3 h-3" />
              <span>{announcement.quartier}</span>
            </div>
            {userProfile?.bio && (
              <p className="text-gray-600 text-xs mt-1 italic">{userProfile.bio}</p>
            )}
          </div>
        </div>
        <div 
          className={`px-3 py-1 rounded-full text-white ${
            isOffre ? 'bg-green-500' : 'bg-blue-500'
          }`}
        >
          {isOffre ? 'Offre' : 'Demande'}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-gray-900 mb-2">{announcement.title}</h3>
        <p className="text-gray-700">{announcement.description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>{getTimeAgo(announcement.created_at)}</span>
        </div>
        
        {!isOwnAnnouncement && (
          <Button
            onClick={() => onContact(announcement.user_id)}
            className={`${
              isOffre
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contacter
          </Button>
        )}
      </div>
    </Card>
  );
}
