import Link from 'next/link';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';

const LandingNavbar = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 px-6 md:px-20 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <SyncLivingLogo size="md" />

      <div className="hidden md:flex flex-1 justify-center gap-8">
        <a className="text-slate-600 hover:text-primary transition-colors text-sm font-medium" href="#how-it-works">
          How it Works
        </a>
        <a className="text-slate-600 hover:text-primary transition-colors text-sm font-medium" href="#testimonials">
          Testimonials
        </a>
        <a className="text-slate-600 hover:text-primary transition-colors text-sm font-medium" href="#">
          Pricing
        </a>
      </div>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-primary text-white text-sm font-bold"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-slate-100 text-slate-900 text-sm font-bold"
        >
          Login
        </Link>
      </div>
    </header>
  );
};

export default LandingNavbar;
