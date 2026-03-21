const FEATURES = [
  {
    icon: 'travel_explore',
    title: 'Smart Discovery',
    description:
      'Browse verified profiles that match your specific living preferences, desired neighborhood, and budget.',
  },
  {
    icon: 'label',
    title: 'Lifestyle Tags',
    description:
      "Filter by habits like 'Night Owl', 'Pet Friendly', or 'Clean Freak' to ensure a perfect vibe fit.",
  },
  {
    icon: 'verified_user',
    title: 'Reputation Scores',
    description:
      'Rent with confidence using our community-driven trust and verification system and past roommate reviews.',
  },
];

const HowItWorksSection = () => {
  return (
    <div className="px-6 md:px-20 py-20 bg-slate-50" id="how-it-works">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-4 text-center items-center">
          <h2 className="text-slate-900 text-4xl font-bold tracking-tight">How it works</h2>
          <p className="text-slate-600 text-lg max-w-[640px]">
            Our simple three-step process to finding your perfect living situation without the drama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-slate-900 text-xl font-bold">{feature.title}</h3>
                <p className="text-slate-600 text-base leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
