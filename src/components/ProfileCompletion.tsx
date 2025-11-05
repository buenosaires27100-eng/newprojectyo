import React from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface ProfileCompletionProps {
  accessToken: string;
  onComplete: () => void;
}

const QUARTIERS = [
  'Centre-Ville',
  'Nord',
  'Sud',
  'Est',
  'Ouest',
  'Quartier des Écoles',
  'Quartier Résidentiel',
  'Zone Commerciale',
];

export function ProfileCompletion({ accessToken, onComplete }: ProfileCompletionProps) {
  const [pseudo, setPseudo] = React.useState('');
  const [quartier, setQuartier] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pseudo.trim() || !quartier) {
      setError('Le pseudo et le quartier sont obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            pseudo: pseudo.trim(),
            quartier,
            bio: bio.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du profil');
      }

      console.log('Profile created successfully:', data);
      onComplete();
    } catch (err: any) {
      console.log('Error creating profile:', err);
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-blue-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-green-700 mb-2">Complétez votre profil</h2>
          <p className="text-gray-600">
            Ces informations permettront à vos voisins de mieux vous connaître
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pseudo */}
          <div className="space-y-2">
            <Label htmlFor="pseudo">
              Pseudo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pseudo"
              type="text"
              placeholder="Comment souhaitez-vous être appelé ?"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={30}
              required
            />
          </div>

          {/* Quartier */}
          <div className="space-y-2">
            <Label htmlFor="quartier">
              Quartier <span className="text-red-500">*</span>
            </Label>
            <Select value={quartier} onValueChange={setQuartier} required>
              <SelectTrigger id="quartier">
                <SelectValue placeholder="Sélectionnez votre quartier" />
              </SelectTrigger>
              <SelectContent>
                {QUARTIERS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optionnel)</Label>
            <Textarea
              id="bio"
              placeholder="Dites-en un peu plus sur vous..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={4}
            />
            <p className="text-gray-500 text-sm">
              {bio.length}/200 caractères
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
          >
            {loading ? 'Création...' : 'Continuer'}
          </Button>
        </form>
      </div>
    </div>
  );
}
