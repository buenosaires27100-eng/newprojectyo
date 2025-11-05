import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { AuthScreen } from './components/AuthScreen';
import { ProfileCompletion } from './components/ProfileCompletion';
import { MainLayout } from './components/MainLayout';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

type AppState = 'loading' | 'auth' | 'profile-completion' | 'main';

export default function App() {
  const [appState, setAppState] = React.useState<AppState>('loading');
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token && session?.user?.id) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        
        // Check if user has completed profile
        await checkProfileCompletion(session.access_token, session.user.id);
      } else {
        setAppState('auth');
      }
    } catch (error) {
      console.log('Error checking auth:', error);
      setAppState('auth');
    }
  };

  const checkProfileCompletion = async (token: string, uid: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/users/me/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.profile && data.profile.pseudo && data.profile.quartier) {
          // Profile is complete
          setAppState('main');
        } else {
          // Profile needs completion
          setAppState('profile-completion');
        }
      } else {
        // Profile doesn't exist yet
        setAppState('profile-completion');
      }
    } catch (error) {
      console.log('Error checking profile:', error);
      setAppState('profile-completion');
    }
  };

  const handleAuthSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token && session?.user?.id) {
      setAccessToken(session.access_token);
      setUserId(session.user.id);
      await checkProfileCompletion(session.access_token, session.user.id);
    }
  };

  const handleProfileComplete = () => {
    setAppState('main');
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setUserId(null);
    setAppState('auth');
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500" />
      </div>
    );
  }

  if (appState === 'auth') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (appState === 'profile-completion' && accessToken) {
    return (
      <ProfileCompletion
        accessToken={accessToken}
        onComplete={handleProfileComplete}
      />
    );
  }

  if (appState === 'main' && accessToken && userId) {
    return (
      <MainLayout
        accessToken={accessToken}
        currentUserId={userId}
        onSignOut={handleSignOut}
      />
    );
  }

  return null;
}
