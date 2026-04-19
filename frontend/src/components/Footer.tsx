import logo from "../assets/logo.png";
import { Mail, Phone } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

export default function Footer() {

  // 🔥 Magnetic effect
  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const reset = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "translate(0,0)";
  };

  return (
    <footer className="relative mt-8 overflow-hidden border-t border-white/5 bg-[#080808] px-4 py-8 sm:py-10 md:px-8">

      {/* TOP GLOW */}
      <div className="absolute top-0 left-1/2 h-[1px] w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row md:items-start md:gap-8">

        {/* LEFT */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="group mb-3 flex cursor-pointer items-center gap-2.5">
            <img
              src={logo}
              alt="InkNWall Logo"
              className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105 md:h-10 md:w-10"
            />
            <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
              InkN<span className="text-orange-500">Wall</span>
            </h2>
          </div>

          <p className="text-[10px] font-medium uppercase tracking-normal text-gray-400 md:text-xs">
            Premium Aesthetics for IITM Students.
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-center gap-4 text-xs md:items-end md:text-sm">

          <p className="text-gray-400">
            Questions? Feedback?{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text font-bold italic text-transparent">
              Hit us up.
            </span>
          </p>

          {/* 🔥 ICON ROW (ORIGINAL POSITION KEPT) */}
          <div className="flex flex-row items-center gap-3 md:gap-4">

            {/* EMAIL */}
            <a
              href="mailto:InkNwall@gmail.com"
              onMouseMove={handleMove}
              onMouseLeave={reset}
              className="group relative flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 transition-all duration-300 hover:border-blue-400/60"
            >
              {/* animated glow */}
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-blue-400/20 to-blue-600/20 blur-md"></span>

              <Mail
                size={18}
                className="relative z-10 text-gray-400 transition-all duration-300 group-hover:text-blue-400 group-hover:-translate-y-1 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(96,165,250,0.9)]"
              />
            </a>

            {/* INSTAGRAM */}
            <a
              href="https://www.instagram.com/inknwall/"
              target="_blank"
              rel="noreferrer"
              onMouseMove={handleMove}
              onMouseLeave={reset}
              className="group relative flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 transition-all duration-300 hover:border-pink-500/60"
            >
              {/* animated gradient glow */}
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-400/20 blur-md"></span>

              <FaInstagram
                size={18}
                className="relative z-10 text-gray-400 transition-all duration-300 group-hover:text-pink-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(236,72,153,0.9)]"
              />
            </a>

            {/* PHONE */}
            <a
              href="tel:+919030300170"
              onMouseMove={handleMove}
              onMouseLeave={reset}
              className="group relative flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 transition-all duration-300 hover:border-green-400/60"
            >
              {/* glow */}
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-green-400/20 to-emerald-500/20 blur-md"></span>

              <Phone
                size={18}
                className="relative z-10 text-gray-400 transition-all duration-300 group-hover:text-green-400 group-hover:-translate-y-1 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(74,222,128,0.9)]"
              />
            </a>

          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/5 pt-5 text-[10px] font-semibold uppercase tracking-normal text-gray-600 md:flex-row">
        
        <p>© {new Date().getFullYear()} InkNwall. All rights reserved.</p>

        <p className="cursor-pointer transition-colors hover:text-gray-400">
          Designed at IITM
        </p>
      </div>
    </footer>
  );
}
