import Link from 'next/link';

interface SyncLivingLogoProps {
  /** 'sm' = footer/compact use, 'md' = default navbars, 'lg' = auth page headers */
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const sizeMap = {
  sm: { svg: 'w-6 h-6 rounded-md', gap: 'gap-1.5', text: 'text-lg', stroke: 'stroke-[2.5]' },
  md: { svg: 'w-8 h-8 rounded-lg', gap: 'gap-2', text: 'text-2xl', stroke: 'stroke-[2.5]' },
  lg: { svg: 'w-10 h-10 rounded-xl', gap: 'gap-2.5', text: 'text-3xl', stroke: 'stroke-2' },
};

const SyncLivingLogo = ({ size = 'md', href = '/' }: SyncLivingLogoProps) => {
  const { svg, gap, text, stroke } = sizeMap[size];

  return (
    <Link href={href} className={`flex items-center ${gap} group w-fit`}>
      {/* Abstract Logo Icon */}
      <div className={`relative flex items-center justify-center shrink-0 bg-dark shadow-lg ${svg}`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary opacity-30 blur-md rounded-full group-hover:opacity-60 transition-opacity duration-300"></div>
        
        {/* Isometric Cube (Room/Space) Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-[65%] h-[65%] text-primary z-10 group-hover:scale-110 transition-transform duration-300"
        >
          <path d="M12 2.5L3.5 7.5V16.5L12 21.5L20.5 16.5V7.5L12 2.5Z" stroke="currentColor" className={stroke} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 21.5V12" stroke="currentColor" className={stroke} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12L3.5 7.5" stroke="currentColor" className={stroke} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12L20.5 7.5" stroke="currentColor" className={stroke} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Typography */}
      <div className={`font-extrabold tracking-tight flex items-center ${text}`}>
        <span className="text-dark">Sync</span>
        <span className="text-primary">Living</span>
      </div>
    </Link>
  );
};

export default SyncLivingLogo;
