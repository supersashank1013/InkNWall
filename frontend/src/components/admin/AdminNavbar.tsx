import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../../assets/logo.png";

interface Props {
  adminUsername: string;
}

export default function AdminNavbar({ adminUsername }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const adminInitial = useMemo(
    () => adminUsername.trim().charAt(0).toUpperCase() || "A",
    [adminUsername]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current) return;

      if (!profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-login";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#080808]/90 px-4 py-3 backdrop-blur-xl md:h-16 md:flex-nowrap md:px-6 md:py-0">

      <div className="flex items-center gap-3">
        <img src={logo} className="h-7 w-7 sm:h-8 sm:w-8" />
        <h1 className="text-base font-bold text-white sm:text-lg">
          InkN<span className="text-orange-500">Wall</span> Admin
        </h1>
      </div>

      <div ref={profileRef} className="relative flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => setShowProfile((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-orange-500/90 text-sm font-bold text-white shadow-[0_0_25px_rgba(255,95,31,0.18)] transition hover:scale-105 hover:shadow-[0_0_35px_rgba(255,95,31,0.25)]"
        >
          {adminInitial}
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[26px] border border-white/12 bg-white/8 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:top-14 md:mt-0 md:w-[340px]">
            <div className="pointer-events-none absolute -right-12 -top-10 h-28 w-28 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-orange-500/25 to-white/10 text-2xl font-black text-white">
                  {adminInitial}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                    Admin Profile
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {adminUsername}
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4 transition duration-300 hover:border-orange-500/25 hover:bg-black/35">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Username
                  </p>
                  <div className="mt-2 rounded-xl border border-white/10 bg-[#0c0c0c]/80 px-4 py-3 text-sm text-white shadow-inner">
                    {adminUsername}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4 transition duration-300 hover:border-orange-500/25 hover:bg-black/35">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Password
                  </p>
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-[#0c0c0c]/80 px-4 py-3 shadow-inner">
                    <span className="text-sm tracking-[0.35em] text-white">••••••••••••</span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Protected
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-5 w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400/40 hover:bg-red-500/15 hover:shadow-[0_0_30px_rgba(239,68,68,0.12)]"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
