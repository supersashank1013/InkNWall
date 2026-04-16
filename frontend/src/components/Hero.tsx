import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600",
  "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=600",
  "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600",
];

const features = [
  {
    title: "Minimalist Dimensions",
    note: "Clean shapes and warm neutrals for a calmer desk-side setup.",
  },
  {
    title: "Urban Concrete",
    note: "Moodier tones, sharper contrast, and a little more edge.",
  },
  {
    title: "Abstract Waves",
    note: "Fluid movement and high-energy color without visual clutter.",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const activeFeature = features[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const scrollToShop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const shopSection = document.getElementById("shop");

    if (shopSection) {
      const targetPosition =
        shopSection.getBoundingClientRect().top + window.scrollY - 100;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,18,18,0.94),rgba(10,10,10,0.86))] px-4 py-5 shadow-[0_25px_90px_rgba(0,0,0,0.45)] sm:rounded-[36px] sm:px-8 sm:py-10 lg:min-h-[calc(100vh-10rem)] lg:px-12 lg:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,95,31,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_32%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:120px_120px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.7),transparent_100%)]" />

      <div className="relative z-10 grid items-center gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-200 sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.24em]">
            <Sparkles className="h-4 w-4" />
            Hostel room glow-up
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-5 sm:flex-wrap sm:gap-3 sm:text-xs sm:tracking-[0.22em]">
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2">Curated wall art</span>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2">Fast campus pickup</span>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2">Designed for small spaces</span>
          </div>

          <h2 className="mt-6 max-w-3xl text-[2.7rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white sm:mt-8 sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
            Walls That
            <span className="block bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Speak.
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300 sm:mt-6 sm:text-lg sm:leading-8">
            Give your room a sharper identity with poster drops that feel curated, cinematic, and actually worth
            looking at every day.
          </p>

          <div className="mt-6 hidden gap-3 sm:mt-8 sm:grid sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Mood</p>
              <p className="mt-2 text-lg font-bold text-white">Minimal to bold</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Pickup</p>
              <p className="mt-2 text-lg font-bold text-white">Campus-ready</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Browse</p>
              <p className="mt-2 text-lg font-bold text-white">Quick preview flow</p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:gap-4 sm:flex-row sm:items-center">
            <a
              href="#shop"
              onClick={scrollToShop}
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-orange-600 px-5 py-3.5 text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_20px_40px_rgba(255,95,31,0.24)] transition-all duration-300 hover:-translate-y-1 hover:bg-orange-500 active:scale-[0.98] sm:px-7 sm:py-4 sm:text-sm"
            >
              Start Browsing
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <div className="hidden max-w-sm rounded-2xl border border-white/10 bg-black/25 px-5 py-4 backdrop-blur-xl sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200">Design Diagnosis</p>
              <p className="mt-2 text-sm leading-7 text-gray-300">
                &quot;Your walls look like a government office. Let&apos;s fix that.&quot;
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="mx-auto max-w-[320px] sm:max-w-[500px]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#0f0f0f] p-2.5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:rounded-[32px] sm:p-3">
              <div className="absolute inset-x-16 top-0 h-28 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/10 bg-[#080808] sm:rounded-[28px]">
                {images.map((img, i) => (
                  <img
                    key={img}
                    src={img}
                    alt={`Featured Drop ${i + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      i === index ? "scale-100 opacity-100" : "scale-110 opacity-0"
                    }`}
                  />
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/35 to-transparent" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
                  <div className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.24em] text-white/85 backdrop-blur-xl sm:text-[10px] sm:tracking-[0.26em]">
                    Featured wall drop
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <div className="rounded-[20px] border border-white/10 bg-black/40 p-4 backdrop-blur-2xl sm:rounded-[24px] sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200">Current edit</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">{activeFeature.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-300 sm:leading-7">{activeFeature.note}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 hidden rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-2xl sm:block">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Featured style</p>
                  <p className="mt-1 text-sm font-bold text-white">{activeFeature.title}</p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-2">
                    {images.map((img, i) => (
                      <div
                        key={`${img}-thumb`}
                        className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                          i === index
                            ? "border-orange-400/60 shadow-[0_0_20px_rgba(255,95,31,0.18)]"
                            : "border-white/10 opacity-60"
                        }`}
                      >
                        <img src={img} alt={`Preview ${i + 1}`} className="h-12 w-10 object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {images.map((img, i) => (
                      <span
                        key={`${img}-dot`}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          i === index ? "w-8 bg-orange-400" : "w-2.5 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
