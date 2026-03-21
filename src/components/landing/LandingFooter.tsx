import SyncLivingLogo from '@/components/ui/SyncLivingLogo';

const LandingFooter = () => {
  return (
    <footer className="border-t border-slate-200 px-6 md:px-20 py-12">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Brand */}
        <div className="flex flex-col gap-4 max-w-[300px]">
          <SyncLivingLogo size="sm" />
          <p className="text-slate-500 text-sm">
            Revolutionizing how people live together by putting compatibility at the center of the search.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-slate-900">Product</h4>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Browse Roomies</a>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Add Listing</a>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Security</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-slate-900">Company</h4>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">About Us</a>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Careers</a>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Contact</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-slate-900">Legal</h4>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-500 text-sm">© 2024 SyncLiving Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a className="text-slate-400 hover:text-primary transition-colors" href="#">
            <span className="material-symbols-outlined">social_leaderboard</span>
          </a>
          <a className="text-slate-400 hover:text-primary transition-colors" href="#">
            <span className="material-symbols-outlined">photo_camera</span>
          </a>
          <a className="text-slate-400 hover:text-primary transition-colors" href="#">
            <span className="material-symbols-outlined">alternate_email</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
