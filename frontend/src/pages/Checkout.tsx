import { useLayoutEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { authFetch, isJwtExpired, clearUserAuth } from "../lib/api";

interface CheckoutItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  img: string;
  cat?: string;
}

interface CheckoutState {
  cart?: CheckoutItem[];
  total?: number;
}

interface StoredUser {
  name?: string;
  email?: string;
  hostel?: string;
  phone?: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency?: string;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    description?: string;
    reason?: string;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const currencyFormatter = new Intl.NumberFormat("en-IN");
const PAYMENT_REQUEST_TIMEOUT_MS = 30000;
const RAZORPAY_OPEN_TOAST_ID = "razorpay-open";
const RAZORPAY_CONFIRM_TOAST_ID = "razorpay-confirm";

const formatPrice = (amount: number) => `Rs. ${currencyFormatter.format(amount)}`;

const getEnvString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

const hasRazorpayPaymentDetails = (response: RazorpaySuccessResponse) =>
  Boolean(response.razorpay_payment_id && response.razorpay_order_id && response.razorpay_signature);

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as CheckoutState | null) ?? null;

  const [cart, setCart] = useState<CheckoutItem[]>(state?.cart ?? []);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");

  const RAZORPAY_KEY_ID =
    getEnvString(import.meta.env.VITE_RAZORPAY_KEY_ID) ||
    getEnvString(import.meta.env.VITE_RAZORPAY_KEY);
  const user = JSON.parse(localStorage.getItem("user") || "null") as StoredUser | null;

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const total = Number(state?.total ?? subtotal);
  const profileComplete = Boolean(user?.hostel && user?.phone);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const authFetchWithTimeout = async (
    path: string,
    init: RequestInit,
    timeoutMessage: string
  ) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PAYMENT_REQUEST_TIMEOUT_MS);

    try {
      return await authFetch(path, { ...init, signal: controller.signal }, "user");
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(timeoutMessage);
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const submitOrder = async (paymentDetails?: RazorpaySuccessResponse) => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const orderData = {
      address: storedUser.hostel,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "UPI" ? "PAID" : "PENDING",
      razorpayOrderId: paymentDetails?.razorpay_order_id,
      razorpayPaymentId: paymentDetails?.razorpay_payment_id,
      razorpaySignature: paymentDetails?.razorpay_signature,
      items: cart.map((item) => ({
        posterId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.img,
      })),
    };

    const res = await authFetchWithTimeout(
      "/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      },
      paymentDetails
        ? "Payment verified, but saving the order took too long. Check your profile before retrying."
        : "Saving the order took too long. Please try again."
    );

    if (!res.ok) {
      throw new Error("Failed to place order");
    }

    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
    setSuccess(true);
  };

  const verifyPayment = async (response: RazorpaySuccessResponse) => {
    const res = await authFetchWithTimeout(
      "/api/payment/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(response),
      },
      "Razorpay payment succeeded, but verification took too long. Please check your profile before retrying."
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || "Payment verification failed");
    }

    await submitOrder(response);
  };

  const handleRazorpay = async () => {
    if (!RAZORPAY_KEY_ID) {
      toast.error("Razorpay key is missing. Set VITE_RAZORPAY_KEY_ID in the frontend environment and redeploy.");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay checkout could not be loaded. Please refresh and try again.");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!storedUser?.hostel || !storedUser?.phone) {
      toast.error("Complete your profile first");
      navigate("/profile");
      return;
    }

    if (!storedUser || !token) {
      toast.error("Login required");
      return;
    }

    if (isJwtExpired(token)) {
      clearUserAuth();
      return;
    }

    try {
      setLoading(true);
      toast.loading("Opening Razorpay...", { id: RAZORPAY_OPEN_TOAST_ID });

      const res = await authFetchWithTimeout(
        `/api/payment/create-order?amount=${encodeURIComponent(total)}`,
        { method: "POST" },
        "Creating the Razorpay order took too long. Please try again."
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "Failed to create Razorpay order");
      }

      const data = (await res.json()) as RazorpayOrderResponse;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "InkNWall",
        description: "Poster Purchase",
        order_id: data.id,
        handler: async function (response: RazorpaySuccessResponse) {
          setLoading(true);

          try {
            if (!hasRazorpayPaymentDetails(response)) {
              throw new Error("Razorpay did not return complete payment details.");
            }

            console.info("Razorpay payment success received", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
            });

            toast.loading("Confirming payment...", { id: RAZORPAY_CONFIRM_TOAST_ID });
            await verifyPayment(response);
            toast.success("Payment successful", { id: RAZORPAY_CONFIRM_TOAST_ID });
          } catch (error) {
            toast.error((error as Error).message || "Payment verification failed", {
              id: RAZORPAY_CONFIRM_TOAST_ID,
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: storedUser.name,
          email: storedUser.email,
          contact: storedUser.phone,
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setLoading(false);
        toast.dismiss(RAZORPAY_OPEN_TOAST_ID);
        toast.error(response.error?.description || response.error?.reason || "Payment failed");
      });
      rzp.open();
      toast.dismiss(RAZORPAY_OPEN_TOAST_ID);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.dismiss(RAZORPAY_OPEN_TOAST_ID);
      toast.error((error as Error).message || "Payment failed");
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (loading) return;
    if (paymentMethod === "UPI") {
      await handleRazorpay();
      return;
    }

    try {
      setLoading(true);
      await submitOrder();
      toast.success("Order placed successfully");
    } catch {
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#060606] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,95,31,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="absolute left-10 top-16 h-52 w-52 rounded-full bg-orange-500/[0.14] blur-3xl" />
        <div className="absolute bottom-12 right-10 h-60 w-60 rounded-full bg-white/[0.06] blur-3xl" />

        <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
            Order Confirmed
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Order Placed
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-300 sm:text-base">
            Your posters will be delivered soon. Check out your Mail and Profile to track your Order.
          </p>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("cart", JSON.stringify([]));
              navigate("/", { replace: true, state: { cart: [], openCart: false } });
            }}
            className="mt-8 w-full rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-500 active:scale-95 sm:w-auto"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#060606] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,95,31,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.07),transparent_30%)]" />
        <div className="absolute left-10 top-16 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-12 right-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
              Checkout
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Your cart is waiting for its first poster.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
              Add a few prints you love, then come back here for the final glow-up before placing your order.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate("/", { state: { cart, openCart: true } })}
                className="rounded-2xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-500"
              >
                Browse Posters
              </button>
              <button
                type="button"
                onClick={() => navigate("/", { state: { cart, openCart: true } })}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 font-semibold text-gray-200 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060606] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,95,31,0.14),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,95,31,0.1),transparent_28%)]" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-orange-500/[0.12] blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-white/[0.06] blur-[140px]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-300/[0.08] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/", { state: { cart, openCart: true } })}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300 transition hover:border-orange-400/40 hover:bg-white/[0.08] hover:text-white"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to cart</span>
          </button>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
            Secure campus checkout
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-6">
            <div
              className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-8"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(255,95,31,0.12), rgba(255,255,255,0.03) 55%, rgba(255,95,31,0.05))",
              }}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
                    Final Step
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.8rem]">
                    Give your order the finish it deserves.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-gray-200 sm:text-base">
                    Clean details, campus-friendly delivery, and a polished summary before your posters start their trip to the wall.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[340px]">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Items</p>
                    <p className="mt-2 text-2xl font-black text-white">{itemCount}</p>
                    <p className="mt-1 text-xs text-gray-400">Ready to print</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Payment</p>
                    <p className="mt-2 text-lg font-bold text-white">Cash on Delivery</p>
                    <p className="mt-1 text-xs text-gray-400">Pay when collected</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Drop</p>
                    <p className="mt-2 text-lg font-bold text-white">Campus delivery</p>
                    <p className="mt-1 text-xs text-gray-400">No extra delivery fee</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                    Delivery Details
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Where should we send it?</h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/40 hover:bg-white/[0.07]"
                >
                  Edit profile
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Customer</p>
                  <p className="mt-3 text-lg font-semibold text-white">{user?.name || "Guest User"}</p>
                  <p className="mt-1 text-sm text-gray-400">{user?.email || "Sign in required"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Status</p>
                  <p className={`mt-3 text-lg font-semibold ${profileComplete ? "text-emerald-300" : "text-amber-300"}`}>
                    {profileComplete ? "Ready for delivery" : "Profile needs one more step"}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {profileComplete
                      ? "Your hostel and phone are available for handoff."
                      : "Add your hostel and phone before placing the order."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Hostel and room</p>
                  <p className="mt-3 text-base font-medium text-white">
                    {user?.hostel || "No hostel details saved yet"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Phone number</p>
                  <p className="mt-3 text-base font-medium text-white">
                    {user?.phone || "No phone number saved yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                Payment Method
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Choose how you want to pay</h2>

              <div className="mt-6 grid gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`group rounded-[24px] border p-5 text-left transition-all duration-300 ${
                    paymentMethod === "COD"
                      ? "border-orange-400/60 bg-orange-500/10 shadow-[0_0_0_1px_rgba(255,95,31,0.35)]"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">Cash on Delivery</p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        The easiest option for campus pickup. Place the order now and pay when you collect it.
                      </p>
                    </div>

                    <div
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "COD"
                          ? "border-orange-300 bg-orange-500/20 text-orange-200"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`group rounded-[24px] border p-5 text-left transition-all duration-300 ${
                    paymentMethod === "UPI"
                      ? "border-orange-400/60 bg-orange-500/10 shadow-[0_0_0_1px_rgba(255,95,31,0.35)]"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">Online Payment (UPI)</p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        Pay securely with Razorpay and complete your order immediately.
                      </p>
                    </div>

                    <div
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "UPI"
                          ? "border-orange-300 bg-orange-500/20 text-orange-200"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Packed with care</p>
                  <p className="mt-2 text-xs leading-6 text-gray-400">
                    Posters stay safe from checkout to collection.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Fast campus flow</p>
                  <p className="mt-2 text-xs leading-6 text-gray-400">
                    Your saved hostel details keep the handoff easy.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Order confidence</p>
                  <p className="mt-2 text-xs leading-6 text-gray-400">
                    Review everything once before you lock it in.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
              <div
                className="border-b border-white/10 px-6 py-6 sm:px-8"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,95,31,0.12) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                  Order Summary
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Your wall haul</h2>
                <p className="mt-2 text-sm text-gray-300">
                  {itemCount} item{itemCount > 1 ? "s" : ""} lined up for checkout.
                </p>
              </div>

              <div className="space-y-4 px-6 py-6 sm:px-8">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-[24px] border border-white/10 bg-black/20 p-4 transition-all duration-300 hover:border-orange-400/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="h-24 w-[4.5rem] rounded-2xl object-cover shadow-lg shadow-black/30"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-white">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-orange-200/70">
                              {item.cat || "Poster"}
                            </p>
                          </div>

                          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-gray-200">
                            x{item.quantity}
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Unit price</p>
                            <p className="mt-1 text-sm text-gray-300">{formatPrice(item.price)}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Line total</p>
                            <p className="mt-1 text-lg font-bold text-orange-300">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 px-6 py-6 sm:px-8">
                <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Delivery</span>
                    <span className="text-emerald-300">Free</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Payment mode</span>
                    <span>{paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (UPI)"}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-white">Total</span>
                      <span className="text-2xl font-black text-white">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={placeOrder}
                  className="mt-5 group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] bg-orange-600 px-6 py-4 text-base font-bold text-white shadow-[0_20px_50px_rgba(255,95,31,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition duration-700 group-hover:translate-x-[100%] group-hover:opacity-100" />
                  <span className="relative z-10">
                    {loading
                      ? paymentMethod === "UPI"
                        ? "Processing payment..."
                        : "Placing Order..."
                      : paymentMethod === "UPI"
                      ? "Pay with Razorpay"
                      : "Confirm Order"}
                  </span>
                  {!loading && <span className="relative z-10 text-lg">&rarr;</span>}
                </button>

                <p className="mt-4 text-center text-xs leading-6 text-gray-400">
                  By confirming, you are reserving these posters for campus delivery using the saved profile details above.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
