import Link from 'next/link';
import { login } from '../auth/actions';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';

// Image URLs from Stitch design
const RIGHT_PANEL_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuANxTu1f2OWe9cYJlXVnbdn0khNksqJI0nFyoOabFIGCGQhnCGbZAa34HlWmQ7qPnBwcw0Up_CTp9XzFS9_ZZrd6B2Z-Ed3pCEj7K2kHwF1p46tdmp-grwu9p3cswCK-SDKJ4YhZ-k2yyRrKwlY_vLnAMWiwD8J4NMV1jfGkSAgxOEUqWZgX05LRQOhl5-TNGfdHpvBQbFOAjiUb5ThHmOVMAwdQEdNMY0NhELketqR8qoW2lp5pvLRAE33WoyTPTUiVhiDL8ZTlvQ';
const SARAH_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo4ghO9Q8K7OPq_w0KfBMBMYCoW9I2UQYw5k6ClcgXC3JPy9U16__7k2ELrWZTdjPAznGYq_yzQxW5T3k3TpPl-MM2r6-11NeSuBa0ytl3CZT4rUkHi5a-hVdln9wXtpbYEuPh68qSbn8FLFBZvaEstjyJD5q1Kxw-AtCOwnZ2wWxbCMwDrJnXNuIrOcF5HgGCFmPA2r3RaJXBCeloVYqrVkhc2pI-wkEt_tzFodoGIltLQWs6wSPYl-LZZzTqObnW0YziyXVB76s';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-0 md:p-6 font-sans">
      {/* Centered card */}
      <div className="flex w-full max-w-[1200px] bg-white min-h-[650px] shadow-2xl rounded-none md:rounded-xl overflow-hidden">

        {/* Left column — form */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 lg:max-w-[550px]">
          {/* Brand */}
          <div className="mb-10">
            <SyncLivingLogo size="md" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-500">Simplify your shared living experience today.</p>
          </div>

          {/* Email / password form */}
          <form method="POST" className="space-y-5">
            <SearchParamsHandler searchParams={searchParams} />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="example@syncliving.com"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-sm font-semibold text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="size-4 accent-primary border-slate-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">
                Remember me for 30 days
              </label>
            </div>

            <button
              formAction={login}
              type="submit"
              className="w-full bg-primary hover:brightness-105 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Right column — photo + testimonial */}
        <div className="hidden lg:block relative flex-1 bg-primary/10">
          {/* Background photo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${RIGHT_PANEL_BG}')` }}
          />
          {/* Teal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-12">
            {/* Glassmorphism testimonial card */}
            <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl border border-white/30 text-white max-w-md">
              <p className="text-xl font-semibold mb-4 italic">
                &ldquo;SyncLiving turned our chaotic roommate situation into a perfectly organized
                home. No more guessing who bought the milk!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full border-2 border-white overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SARAH_AVATAR} alt="Sarah Jenkins" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold">Sarah Jenkins</p>
                  <p className="text-sm opacity-80">SyncLiving Member since 2022</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

async function SearchParamsHandler({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = params.error as string | undefined;
  const message = params.message as string | undefined;

  if (!error && !message) return null;

  return (
    <div
      className={`p-3 rounded-xl text-sm ${
        error
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-green-50 text-green-600 border border-green-200'
      }`}
    >
      {error || message}
    </div>
  );
}
