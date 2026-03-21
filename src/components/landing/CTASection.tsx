import Link from 'next/link';

const CTASection = () => {
  return (
    <div className="px-6 md:px-20 py-20">
      <div className="max-w-[1280px] mx-auto rounded-3xl p-10 md:p-20 text-center flex flex-col items-center gap-8 relative overflow-hidden bg-primary">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <h2 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight relative z-10">
          Ready to find your <br />
          next great living partner?
        </h2>
        <p className="text-white/90 text-lg md:text-xl max-w-[600px] relative z-10">
          Join thousands of people finding more than just a place to stay.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Link
            href="/signup"
            className="bg-white font-bold px-10 py-4 rounded-full text-lg hover:bg-slate-50 transition-colors text-primary"
          >
            Find a Roommate
          </Link>
          <Link
            href="/signup"
            className="border border-white/30 text-white font-bold px-10 py-4 rounded-full text-lg hover:bg-white/10 transition-colors"
          >
            List my Space
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
