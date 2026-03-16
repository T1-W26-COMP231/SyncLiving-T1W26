import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import MatchCard from '@/components/home/MatchCard';

export default function Home() {
  const mockMatches = [
    {
      name: "Alex Bennett",
      role: "Student",
      matchPercentage: 92,
      tags: ["Tidy", "Social"],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjhm_t1rjnT8zfGJMgasm5KkxxGcBqSB5x3SLjzpQrHnpo0lAOvluX6NjfT6qpaOveeyjqIixpiXBFmHHA7Z-ZSLyQoUIuG5bc0aVtWBRfrGJnVWPq4u-dRuiwLpP-EXje9qsr2NnRAWxHbaCe-fLxiB5ELQY51P3rqt1VbJrMr2YPFFrCVXtjCBwOJHVtntd5ZIvQDjFzQEjiroNuYzf4iQz0uCHAEUWtiHEHnv78eHO3xcKA3_BlrKwKWhQCoyG1chtnUzQUaCJa"
    },
    {
      name: "Jordan Smith",
      role: "Student",
      matchPercentage: 92,
      tags: ["EarlyBird"],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuALQLJe2slFjwn6jhNFX-oQczDaMTwofX6hZD8Yfpla-mgI4ctaCtVdoC6rJuF87abwDNcLxs6tbM3R_-gPYrl_HYinC88woONUedQms_rj11oLmydY5ZzMFX_cYJkwXcGS8YXGoD18IOjWthucdei5-V1rMYZdMB3XwpQe8KnMVX1tssPIzPTyMOfddJar6rPOfW0ZY2TbELj1sV8-7rcaYdOIGQ0BaqkoB3og5YiM-Rc88cF3dQT2j2FJEtddlkgLMNaVRSyjZ2_A"
    },
    {
      name: "Maya Chen",
      role: "Student",
      matchPercentage: 93,
      tags: ["Quiet", "Tidy"],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBw9DVMtJ38OTuVXRW9mUx146cGS3SWvgthv51ia9Tr_4HR7gVGqmpss9bGkXQMyIUyOlzQm73KjiSwCf4aeefgBuUHstz34ASDGl1_BbDhRIfqJ3u6nD8YIQsyWa06sS3jmRRHwaxzyAJqQ9Ht3FH5xKILsZRbnhaDZtHldj-gxh3uoayJiiBM9yvgGGfkYvDx9qn6Fo5q_PksGWq6M3ZzXf1fb1y_sonxCR4DILwBYJ-k3OdCl0pco28_FhX6RHElyVT8Kf5YtLue"
    },
    {
      name: "Riley Garcia",
      role: "Student",
      matchPercentage: 92,
      tags: ["NightOwl"],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDREpyCWY78yUoNJr0l3VbfRSmrZtYzDTs3bL67o1fRke3krHk7F9Yjv741XCPgIYPGGahmPUuc5xcos5a3PkE7vK5Ok9-We0a-8ucDnNnDuh_9ydBuvLCKwt3tMeuSUndTEB2kSiK7k0ESPUTrgwZ9rb1bM6QTSXQj_6n7oJwN0LcVrghcbndH5AKzJhVSsPsy6gvWk5ZSgAwW7yBGXLaXlAA6zPx3XikBO3YpnCsTPOiRmpG06eIG-uMkXjWM0Qfq2osELngw_ZSS"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex flex-1 max-w-screen-2xl mx-auto w-full px-6 py-8 gap-8">
        <Sidebar />
        
        <section className="flex-1 flex flex-col gap-10" data-purpose="main-display">
          <Hero />
          
          <section data-purpose="match-grid">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Top Matches</h2>
              <a className="text-primary font-semibold text-sm hover:underline" href="#">View All</a>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockMatches.map((match) => (
                <MatchCard key={match.name} {...match} />
              ))}
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}
