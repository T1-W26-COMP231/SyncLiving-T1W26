const STATS = [
  { value: '10,000+', label: 'Active Roomies' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '4 Days', label: 'Avg. Match Time' },
  { value: '98%', label: 'Match Satisfaction' },
];

const StatsSection = () => {
  return (
    <section className="bg-primary/10 border-y border-primary/20 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-extrabold text-[#101d22] mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-[#101d22]/60">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
