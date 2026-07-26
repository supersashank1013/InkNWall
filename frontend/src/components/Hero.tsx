import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import ProtectedPosterImage from "./ProtectedPosterImage";



interface AnnouncementPoster {
  id?: number;
  name?: string;
  imageUrl?: string;
}

interface Announcement {
  createdAt?: string;
  message?: string;
  poster?: AnnouncementPoster | null;
  posters?: AnnouncementPoster[] | null;
}

interface HeroProps {
  onFeaturedPosterSelect: (posterId: number) => void;
}

const FEATURED_POSTER_STORAGE_KEY = "inknwall_featured_announcement_poster";
const ANNOUNCEMENT_GROUP_WINDOW_MS = 5 * 60 * 1000;

const getAnnouncementPoster = (announcement: Announcement) => {
  if (announcement.poster?.imageUrl?.trim()) {
    return announcement.poster;
  }

  return announcement.posters?.find((poster) => poster.imageUrl?.trim()) ?? null;
};

const uniquePosters = (posters: AnnouncementPoster[]) => {
  const seen = new Set<string>();

  return posters.filter((poster) => {
    const imageUrl = poster.imageUrl?.trim();
    if (!imageUrl) return false;

    const key = String(poster.id ?? imageUrl);
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const getStoredFeaturedPosters = () => {
  try {
    const storedPosters = localStorage.getItem(FEATURED_POSTER_STORAGE_KEY);
    if (!storedPosters) return [];

    const parsed = JSON.parse(storedPosters) as AnnouncementPoster | AnnouncementPoster[];
    return uniquePosters(Array.isArray(parsed) ? parsed : [parsed]);
  } catch {
    return [];
  }
};

const getLatestAnnouncementPosters = (announcements: Announcement[]) => {
  const latestWithPoster = [...announcements]
    .reverse()
    .find((item) => getAnnouncementPoster(item));

  if (!latestWithPoster) return [];

  const latestMessage = latestWithPoster.message?.trim() ?? "";
  const latestTime = latestWithPoster.createdAt ? Date.parse(latestWithPoster.createdAt) : Number.NaN;
  const relatedPosters = announcements
    .filter((item) => {
      const poster = getAnnouncementPoster(item);
      if (!poster) return false;

      const itemMessage = item.message?.trim() ?? "";
      const itemTime = item.createdAt ? Date.parse(item.createdAt) : Number.NaN;
      const isSameAnnouncement = itemMessage === latestMessage;
      const isNearby =
        Number.isNaN(latestTime) ||
        Number.isNaN(itemTime) ||
        Math.abs(latestTime - itemTime) <= ANNOUNCEMENT_GROUP_WINDOW_MS;

      return isSameAnnouncement && isNearby;
    })
    .map((item) => getAnnouncementPoster(item))
    .filter((poster): poster is AnnouncementPoster => Boolean(poster));

  return uniquePosters(relatedPosters);
};

export default function Hero({ onFeaturedPosterSelect }: HeroProps) {
  const [index, setIndex] = useState(0);
  const [featuredPosters, setFeaturedPosters] = useState<AnnouncementPoster[]>(() => getStoredFeaturedPosters());

  const hasFeaturedPosters = featuredPosters.length > 0;
  const currentLength = featuredPosters.length;
  const activeIndex = index % (currentLength || 1);

  useEffect(() => {
    if (currentLength <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % currentLength);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentLength]);

  useEffect(() => {
    let isMounted = true;

    const fetchFeaturedPoster = () => {
      fetch(apiUrl("/api/announcement"))
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load announcements");
          return res.json();
        })
        .then((data: Announcement[]) => {
          if (!isMounted || !Array.isArray(data)) return;

          const latestPosters = getLatestAnnouncementPosters(data);
          setFeaturedPosters(latestPosters.length > 0 ? latestPosters : getStoredFeaturedPosters());
        })
        .catch(() => {
          if (isMounted) setFeaturedPosters(getStoredFeaturedPosters());
        });
    };

    fetchFeaturedPoster();
    const interval = setInterval(fetchFeaturedPoster, 10000);
    const handleStoredFeaturedPoster = () => {
      if (isMounted) {
        setFeaturedPosters(getStoredFeaturedPosters());
      }
    };

    window.addEventListener("storage", handleStoredFeaturedPoster);
    window.addEventListener("inknwall_featured_announcement_poster", handleStoredFeaturedPoster);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("storage", handleStoredFeaturedPoster);
      window.removeEventListener("inknwall_featured_announcement_poster", handleStoredFeaturedPoster);
    };
  }, []);

  const scrollToShopSection = () => {
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

  const scrollToShop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToShopSection();
  };

  const openFeaturedPoster = (poster: AnnouncementPoster) => {
    if (poster.id) {
      onFeaturedPosterSelect(poster.id);
    }
  };

  return (
    <section className="relative isolate overflow-hidden px-1 py-4 sm:px-2 sm:py-6 lg:py-10">
      <div className="relative z-10 grid items-start gap-7 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div className="max-w-xl lg:pt-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-orange-300 sm:text-xs">
            <Sparkles className="h-4 w-4" />
            <span>Hostel room glow-up</span>
          </div>

          <h2 className="mt-4 max-w-2xl text-[2.45rem] font-black uppercase leading-[0.94] tracking-normal text-white sm:mt-6 sm:text-5xl lg:text-6xl xl:text-7xl">
            Walls That
            <span className="block bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Speak.
            </span>
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-7 text-gray-300 sm:mt-5 sm:text-base sm:leading-8">
            Give your room a sharper identity with poster drops that feel curated, cinematic, and actually worth
            looking at every day.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-normal text-gray-400 sm:mt-5">
            <span>Curated wall art</span>
            <span className="text-gray-600">/</span>
            <span>Fast campus pickup</span>
            <span className="text-gray-600">/</span>
            <span>Designed for small spaces</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:gap-4 sm:flex-row sm:items-center">
            <a
              href="#shop"
              onClick={scrollToShop}
              className="group inline-flex items-center justify-center gap-3 rounded-lg bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-normal text-white shadow-[0_16px_32px_rgba(255,95,31,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-orange-500 active:scale-[0.98] sm:px-6 sm:py-3.5 sm:text-sm"
            >
              Start Browsing
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

          </div>
        </div>

        <div className="relative">
          <div className="mx-auto w-full max-w-[260px] sm:max-w-[340px] lg:ml-auto lg:mr-0 lg:max-w-[360px] xl:max-w-[380px]">
            <div className="relative overflow-hidden rounded-lg border border-white/12 bg-[#0f0f0f] p-2 shadow-[0_20px_54px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-x-12 top-0 h-20 rounded-full bg-orange-500/18 blur-3xl" />

              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-[#080808]">
                {hasFeaturedPosters ? (
                  featuredPosters.map((poster, i) => (
                    <button
                      key={`${poster.id ?? poster.imageUrl}-${poster.name ?? "poster"}`}
                      type="button"
                      onClick={() => openFeaturedPoster(poster)}
                      aria-label={`Open ${poster.name?.trim() || "featured poster"} in shop`}
                      className={`group absolute inset-0 block h-full w-full overflow-hidden text-left transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        i === activeIndex ? "z-10 scale-100 opacity-100 pointer-events-auto" : "z-0 scale-110 opacity-0 pointer-events-none"
                      }`}
                    >
                      <ProtectedPosterImage
                        src={poster.imageUrl}
                        alt={poster.name?.trim() || "Featured Drop"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-70" />
                      {poster.name && (
                        <div className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-white sm:p-5">
                          {poster.name}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]">
                    {/* Subtle grid texture */}
                    <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:32px_32px]" />
                    {/* Glow blob */}
                    <div className="absolute h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                    {/* Icon */}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_32px_rgba(255,95,31,0.12)]">
                      <svg className="h-6 w-6 text-orange-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 6.75h.008v.008H6.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="relative z-10 text-center px-6">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300/80">Coming Soon</p>
                      <p className="mt-1 text-xs text-white/30 leading-relaxed">Featured drop will appear here</p>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent" />

                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 sm:p-4">
                  <div className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-normal text-white/85 backdrop-blur-xl sm:text-[10px]">
                    Featured wall drop
                  </div>
                </div>
              </div>
            </div>

            {currentLength > 1 && (
              <div className="mt-3 rounded-lg px-3 py-2 backdrop-blur-2xl block">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex gap-2">
                      {Array.from({ length: currentLength }).map((_, i) => (
                        <span
                          key={`dot-${i}`}
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            i === activeIndex ? "w-8 bg-orange-400" : "w-2.5 bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
