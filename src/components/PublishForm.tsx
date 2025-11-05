import React from 'react';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, ChevronLeft } from 'lucide-react';

interface PublishFormProps {
  accessToken: string;
  onClose: () => void;
  onPublished: () => void;
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

export function PublishForm({ accessToken, onClose, onPublished }: PublishFormProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [type, setType] = React.useState<'offre' | 'demande' | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [quartier, setQuartier] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleTypeSelection = (selectedType: 'offre' | 'demande') => {
    setType(selectedType);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setType(null);
      setTitle('');
      setDescription('');
      setQuartier('');
      setError(null);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type || !title.trim() || !description.trim() || !quartier) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-590b4770/announcements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            type,
            title: title.trim(),
            description: description.trim(),
            quartier,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la publication');
      }

      console.log('Announcement published:', data);
      onPublished();
      onClose();
    } catch (err: any) {
      console.log('Error publishing announcement:', err);
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {step === 2 ? (
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Back">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}
          <h3 className="text-gray-900">Nouvelle publication</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Que souhaitez-vous publier ?
              </p>

              <button
                onClick={() => handleTypeSelection('offre')}
                className="w-full p-6 border-2 border-green-500 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-700 mb-1">Offre de service</p>
                    <p className="text-gray-600 text-sm">
                      Je propose mon aide à mes voisins
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelection('demande')}
                className="w-full p-6 border-2 border-blue-500 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-blue-700 mb-1">Demande d'aide</p>
                    <p className="text-gray-600 text-sm">
                      J'ai besoin d'un coup de main
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder={
                    type === 'offre'
                      ? 'Ex: Aide au jardinage'
                      : 'Ex: Besoin d\'aide pour déménager'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder={
                    type === 'offre'
                      ? 'Décrivez ce que vous proposez...'
                      : 'Décrivez votre besoin...'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={5}
                  required
                />
                <p className="text-gray-500 text-sm">{description.length}/500</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quartier">Quartier concerné</Label>
                <Select value={quartier} onValueChange={setQuartier} required>
                  <SelectTrigger id="quartier">
                    <SelectValue placeholder="Sélectionnez un quartier" />
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`w-full py-6 text-white ${
                  type === 'offre'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Publication...' : 'Publier'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
