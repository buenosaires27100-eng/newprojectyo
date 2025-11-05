import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Helper function to verify user authentication
async function verifyUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.log('Authorization error while verifying user:', error);
    return null;
  }
  return user;
}

// Health check endpoint
app.get("/make-server-590b4770/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-590b4770/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log('Sign up error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log(`User signed up successfully: ${email}`);
    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Error during sign up:', error);
    return c.json({ error: 'Internal server error during sign up' }, 500);
  }
});

// Initialize demo data
app.post("/make-server-590b4770/init-demo", async (c) => {
  try {
    console.log('Initializing demo data...');

    // Check if demo data already exists
    const existingAnnouncements = await kv.getByPrefix('announcement:');
    if (existingAnnouncements.length > 5) {
      console.log('Demo data already exists');
      return c.json({ success: true, message: 'Demo data already exists' });
    }

    // Create demo users
    const demoUsers = [
      { email: 'marie.dupont@demo.fr', password: 'demo123', pseudo: 'Marie D.', quartier: 'Centre-Ville', bio: 'Retraitée active, j\'adore jardiner et cuisiner 🌻' },
      { email: 'thomas.martin@demo.fr', password: 'demo123', pseudo: 'Thomas M.', quartier: 'Quartier Nord', bio: 'Développeur freelance, toujours partant pour aider mes voisins 💻' },
      { email: 'sophie.bernard@demo.fr', password: 'demo123', pseudo: 'Sophie B.', quartier: 'Centre-Ville', bio: 'Maman de deux enfants, aime le bricolage et la couture ✂️' },
      { email: 'lucas.petit@demo.fr', password: 'demo123', pseudo: 'Lucas P.', quartier: 'Quartier Sud', bio: 'Étudiant en médecine, disponible pour du baby-sitting 👨‍⚕️' },
      { email: 'claire.dubois@demo.fr', password: 'demo123', pseudo: 'Claire D.', quartier: 'Quartier Est', bio: 'Professeure de yoga, passionnée de cuisine végétarienne 🧘‍♀️' },
      { email: 'pierre.roux@demo.fr', password: 'demo123', pseudo: 'Pierre R.', quartier: 'Quartier Nord', bio: 'Plombier retraité, j\'aime rendre service à mes voisins 🔧' },
    ];

    const createdUsers = [];

    for (const user of demoUsers) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError && !authError.message.includes('already')) {
          console.log(`Error creating user ${user.email}:`, authError);
          continue;
        }

        const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === user.email)?.id;

        if (userId) {
          // Create profile
          const userProfile = {
            user_id: userId,
            email: user.email,
            pseudo: user.pseudo,
            quartier: user.quartier,
            bio: user.bio,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

          await kv.set(`user:${userId}`, userProfile);
          createdUsers.push({ userId, ...user });
          console.log(`Created user profile: ${user.pseudo}`);
        }
      } catch (err) {
        console.log(`Error with user ${user.email}:`, err);
      }
    }

    // Create demo announcements
    const announcements = [
      { type: 'offre', title: 'Cours de jardinage gratuits', description: 'Je propose des ateliers de jardinage tous les samedis matin. Parfait pour les débutants ! Apportez vos questions et vos plantes 🌱', quartier: 'Centre-Ville', userIndex: 0 },
      { type: 'demande', title: 'Besoin d\'aide pour déménagement', description: 'Je déménage ce weekend et j\'aurais besoin d\'un coup de main pour porter quelques meubles. Pizza et bières offertes ! 📦', quartier: 'Quartier Nord', userIndex: 1 },
      { type: 'offre', title: 'Prêt perceuse et outils', description: 'J\'ai une perceuse, une scie et divers outils de bricolage à prêter à mes voisins. Contactez-moi si besoin 🔨', quartier: 'Centre-Ville', userIndex: 2 },
      { type: 'demande', title: 'Recherche baby-sitter ponctuel', description: 'Je cherche quelqu\'un pour garder mes deux enfants (5 et 8 ans) occasionnellement en soirée. Rémunération selon tarif habituel 👶', quartier: 'Quartier Sud', userIndex: 3 },
      { type: 'offre', title: 'Cours de yoga en plein air', description: 'Séances de yoga gratuites au parc tous les mardis et jeudis à 18h. Apportez votre tapis ! Tous niveaux bienvenus 🧘', quartier: 'Quartier Est', userIndex: 4 },
      { type: 'demande', title: 'Petit problème de plomberie', description: 'Ma chasse d\'eau fuit un peu. Quelqu\'un aurait 10 minutes pour y jeter un œil ? Je peux offrir un café et des gâteaux ☕', quartier: 'Quartier Nord', userIndex: 5 },
      { type: 'offre', title: 'Don de plants de tomates', description: 'J\'ai fait trop de semis de tomates cerises ! J\'en donne une dizaine. À récupérer chez moi 🍅', quartier: 'Centre-Ville', userIndex: 0 },
      { type: 'offre', title: 'Dépannage informatique gratuit', description: 'Si vous avez des soucis avec votre ordinateur ou smartphone, je peux vous aider gratuitement. Installation, virus, etc. 💻', quartier: 'Quartier Nord', userIndex: 1 },
      { type: 'demande', title: 'Cherche partenaire de jogging', description: 'Je cherche quelqu\'un pour courir ensemble 2-3 fois par semaine le matin vers 7h. Niveau intermédiaire 🏃', quartier: 'Quartier Sud', userIndex: 3 },
      { type: 'offre', title: 'Atelier cuisine végétarienne', description: 'J\'organise un atelier cuisine végé samedi prochain. On prépare un repas complet ensemble puis on le partage ! Max 6 personnes 🥗', quartier: 'Quartier Est', userIndex: 4 },
      { type: 'demande', title: 'Covoiturage vers la gare', description: 'Je dois aller à la gare demain matin à 8h. Quelqu\'un y va aussi ? Je participe aux frais d\'essence 🚗', quartier: 'Centre-Ville', userIndex: 2 },
      { type: 'offre', title: 'Réparation vélos gratuite', description: 'Ancien mécanicien vélo, je peux réparer crevaisons, régler freins et vitesses. Vous payez juste les pièces si nécessaire 🚴', quartier: 'Quartier Nord', userIndex: 5 },
    ];

    for (let i = 0; i < announcements.length; i++) {
      const ann = announcements[i];
      const user = createdUsers[ann.userIndex];
      
      if (user) {
        const announcementId = crypto.randomUUID();
        const announcement = {
          id: announcementId,
          user_id: user.userId,
          type: ann.type,
          title: ann.title,
          description: ann.description,
          quartier: ann.quartier,
          created_at: new Date(Date.now() - (announcements.length - i) * 2 * 60 * 60 * 1000).toISOString(),
        };

        await kv.set(`announcement:${announcementId}`, announcement);
        console.log(`Created announcement: ${ann.title}`);
      }
    }

    console.log('Demo data initialization completed');
    return c.json({ success: true, message: 'Demo data created successfully' });
  } catch (error) {
    console.log('Error initializing demo data:', error);
    return c.json({ error: 'Error initializing demo data' }, 500);
  }
});

// Create or update user profile
app.post("/make-server-590b4770/users", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { pseudo, quartier, bio } = body;

    if (!pseudo || !quartier) {
      return c.json({ error: 'Missing required fields: pseudo and quartier' }, 400);
    }

    const userProfile = {
      user_id: user.id,
      email: user.email,
      pseudo,
      quartier,
      bio: bio || '',
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, userProfile);
    console.log(`User profile created/updated for user ${user.id}`);
    
    return c.json({ success: true, profile: userProfile });
  } catch (error) {
    console.log('Error creating user profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user profile
app.get("/make-server-590b4770/users/:id", async (c) => {
  try {
    const userId = c.req.param('id');
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log('Error fetching user profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user profile
app.get("/make-server-590b4770/users/me/profile", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    return c.json({ profile });
  } catch (error) {
    console.log('Error fetching current user profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create announcement
app.post("/make-server-590b4770/announcements", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { type, title, description, quartier } = body;

    if (!type || !title || !description || !quartier) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (type !== 'offre' && type !== 'demande') {
      return c.json({ error: 'Type must be either offre or demande' }, 400);
    }

    const announcementId = crypto.randomUUID();
    const announcement = {
      id: announcementId,
      user_id: user.id,
      type,
      title,
      description,
      quartier,
      created_at: new Date().toISOString(),
    };

    await kv.set(`announcement:${announcementId}`, announcement);
    console.log(`Announcement created: ${announcementId}`);
    
    return c.json({ success: true, announcement });
  } catch (error) {
    console.log('Error creating announcement:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all announcements
app.get("/make-server-590b4770/announcements", async (c) => {
  try {
    const announcements = await kv.getByPrefix('announcement:');
    
    // Sort by created_at descending (newest first)
    const sorted = announcements.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ announcements: sorted });
  } catch (error) {
    console.log('Error fetching announcements:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create or get conversation between two users
app.post("/make-server-590b4770/conversations", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { other_user_id } = body;

    if (!other_user_id) {
      return c.json({ error: 'Missing other_user_id' }, 400);
    }

    // Check if conversation already exists
    const allConversations = await kv.getByPrefix('conversation:');
    const existing = allConversations.find((conv: any) => 
      (conv.user1_id === user.id && conv.user2_id === other_user_id) ||
      (conv.user1_id === other_user_id && conv.user2_id === user.id)
    );

    if (existing) {
      return c.json({ conversation: existing });
    }

    // Create new conversation
    const conversationId = crypto.randomUUID();
    const conversation = {
      id: conversationId,
      user1_id: user.id,
      user2_id: other_user_id,
      created_at: new Date().toISOString(),
      last_message: null,
      last_message_at: null,
    };

    await kv.set(`conversation:${conversationId}`, conversation);
    console.log(`Conversation created: ${conversationId}`);
    
    return c.json({ conversation });
  } catch (error) {
    console.log('Error creating conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user's conversations
app.get("/make-server-590b4770/conversations", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allConversations = await kv.getByPrefix('conversation:');
    const userConversations = allConversations.filter((conv: any) => 
      conv.user1_id === user.id || conv.user2_id === user.id
    );

    // Sort by last message time
    const sorted = userConversations.sort((a: any, b: any) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    return c.json({ conversations: sorted });
  } catch (error) {
    console.log('Error fetching conversations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Send message
app.post("/make-server-590b4770/messages", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { conversation_id, text } = body;

    if (!conversation_id || !text) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify user is part of conversation
    const conversation = await kv.get(`conversation:${conversation_id}`);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      conversation_id,
      sender_id: user.id,
      text,
      created_at: new Date().toISOString(),
    };

    await kv.set(`message:${conversation_id}:${messageId}`, message);

    // Update conversation's last message
    conversation.last_message = text;
    conversation.last_message_at = message.created_at;
    await kv.set(`conversation:${conversation_id}`, conversation);

    console.log(`Message sent in conversation ${conversation_id}`);
    
    return c.json({ success: true, message });
  } catch (error) {
    console.log('Error sending message:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get messages for a conversation
app.get("/make-server-590b4770/messages/:conversationId", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('conversationId');

    // Verify user is part of conversation
    const conversation = await kv.get(`conversation:${conversationId}`);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const messages = await kv.getByPrefix(`message:${conversationId}:`);
    
    // Sort by created_at ascending (oldest first)
    const sorted = messages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return c.json({ messages: sorted });
  } catch (error) {
    console.log('Error fetching messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);