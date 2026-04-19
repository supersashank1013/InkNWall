import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";

interface Announcement {
  id?: number;
  message?: string;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchData = () => {
      fetch(apiUrl("/api/announcement"))
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
  const marqueeDuration = useMemo(() => {
    if (!message) return 18;
    return Math.max(18, Math.min(32, Math.round(message.length * 0.45)));
  }, [message]);
  const marqueeItems = useMemo(() => [0, 1], []);

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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
