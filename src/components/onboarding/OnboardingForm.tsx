'use client';

import React, { useState } from 'react';
import { updateProfile } from '../../../app/onboarding/actions';

const OnboardingForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    age: 25,
    location: '',
    longitude: undefined as number | undefined,
    latitude: undefined as number | undefined,
    role: 'seeker' as 'seeker' | 'provider',
    lifestyle_tags: [] as string[],
    budget_min: 800,
    budget_max: 2500,
    preferred_gender: 'Any Gender',
    move_in_date: '',
  });

  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchLocation = async (query: string) => {
    setFormData({ ...formData, location: query });
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setLocationSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setFormData({
      ...formData,
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    });
    setShowSuggestions(false);
  };

  const lifestyleOptions = ['Early Bird', 'Night Owl', 'Tidy', 'Social', 'Quiet', 'Pet Friendly', 'LGBTQ+ Friendly', 'Non-Smoker'];

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle_tags: prev.lifestyle_tags.includes(tag)
        ? prev.lifestyle_tags.filter(t => t !== tag)
        : [...prev.lifestyle_tags, tag]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result?.error) {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Create Profile
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tell us a bit about yourself to find your perfect match
            </p>
          </div>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
          {/* Section 1: Basic Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">01. Basic Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                <div className="space-y-2 relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => searchLocation(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Search city, neighborhood, or address..."
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                        >
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{suggestion.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] text-slate-400">
                      {formData.latitude ? `Coordinates: ${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'Start typing to see suggestions'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Goal */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">02. My Goal</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="relative cursor-pointer group" onClick={() => setFormData({ ...formData, role: 'seeker' })}>
                <input type="radio" name="role" className="peer sr-only" checked={formData.role === 'seeker'} readOnly />
                <div className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex flex-col items-center text-center gap-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Seeker</div>
                  <div className="text-xs text-slate-500">I am looking for a room</div>
                </div>
              </label>
              <label className="relative cursor-pointer group" onClick={() => setFormData({ ...formData, role: 'provider' })}>
                <input type="radio" name="role" className="peer sr-only" checked={formData.role === 'provider'} readOnly />
                <div className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex flex-col items-center text-center gap-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Provider</div>
                  <div className="text-xs text-slate-500">I am listing a room</div>
                </div>
              </label>
            </div>
          </section>

          {/* Section 3: Lifestyle */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">03. Lifestyle & Habits</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lifestyleOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.lifestyle_tags.includes(tag)
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Section 4: Preferences */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">04. Roommate Preferences</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Max Budget</span>
                    <span className="text-primary">${formData.budget_max}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) })}
                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preferred Gender</label>
                <select
                  value={formData.preferred_gender}
                  onChange={(e) => setFormData({ ...formData, preferred_gender: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option>Any Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Move-in Date</label>
                <input
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 bg-primary hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all transform active:scale-[0.98] ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default OnboardingForm;
