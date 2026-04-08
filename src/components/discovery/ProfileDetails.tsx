import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ProfileConnectButton } from './ProfileConnectButton';
import { 
  Users, 
  Volume2, 
  Sparkles, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Calendar,
  Zap,
  Coffee,
  Sun,
  MoonStar
} from 'lucide-react';

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
  incomingRequestId?: string | null;
  existingRequestStatus?: string | null;
}

const DIMENSIONS = [
  { id: 'social', label: 'Social Density', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'acoustic', label: 'Acoustic Environment', icon: Volume2, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'sanitary', label: 'Sanitary Standards', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'rhythm', label: 'Circadian Rhythm', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'boundary', label: 'Boundary Philosophy', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const TAG_MAP: Record<string, { label: string; dimension: string }> = {
  // social
  'TheHermit': { label: 'The Hermit', dimension: 'social' },
  'QuietLiving': { label: 'Quiet Living', dimension: 'social' },
  'BalancedSocial': { label: 'Balanced Social', dimension: 'social' },
  'FrequentHost': { label: 'Frequent Host', dimension: 'social' },
  'OpenHouse': { label: 'Open House', dimension: 'social' },
  // acoustic
  'LibraryZone': { label: 'Library Zone', dimension: 'acoustic' },
  'QuietFocus': { label: 'Quiet Focus', dimension: 'acoustic' },
  'AmbientLife': { label: 'Ambient Life', dimension: 'acoustic' },
  'VibrantHome': { label: 'Vibrant Home', dimension: 'acoustic' },
  'HighDecibel': { label: 'High Decibel', dimension: 'acoustic' },
  // sanitary
  'ChaosLover': { label: 'Chaos Lover', dimension: 'sanitary' },
  'LifeOverLaundry': { label: 'Life Over Laundry', dimension: 'sanitary' },
  'AverageTidy': { label: 'Average Tidy', dimension: 'sanitary' },
  'PubliclyTidy': { label: 'Publicly Tidy', dimension: 'sanitary' },
  'Minimalist24_7': { label: 'Minimalist 24/7', dimension: 'sanitary' },
  'Minimalist24_8': { label: 'Minimalist 24/7', dimension: 'sanitary' }, // match possible variations
  // rhythm
  'StrictEarlyBird': { label: 'Strict Early Bird', dimension: 'rhythm' },
  'AM_Routine': { label: 'AM Routine', dimension: 'rhythm' },
  'The9to5er': { label: 'The 9 to 5er', dimension: 'rhythm' },
  'TheLateShifter': { label: 'The Late Shifter', dimension: 'rhythm' },
  'TrueNightOwl': { label: 'True Night Owl', dimension: 'rhythm' },
  // boundary
  'StrictlyPrivate': { label: 'Strictly Private', dimension: 'boundary' },
  'RespectfulDistance': { label: 'Respectful Distance', dimension: 'boundary' },
  'Borrower': { label: 'Borrower', dimension: 'boundary' },
  'SharedHousehold': { label: 'Shared Household', dimension: 'boundary' },
  'CommunalLiving': { label: 'Communal Living', dimension: 'boundary' },
};

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profile, incomingRequestId, existingRequestStatus }) => {
  // Enhanced parsing
  const weekdayRoutine: Record<string, string> = {};
  const weekendRoutine: Record<string, string> = {};
  const regularTags: string[] = [];

  profile.lifestyle_tags?.forEach(fullTag => {
    // 1. Check for "wd:social:TheHermit" format
    if (fullTag.includes(':')) {
      const parts = fullTag.split(':');
      if (parts.length === 3) {
        const [time, dim, tagKey] = parts;
        const tagLabel = TAG_MAP[tagKey]?.label || tagKey;
        if (time === 'wd') weekdayRoutine[dim] = tagLabel;
        if (time === 'we') weekendRoutine[dim] = tagLabel;
        return;
      }
    }

    const cleanTag = fullTag.startsWith('#') ? fullTag.substring(1) : fullTag;
    
    // 2. Check for "TheHermit_WD" format
    const match = cleanTag.match(/^(.*)_(WD|WE)$/);
    if (match) {
      const [, tagName, type] = match;
      const tagInfo = TAG_MAP[tagName];
      if (tagInfo) {
        if (type === 'WD') weekdayRoutine[tagInfo.dimension] = tagInfo.label;
        if (type === 'WE') weekendRoutine[tagInfo.dimension] = tagInfo.label;
        return;
      }
    }
    
    // 3. Check for standalone TAG_MAP tags
    if (TAG_MAP[cleanTag]) {
      const tagInfo = TAG_MAP[cleanTag];
      weekdayRoutine[tagInfo.dimension] = tagInfo.label;
      weekendRoutine[tagInfo.dimension] = tagInfo.label;
      return;
    }

    // Otherwise it's a regular informational tag
    regularTags.push(fullTag);
  });

  const renderRoutineCard = (title: string, icon: React.ReactNode, routine: Record<string, string>, accentColor: string) => {
    return (
      <Card className="border-none shadow-sm overflow-hidden">
        <div className={`h-2 ${accentColor}`} />
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-50 p-3 rounded-2xl text-dark shadow-sm">
              {icon}
            </div>
            <h4 className="text-xl font-black text-dark tracking-tight">{title}</h4>
          </div>
          
          <div className="space-y-6">
            {DIMENSIONS.map(dim => {
              const tagLabel = routine[dim.id];
              if (!tagLabel) return null;

              return (
                <div key={dim.id} className="flex items-start gap-5 group">
                  <div className={`${dim.bg} ${dim.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                    <dim.icon size={20} />
                  </div>
                  <div className="flex-grow pt-0.5">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {dim.label}
                      </span>
                    </div>
                    <div className="text-dark font-extrabold text-base">
                      {tagLabel}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(routine).length === 0 && (
              <p className="text-slate-400 italic text-sm text-center py-4">No specific routine data set.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8f8] flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Profile Card (4/12) */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 border-none shadow-xl shadow-slate-200/50">
              <CardContent className="flex flex-col items-center text-center p-10">
                <div className="relative mb-8">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-inner">
                    <img 
                      src={profile.avatar_url || 'https://via.placeholder.com/160'} 
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-primary w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                    <Zap size={14} className="text-dark fill-dark" />
                  </div>
                </div>
                
                <h1 className="text-3xl font-extrabold text-dark mb-2 tracking-tight">{profile.full_name}</h1>
                <p className="flex items-center gap-1.5 text-slate-500 font-medium mb-6">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  {profile.location || 'Location not set'}
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  <Badge variant="published" className="capitalize px-4 py-1.5 text-sm font-bold shadow-sm">
                    {profile.role}
                  </Badge>
                  {profile.age && (
                    <Badge variant="default" className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 text-sm font-bold shadow-sm">
                      {profile.age} Years Old
                    </Badge>
                  )}
                </div>
                
                <div className="w-full space-y-3">
                  <ProfileConnectButton
                    targetUserId={profile.id}
                    targetUserName={profile.full_name}
                    targetAvatarUrl={profile.avatar_url ?? null}
                    incomingRequestId={incomingRequestId}
                    existingRequestStatus={existingRequestStatus}
                  />
                  <Button variant="outline" className="w-full py-4 text-base border-slate-200">Save Profile</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Details (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Gallery Section */}
            {profile.photos && profile.photos.length > 0 && (
              <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                ))}
              </section>
            )}

            {/* Bio Section */}
            <Card className="border-none shadow-sm overflow-visible">
              <CardContent className="p-10 relative">
                <div className="absolute -top-4 -left-4 bg-white p-3 rounded-2xl shadow-md">
                  <Coffee size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-extrabold text-dark mb-6 flex items-center gap-2">
                  About Me
                </h3>
                <p className="text-slate-600 leading-relaxed text-lg font-medium opacity-90">
                  {profile.bio || "No bio provided."}
                </p>
              </CardContent>
            </Card>

            {/* Compatibility Breakdown (Preferences) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm group">
                <CardContent className="p-8 flex items-start gap-5">
                  <div className="bg-[#e5fcf9] p-4 rounded-2xl text-[#00a396] group-hover:rotate-12 transition-transform shadow-inner">
                    <span className="material-symbols-outlined text-2xl">payments</span>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Budget</h4>
                    <p className="text-2xl font-black text-dark tracking-tight">
                      ${profile.budget_min || 0} – ${profile.budget_max || 'No limit'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm group">
                <CardContent className="p-8 flex items-start gap-5">
                  <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 group-hover:-rotate-12 transition-transform shadow-inner">
                    <span className="material-symbols-outlined text-2xl">calendar_today</span>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Planned Move-in</h4>
                    <p className="text-2xl font-black text-dark tracking-tight">
                      {profile.move_in_date ? new Date(profile.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lifestyle & Habits Section */}
            <section className="space-y-6">
              <h3 className="text-2xl font-black text-dark flex items-center gap-2 ml-2">
                <Calendar size={24} className="text-primary" />
                Lifestyle & Habits
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderRoutineCard('Weekday Routine', <Sun size={24} className="text-amber-500" />, weekdayRoutine, 'bg-primary')}
                {renderRoutineCard('Weekend Lifestyle', <MoonStar size={24} className="text-purple-500" />, weekendRoutine, 'bg-secondary')}
              </div>

              {/* Other Tags */}
              {regularTags.length > 0 && (
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={14} /> Other Key Traits
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {regularTags.map((tag) => (
                        <Badge key={tag} variant="default" className="bg-white border border-slate-200 text-slate-600 px-4 py-2 text-xs font-bold shadow-sm hover:border-primary transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};


