import React from 'react';

const Sidebar: React.FC = () => {
  const lifestyleOptions = [
    "Early Bird", "Night Owl", "Tidy", "Social", "Quiet", "Pet Friendly", "LGBTQ+ Friendly", "Non-Smoker"
  ];

  return (
    <aside className="w-72 flex-shrink-0" data-purpose="search-filters">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          Sidebar - Filters
        </h2>

        {/* Budget Range */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-4">Budget Range ($/month)</label>
          <div className="px-2">
            <input className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" max="3000" min="500" step="50" type="range" />
            <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
              <span>Min</span>
              <span>Max</span>
            </div>
          </div>
        </div>

        {/* Location Search */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <input className="w-full pl-9 py-2 text-sm border border-slate-200 rounded-lg focus:ring-primary focus:border-primary" placeholder="Search neighborhood..." type="text" />
          </div>
        </div>

        {/* Lifestyle Checklist */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-4">Lifestyle</label>
          <div className="space-y-3">
            {lifestyleOptions.map((option) => (
              <label key={option} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center">
                  <input className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300" type="checkbox" />
                  <span className="ml-3 text-sm text-slate-600 group-hover:text-primary transition-colors">{option}</span>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
