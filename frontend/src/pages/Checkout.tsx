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
  id?: number;
  name?: string;
  email?: string;
  hostel?: string;
  phone?: string;
  profilePic?: string;
  roll?: string;
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
const PAYMENT_REQUEST_TIMEOUT_MS = 90000;
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

  const [user, setUser] = useState<StoredUser | null>(
    JSON.parse(localStorage.getItem("user") || "null") as StoredUser | null
  );

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editHostel, setEditHostel] = useState(user?.hostel || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [savingDetails, setSavingDetails] = useState(false);

  const saveDeliveryDetails = async () => {
    if (!editHostel.trim() || !editPhone.trim()) {
      toast.error("Hostel and phone are required");
      return;
    }
    if (!user?.id) {
      toast.error("User not found");
      return;
    }
    setSavingDetails(true);
    try {
      const res = await authFetchWithTimeout(
        `/api/users/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostel: editHostel.trim(),
            phone: editPhone.trim(),
            profilePic: user.profilePic,
          }),
        },
        "Saving details took too long. Please try again."
      );
      if (!res.ok) throw new Error("Failed to save details");
      const updated = await res.json();
      const updatedUser = {
        ...updated,
        profilePic: user.profilePic,
        roll: updated.roll?.toLowerCase?.() ?? updated.roll,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      toast.success("Delivery details updated!");
    } catch {
      toast.error("Failed to save details. Try again.");
    } finally {
      setSavingDetails(false);
    }
  };

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

    // try {
    //   await authFetchWithTimeout(
    //     "/api/mail",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         email: storedUser.email,
    //         name: storedUser.name,
    //         orderData,
    //       }),
    //     },
    //     "Sending order confirmation email took too long."
    //   );
    // } catch (mailError) {
    //   console.error("Failed to send confirmation email:", mailError);
    // }

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,95,31,0.15),transparent_60%)]" />
        <div className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
            <svg className="h-7 w-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Order Confirmed
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            You're all set.
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-gray-400">
            Your posters are on their way. Check your email and profile to track the delivery.
          </p>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("cart", JSON.stringify([]));
              navigate("/", { replace: true, state: { cart: [], openCart: false } });
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 active:scale-95"
          >
            Continue Shopping
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#060606] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,95,31,0.12),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
          <div className="w-full text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">Checkout</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Your cart is empty.
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-gray-500">
              Add some prints you love and come back to complete your order.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate("/", { state: { cart, openCart: true } })}
                className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 active:scale-95"
              >
                Browse Posters
              </button>
              <button
                type="button"
                onClick={() => navigate("/", { state: { cart, openCart: true } })}
                className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/20 hover:bg-white/[0.07]"
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
    <div className="relative min-h-screen overflow-hidden bg-[#060606] px-4 py-6 text-white sm:px-6 sm:py-10 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,95,31,0.1),transparent_50%)]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/", { state: { cart, openCart: true } })}
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure checkout
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="border-b border-white/[0.06] pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
                Final Step
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Review & Place Order
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Confirm your details below before locking in your order.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
                    Delivery Details
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">Where should we send it?</h2>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditHostel(user?.hostel || "");
                      setEditPhone(user?.phone || "");
                      setIsEditing(true);
                    }}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-gray-400 transition hover:border-orange-400/40 hover:text-white"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-600">Customer</p>
                  <p className="mt-2 text-base font-semibold text-white">{user?.name || "Guest User"}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{user?.email || "Sign in required"}</p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-600">Status</p>
                  <p className={`mt-2 text-base font-semibold ${profileComplete ? "text-emerald-400" : "text-amber-400"}`}>
                    {profileComplete ? "Ready for delivery" : "Profile incomplete"}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {profileComplete
                      ? "Hostel and phone confirmed."
                      : "Add hostel and phone to continue."}
                  </p>
                </div>

                {isEditing ? (
                  <>
                    <div className="rounded-xl border border-orange-500/30 bg-black/30 p-4 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-[0.22em] text-gray-600">
                        Hostel & Room
                      </label>
                      <input
                        type="text"
                        value={editHostel}
                        onChange={(e) => setEditHostel(e.target.value)}
                        placeholder="e.g. Alakananda, Room 204"
                        className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-orange-500/50"
                      />
                    </div>

                    <div className="rounded-xl border border-orange-500/30 bg-black/30 p-4 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-[0.22em] text-gray-600">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-orange-500/50"
                      />
                    </div>

                    <div className="flex gap-3 md:col-span-2">
                      <button
                        type="button"
                        onClick={saveDeliveryDetails}
                        disabled={savingDetails}
                        className="flex-1 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
                      >
                        {savingDetails ? "Saving..." : "Save Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-400 transition hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 md:col-span-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-600">Hostel & Room</p>
                      <p className="mt-2 text-base font-medium text-white">
                        {user?.hostel || "No hostel details saved yet"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 md:col-span-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-600">Phone Number</p>
                      <p className="mt-2 text-base font-medium text-white">
                        {user?.phone || "No phone number saved yet"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
                Payment Method
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">How do you want to pay?</h2>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    paymentMethod === "COD"
                      ? "border-orange-500/40 bg-orange-500/[0.08]"
                      : "border-white/[0.06] bg-black/20 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Cash on Delivery</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Pay when you collect your order on campus.
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "COD"
                          ? "border-orange-400 bg-orange-500/20"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {paymentMethod === "COD" && <span className="h-2 w-2 rounded-full bg-orange-400" />}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    paymentMethod === "UPI"
                      ? "border-orange-500/40 bg-orange-500/[0.08]"
                      : "border-white/[0.06] bg-black/20 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Online Payment (UPI)</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Pay securely with Razorpay — instant confirmation.
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === "UPI"
                          ? "border-orange-400 bg-orange-500/20"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {paymentMethod === "UPI" && <span className="h-2 w-2 rounded-full bg-orange-400" />}
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <p className="text-xs font-semibold text-white">Packed with care</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Safe from checkout to collection.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <p className="text-xs font-semibold text-white">Fast campus flow</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Hostel details keep handoff easy.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <p className="text-xs font-semibold text-white">Order confidence</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Review everything before you confirm.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              <div className="border-b border-white/[0.06] px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
                  Order Summary
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">Your wall haul</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {itemCount} item{itemCount > 1 ? "s" : ""} ready for checkout.
                </p>
              </div>

              <div className="space-y-3 px-6 py-5">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3"
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-20 w-14 rounded-lg object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                          ×{item.quantity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-orange-400/70">
                        {item.cat || "Poster"}
                      </p>
                      <div className="mt-3 flex items-end justify-between">
                        <p className="text-xs text-gray-600">{formatPrice(item.price)} each</p>
                        <p className="text-sm font-bold text-orange-300">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.06] px-6 py-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Delivery</span>
                    <span className="text-emerald-400">Free</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Payment</span>
                    <span>{paymentMethod === "COD" ? "Cash on Delivery" : "UPI"}</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Total</span>
                      <span className="text-2xl font-black text-white">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={placeOrder}
                  className="mt-5 group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-orange-600 px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition duration-500 group-hover:translate-x-[100%] group-hover:opacity-100" />
                  <span className="relative z-10">
                    {loading
                      ? paymentMethod === "UPI"
                        ? "Processing payment..."
                        : "Placing Order..."
                      : paymentMethod === "UPI"
                      ? "Pay with Razorpay"
                      : "Confirm Order"}
                  </span>
                  {!loading && <span className="relative z-10">→</span>}
                </button>

                <p className="mt-3 text-center text-xs text-gray-600">
                  By confirming, you're reserving these posters for campus delivery.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}