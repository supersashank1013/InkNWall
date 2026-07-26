import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authFetch, isJwtExpired, clearUserAuth } from "../lib/api";
import ProtectedPosterImage from "../components/ProtectedPosterImage";

type OrderStatus = "PENDING" | "RECEIVED" | "COLLECTED";
type OrderFilter = "PLACED" | "COLLECTED";

const PROFILE_ORDERS_PER_PAGE = 5;

interface Order {
  id: number;
  createdAt: string;
  status: OrderStatus;
  address: string;
  total: number;
  items?: OrderItem[];
}

interface OrderItem {
  posterId?: number;
  name?: string;
  quantity: number;
  price: number;
  image?: string;
  poster?: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface StoredUser {
  id: number;
  name: string;
  email: string;
  roll: string;
  hostel?: string;
  phone?: string;
  profilePic?: string;
}

const PROFILE_ORDER_FILTERS = [
  { key: "PLACED" as const, label: "Placed Orders" },
  { key: "COLLECTED" as const, label: "Orders Collected" },
];

const normalizeOrderStatus = (status?: string): OrderStatus =>
  status === "RECEIVED" ? "RECEIVED" : status === "COLLECTED" ? "COLLECTED" : "PENDING";

const normalizeOrder = (order: Partial<Order> & { id: number }): Order => ({
  id: order.id,
  createdAt: order.createdAt || "",
  status: normalizeOrderStatus(order.status),
  address: order.address || "-",
  total: Number(order.total || 0),
  items: Array.isArray(order.items) ? order.items : [],
});

const getOrderFilter = (status: OrderStatus): OrderFilter =>
  status === "COLLECTED" ? "COLLECTED" : "PLACED";

const getOrderTimestamp = (date?: string) => {
  if (!date) return 0;

  const normalizedDate = date.length > 23 ? date.slice(0, 23) : date;
  const timestamp = new Date(normalizedDate).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatOrderDate = (date?: string) => {
  const timestamp = getOrderTimestamp(date);
  if (!timestamp || !date) return "Date unavailable";

  const normalizedDate = date.length > 23 ? date.slice(0, 23) : date;
  return new Date(normalizedDate).toLocaleString();
};



export default function Profile() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hostel, setHostel] = useState("");
  const [phone, setPhone] = useState("");
  const [preview, setPreview] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeOrderFilter, setActiveOrderFilter] = useState<OrderFilter>("PLACED");
  const [orderPages, setOrderPages] = useState<Record<OrderFilter, number>>({
    PLACED: 1,
    COLLECTED: 1,
  });
  const navigate = useNavigate();
  const isPhoneLocked = Boolean(user?.phone);

  const filteredOrders = orders.filter((order) => getOrderFilter(order.status) === activeOrderFilter);
  const activePage = orderPages[activeOrderFilter];
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PROFILE_ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (activePage - 1) * PROFILE_ORDERS_PER_PAGE,
    activePage * PROFILE_ORDERS_PER_PAGE
  );
  const orderCounts = orders.reduce<Record<OrderFilter, number>>(
    (acc, order) => {
      acc[getOrderFilter(order.status)] += 1;
      return acc;
    },
    { PLACED: 0, COLLECTED: 0 }
  );

  const getRevealStyle = (delay: number) => ({
    animationDelay: `${delay}ms`,
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null") as StoredUser | null;
    if (!stored) return;

    const normalizedUser = {
      ...stored,
      roll: stored.roll?.toLowerCase?.() ?? stored.roll,
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setHostel(normalizedUser.hostel || "");
    setPhone(normalizedUser.phone || "");
    setPreview(normalizedUser.profilePic || "");

    const token = localStorage.getItem("token");
    if (!token || isJwtExpired(token)) {
      clearUserAuth();
      return;
    }

    let cancelled = false;

    const fetchOrders = () => {
      authFetch("/api/orders/my", {}, "user")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch orders");
          }

          return res.json();
        })
        .then((data) => {
          if (cancelled) return;

          const normalizedOrders = Array.isArray(data)
            ? data
              .map((order) => normalizeOrder(order as Partial<Order> & { id: number }))
              .sort((a, b) => getOrderTimestamp(b.createdAt) - getOrderTimestamp(a.createdAt))
            : [];

          setOrders(normalizedOrders);
        })
        .catch(() => {
          if (!cancelled) {
            setOrders([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setOrdersLoading(false);
          }
        });
    };

    fetchOrders();
    const intervalId = window.setInterval(fetchOrders, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setOrderPages((prev) => {
      const next = { ...prev };
      let changed = false;

      (["PLACED", "COLLECTED"] as OrderFilter[]).forEach((filter) => {
        const count = orders.filter((order) => getOrderFilter(order.status) === filter).length;
        const maxPage = Math.max(1, Math.ceil(count / PROFILE_ORDERS_PER_PAGE));

        if (next[filter] > maxPage) {
          next[filter] = maxPage;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [orders]);

  // const handleImageChange = (file: File) => {
  //   const reader = new FileReader();

  //   reader.onloadend = () => {
  //     setPreview(reader.result as string);
  //   };

  //   reader.readAsDataURL(file);
  // };

  const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "inknwalluser"); // ⭐ replace

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dmtnw2ago/image/upload", // ⭐ replace
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  return data.secure_url; // ⭐ THIS is what we store
};

  const handleSave = async () => {
  if (!user?.id) {
    toast.error("User not found");
    return;
  }

  try {
    let imageUrl = user.profilePic;

    // ⭐ upload only if new file selected
    if (selectedFile) {
      imageUrl = await uploadToCloudinary(selectedFile);
    }

    const res = await authFetch(
      `/api/users/${user.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostel,
          phone: isPhoneLocked ? user.phone : phone,
          profilePic: imageUrl, // ⭐ ONLY URL
        }),
      },
      "user"
    );

    if (!res.ok) throw new Error();

    const updated = await res.json();

    const normalizedUser = {
      ...updated,
      profilePic: imageUrl,
      roll: updated.roll?.toLowerCase?.() ?? updated.roll,
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    toast.success("Profile updated");
    navigate("/");

  } catch (err) {
    console.error(err);
    toast.error("Failed to update");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
      {/* Toaster is mounted in App; keep toast usage here only */}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,95,31,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.85)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.85)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute -top-20 right-[-4rem] h-72 w-72 rounded-full bg-orange-500/15 blur-3xl profile-float-orb" />
      <div
        className="pointer-events-none absolute left-[-4rem] top-1/3 h-64 w-64 rounded-full bg-white/8 blur-3xl profile-float-orb"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl profile-float-orb"
        style={{ animationDelay: "-8s" }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 sm:gap-6">
        <div
          className="profile-section-reveal flex items-center justify-between gap-4"
          style={getRevealStyle(80)}
        >
          <button
            type="button"
            onClick={() => navigate("/")}
            className="profile-glass-soft inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm text-gray-200 transition hover:border-orange-500/40 hover:text-white sm:px-5"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back</span>
          </button>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200/80">
              InkNWall Account
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
              Your Profile
            </h1>
          </div>
        </div>

        <div className="profile-fluid-enter profile-glass-panel relative overflow-hidden rounded-[34px] p-4 sm:p-5 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_28%,transparent_100%)]" />
          <div className="pointer-events-none absolute -right-10 top-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-6 left-0 h-32 w-32 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative space-y-8">
            <div
              className="profile-section-reveal profile-glass-soft flex flex-col items-center gap-5 rounded-[30px] p-5 sm:flex-row sm:items-start sm:gap-6 md:p-6"
              style={getRevealStyle(150)}
            >
              <div className="group relative">
                <div className="absolute -inset-2 rounded-full bg-orange-500/15 blur-xl" />
                <div className="relative rounded-full border border-white/15 bg-white/[0.04] p-1.5 backdrop-blur-xl">
                  <img
                    src={preview || user.profilePic}
                    alt="profile"
                    className="h-20 w-20 rounded-full object-cover shadow-lg sm:h-24 sm:w-24 md:h-28 md:w-28"
                  />
                </div>

                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <span className="text-xs font-bold tracking-wide">Edit</span>
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    setSelectedFile(file); // ⭐ important
    setPreview(URL.createObjectURL(file)); // ⭐ preview
  }
}}
                  />
                </label>
              </div>

              <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200/80">
                    Personal Space
                  </p>
                  <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {user.name}
                  </h2>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-gray-200">
                    {user.email}
                  </span>
                  <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                    {user.roll}
                  </span>
                </div>

                <p className="max-w-xl text-sm leading-7 text-gray-300">
                  Keep your pickup details ready, track your order flow, and manage your account.
                </p>
              </div>
            </div>

            <div
              className="profile-section-reveal grid gap-4 sm:gap-5 md:grid-cols-2"
              style={getRevealStyle(240)}
            >
              <div className="profile-glass-soft rounded-[24px] p-4 sm:p-5">
                <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Email</label>
                <input
                  value={user.email}
                  disabled
                  className="input mt-3 border-white/10 bg-white/[0.04] text-white shadow-inner shadow-black/10 cursor-not-allowed opacity-50"
                />
              </div>

              <div className="profile-glass-soft rounded-[24px] p-4 sm:p-5">
                <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Roll No</label>
                <input
                  value={user.roll}
                  disabled
                  className="input mt-3 border-white/10 bg-white/[0.04] text-white shadow-inner shadow-black/10 cursor-not-allowed opacity-50"
                />
              </div>

              <div className="profile-glass-soft rounded-[24px] p-4 sm:p-5 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.18em] text-gray-400" >
                  Address
                </label>
                <input
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="Hostel, Room No"
                  className="input mt-3 border-white/10 bg-white/[0.04] text-white shadow-inner shadow-black/10"
                />
              </div>

              <div className="profile-glass-soft rounded-[24px] p-4 sm:p-5 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPhoneLocked}
                  className={`input mt-3 border-white/10 bg-white/[0.04] text-white shadow-inner shadow-black/10 ${isPhoneLocked ? "cursor-not-allowed opacity-50" : ""
                    }`}
                />
                {isPhoneLocked && (
                  <p className="mt-3 text-xs text-gray-400">
                    Phone number cannot be changed once entered.
                  </p>
                )}
              </div>
            </div>

            <div
              className="profile-section-reveal profile-glass-soft flex flex-col items-center justify-between gap-3 rounded-[24px] p-4 sm:flex-row sm:gap-4"
              style={getRevealStyle(320)}
            >
              <button
                onClick={handleSave}
                className="w-full rounded-2xl bg-orange-600 px-6 py-3 font-bold shadow-[0_18px_40px_rgba(255,95,31,0.24)] transition hover:bg-orange-500 sm:w-auto sm:px-8"
              >
                Save Changes
              </button>

              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-gray-200 transition hover:border-red-400/40 hover:text-red-300"
              >
                Logout
              </button>
            </div>

            <div className="profile-section-reveal space-y-6" style={getRevealStyle(400)}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200/80">
                    Order Stream
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Your Orders</h2>
                  <p className="mt-1 text-sm text-gray-300">
                    View your placed and collected orders.
                  </p>
                </div>

                <div className="profile-glass-soft inline-flex w-full rounded-2xl p-1 lg:w-auto">
                  {PROFILE_ORDER_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveOrderFilter(filter.key)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition lg:flex-none ${activeOrderFilter === filter.key
                          ? "bg-orange-600 text-white shadow-[0_12px_30px_rgba(255,95,31,0.25)]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <span>{filter.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs ${activeOrderFilter === filter.key
                            ? "bg-white/15 text-white"
                            : "bg-white/10 text-gray-300"
                          }`}
                      >
                        {orderCounts[filter.key]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {ordersLoading ? (
                <div className="profile-glass-soft rounded-2xl p-6 text-center text-gray-300">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="profile-glass-soft rounded-2xl p-6 text-center text-gray-300">
                  No orders yet
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="profile-glass-soft rounded-2xl p-6 text-center text-gray-400">
                  No {activeOrderFilter === "PLACED" ? "placed" : "collected"} orders found.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="profile-glass-soft flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      Showing {filteredOrders.length === 0 ? 0 : (activePage - 1) * PROFILE_ORDERS_PER_PAGE + 1}
                      -
                      {Math.min(activePage * PROFILE_ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                    </p>
                    <p>
                      {activeOrderFilter === "PLACED"
                        ? "Pending orders glow red until the admin confirms them."
                        : "Collected orders stay in a separate history tab."}
                    </p>
                  </div>

                  {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="profile-glass-soft space-y-4 rounded-[24px] p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-white">Order #{order.id}</p>
                            <p className="text-xs text-gray-400">{formatOrderDate(order.createdAt)}</p>
                          </div>

                          <div
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${order.status === "PENDING"
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              }`}
                          >
                            {order.status === "PENDING" ? (
                              <span className="relative flex h-3.5 w-3.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.85)]" />
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-300 shadow-[0_0_18px_rgba(34,197,94,0.35)]">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                            )}

                            <span>
                              {order.status === "PENDING"
                                ? "Confirmation pending"
                                : order.status === "RECEIVED"
                                  ? "Order Confirmed"
                                  : "Order collected"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 text-left sm:text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${order.status === "PENDING"
                                ? "bg-rose-500/15 text-rose-300"
                                : order.status === "RECEIVED"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-sky-500/15 text-sky-300"
                              }`}
                          >
                            {order.status === "PENDING"
                              ? "Placed"
                              : order.status === "RECEIVED"
                                ? "Confirmed"
                                : "Collected"}
                          </span>

                          <div className="font-bold text-orange-300">Rs. {order.total}</div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300 backdrop-blur-xl">
                        Hostel: {order.address}
                      </div>

                      <div className="space-y-2">
                        {order.items?.map((item, index) => {
                          const posterId = item.poster?.id ?? item.posterId;
                          const posterName = item.poster?.name ?? item.name ?? "Poster";
                          const posterImage =
                            item.poster?.imageUrl ??
                            item.image ??
                            "https://via.placeholder.com/120x160?text=Poster";

                          return (
                            <button
                              key={posterId ?? `${order.id}-${index}`}
                              type="button"
                              onClick={() => posterId && navigate(`/?poster=${posterId}`)}
                              className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/[0.02] p-2 text-left transition hover:border-white/10 hover:bg-white/5"
                            >
                              <ProtectedPosterImage
                                src={posterImage}
                                alt={posterName}
                                className="h-16 w-12 rounded object-cover"
                              />

                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{posterName}</p>
                                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                              </div>

                              <div className="text-sm font-semibold text-orange-300">
                                Rs. {item.price}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="profile-glass-soft flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-300">
                      Page {activePage} of {totalPages}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOrderPages((prev) => ({
                            ...prev,
                            [activeOrderFilter]: Math.max(1, prev[activeOrderFilter] - 1),
                          }))
                        }
                        disabled={activePage === 1}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOrderPages((prev) => ({
                            ...prev,
                            [activeOrderFilter]: Math.min(totalPages, prev[activeOrderFilter] + 1),
                          }))
                        }
                        disabled={activePage === totalPages}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
