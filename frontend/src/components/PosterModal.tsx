import { useEffect, useState } from "react";

export default function PosterModal({
  img,
  close,
}: {
  img: string;
  close: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const timer = setTimeout(() => setShow(true), 10);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(close, 300);
  };

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 transition-all duration-300 ease-out cursor-pointer ${
        show ? "opacity-100 backdrop-blur-xl" : "opacity-0 backdrop-blur-none"
      }`}
    >

      {/* 🔥 DARK BACKDROP */}
      <div className="absolute inset-0 bg-black/80"></div>

      {/* 🔥 AMBIENT GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full"></div>

      {/* 🖼️ IMAGE CONTAINER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-[min(95vw,780px)] max-h-[90vh] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          show ? "scale-100 translate-y-0" : "scale-90 translate-y-10"
        }`}
      >

        {/* Glow frame */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-orange-500/20 to-orange-900/30 blur-xl opacity-70"></div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b]/90 shadow-[0_30px_80px_rgba(0,0,0,0.9)]">
          <div className="aspect-[3/4] w-full bg-black/90 sm:aspect-[4/5] md:aspect-[3/4] lg:aspect-[11/14]">
            <img
              src={img}
              alt="Enlarged Poster view"
              className="h-full w-full object-contain" 
            />
          </div>
        </div>
      </div>

      {/* ✨ CLOSE BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={`absolute top-6 right-6 cursor-pointer text-3xl text-gray-500 transition-all duration-300 hover:rotate-90 hover:text-white md:top-10 md:right-10 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        &times;
      </button>

      {/* ✨ HINT TEXT */}
      <div
        className={`absolute bottom-6 md:bottom-10 text-white/30 text-xs tracking-[0.2em] uppercase transition-all duration-700 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        Tap outside to close
      </div>
    </div>
  );
}
