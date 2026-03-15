import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm" data-purpose="hero-banner">
      <div className="flex flex-col md:flex-row items-center p-8 lg:p-12 gap-10">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            FIND YOUR <br /> <span className="text-primary italic">PERFECT SYNC!</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-md">
            Match with Compatible Roommates & Discover ideal Living Spaces in your favorite cities.
          </p>
          <button className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-1">
            Start Exploring
          </button>
        </div>
        
        {/* Hero Illustration Placeholder */}
        <div className="flex-1 relative min-h-[300px] w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="text-slate-300 font-bold">Hero Illustration</div>
          {/* In a real app, replace with an <Image /> component */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
