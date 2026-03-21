const TESTIMONIALS = [
  {
    name: 'Sarah Jenkins',
    subtitle: 'Found a roommate in Austin',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBwOazK5OU7RZeogIHEbRJhzOP7v98jwJigqKOw2DMQzJ00tuSZbNbu40pdT-CYl3h-uZnTY-02PZj1GUwIn5rv5jU_jIF4YkA9B99u6IVxJFychP5dhgy2T9iVM7UiexTdb-3Gp8xRMNWbkQE7zZ4oJiP5it9xYRM_1D-JQ3olfpqFf-P1hD1Jkb1t4Y_K1gGXmystLSjfK0tYQ4fms62K2T1SnHLPhvsMspf9e2nONbsPlQoLC3ywePeYerw0DbVcEm-tbW6mZvw',
    quote:
      '"Found my best friend and roommate through this app! The lifestyle tags really helped us realize we were a great match before even meeting."',
  },
  {
    name: 'Marcus Chen',
    subtitle: 'Listed a room in Chicago',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBP4L1WyXCyrg1TGaNzFStnOVl9fWYMLxBf-8LPMjxSUbClIm1pxxM_lWstjgGGqXQJVLdxDvUg5yh4qrElh_7mNVavcPt0U1tLHeyIcgTZ4fOGHKsYBmeAjHIsP9ghMuNZvX488rM9UBqXq05OCtXtgSziWvPAniqM6KxRbjJRLoGmj04HhDOF1M2JK_AXij7GtJcyFsO5N1KC70W8YpHSOvB7TezLYkPLP9pNNakClHT0CZrr14GdJKgJebSw8a0Rifnn1ABOw-c',
    quote:
      '"The reputation scores gave me peace of mind as a first-time landlord. I felt safe knowing who I was inviting into my home."',
  },
  {
    name: 'Elena Rodriguez',
    subtitle: 'Relocated to Miami',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDn2GenG_M9Zc2crVCHhdOQdcPOOkCKEhCk-0ruQQmLHswpGdCMNlDrhN6ywOpJgedjSPhFn5DIA8DcwU6LGxfVA_mX6vnHHzqH31X5bvT7d_Lwb7RmuKXhBq3cbbQ0GyHH8zW2Jw_4-I6NBb5NbW7mLHdcvCCKJjeTtc4WaHo986D3NghcPfJ8EwgWJ8D3h7UYxLv6UpXeuafePWmIdSevzjuFURQbhlKrmstP2jsUG_dyv95L-BORenomctKUobSN4aHDNSucPk4',
    quote:
      '"I listed my spare room and found a compatible roommate within 4 days. The interface is so easy to use compared to Craigslist."',
  },
];

const StarRating = () => (
  <div className="flex text-amber-400">
    {[...Array(5)].map((_, i) => (
      <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
        star
      </span>
    ))}
  </div>
);

const TestimonialsSection = () => {
  return (
    <div className="px-6 md:px-20 py-20" id="testimonials">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-slate-900 text-3xl md:text-4xl font-bold tracking-tight mb-12">
          What our community says
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                  <img alt={t.name} className="w-full h-full object-cover" src={t.avatar} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 text-base font-bold">{t.name}</p>
                  <p className="text-slate-500 text-sm">{t.subtitle}</p>
                </div>
              </div>
              <StarRating />
              <p className="text-slate-600 italic">{t.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
