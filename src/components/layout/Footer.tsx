import React from 'react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-12" data-purpose="site-footer">
      <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <SyncLivingLogo size="sm" />
          <span className="text-slate-400 text-sm">© 2026 SyncLiving Inc. All rights reserved.</span>
        </div>
        <div className="flex gap-8 text-sm font-medium text-slate-600">
          <a className="hover:text-primary" href="#">Privacy Policy</a>
          <a className="hover:text-primary" href="#">Terms of Service</a>
          <a className="hover:text-primary" href="#">Help Center</a>
          <a className="hover:text-primary" href="#">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
