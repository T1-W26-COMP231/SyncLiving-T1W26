import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
      <div className="flex flex-col gap-1">
        {subtitle && <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{subtitle}</span>}
        <h2 className="text-xl font-bold text-slate-900 uppercase">{title}</h2>
      </div>
    </div>
  );
};

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`p-8 ${className}`}>{children}</div>;
};
