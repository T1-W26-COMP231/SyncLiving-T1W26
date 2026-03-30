import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ProfileDetailsProps {
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    age?: number;
    location?: string;
    role: 'seeker' | 'provider';
    lifestyle_tags?: string[];
    budget_min?: number;
    budget_max?: number;
    move_in_date?: string;
    preferred_gender?: string;
    photos?: string[];
  };
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profile }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="flex flex-col items-center text-center p-8">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img 
                      src={profile.avatar_url || 'https://via.placeholder.com/128'} 
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-primary w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-dark mb-1">{profile.full_name}</h1>
                <p className="text-slate-500 text-sm mb-4">{profile.location || 'Location not set'}</p>
                
                <div className="flex gap-2 mb-6">
                  <Badge variant="published" className="capitalize">
                    {profile.role}
                  </Badge>
                  {profile.age && <Badge variant="default">{profile.age} Years Old</Badge>}
                </div>
                
                <div className="w-full space-y-3">
                  <Button className="w-full">Send Match Request</Button>
                  <Button variant="outline" className="w-full">Save Profile</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Section */}
            {profile.photos && profile.photos.length > 0 && (
              <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </section>
            )}

            {/* Bio Section */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-bold text-dark mb-4">About Me</h3>
                <p className="text-slate-600 leading-relaxed">
                  {profile.bio || "No bio provided."}
                </p>
              </CardContent>
            </Card>

            {/* Lifestyle Tags Section */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-bold text-dark mb-4">Lifestyle & Habits</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.lifestyle_tags && profile.lifestyle_tags.length > 0 ? (
                    profile.lifestyle_tags.map((tag) => (
                      <Badge key={tag} variant="default" className="bg-slate-100 text-slate-700 px-4 py-2 text-sm">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No tags specified.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Budget</h4>
                    <p className="text-lg font-bold text-dark">
                      ${profile.budget_min || 0} - ${profile.budget_max || 'No limit'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-secondary/20 p-3 rounded-xl text-secondary-foreground">
                    <span className="material-symbols-outlined">calendar_today</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Move-in Date</h4>
                    <p className="text-lg font-bold text-dark">
                      {profile.move_in_date ? new Date(profile.move_in_date).toLocaleDateString() : 'Flexible'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
