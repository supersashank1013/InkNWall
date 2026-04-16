import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AnnouncementPoster {
  id?: number;
  name?: string;
  imageUrl?: string;
}

interface Announcement {
  id?: number;
  message?: string;
  poster?: AnnouncementPoster | null;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = selectedAnnouncement ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedAnnouncement]);

  useEffect(() => {
    if (!selectedAnnouncement) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAnnouncement(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedAnnouncement]);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:8080/api/announcement")
        .then((res) => res.json())
        .then((data: Announcement[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setAnnouncement(data[data.length - 1]);
            return;
          }

          setAnnouncement(null);
        })
        .catch((err) => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  const message = announcement?.message?.trim();
  const poster = announcement?.poster ?? null;
  const posterImageUrl = poster?.imageUrl?.trim();
  const posterName = poster?.name?.trim() || "Featured Poster";
  const selectedPoster = selectedAnnouncement?.poster ?? null;
  const selectedPosterImageUrl = selectedPoster?.imageUrl?.trim();
  const selectedPosterName = selectedPoster?.name?.trim() || "Featured Poster";
  const marqueeDuration = useMemo(() => {
    if (!message) return 18;
    return Math.max(18, Math.min(32, Math.round(message.length * 0.45)));
  }, [message]);
  const marqueeItems = useMemo(() => [0, 1], []);

  const closePreview = () => {
    setSelectedAnnouncement(null);
  };

  const handleOpenPoster = () => {
    const posterId = selectedAnnouncement?.poster?.id;

    closePreview();

    if (posterId) {
      navigate(`/?poster=${posterId}`);
    }
  };

  if (!message) return null;

  return (
    <>
      <style>{`
        @keyframes announcement-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      <section className="relative z-20 px-3 py-2 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[20px] border border-orange-400/20 bg-[linear-gradient(90deg,rgba(43,18,8,0.92)_0%,rgba(83,34,11,0.96)_48%,rgba(18,18,18,0.92)_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:rounded-[24px]">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:140px_140px]" />

          <div className="relative flex flex-col gap-2 px-3 py-2.5 sm:px-5 sm:py-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-orange-100 sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.24em]">
                <Sparkles className="h-4 w-4 text-orange-300" />
                Latest
              </div>

              <div className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100/70 sm:block">
                Fresh wall drop
              </div>
            </div>

            <div
              className="relative min-w-0 flex-1 overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              }}
            >
              <div
                className="flex w-max items-stretch"
                style={{
                  animation: `announcement-marquee ${marqueeDuration}s linear infinite`,
                  willChange: "transform",
                }}
              >
                {marqueeItems.map((item) => (
                  <div
                    key={item}
                    className="flex min-w-full shrink-0 items-center gap-3 whitespace-nowrap pr-6 text-xs font-semibold tracking-[0.05em] text-white/90 sm:text-sm sm:tracking-[0.06em]"
                  >
                    <span className="text-orange-100/90">{message}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-300/70" />
                    <span className="text-[11px] uppercase tracking-[0.24em] text-orange-100/65">
                      Curated announcement
                    </span>

                    {posterImageUrl && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-300/70" />
                        <button
                          type="button"
                          onClick={() => setSelectedAnnouncement(announcement)}
                          aria-label={`Preview ${posterName}`}
                          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-2 py-1.5 transition-all duration-300 hover:border-orange-200/60 hover:bg-white/[0.12] hover:shadow-[0_0_18px_rgba(255,95,31,0.16)]"
                        >
                          <img
                            src={posterImageUrl}
                            alt={posterName}
                            className="h-8 w-6 rounded-md object-cover ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="pr-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/90">
                            Preview
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {posterImageUrl && (
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(announcement)}
                className="hidden shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:border-orange-200/60 hover:bg-white/[0.12] lg:inline-flex"
              >
                Open Drop
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {selectedAnnouncement && selectedPosterImageUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md sm:px-6"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              aria-label="Close announcement preview"
              className="absolute -top-12 right-2 text-3xl text-gray-500 transition-all duration-300 hover:rotate-90 hover:text-white sm:-top-14 sm:right-0"
            >
              &times;
            </button>

            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0B0B]/95 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
              <div className="grid gap-0 md:grid-cols-[minmax(320px,0.95fr)_minmax(320px,1.05fr)]">
                <div
                  className="relative overflow-hidden p-5 sm:p-6"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at top, rgba(255,129,72,0.24), transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
                  }}
                >
                  <div className="absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl" />

                  <div className="relative rounded-[28px] border border-white/10 bg-[#111] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <img
                      src={selectedPosterImageUrl}
                      alt={selectedPosterName}
                      className="max-h-[72vh] w-full rounded-[22px] object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
                        Announcement Preview
                      </p>
                      <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                        {selectedPosterName}
                      </h2>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                        Message
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-200 sm:text-base">
                        {selectedAnnouncement.message}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl border border-orange-500/20 p-5"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, rgba(255,95,31,0.12), rgba(255,255,255,0.03))",
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200/80">
                        Why open it
                      </p>
                      <p className="mt-3 text-sm leading-7 text-gray-300">
                        Jump straight to the poster page, get the full-size view, and add it to your cart without
                        hunting through the grid.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleOpenPoster}
                      className="w-full rounded-2xl bg-orange-600 px-5 py-3.5 font-bold text-white transition-all duration-300 hover:bg-orange-500 hover:shadow-[0_16px_40px_rgba(255,95,31,0.28)]"
                    >
                      Open in Shop
                    </button>

                    <button
                      type="button"
                      onClick={closePreview}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 font-semibold text-gray-200 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
