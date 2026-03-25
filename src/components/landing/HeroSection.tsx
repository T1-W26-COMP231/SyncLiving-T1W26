import Link from 'next/link';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrpcVQzl624RKIg5mGhyUdkQbsWeLXucwZFQCdNpmyvOZCEHCK9jy6yUJBJ-YfE8eByNeaCGqckjR4ZCsaJ2n4Imjichguotxep05SXfgjJpb6tVZA-40p6295XTayTCH5nGSrzdRZ6C45bUByhreHSKUQhPvSLKlyL1ncUmLAwlbcUbWcnyvjgA2mZa6NqNsvsOL-20yiWDZ9JJfDK0d3ZQpto40ohSO2A-b8cZ4MmyPgsUKwumOtfGw1NxRIWwCT7TYWNN8KVCs';

const AVATAR_URLS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCY9jxbVYfwYbvRV6VyHL4eiKirwtslI27jyJV_QOcyYLNxTRzz-NHzKW8A6STYY6N-_k-GLSjN4q8VNiNDdggjBN2cj7e2-CsP6Ub96n5Ae-9I66e1maEW086LfM9VkWG-1yzxwXfbXV1JBLImlH7rJhWTPwuVynlrHA5D_MA6Q8FbMaro3qpiDNgubvtJ_QrqRj46k0auRjSJqDDwOtvhfTCprO8cD_HymaPyUzjrvuPe-ZHbyscCvdkB24vROWZGDd7IM3wguek',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAiUA2WWUWxoUMK96ZvgwTD0PRISqBTUM7l7voNruNc6jnK5w1Fp3Qolb0Dcmdt4WRSjXYHy6jDmCMlZIlzCvgAljkLxW2PfF8pk5gjqNt3yPyDzsc-YuPFhqkwJxOG0fD_4JVw7vSdNsUUCRPWBpxhrWWh-DzM7jWe42M0jbhLD8UT_iBpmgq9ARdDo8w5iyLuUBW9vRP4jW_kKVFCY2i5dWHxn0TsbJqz_-z--yWoYcgRBamEl5UPiY7yVQJ1wzq7V3a6hK6Syt0',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAVzxLu1FSOFdfL-fevwaYg2GaBZkMXIx2mdlPdUSAUiDLHjCbron3_UHzIn6eOqoN8mRaFkie6ojjUq9WOI3wBsi35NX-rC4ft9Uv3gygHVrKn9JXEhsBSckCXZeiqcq5yhRGwh7EOCwycZsM78v7RAa-aMCX8RMTf1KPeEuHX2bccfEmZO5CIvpc5HtKJ_YOZGBKR4ZoRbHNYlCXkWGRuY0nwYzEX2E5h9ZTkzjkYiNIH-xzF-cdv0oW4FQA2ERmmtxSNqZyd1WE',
];

const HeroSection = () => {
  return (
    <div className="px-6 md:px-20 py-12 md:py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          {/* Left: text content */}
          <div className="flex flex-col gap-8 lg:w-1/2">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold w-fit">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Find your vibe
              </div>
              <h1 className="text-slate-900 text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                Compatibility-first <br />
                <span className="text-primary">perfect sync.</span>
              </h1>
              <p className="text-slate-600 text-lg md:text-xl font-normal leading-relaxed max-w-[540px]">
                Find someone who shares your rhythm, not just your rent. Our matching algorithm connects you based on
                lifestyle, habits, and values.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/discovery"
                className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 text-white text-lg font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform bg-primary"
              >
                Find a Roommate
              </Link>
              <Link
                href="/dashboard"
                className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white border border-slate-200 text-slate-900 text-lg font-bold hover:bg-slate-50 transition-colors"
              >
                List a Room
              </Link>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="lg:w-1/2 relative">
            <div className="w-full aspect-[4/3] bg-primary/20 rounded-xl overflow-hidden shadow-2xl relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
              />
            </div>

            {/* Floating social proof card */}
            <div className="absolute -bottom-6 -left-6 p-6 bg-white rounded-xl shadow-xl hidden md:flex items-center gap-4">
              <div className="flex -space-x-3">
                {AVATAR_URLS.map((url, i) => (
                  <img
                    key={i}
                    alt={`User ${i + 1}`}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    src={url}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold">10k+ Active Roomies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
