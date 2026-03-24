'use client';

import React from 'react';
import { SlidersHorizontal, UserCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const roommates = [
  {
    name: 'Sarah Jenkins',
    match: '98%',
    role: 'New York University • Senior',
    price: '$1,100',
    tags: ['Early Bird', 'Non-Smoker', 'No Pets'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=300',
  },
  {
    name: 'David Chen',
    match: '85%',
    role: 'Brooklyn • Software Engineer',
    price: '$1,450',
    tags: ['Night Owl', 'Cat Owner', 'Vegan'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=300',
  },
  {
    name: 'Maya Williams',
    match: '92%',
    role: 'Columbia University • PhD Student',
    price: '$950',
    tags: ['Quiet Study', 'Non-Smoker', 'Cleanly'],
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400&h=300',
  },
  {
    name: 'Liam Thompson',
    match: '78%',
    role: 'Astoria • Marketing Manager',
    price: '$1,200',
    tags: ['Social', 'Weekend Chef', 'Dog Friendly'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=300',
  },
];

const RoommateDiscovery: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
          <Navbar activeTab="Discovery" />

          <main className="max-w-7xl mx-auto w-full px-6 py-8">

            {/* Hero */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-dark tracking-tight">Find your perfect match</h1>
                <p className="text-slate-500 font-medium mt-1">Personalized roommate recommendations based on your lifestyle.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
                  <SlidersHorizontal size={16} />
                  Advanced Filters
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-dark rounded-full text-sm font-bold shadow-sm hover:brightness-105 transition-all">
                  <UserCircle size={16} />
                  Edit Your Profile
                </button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-3 mb-8 pb-2 overflow-x-auto no-scrollbar">
              <button className="px-4 py-2 rounded-full bg-primary text-dark text-sm font-semibold">All Matches</button>
              <button className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-primary transition-all">Non-Smoker</button>
              <button className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-primary transition-all">No Pets</button>
              <button className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-primary transition-all">Cleanly</button>
              <button className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-primary transition-all">Budget: $800–1200</button>
            </div>

            {/* Roommate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {roommates.map((person, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200 group hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button className="absolute top-3 right-3 size-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-xl">favorite</span>
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-primary text-dark px-3 py-1 rounded-full text-xs font-bold shadow-lg">{person.match} Match</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-dark">{person.name}</h3>
                        <p className="text-sm text-slate-500">{person.role}</p>
                      </div>
                      <span className="text-primary font-bold text-lg">
                        {person.price}<span className="text-xs text-slate-400 font-normal">/mo</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 my-4">
                      {person.tags.map((tag, j) => (
                        <span key={j} className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <button className="text-sm font-bold text-primary hover:underline">View Profile</button>
                      <button className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-dark transition-all">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* More matches card */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="size-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-slate-400">person_search</span>
                </div>
                <h4 className="text-lg font-bold text-slate-700">More matches coming!</h4>
                <p className="text-sm text-slate-500 mt-2 mb-6">We&apos;re finding more roommates that fit your criteria.</p>
                <button className="px-6 py-2 bg-dark text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">
                  Refine Preferences
                </button>
              </div>
            </div>

            {/* Lifestyle Preferences */}
            <section className="mt-4 bg-white rounded-2xl p-8 border border-slate-200 mb-16">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <h2 className="text-2xl font-bold text-dark mb-3">Lifestyle Preferences</h2>
                  <p className="text-slate-500 text-sm">Fine-tune your discovery by prioritizing what matters most in your daily living environment.</p>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-dark">Schedule Alignment</p>
                        <p className="text-xs text-slate-500">Match with early birds or night owls</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">group</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-dark">Social Vibe</p>
                        <p className="text-xs text-slate-500">Introverted vs Extroverted spaces</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-primary bg-primary/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-dark">Smoking Habits</span>
                      <span className="material-symbols-outlined text-primary text-xl">smoke_free</span>
                    </div>
                    <select className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Strictly Non-Smoking</option>
                      <option>Outdoor Smoking OK</option>
                      <option>Social Smoker</option>
                      <option>No Preference</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-dark">Pet Friendliness</span>
                      <span className="material-symbols-outlined text-slate-400 text-xl">pets</span>
                    </div>
                    <select className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>No Pets</option>
                      <option>Dog Friendly</option>
                      <option>Cat Friendly</option>
                      <option>All Pets Welcome</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-dark">Cleanliness Level</span>
                      <span className="material-symbols-outlined text-slate-400 text-xl">cleaning_services</span>
                    </div>
                    <select className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Very Tidy</option>
                      <option>Lived-in Comfort</option>
                      <option>Moderate</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-dark">Guest Policy</span>
                      <span className="material-symbols-outlined text-slate-400 text-xl">diversity_3</span>
                    </div>
                    <select className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Rarely Guests</option>
                      <option>Weekends Only</option>
                      <option>Social Household</option>
                      <option>Open Door Policy</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Location Discovery banner */}
            <div className="rounded-2xl overflow-hidden relative min-h-[300px] flex items-center p-8 mb-8">
              <div className="absolute inset-0 bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=60&w=1400"
                  alt="City map"
                  className="w-full h-full object-cover opacity-40 grayscale"
                />
              </div>
              <div className="relative z-10 max-w-md">
                <h2 className="text-3xl font-bold text-white mb-4">Location Search</h2>
                <p className="text-slate-300 mb-6">Explore roommate matches by neighborhood proximity to your workplace or campus.</p>
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-dark rounded-full font-bold hover:brightness-105 transition-all">
                  <span className="material-symbols-outlined">map</span>
                  Open Map Discovery
                </button>
              </div>
            </div>

          </main>
    </div>
  );
};

export default RoommateDiscovery;
