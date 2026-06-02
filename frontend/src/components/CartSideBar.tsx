import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CartItem } from "../App";
import AuthModal from "./AuthModal";

interface Props {
  cart: CartItem[];
  isOpen: boolean;
  toggleCart: () => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

interface StoredUser {
  id: number | string;
  roll?: string;
  hostel?: string;
  phone?: string;
  [key: string]: unknown;
}

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

const getIsDesktopViewport = () =>
  typeof window !== "undefined" ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false;

export default function CartSidebar({
  cart,
  isOpen,
  toggleCart,
  setCart,
}: Props) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  // Responsive breakpoint tracking
  const [isDesktop, setIsDesktop] = useState(getIsDesktopViewport);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  // Drag-to-dismiss (mobile bottom sheet)
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const DISMISS_THRESHOLD = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if ((scrollRef.current?.scrollTop ?? 0) > 0) {
      setIsDragging(false);
      setDragY(0);
      return;
    }
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return;
    setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (dragY > DISMISS_THRESHOLD) toggleCart();
    setDragY(0);
    setIsDragging(false);
  };

  // Compute the sheet transform
  const getSheetTransform = () => {
    if (isDragging && dragY > 0) return `translateY(${dragY}px)`;
    if (isOpen) return "translate(0, 0)";
    return isDesktop ? "translateX(calc(100% + 20px))" : "translateY(110%)";
  };

  const getSheetOpacity = () => {
    if (isDragging && dragY > 0) return Math.max(0.35, 1 - dragY / 280);
    return isOpen ? 1 : 0;
  };

  const sheetTransition = isDragging
    ? "opacity 0.08s linear"
    : "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)";

  const increase = (id: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrease = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCheckout = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null") as StoredUser | null;
    const user = storedUser
      ? { ...storedUser, roll: storedUser.roll?.toLowerCase?.() ?? storedUser.roll }
      : null;

    if (!user) {
      setShowAuth(true);
      return;
    }

    navigate("/checkout", { state: { cart, total } });
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={toggleCart}
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: isOpen ? "blur(12px)" : "blur(0px)",
          WebkitBackdropFilter: isOpen ? "blur(12px)" : "blur(0px)",
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? "visible" : "hidden",
          transition: "opacity 380ms cubic-bezier(0.22,1,0.36,1), backdrop-filter 380ms ease, visibility 380ms",
        }}
      />

      {/* Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="fixed inset-x-0 bottom-0 z-[60] flex h-[82dvh] flex-col overflow-hidden rounded-t-[28px] border border-white/12 will-change-transform md:inset-x-auto md:top-4 md:right-4 md:bottom-4 md:h-auto md:w-[450px] md:rounded-[32px]"
        style={{
          backgroundColor: "rgba(8, 8, 8, 0.82)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          boxShadow: isDesktop
            ? "0 30px 90px rgba(0,0,0,0.6), -12px 0 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          transform: getSheetTransform(),
          opacity: getSheetOpacity(),
          transition: sheetTransition,
        }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-20 h-40 w-40 rounded-full bg-orange-500/14 blur-3xl" />
          <div className="absolute -right-8 top-1/3 h-44 w-44 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-orange-300/10 blur-3xl" />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:120px_120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.01)_22%,rgba(255,255,255,0)_100%)]" />
        </div>

        {/* Drag handle — mobile only */}
        <div className="relative z-10 flex cursor-grab flex-col items-center gap-1 pt-2.5 pb-1 md:hidden active:cursor-grabbing">
          <span
            className="rounded-full transition-all duration-200"
            style={{
              height: "6px",
              width: isDragging ? "80px" : "56px",
              backgroundColor: isDragging ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
            }}
          />
          {dragY > DISMISS_THRESHOLD && (
            <span className="text-[9px] font-semibold uppercase tracking-widest text-orange-300/70">
              release to close
            </span>
          )}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-300/80">
              Curated Bag
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Your Cart
            </h2>
          </div>

          <button
            type="button"
            onClick={toggleCart}
            aria-label="Close cart"
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-2xl text-gray-500 transition-all duration-300 hover:rotate-90 hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:px-3 sm:py-1 sm:text-3xl"
          >
            &times;
          </button>
        </div>

        {/* Cart items */}
        <div ref={scrollRef} className="custom-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-8 text-gray-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:rounded-[28px] sm:px-6 sm:py-10">
              <span className="animate-pulse text-5xl text-orange-200/85">Art</span>
              <p className="mt-4 text-center italic text-gray-300/90">
                Your walls are crying. Add something.
              </p>
              <p className="mt-2 max-w-xs text-center text-sm leading-6 text-gray-400">
                Posters you pick will show up here in a soft glass tray ready for checkout.
              </p>
              <button
                type="button"
                onClick={toggleCart}
                className="mt-6 rounded-xl border border-white/12 bg-white/[0.05] px-6 py-2.5 text-sm text-white transition-all hover:scale-105 hover:border-orange-400/35 hover:bg-white/[0.08]"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl transition-all duration-300 hover:border-orange-500/35 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_rgba(0,0,0,0.3),0_0_24px_rgba(255,95,31,0.08)] sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-3.5"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

                <div className="relative flex items-center gap-3 sm:gap-4">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-16 w-14 rounded-xl border border-white/12 object-cover shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition-transform duration-300 group-hover:scale-105"
                  />
                  <div>
                    <p className="max-w-[180px] truncate text-sm font-bold text-white sm:max-w-[120px]" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs capitalize text-gray-400">{item.cat}</p>
                    <div className="mt-1">
                      <span className="text-sm font-bold text-orange-400">
                        {"₹"}{item.price * item.quantity}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({item.quantity} {"×"} {"₹"}{item.price})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center gap-2 self-end rounded-xl border border-white/10 bg-black/20 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:self-auto">
                  <button
                    type="button"
                    onClick={() => decrease(item.id)}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                  >-</button>
                  <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => increase(item.id)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="relative z-10 border-t border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-2xl sm:px-6 sm:py-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Cart Total</p>
                <p className="mt-1 text-lg font-bold text-white">{"₹"}{total}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              aria-label="Proceed to secure checkout"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-orange-400/30 bg-[linear-gradient(135deg,rgba(249,115,22,0.95),rgba(234,88,12,0.92))] py-4 font-bold text-white shadow-[0_18px_38px_rgba(124,45,18,0.34)] transition-all duration-300 hover:border-orange-300/45 hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] active:scale-[0.97]"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition duration-700 group-hover:translate-x-[100%] group-hover:opacity-100" />
              <span className="relative z-10">Place Order</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 transition-transform group-hover:translate-x-1">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
