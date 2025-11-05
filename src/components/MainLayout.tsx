import React from 'react';
import { Feed } from './Feed';
import { Messages } from './Messages';
import { Profile } from './Profile';
import { Chat } from './Chat';
import { PublishForm } from './PublishForm';
import { projectId } from '../utils/supabase/info';
import { Home, MessageCircle, User, Plus } from 'lucide-react';

interface MainLayoutProps {
  accessToken: string;
  currentUserId: string;
  onSignOut: () => void;
}

type Tab = 'feed' | 'messages' | 'profile';

export function MainLayout({ accessToken, currentUserId, onSignOut }: MainLayoutProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('feed');
  const [showPublishForm, setShowPublishForm] = React.useState(false);
  const [chatState, setChatState] = React.useState<{
    isOpen: boolean;
    conversationId: string | null;
    otherUserId: string | null;
  }>({
    isOpen: false,
    conversationId: null,
    otherUserId: null,
  });

  const handleStartConversation = async (otherUserId: string) => {
    try {
      // Create or get conversation
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/conversations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ other_user_id: otherUserId }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la conversation');
      }

      const data = await response.json();
      
      // Open chat
      setChatState({
        isOpen: true,
        conversationId: data.conversation.id,
        otherUserId,
      });
      setActiveTab('messages');
    } catch (error) {
      console.log('Error starting conversation:', error);
    }
  };

  const handleOpenChat = (conversationId: string, otherUserId: string) => {
    setChatState({
      isOpen: true,
      conversationId,
      otherUserId,
    });
  };

  const handleCloseChat = () => {
    setChatState({
      isOpen: false,
      conversationId: null,
      otherUserId: null,
    });
  };

  const handlePublished = () => {
    setShowPublishForm(false);
    setActiveTab('feed');
    // Feed will auto-refresh
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'feed' && (
          <Feed
            accessToken={accessToken}
            currentUserId={currentUserId}
            onStartConversation={handleStartConversation}
          />
        )}
        {activeTab === 'messages' && !chatState.isOpen && (
          <Messages
            accessToken={accessToken}
            currentUserId={currentUserId}
            onOpenChat={handleOpenChat}
          />
        )}
        {activeTab === 'messages' && chatState.isOpen && chatState.conversationId && (
          <Chat
            accessToken={accessToken}
            currentUserId={currentUserId}
            conversationId={chatState.conversationId}
            otherUserId={chatState.otherUserId!}
            onBack={handleCloseChat}
          />
        )}
        {activeTab === 'profile' && (
          <Profile accessToken={accessToken} onSignOut={onSignOut} />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t px-4 pb-safe">
        <div className="flex items-center justify-around h-16 relative">
          {/* Home */}
          <button
            onClick={() => {
              setActiveTab('feed');
              handleCloseChat();
            }}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'feed' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">Accueil</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => {
              setActiveTab('messages');
              handleCloseChat();
            }}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'messages' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <MessageCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">Messages</span>
          </button>

          {/* Spacer for floating button */}
          <div className="flex-1" />

          {/* Profile */}
          <button
            onClick={() => {
              setActiveTab('profile');
              handleCloseChat();
            }}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'profile' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">Profil</span>
          </button>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowPublishForm(true)}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Publish Form Modal */}
      {showPublishForm && (
        <PublishForm
          accessToken={accessToken}
          onClose={() => setShowPublishForm(false)}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
