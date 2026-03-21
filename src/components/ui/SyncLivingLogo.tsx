import Link from 'next/link';

interface SyncLivingLogoProps {
  /** 'sm' = footer/compact use, 'md' = default navbars, 'lg' = auth page headers */
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const sizeMap = {
  sm: { icon: 'text-2xl', text: 'text-lg' },
  md: { icon: 'text-3xl', text: 'text-xl' },
  lg: { icon: 'text-3xl', text: 'text-2xl' },
};

const SyncLivingLogo = ({ size = 'md', href = '/' }: SyncLivingLogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <Link href={href} className="flex items-center gap-2">
      <span className={`material-symbols-outlined text-primary ${icon}`}>sync</span>
      <span className={`text-slate-900 font-bold leading-tight tracking-tight ${text}`}>
        SyncLiving
      </span>
    </Link>
  );
};

export default SyncLivingLogo;
