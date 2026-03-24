'use client';

import React from 'react';
import { 
  SlidersHorizontal, 
  UserCircle, 
  Heart, 
  Clock, 
  Users, 
  Cigarette, 
  PawPrint, 
  Sparkles, 
  UserPlus,
  Map as MapIcon,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SettingsModal from '@/components/settings/SettingsModal';
import { createClient } from '@/utils/supabase/client';

const roommates = [
  {
    name: "Sarah Jenkins",
    match: "98%",
    role: "New York University • Senior",
    price: "$1,100/mo",
    tags: ["Early Bird", "Non-Smoker", "No Pets"],
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "David Chen",
    match: "85%",
    role: "Brooklyn • Software Engineer",
    price: "$1,450/mo",
    tags: ["Night Owl", "Cat Owner", "Vegan"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "Maya Williams",
    match: "92%",
    role: "Columbia University • PhD Student",
    price: "$950/mo",
    tags: ["Quiet Study", "Non-Smoker", "Cleanly"],
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "Liam Thompson",
    match: "78%",
    role: "Astoria • Marketing Manager",
    price: "$1,200/mo",
    tags: ["Social Weekend", "Chef", "Dog Friendly"],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
  }
];

const RoommateDiscovery: React.FC = () => {
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  return (
    <>
      <div className={`transition-all duration-300 ${showSettingsModal ? 'blur-md brightness-50' : ''}`}>
        <div className="min-h-screen bg-slate-50 font-sans text-dark antialiased">
          <Navbar activeTab="Discovery" onOpenSettings={() => setShowSettingsModal(true)} />

          <main className="max-w-7xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-dark">
                  Find Your Perfect Match
                </h1>
                <p className="text-lg text-slate-500 font-medium">
                  Personalized roommate recommendations based on your lifestyle, habits, and values.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full font-bold text-dark hover:border-primary hover:text-primary transition-all shadow-sm cursor-pointer">
                  <SlidersHorizontal size={18} />
                  Advanced Filters
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-dark rounded-full font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer">
                  <UserCircle size={18} />
                  Edit Your Profile
                </button>
              </div>
            </section>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
              <button className="px-5 py-2.5 bg-primary text-dark rounded-full text-sm font-bold whitespace-nowrap shadow-sm cursor-pointer">All Matches</button>
              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:border-primary hover:text-dark transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <Cigarette size={14} /> Non-Smoker
              </button>
              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:border-primary hover:text-dark transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <PawPrint size={14} /> No Pets
              </button>
              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:border-primary hover:text-dark transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <Sparkles size={14} /> Cleanly
              </button>
              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:border-primary hover:text-dark transition-all whitespace-nowrap cursor-pointer">
                Budget: $800-1200
              </button>
            </div>

            {/* Roommate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {roommates.map((person, i) => (
                <div key={i} className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
                  <div className="relative h-56 bg-slate-100">
                    <img src={person.image} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm cursor-pointer">
                      <Heart size={20} />
                    </button>
                    <div className="absolute bottom-4 left-4 px-4 py-1.5 bg-primary text-dark text-xs font-black rounded-full shadow-lg">
                      {person.match} Match
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-lg mb-1 group-hover:text-primary transition-colors text-dark">{person.name}</h3>
                    <p className="text-xs text-slate-400 font-bold mb-3 tracking-wider">{person.role}</p>
                    <p className="text-primary font-black text-xl mb-4">{person.price}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {person.tags.map((tag, j) => (
                        <span key={j} className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg tracking-widest border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-3 text-xs font-black text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 transition-all tracking-widest cursor-pointer">View Profile</button>
                      <button className="py-3 text-xs font-black text-dark bg-primary rounded-full hover:bg-primary/90 transition-all tracking-widest shadow-sm cursor-pointer">Connect</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* More Matches Section */}
            <section className="bg-primary/5 rounded-[48px] p-16 text-center mb-24 border border-primary/10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-md mb-8 text-primary">
                <UserPlus size={36} />
              </div>
              <h2 className="text-3xl font-black mb-3 text-dark tracking-tight">More Matches Coming!</h2>
              <p className="text-slate-500 mb-10 font-medium max-w-lg mx-auto">We&apos;re constantly updating our database to find roommates that perfectly fit your lifestyle criteria.</p>
              <button className="px-10 py-4 bg-white text-dark border-2 border-primary/20 rounded-full font-black hover:bg-primary hover:border-primary transition-all shadow-sm tracking-widest text-sm cursor-pointer">
                Refine Preferences
              </button>
            </section>

            {/* Lifestyle Preferences */}
            <section className="mb-24">
              <div className="mb-12">
                <h2 className="text-4xl font-black mb-4 text-dark">Lifestyle Preferences</h2>
                <p className="text-slate-500 font-medium max-w-2xl">Fine-tune your discovery by prioritizing what matters most in your daily living environment. We use these to calculate your compatibility scores.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                      <Clock size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl mb-2 text-dark tracking-tight">Schedule Alignment</h3>
                      <p className="text-slate-500 font-medium">Match with early birds who appreciate quiet mornings or night owls who share your evening energy.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 border border-purple-200">
                      <Users size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl mb-2 text-dark tracking-tight">Social Vibe</h3>
                      <p className="text-slate-500 font-medium">Whether you prefer a quiet sanctuary for deep study or a social hub for weekend gatherings.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <div className="flex items-center gap-3 font-black text-dark mb-5 tracking-wider text-sm">
                      <Cigarette size={20} className="text-primary" /> Smoking Habits
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Strictly Non-Smoking', 'Outdoor Smoking OK', 'Social Smoker', 'No Preference'].map((opt) => (
                        <button key={opt} className="px-5 py-4 text-xs font-black border border-slate-200 rounded-full hover:border-primary hover:text-dark transition-all text-left tracking-widest bg-white cursor-pointer">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 font-black text-dark mb-5 tracking-wider text-sm">
                      <PawPrint size={20} className="text-primary" /> Pet Friendliness
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['No Pets', 'Dog Friendly', 'Cat Friendly', 'All Pets Welcome'].map((opt) => (
                        <button key={opt} className="px-5 py-4 text-xs font-black border border-slate-200 rounded-full hover:border-primary hover:text-dark transition-all text-left tracking-widest bg-white cursor-pointer">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Location Search */}
            <section className="bg-dark rounded-[48px] p-16 text-white overflow-hidden relative shadow-2xl">
              <div className="relative z-10 max-w-md">
                <h2 className="text-4xl font-black mb-6 tracking-tight leading-tight">Location Discovery</h2>
                <p className="text-slate-400 mb-10 font-medium text-lg">Explore roommate matches by neighborhood proximity to your workplace or campus using our interactive map.</p>
                <button className="flex items-center gap-3 px-10 py-5 bg-primary text-dark rounded-full font-black hover:bg-primary/90 transition-all shadow-xl tracking-widest text-sm cursor-pointer">
                  <MapIcon size={22} />
                  Open Map Discovery
                </button>
              </div>
              {/* Decorative Map Element */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent hidden md:block">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
              </div>
            </section>
          </main>

          <Footer />
        </div>
      </div>

      {showSettingsModal && (
        <SettingsModal 
          initialProfile={profile} 
          onClose={() => setShowSettingsModal(false)} 
        />
      )}
    </>
  );
};

export default RoommateDiscovery;
