import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-12" data-purpose="site-footer">
      <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-slate-800">SyncLiving</span>
          <span className="text-slate-400 text-sm ml-4">© 2026 SyncLiving Inc. All rights reserved.</span>
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
