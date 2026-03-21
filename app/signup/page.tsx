import Link from 'next/link';
import { signup, signInWithGoogle, signInWithApple } from '../auth/actions';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import SocialLoginButtons from '@/components/ui/SocialLoginButtons';

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4">
        <SyncLivingLogo size="md" />
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {/* White card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm mb-5">Join SyncLiving for compatibility-first living</p>

          {/* Progress indicator */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Step 1 of 5: Account Setup</span>
              <span>20%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full w-1/5" />
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border-l-4 border-primary p-3 mb-5 rounded-r-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Next:</span> Compatibility Quiz to find your perfect roommates
            </p>
          </div>

          {/* Social login — Google + Apple */}
          <div className="mb-5">
            <SocialLoginButtons
              googleAction={signInWithGoogle}
              appleAction={signInWithApple}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <hr className="flex-1 border-0 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">or with email</span>
            <hr className="flex-1 border-0 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form method="POST" className="space-y-4">
            <SearchParamsHandler searchParams={searchParams} />

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                  person
                </span>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-primary transition-colors placeholder-gray-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="john@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-primary transition-colors placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-primary transition-colors placeholder-gray-400"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base cursor-pointer select-none">
                  visibility_off
                </span>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-0.5 accent-primary"
              />
              <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>,
                including the processing of my lifestyle data for roommate matching.
              </label>
            </div>

            <button
              formAction={signup}
              type="submit"
              className="w-full bg-primary text-foreground font-semibold py-3 rounded-full hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
            >
              Continue to Compatibility Quiz
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-5 px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>&copy; 2024 SyncLiving. Designed for harmony.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">Security</a>
            <a href="#" className="hover:text-primary transition-colors">Help Center</a>
          </div>
        </div>
      </footer>
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
      className={`p-3 rounded-lg text-sm ${
        error
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-green-50 text-green-600 border border-green-200'
      }`}
    >
      {error || message}
    </div>
  );
}
