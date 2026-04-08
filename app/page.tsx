import LandingNavbar from '@/components/landing/LandingNavbar';
import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect them away from the landing page
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      redirect('/admin/dashboard');
    }
    redirect('/discovery');
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden font-sans">
      <div className="flex h-full grow flex-col">
        <LandingNavbar user={user} />
        <main className="flex-1">
          <HeroSection />
          <HowItWorksSection />
          <TestimonialsSection />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
