import React from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { MessageCircle } from 'lucide-react';

interface MessagesProps {
  accessToken: string;
  currentUserId: string;
  onOpenChat: (conversationId: string, otherUserId: string) => void;
}

export function Messages({ accessToken, currentUserId, onOpenChat }: MessagesProps) {
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [userProfiles, setUserProfiles] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);

      // Fetch user profiles
      const userIds = new Set<string>();
      data.conversations?.forEach((conv: any) => {
        if (conv.user1_id !== currentUserId) userIds.add(conv.user1_id);
        if (conv.user2_id !== currentUserId) userIds.add(conv.user2_id);
      });

      const profiles: Record<string, any> = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
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
              profiles[userId] = userData.profile;
            }
          } catch (err) {
            console.log('Error fetching user profile:', err);
          }
        })
      );

      setUserProfiles(profiles);
    } catch (error) {
      console.log('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConversations();

    // Refresh every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [accessToken, currentUserId]);

  const getOtherUserId = (conversation: any) => {
    return conversation.user1_id === currentUserId
      ? conversation.user2_id
      : conversation.user1_id;
  };

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

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <h2 className="text-gray-900">Messages</h2>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
            <p>Aucune conversation</p>
            <p className="text-sm mt-2">
              Contactez un voisin depuis le fil d'actualité pour commencer
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUserId = getOtherUserId(conversation);
            const otherUser = userProfiles[otherUserId];

            return (
              <button
                key={conversation.id}
                onClick={() => onOpenChat(conversation.id, otherUserId)}
                className="w-full px-4 py-4 border-b hover:bg-gray-100 transition-colors text-left bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ${getAvatarColor(otherUserId)}`}>
                    {otherUser?.pseudo?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-900 truncate">
                        {otherUser?.pseudo || 'Utilisateur'}
                      </p>
                      <span className="text-gray-500 text-sm flex-shrink-0 ml-2">
                        {getTimeAgo(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm truncate">
                      {conversation.last_message || 'Commencez la conversation'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
