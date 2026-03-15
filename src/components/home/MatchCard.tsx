import React from 'react';

interface MatchCardProps {
  name: string;
  role: string;
  matchPercentage: number;
  tags: string[];
  imageUrl: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ name, role, matchPercentage, tags, imageUrl }) => {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden" data-purpose="profile-card">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          alt={`${name} profile photo`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          src={imageUrl}
        />
        <div className="absolute top-3 left-3 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
          {matchPercentage}% Match
        </div>
        <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
          </svg>
        </button>
      </div>
      <div className="p-5 text-center">
        <h3 className="font-bold text-slate-800 text-lg mb-1">{name}</h3>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-3">{role}</p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">
              #{tag}
            </span>
          ))}
        </div>
        <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-primary transition-colors">
          View Profile
        </button>
      </div>
    </article>
  );
};

export default MatchCard;
