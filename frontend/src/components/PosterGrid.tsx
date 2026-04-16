import { Eye, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Poster } from "../data/posters";
import type { CartItem } from "../App";

interface Props {
  shopRef?: React.RefObject<HTMLElement | null>;
  posters: Poster[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (id: number) => void;
  openModal: (img: string) => void;
}

export default function PosterGrid({
  shopRef,
  posters,
  cart,
  setCart,
  addToCart,
  openModal,
}: Props) {
  const increase = (id: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  const decrease = (id: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  if (posters.length === 0) {
    return (
      <section
        id="shop"
        ref={shopRef}
        className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/82 px-4 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:rounded-[32px] sm:px-6 sm:py-14"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-3xl text-orange-300 shadow-[0_0_30px_rgba(255,95,31,0.12)]">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-white">No posters found</h2>
          <p className="mt-3 text-sm leading-7 text-gray-400 sm:text-base">
            Nothing matched the current search or category. Try another vibe and the gallery will update instantly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="shop"
      ref={shopRef}
      className="space-y-4 rounded-[26px] border border-white/10 bg-[#0b0b0b]/82 px-3 py-4 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:space-y-6 sm:rounded-[32px] sm:px-5 sm:py-6 lg:px-6 lg:py-8"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200">Poster library</p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-white sm:text-2xl">Find the print that changes the whole room</h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-gray-400 sm:text-sm">
            Preview the artwork, filter by category, and add pieces to your cart without breaking the browsing flow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-300 sm:gap-3 sm:text-xs sm:tracking-[0.2em]">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">{posters.length} posters showing</span>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 sm:inline-flex">Tap artwork to preview</span>
        </div>
      </div>

      <div className="grid max-[360px]:grid-cols-1 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {posters.map((p, index) => {
          console.log("POSTER:", p);
          const cartItem = cart.find((c) => c.id === p.id);
          const qtyInCart = cartItem?.quantity || 0;

          return (
            <div
              key={p.id}
              className="group relative flex h-full flex-col overflow-visible rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-2 shadow-[0_16px_50px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-1 hover:border-orange-400/35 hover:shadow-[0_24px_70px_rgba(255,95,31,0.14)] animate-in fade-in zoom-in-95 slide-in-from-bottom-8 sm:rounded-[24px] sm:p-2.5"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "both",
              }}
            >
              {p.isPremium && (
                <>
                  {/* Triangle INSIDE */}
                  <div className="absolute top-0 right-0 w-14 h-14 
                    bg-gradient-to-tr from-yellow-400 to-yellow-600 
                    z-30"
                    style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                  />

                  {/* Text */}
                  <span className="absolute top-[6px] right-[2px] text-[9px] font-bold 
                     text-black rotate-45 z-40">
                    PREMIUM
                  </span>
                </>
              )}

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,95,31,0.18),transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <button
                type="button"
                className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-[16px] border border-white/10 bg-[#050505] text-left sm:mb-4 sm:rounded-[18px]"
                onClick={() => openModal(p.img)}
              >
                {qtyInCart > 0 && (
                  <div className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#111] bg-orange-600 text-[9px] font-black text-white shadow-[0_0_22px_rgba(234,88,12,0.65)] sm:right-2.5 sm:top-2.5 sm:h-7 sm:w-7 sm:text-[10px]">
                    {qtyInCart}
                  </div>
                )}

                <div className="absolute left-2 top-2 z-20 rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-xl sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:text-[9px] sm:tracking-[0.2em]">
                  {p.cat}
                </div>

                <img
                  src={p.img}
                  alt={p.name}
                  className="h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:brightness-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent opacity-90 transition duration-500 group-hover:opacity-65" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5 sm:p-3">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-orange-200 sm:text-[9px] sm:tracking-[0.24em]">Preview</p>
                    <p className="mt-1 hidden text-xs font-semibold text-white/90 sm:block sm:text-sm">Open artwork view</p>
                  </div>

                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-xl transition-transform duration-300 group-hover:scale-105 sm:h-9 sm:w-9">
                    <Eye className="h-4 w-4" />
                  </span>
                </div>
              </button>

              <div className="relative flex flex-grow flex-col justify-between gap-2 px-0.5 pb-0.5 sm:gap-3 sm:px-1 sm:pb-1">
                <div>
                  <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-black uppercase tracking-tight text-gray-100 sm:text-base">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-gray-500 sm:text-[11px] sm:tracking-[0.18em]">
                    Curated wall print
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-2 border-t border-white/10 pt-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:pt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Price</p>
                    <span className="mt-1 block text-base font-black tracking-tight text-white sm:text-xl">
                      Rs. {p.price}
                    </span>
                  </div>

                  {qtyInCart > 0 ? (
                    <div className="flex items-center gap-1 self-start rounded-2xl border border-white/10 bg-[#1A1A1A]/90 p-1 shadow-inner backdrop-blur-xl sm:self-auto">
                      <button
                        onClick={() => decrease(p.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-orange-600 hover:text-white active:scale-90 sm:h-8 sm:w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <span className="w-5 text-center text-sm font-bold text-white sm:w-6">
                        {qtyInCart}
                      </span>

                      <button
                        onClick={() => increase(p.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-orange-600 hover:text-white active:scale-90 sm:h-8 sm:w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p.id)}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-300 transition-all duration-300 hover:border-orange-500 hover:bg-orange-600 hover:text-white active:scale-95 sm:w-auto sm:px-4 sm:text-[10px] sm:tracking-[0.18em]"
                    >
                      <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition duration-700 group-hover:translate-x-[100%] group-hover:opacity-100" />
                      <ShoppingBag className="relative z-10 h-4 w-4" />
                      <span className="relative z-10 sm:hidden">Add</span>
                      <span className="relative z-10 hidden sm:inline">Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
