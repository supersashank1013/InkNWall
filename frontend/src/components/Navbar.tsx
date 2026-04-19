import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { Search } from "lucide-react";
import { posters } from "../data/posters";
import AuthModal from "./AuthModal";

const allCategories = [
  "marvel", "anime", "f1", "sports", "movies", "food", "quotes"
];

interface NavbarProps {
  search: string;
  setSearch: (value: string) => void;
  cartCount: number;
  toggleCart: () => void;
}

interface NavUser {
  name?: string;
  profilePic?: string;
}

export default function Navbar({
  search,
  setSearch,
  cartCount,
  toggleCart,
}: NavbarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? (JSON.parse(stored) as NavUser) : null;
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("inknwall_search_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? (JSON.parse(stored) as NavUser) : null);
    };

    window.addEventListener("storage", syncUser);

    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const lowerTerm = term.toLowerCase();
    const newHistory = [lowerTerm, ...history.filter((h) => h !== lowerTerm)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("inknwall_search_history", JSON.stringify(newHistory));
  };

  const getShopOffset = () => (window.innerWidth < 768 ? 112 : 144);

  const removeHistoryItem = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h !== term);
    setHistory(newHistory);
    localStorage.setItem("inknwall_search_history", JSON.stringify(newHistory));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);

    if (val.length === 1 && search.length === 0) {
      const shopSection = document.getElementById("shop");
      if (shopSection) {
        const targetPosition = shopSection.getBoundingClientRect().top + window.scrollY - getShopOffset();
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }
    }
  };

  const handleSelect = (term: string) => {
    setSearch(term);
    saveSearch(term);
    setIsFocused(false);
    
    const shopSection = document.getElementById("shop");
    if (shopSection) {
      const targetPosition = shopSection.getBoundingClientRect().top + window.scrollY - getShopOffset();
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveSearch(search);
      setIsFocused(false);
      
      const shopSection = document.getElementById("shop");
      if (shopSection) {
        const targetPosition = shopSection.getBoundingClientRect().top + window.scrollY - getShopOffset();
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }
    }
  };

  const goHome = () => {
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const query = search.toLowerCase().trim();

  const filteredHistory = query
    ? history.filter((h) => h.startsWith(query))
    : history;

  const filteredCategories = query
    ? allCategories.filter((c) => c.startsWith(query))
    : [];

  const filteredPosters = query
    ? Array.from(new Set(posters.map((p) => p.name)))
        .filter((name) => name.toLowerCase().startsWith(query))
        .slice(0, 4)
    : [];

  const hasResults = filteredHistory.length > 0 || filteredCategories.length > 0 || filteredPosters.length > 0;

  return (
    <>
      {/* ✨ Keyframe animations injected once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        @keyframes navbar-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes badge-pop {
          0%   { transform: translate(25%, -25%) scale(0.5); opacity: 0; }
          70%  { transform: translate(25%, -25%) scale(1.15); }
          100% { transform: translate(25%, -25%) scale(1);   opacity: 1; }
        }
        @keyframes dropdown-slide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cart-bounce {
          0%, 100% { transform: scale(1); }
          40%       { transform: scale(1.18); }
          70%       { transform: scale(0.92); }
        }

        .navbar-brand-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .navbar-gradient-border::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(249,115,22,0.15) 20%,
            rgba(249,115,22,0.5) 50%,
            rgba(249,115,22,0.15) 80%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: navbar-shimmer 4s linear infinite;
        }
        .search-glow:focus-within {
          box-shadow: 0 0 0 1px rgba(249,115,22,0.4), 0 0 20px rgba(249,115,22,0.08);
        }
        .cart-icon-btn:active svg {
          animation: cart-bounce 0.35s ease;
        }
        .dropdown-enter {
          animation: dropdown-slide 0.18s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .badge-animate {
          animation: badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .suggestion-row {
          position: relative;
        }
        .suggestion-row::before {
          content: '';
          position: absolute;
          left: 16px; right: 16px; top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
        }
      `}</style>

      <header className="fixed top-0 left-0 w-full z-40 border-b border-white/5 bg-[#0e0e0e]/60 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2.5 py-2 md:h-16 md:flex-nowrap md:gap-6 md:py-0 lg:gap-8">

            {/* ── BRAND ── */}
            <div
              onClick={goHome}
              className="group order-1 flex min-w-0 flex-1 items-center cursor-pointer select-none md:w-auto md:flex-shrink-0"
              title="Go to Home"
            >
              <div className="relative transition duration-300 group-hover:drop-shadow-[0_0_14px_rgba(249,115,22,0.35)]">
                <img
                  src={logo}
                  alt="InkNWall Logo"
                  className="h-10 w-10 origin-left scale-110 object-contain transition-all duration-300 group-hover:scale-125 sm:h-14 sm:w-14 md:h-20 md:w-20"
                />
              </div>
              <span
                className="navbar-brand-text ml-1.5 text-[0.95rem] tracking-tight bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent transition-all duration-300 group-hover:from-orange-500 group-hover:to-orange-400 sm:ml-2 sm:text-[1.1rem] md:text-[1.25rem]"
                style={{
                  background: "linear-gradient(135deg, #ffffff 30%, #d1d1d1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #f97316 0%, #fb923c 100%)";
                  (e.currentTarget as HTMLElement).style.webkitBackgroundClip = "text";
                  (e.currentTarget as HTMLElement).style.backgroundClip = "text";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #ffffff 30%, #d1d1d1 100%)";
                  (e.currentTarget as HTMLElement).style.webkitBackgroundClip = "text";
                  (e.currentTarget as HTMLElement).style.backgroundClip = "text";
                }}
              >
                InkNWall
              </span>
            </div>

            {/* ── SEARCH ── */}
            <div
              ref={searchRef}
              className="search-glow order-3 relative w-full min-w-0 rounded-full transition-all duration-300 md:order-2 md:max-w-xl md:flex-1"
            >
              
              {/* Search icon */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-3 sm:pl-4">
                <div
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    background: isFocused
                      ? "linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 100%)"
                      : "linear-gradient(135deg, rgba(251,146,60,0.92) 0%, rgba(249,115,22,0.88) 45%, rgba(234,88,12,0.84) 100%)",
                    boxShadow: isFocused
                      ? "0 0 12px rgba(249,115,22,0.28)"
                      : "0 0 8px rgba(249,115,22,0.18)",
                  }}
                >
                  <Search
                    size={12.5}
                    strokeWidth={2.6}
                    className="text-white"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Search posters, movies, minimal..."
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                className="relative z-20 w-full rounded-full border border-white/10 bg-[#121212]/90 py-2.5 pl-10 pr-9 text-[13px] text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-500 focus:border-orange-500/50 focus:bg-[#181818] sm:py-[10px] sm:pl-11 sm:pr-10 sm:text-sm"
                style={{
                  background: isFocused ? "rgba(18,18,18,0.95)" : "rgba(12,12,12,0.9)",
                  border: isFocused
                    ? "1px solid rgba(249,115,22,0.45)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: isFocused && hasResults ? "16px 16px 0 0" : "999px",
                  borderBottomColor: isFocused && hasResults ? "transparent" : undefined,
                  fontSize: "0.875rem",
                  letterSpacing: "0.01em",
                }}
              />

              {search && (
                <button
                  onClick={() => { setSearch(""); setIsFocused(true); }}
                  className="absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-3xl text-gray-500 transition-all duration-300 hover:rotate-90 hover:text-white sm:pr-4"
                  style={{ fontSize: "1.1rem", lineHeight: 1 }}
                >
                  &times;
                </button>
              )}

              {/* ── DROPDOWN ── */}
              {isFocused && hasResults && (
                <div
                  className="absolute top-full left-0 z-10 max-h-[55vh] w-full overflow-y-auto rounded-b-2xl border border-orange-500/30 border-t-0 bg-[#0d0d0d]/95 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-[dropdown_0.18s_ease-out]"
                  style={{
                    background: "rgba(13,13,13,0.98)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(249,115,22,0.45)",
                    borderTop: "none",
                    borderRadius: "0 0 16px 16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 20px rgba(249,115,22,0.06)",
                  }}
                >
                  {/* Subtle orange inner glow at the top seam */}
                  <div style={{
                    height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.2), transparent)",
                    marginBottom: "6px",
                  }} />

                  {filteredHistory.map((h, i) => (
                    <div
                      key={`history-${h}`}
                      className="flex items-center justify-between group/item transition-colors suggestion-row"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <button
                        onClick={() => handleSelect(h)}
                        className="flex-1 text-left px-4 py-2.5 text-sm flex items-center gap-3 cursor-pointer transition-colors duration-150 group/item-btn"
                        style={{ color: "#9ca3af" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f97316")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
                      >
                        {/* Clock icon */}
                        <svg className="w-[13px] h-[13px] opacity-40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{h}</span>
                      </button>
                      <button
                        onClick={(e) => removeHistoryItem(e, h)}
                        className="mr-3 p-1.5 rounded-md transition-all duration-150 cursor-pointer flex-shrink-0"
                        style={{ color: "#4b5563" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.color = "#ef4444";
                          (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.color = "#4b5563";
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {filteredHistory.length > 0 && query && (filteredCategories.length > 0 || filteredPosters.length > 0) && (
                    <div style={{
                      height: "1px",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                      margin: "4px 16px",
                    }} />
                  )}

                  {filteredCategories.map((c, i) => (
                    <button
                      key={`cat-${c}`}
                      onClick={() => handleSelect(c)}
                      className="text-left w-full cursor-pointer transition-colors duration-150 flex items-center gap-3 suggestion-row"
                      style={{
                        padding: "10px 16px",
                        fontSize: "0.875rem",
                        color: "#9ca3af",
                        animationDelay: `${(filteredHistory.length + i) * 30}ms`,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = "#f97316";
                        (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.04)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {/* Tag icon */}
                      <svg className="w-[13px] h-[13px] opacity-40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="capitalize">
                        <strong style={{ color: "#f1f1f1", fontWeight: 600 }}>{c.substring(0, query.length)}</strong>
                        {c.substring(query.length)}
                      </span>
                    </button>
                  ))}

                  {filteredPosters.map((p, i) => (
                    <button
                      key={`poster-${p}`}
                      onClick={() => handleSelect(p)}
                      className="text-left w-full cursor-pointer transition-colors duration-150 flex items-center gap-3 suggestion-row"
                      style={{
                        padding: "10px 16px",
                        fontSize: "0.875rem",
                        color: "#9ca3af",
                        animationDelay: `${(filteredHistory.length + filteredCategories.length + i) * 30}ms`,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = "#f97316";
                        (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.04)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {/* Search icon */}
                      <svg className="w-[13px] h-[13px] opacity-40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>
                        <strong style={{ color: "#f1f1f1", fontWeight: 600 }}>{p.substring(0, query.length)}</strong>
                        {p.substring(query.length)}
                      </span>
                    </button>
                  ))}

                  <div style={{ height: "8px" }} />
                </div>
              )}
            </div>

            {/* ── CART ── */}
            <div className="order-2 ml-auto flex items-center gap-2 md:order-3 md:w-auto md:flex-shrink-0 md:gap-3">
              <div className="flex min-w-0 items-center gap-2 md:flex-none">
                {user ? (
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-gray-200 transition hover:border-orange-500/50 hover:bg-white/10 sm:px-3 sm:py-2 sm:text-sm"
                  >
                    <img
                      src={
                        user?.profilePic?.startsWith("data:image")
                          ? user.profilePic
                          : user?.profilePic // Google URL fallback
                      }
                      alt="Profile"
                      className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8"
                    />
                    <span className="hidden max-w-24 truncate md:inline">{user.name}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="inline-flex justify-center rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-gray-200 transition hover:border-white/25 hover:bg-white/5 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="inline-flex justify-center rounded-full bg-orange-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-orange-500 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={toggleCart}
                className="group relative flex-shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-gray-400 transition-all duration-200 hover:text-white"
                style={{ color: "#9ca3af", transition: "color 0.2s ease" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
              >
                {/* Subtle glow ring on hover */}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 bg-orange-500/10 blur-md"></span>

                <svg
                  className="w-[26px] h-[26px] transition-transform duration-300 group-hover:scale-110"
                  style={{ transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
                  onMouseEnter={e => ((e.currentTarget as SVGElement).style.transform = "scale(1.1)")}
                  onMouseLeave={e => ((e.currentTarget as SVGElement).style.transform = "scale(1)")}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>

                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="badge-animate absolute top-0 right-0 flex items-center justify-center"
                    style={{
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      lineHeight: 1,
                      color: "#fff",
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      borderRadius: "999px",
                      border: "2px solid #0e0e0e",
                      transform: "translate(25%, -25%)",
                      boxShadow: "0 2px 8px rgba(249,115,22,0.5)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {isAuthOpen && (
        <AuthModal
          onClose={() => {
            const stored = localStorage.getItem("user");
            setUser(stored ? (JSON.parse(stored) as NavUser) : null);
            setIsAuthOpen(false);
          }}
        />
      )}
    </>
  );
}
