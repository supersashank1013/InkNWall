import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import AdminNavbar from "./admin/AdminNavbar";
import AdminFooter from "./admin/AdminFooter";
import { apiUrl, authFetch, isJwtExpired, clearAdminAuth } from "../lib/api";

interface UploadSlot {
  file: File | null;
  preview: string | null;
  name: string;
  category: string;
  price: string;
  isPremium: boolean;
}

type OrderStatus = "PENDING" | "RECEIVED" | "COLLECTED";
type OrderTab = "PLACED" | "PENDING" | "DELIVERED";
type AdminPanel = "ORDERS" | "ANNOUNCEMENTS" | "UPLOADS" | "LOGS";
const ORDERS_PER_PAGE = 5;

interface Log {
  id: number;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

interface OrderItem {
  posterId?: number;
  name?: string;
  quantity: number;
  price: number;
  image?: string;
  poster?: { id: number; name: string; imageUrl: string };
}

interface Order {
  id: number;
  name: string;
  roll: string;
  address: string;
  total: number;
  status: OrderStatus;
  createdAt?: string;
  items: OrderItem[];
}

interface BackendPoster {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
  price: number | string;
  isPremium?: boolean;
}

interface AdminPoster {
  id: number;
  name: string;
  imageUrl: string;
  img: string;
  category: string;
  cat: string;
  price: number;
  isPremium: boolean;
}

const ORDER_TABS = [
  { key: "PLACED" as const, label: "Placed Orders", helper: "Fresh orders waiting to be accepted" },
  { key: "PENDING" as const, label: "Pending Orders", helper: "Accepted orders that are not delivered yet" },
  { key: "DELIVERED" as const, label: "Delivered Orders", helper: "Orders already handed over to users" },
];

const ADMIN_PANELS = [
  { key: "ORDERS" as const, label: "Order Tracking" },
  { key: "ANNOUNCEMENTS" as const, label: "Announcements" },
  { key: "UPLOADS" as const, label: "Upload Posters" },
  { key: "LOGS" as const, label: "Admin Logs" },
  // { key: "PRICING" as const, label: "Pricing Config" },
];

const EMPTY_UPLOAD_SLOT: UploadSlot = { file: null, preview: null, name: "", category: "", price: "", isPremium: false };

const normalizeOrderStatus = (status?: string): OrderStatus =>
  status === "RECEIVED" ? "RECEIVED" : status === "COLLECTED" ? "COLLECTED" : "PENDING";

const getOrderTab = (status: OrderStatus): OrderTab =>
  status === "RECEIVED" ? "PENDING" : status === "COLLECTED" ? "DELIVERED" : "PLACED";

const getStatusBadge = (status: OrderStatus) =>
  status === "COLLECTED"
    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
    : status === "RECEIVED"
      ? "bg-sky-500/15 text-sky-300 border border-sky-500/20"
      : "bg-amber-500/15 text-amber-300 border border-amber-500/20";

const normalizeOrder = (order: Partial<Order> & { id: number }): Order => ({
  id: order.id,
  name: order.name || "Unknown User",
  roll: order.roll || "-",
  address: order.address || "-",
  total: Number(order.total || 0),
  status: normalizeOrderStatus(order.status),
  createdAt: order.createdAt,
  items: Array.isArray(order.items) ? order.items : [],
});

const formatDate = (date?: string) => {
  if (!date) return "No date";
  return new Date(date.slice(0, 23)).toLocaleString();
};

export default function Admin() {
  const [uploadSlots, setUploadSlots] = useState<UploadSlot[]>(Array.from({ length: 10 }, () => ({ ...EMPTY_UPLOAD_SLOT })));
  const [posters, setPosters] = useState<AdminPoster[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>("PLACED");
  const [activePanel, setActivePanel] = useState<AdminPanel>("ORDERS");
  const [orderPages, setOrderPages] = useState<Record<OrderTab, number>>({
    PLACED: 1,
    PENDING: 1,
    DELIVERED: 1,
  });
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedPosters, setSelectedPosters] = useState<number[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [adminUsername, setAdminUsername] = useState("Admin");
  const [logs, setLogs] = useState<Log[]>([]);
  const [logAdminFilter, setLogAdminFilter] = useState("ALL");
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const selectedPosterPreviews = posters.filter((poster) => selectedPosters.includes(poster.id));
  const announcementPreviewText = announcement.trim();
  const filteredOrders = orders.filter((order) => getOrderTab(order.status) === activeTab);
  const activePage = orderPages[activeTab];
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (activePage - 1) * ORDERS_PER_PAGE,
    activePage * ORDERS_PER_PAGE
  );
  const orderCounts = ORDER_TABS.reduce<Record<OrderTab, number>>(
    (acc, tab) => ({ ...acc, [tab.key]: orders.filter((order) => getOrderTab(order.status) === tab.key).length }),
    { PLACED: 0, PENDING: 0, DELIVERED: 0 }
  );

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const adminLogOptions = Array.from(
    new Set(logs.map((log) => log.adminEmail).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const filteredSortedLogs = sortedLogs.filter((log) =>
    logAdminFilter === "ALL" ? true : log.adminEmail === logAdminFilter
  );

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      window.location.href = "/admin-login";
      return;
    }

    if (isJwtExpired(token)) {
      clearAdminAuth();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAdminUsername(payload.sub || "Admin");
    } catch {
      setAdminUsername("Admin");
    }
  }, [token]);

  useEffect(() => {
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

const fetchPosters = () => {
  fetch(apiUrl("/api/posters"))
    .then((res) => res.json())
    .then((data) => {
      const mapped = Array.isArray(data)
        ? (data as BackendPoster[]).map((p) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            img: p.imageUrl,        // backend → frontend
            category: p.category,
            cat: p.category,        // backend → frontend
            price: Number(p.price),
            isPremium: p.isPremium ?? false, // ⭐ FINAL FIX
          }))
        : [];
        console.log("MAPPED:", mapped); // ⭐ ADD THIS

      setPosters(mapped);
    })
    .catch((err) => {
      console.error("Failed to fetch posters:", err);
      setPosters([]);
    });
};;

  const fetchOrders = () => {
    setOrdersLoading(true);
    authFetch("/api/orders/recent", {}, "admin")
      .then((res) => res.json())
      .then((data) => {
        const normalizedData = Array.isArray(data)
          ? data.map((order) => normalizeOrder(order as Partial<Order> & { id: number }))
          : [];

        const sorted = [...normalizedData].sort((a, b) => {
          const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          if (Number.isNaN(aTs) || Number.isNaN(bTs)) {
            return b.id - a.id;
          }

          return bTs - aTs;
        });

        setOrders(sorted);
      })
      .catch(() => {
        setOrders([]);
        toast.error("Failed to load orders", { duration: 2000 });
      })
      .finally(() => setOrdersLoading(false));
  };

  const fetchAnnouncements = () => {
    fetch(apiUrl("/api/announcement"))
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch announcements:", err);
        setAnnouncements([]);
      });
  };

  const downloadCSV = async () => {
  try {
    const res = await authFetch("/api/orders/export", { method: "GET" }, "admin");

    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();

    // Handle IE/Edge
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      (window.navigator as any).msSaveOrOpenBlob(blob, "orders.csv");
      return;
    }

    const url = window.URL.createObjectURL(blob);

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // For mobile devices, open in new tab/window which will prompt download
      window.open(url, '_blank');
    } else {
      // For desktop, use the standard download approach
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    // Clean up the blob URL after a short delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);

  } catch (err) {
    console.error(err);
    toast.error("CSV download failed");
  }
};

  async function fetchLogs() {
    const res = await authFetch("/api/admin/logs", {}, "admin");
    const data = await res.json();
    setLogs(data);
  }

  useEffect(() => {
    fetchPosters();
    fetchOrders();
    fetchLogs();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    setOrderPages((prev) => {
      const next = { ...prev };
      let changed = false;

      (["PLACED", "PENDING", "DELIVERED"] as OrderTab[]).forEach((tab) => {
        const count = orders.filter((order) => getOrderTab(order.status) === tab).length;
        const maxPage = Math.max(1, Math.ceil(count / ORDERS_PER_PAGE));
        if (next[tab] > maxPage) {
          next[tab] = maxPage;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [orders]);

  useEffect(() => {
    return () => {
      uploadSlots.forEach((slot) => {
        if (slot.preview) URL.revokeObjectURL(slot.preview);
      });
    };
  }, [uploadSlots]);

  const handleFileChange = (index: number, file: File | null) => {
    setUploadSlots((prev) =>
      prev.map((slot, slotIndex) => {
        if (slotIndex !== index) return slot;
        if (slot.preview) URL.revokeObjectURL(slot.preview);
        return { ...slot, file, preview: file ? URL.createObjectURL(file) : null };
      })
    );
  };

  const handleSlotInputChange = (index: number, field: keyof UploadSlot, value: string) => {
    setUploadSlots((prev) => prev.map((slot, slotIndex) => (slotIndex === index ? { ...slot, [field]: value } : slot)));
  };

  const handleSlotPremiumChange = (index: number, isPremium: boolean) => {
    setUploadSlots((prev) => prev.map((slot, slotIndex) => (slotIndex === index ? { ...slot, isPremium } : slot)));
  };

  const handleDeleteSlot = (index: number) => {
    toast(
      (toastItem) => (
        <div className="text-center">
          <p className="mb-4">Do you want to remove this upload?</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                setUploadSlots((prev) =>
                  prev.map((slot, slotIndex) => {
                    if (slotIndex !== index) return slot;
                    if (slot.preview) URL.revokeObjectURL(slot.preview);
                    return { ...EMPTY_UPLOAD_SLOT };
                  })
                );
                toast.dismiss(toastItem.id);
                toast.success("Removed from upload");
              }}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Yes
            </button>
            <button onClick={() => toast.dismiss(toastItem.id)} className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const togglePoster = (id: number) => {
    if (selectedPosters.includes(id)) {
      setSelectedPosters((prev) => prev.filter((posterId) => posterId !== id));
      return;
    }
    if (selectedPosters.length >= 4) {
      toast.error("Max 4 posters", { duration: 2000 });
      return;
    }
    setSelectedPosters((prev) => [...prev, id]);
  };

  const handleAnnouncement = async () => {
    if (!announcement.trim()) return;
    setSending(true);
    try {
      const posterIdsToSend = selectedPosters.length > 0 ? selectedPosters : [undefined];

      for (const posterId of posterIdsToSend) {
        const formData = new FormData();
        formData.append("message", announcement);
        if (posterId) {
          formData.append("posterId", posterId.toString());
        }

const res = await authFetch(
        "/api/announcement",
        {
          method: "POST",
          body: formData,
        },
        "admin"
      );

        if (!res.ok) throw new Error("Announcement failed");
      }

      const selectedAnnouncementPosters = selectedPosterPreviews
        .filter((poster) => poster.imageUrl)
        .map((poster) => ({
          id: poster.id,
          name: poster.name,
          imageUrl: poster.imageUrl,
        }));

      if (selectedAnnouncementPosters.length > 0) {
        localStorage.setItem(
          "inknwall_featured_announcement_poster",
          JSON.stringify(selectedAnnouncementPosters)
        );
      } else {
        localStorage.removeItem("inknwall_featured_announcement_poster");
      }
      window.dispatchEvent(new Event("inknwall_featured_announcement_poster"));
      toast.success("Announcement sent");
      setAnnouncement("");
      setSelectedPosters([]);
    } catch {
      toast.error("Failed to send announcement", { duration: 2000 });
    } finally {
      setSending(false);
    }
  };



  const handleUpload = async () => {

  const slotsToUpload = uploadSlots.filter(
    (slot) =>
      slot.file &&
      slot.name.trim() &&
      slot.category.trim() &&
      slot.price !== null
  );

  if (slotsToUpload.length === 0) {
    toast.error("Please upload images and fill all details", { duration: 2000 });
    return;
  }

  setLoading(true);

  try {
    for (const slot of slotsToUpload) {

      const formData = new FormData();
      formData.append("name", slot.name);
      formData.append("category", slot.category);
      formData.append("price", String(slot.price));
      formData.append("isPremium", String(slot.isPremium));
      formData.append("file", slot.file as File);

      const res = await authFetch(
        "/api/posters/upload",
        {
          method: "POST",
          body: formData,
        },
        "admin"
      );

      const text = await res.text();
      console.log("UPLOAD RESPONSE:", text);

      if (!res.ok) {
        throw new Error(`Failed to upload ${slot.name}`);
      }
    }

    toast.success(`Uploaded ${slotsToUpload.length} posters`);
    fetchPosters();

  } catch (err) {
    console.error(err);
    toast.error("Upload failed", { duration: 2000 });
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id: number) => {
    const performDelete = async (toastId: string) => {
      toast.dismiss(toastId);

      if (!token) {
        toast.error("Admin authorization missing", { duration: 2000 });
        return;
      }

      try {
        const response = await authFetch(
          `/api/posters/${id}`,
          {
            method: "DELETE",
          },
          "admin"
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to delete poster ${id}:`, response.status, errorText);
          toast.error(`Delete failed: ${response.status} ${response.statusText}`, { duration: 2000 });
          return;
        }

        toast.success("Poster deleted successfully");
        fetchPosters();
      } catch (err) {
        console.error("Delete request failed:", err);
        toast.error("Delete failed. Please try again.", { duration: 2000 });
      }
    };

    toast(
      (toastItem) => (
        <div className="w-[320px] rounded-2xl border border-white/10 bg-[#101010] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">Confirm Delete</p>
            <p className="mt-2 text-sm leading-6 text-gray-200">
              Are you sure you want to permanently delete this poster?
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(toastItem.id)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              onClick={() => performDelete(toastItem.id)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const handleDeleteAnnouncement = async (id: number) => {
    const performDelete = async (toastId: string) => {
      toast.dismiss(toastId);

      try {
        const response = await authFetch(
          `/api/announcement/${id}`,
          {
            method: "DELETE",
          },
          "admin"
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to delete announcement ${id}:`, response.status, errorText);
          toast.error(`Delete failed: ${response.status} ${response.statusText}`, { duration: 2000 });
          return;
        }

        toast.success("Announcement deleted successfully");
        fetchAnnouncements();
        // Clear localStorage if this was the featured announcement
        localStorage.removeItem("inknwall_featured_announcement_poster");
        window.dispatchEvent(new Event("inknwall_featured_announcement_poster"));
      } catch (err) {
        console.error("Delete request failed:", err);
        toast.error("Delete failed. Please try again.", { duration: 2000 });
      }
    };

    toast(
      (toastItem) => (
        <div className="w-[320px] rounded-2xl border border-white/10 bg-[#101010] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">Confirm Delete</p>
            <p className="mt-2 text-sm leading-6 text-gray-200">
              Are you sure you want to delete this announcement? This will also remove any featured posters from the hero section.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(toastItem.id)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              onClick={() => performDelete(toastItem.id)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const updateOrderStatus = async (id: number, newStatus: OrderStatus) => {
    setUpdatingOrderId(id);
    try {
      const res = await authFetch(
        `/api/orders/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
        "admin"
      );
      if (!res.ok) throw new Error("Status update failed");
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: newStatus } : order)));
      toast.success(newStatus === "RECEIVED" ? "Order moved to pending" : "Order moved to delivered");
    } catch {
      toast.error("Failed to update order status", { duration: 2000 });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const confirmOrderStatusChange = (
    id: number,
    newStatus: OrderStatus,
    message: string
  ) => {
    toast(
      (toastItem) => (
        <div className="w-[320px] rounded-2xl border border-white/10 bg-[#101010] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="mb-4 flex items-start gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${newStatus === "COLLECTED"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-sky-500/15 text-sky-300"
              }`}>
              {newStatus === "COLLECTED" ? "✓" : "→"}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
                Confirm Action
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-200">{message}</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-gray-400">
            This updates the order status immediately for the admin dashboard.
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(toastItem.id);
                updateOrderStatus(id, newStatus);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${newStatus === "COLLECTED"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-sky-600 hover:bg-sky-500"
                }`}
            >
              Confirm
            </button>
            <button
              onClick={() => toast.dismiss(toastItem.id)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: "0",
        },
      }
    );
  };

  return (
    <>
      <AdminNavbar adminUsername={adminUsername} />
      <div className="min-h-screen bg-[#080808] px-4 py-8 pt-28 text-white sm:px-6 sm:py-10 md:px-12 md:pt-20">
        <div className="mx-auto max-w-6xl space-y-12">
          <div>
            <h1 className="text-4xl font-black">Admin Dashboard</h1>
            <p className="text-gray-400">Manage posters, announcements, and orders.</p>
          </div>
          <section className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-3 backdrop-blur-xl">
              <div className="grid gap-3 md:grid-cols-4">
                {ADMIN_PANELS.map((panel) => (
                  <button
                    key={panel.key}
                    onClick={() => setActivePanel(panel.key)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${activePanel === panel.key
                        ? "bg-orange-600 text-white shadow-[0_10px_30px_rgba(255,95,31,0.25)]"
                        : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
          {activePanel === "ORDERS" && (
            <section className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">Orders</p>
                  <h2 className="mt-2 text-2xl font-bold">Order Tracking Panel</h2>
                  <p className="mt-1 text-sm text-gray-400">Track placed, pending, and delivered orders in one place.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={downloadCSV}
                    className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 transition hover:border-orange-400/45 hover:bg-orange-500/15 hover:text-white"
                  >
                    Download Data
                  </button>
                  <button
                    onClick={fetchOrders}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-orange-500/40 hover:text-white"
                  >
                    Refresh Orders
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {ORDER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl border p-5 text-left transition ${activeTab === tab.key ? "border-orange-500 bg-orange-500/10 shadow-[0_0_30px_rgba(255,95,31,0.12)]" : "border-white/10 bg-[#111]/80 hover:border-white/25"}`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{tab.label}</p>
                    <p className="mt-3 text-3xl font-black">{orderCounts[tab.key]}</p>
                    <p className="mt-2 text-sm text-gray-400">{tab.helper}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#111]/80 p-6 backdrop-blur-xl">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{ORDER_TABS.find((tab) => tab.key === activeTab)?.label}</h3>
                    <p className="text-sm text-gray-400">{ORDER_TABS.find((tab) => tab.key === activeTab)?.helper}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Showing {filteredOrders.length === 0 ? 0 : (activePage - 1) * ORDERS_PER_PAGE + 1}
                    -
                    {Math.min(activePage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                  </p>
                </div>
                {ordersLoading ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-500">No {activeTab.toLowerCase()} orders found.</div>
                ) : (
                  <div className="space-y-5">
                    {paginatedOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-lg font-bold">Order #{order.id}</h4>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>{order.status}</span>
                            </div>
                            <p className="text-sm text-gray-300">{order.name}</p>
                            <p className="text-sm text-gray-500">Roll: {order.roll}</p>
                            <p className="text-sm text-gray-500">Address: {order.address}</p>
                            {order.createdAt && <p className="text-xs text-gray-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>}
                          </div>
                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <p className="text-2xl font-black text-orange-400">Rs. {order.total}</p>
                            {order.status === "PENDING" && (
                              <button
                                onClick={() =>
                                  confirmOrderStatusChange(
                                    order.id,
                                    "RECEIVED",
                                    `Move Order #${order.id} to pending orders?`
                                  )
                                }
                                disabled={updatingOrderId === order.id}
                                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingOrderId === order.id ? "Updating..." : "Move to Pending"}
                              </button>
                            )}
                            {order.status === "RECEIVED" && (
                              <button
                                onClick={() =>
                                  confirmOrderStatusChange(
                                    order.id,
                                    "COLLECTED",
                                    `Mark Order #${order.id} as delivered?`
                                  )
                                }
                                disabled={updatingOrderId === order.id}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingOrderId === order.id ? "Updating..." : "Mark as Delivered"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {order.items.map((item, index) => {
                            const itemName = item.poster?.name ?? item.name ?? "Poster";
                            const itemImage = item.poster?.imageUrl ?? item.image ?? "https://via.placeholder.com/240x320?text=Poster";
                            const itemId = item.poster?.id ?? item.posterId ?? index;
                            return (
                              <div key={`${order.id}-${itemId}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111] p-3">
                                <img src={itemImage} alt={itemName} className="h-20 w-14 rounded-lg object-cover" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">{itemName}</p>
                                  <p className="mt-1 text-xs text-gray-400">Qty: {item.quantity}</p>
                                  <p className="text-xs text-gray-500">Rs. {item.price}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-400">
                        Page {activePage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setOrderPages((prev) => ({
                              ...prev,
                              [activeTab]: Math.max(1, prev[activeTab] - 1),
                            }))
                          }
                          disabled={activePage === 1}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setOrderPages((prev) => ({
                              ...prev,
                              [activeTab]: Math.min(totalPages, prev[activeTab] + 1),
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
            </section>
          )}
          {activePanel === "ANNOUNCEMENTS" && (
            <section className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
              <div className="space-y-6 rounded-2xl border border-white/10 bg-[#111]/80 p-8">
                <div>
                  <h2 className="text-xl font-bold">Create Announcement</h2>
                  <p className="mt-1 text-sm text-gray-400">Write the message and pick up to 4 posters to feature.</p>
                </div>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="New drops are live!"
                  className="min-h-32 w-full resize-none rounded-lg border border-white/10 bg-black p-4"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Selected posters: {selectedPosters.length}/4</p>
                  <p className="text-xs text-gray-500">Click any poster below to add or remove it</p>
                </div>
                <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                  {posters.map((poster) => (
                    <div
                      key={poster.id}
                      onClick={() => togglePoster(poster.id)}
                      className={`group cursor-pointer overflow-hidden rounded-xl border transition ${selectedPosters.includes(poster.id) ? "border-orange-500 ring-1 ring-orange-500/60" : "border-white/10 hover:border-white/30"}`}
                    >
                      <div className="relative">
                        <img src={poster.imageUrl} alt={poster.name} className="h-24 w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        {selectedPosters.includes(poster.id) && <div className="absolute right-2 top-2 rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black text-black">Selected</div>}
                      </div>
                      <div className="bg-[#0b0b0b] p-2">
                        <p className="truncate text-xs font-semibold">{poster.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAnnouncement}
                  disabled={sending}
                  className="w-full rounded-xl bg-orange-600 py-3 font-semibold transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sending ? "Sending..." : "Push Announcement"}
                </button>
              </div>
              <div className="space-y-6 rounded-2xl border border-white/10 bg-[#111]/80 p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Live Preview</p>
                  <h3 className="mt-2 text-xl font-bold">Announcement Card</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
                  <div className="border-b border-white/10 bg-gradient-to-r from-orange-600/20 to-transparent px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-orange-300">InkNWall Update</p>
                    <p className="mt-1 text-sm text-gray-400">This updates as you type</p>
                  </div>
                  <div className="space-y-5 p-5">
                    <div className="min-h-24 rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                      <p className={`whitespace-pre-wrap break-words ${announcementPreviewText ? "text-white" : "italic text-gray-500"}`}>
                        {announcementPreviewText || "Your announcement preview will appear here."}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-white">Featured Posters</p>
                      {selectedPosterPreviews.length > 0 ? (
                        <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1">
                          {selectedPosterPreviews.map((poster) => (
                            <div key={poster.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d]">
                              <img src={poster.imageUrl} alt={poster.name} className="h-28 w-full object-cover" />
                              <div className="p-3">
                                <p className="truncate text-sm font-semibold">{poster.name}</p>
                                <p className="truncate text-xs text-gray-400">{poster.category}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">Select posters to preview them here.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6 rounded-2xl border border-white/10 bg-[#111]/80 p-8">
                <div>
                  <h2 className="text-xl font-bold">Manage Announcements</h2>
                  <p className="mt-1 text-sm text-gray-400">View and delete existing announcements.</p>
                </div>
                <div className="space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm text-white whitespace-pre-wrap break-words">{announcement.message}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="rounded-lg bg-red-600/20 px-3 py-1 text-sm text-red-400 transition hover:bg-red-600/30 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
                      No announcements yet.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
          {activePanel === "UPLOADS" && (
            <section className="space-y-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <h2 className="text-center text-xl font-bold sm:text-left">Upload Posters</h2>
                <select
                  value={isPremium ? "premium" : "standard"}
                  onChange={(e) => setIsPremium(e.target.value === "premium")}
                  className="w-full rounded border border-white/10 bg-black p-2.5 text-sm text-gray-300 focus:border-orange-500 sm:w-auto"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
                {uploadSlots.map((slot, index) => (
                  <div key={index} className="space-y-3">
                    <div className="group relative">
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] transition-all duration-200 hover:border-orange-500/50 group-hover:opacity-50">
                        {!slot.preview ? (
                          <label className="flex h-full w-full cursor-pointer items-center justify-center">
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)} />
                            <div className="text-center text-gray-400">
                              <p className="text-2xl">+</p>
                              <p className="text-xs">Upload</p>
                            </div>
                          </label>
                        ) : (
                          <div className="h-full w-full cursor-pointer" onClick={() => setPreviewImage(slot.preview)}>
                            <img src={slot.preview} alt="Upload preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                      {slot.preview && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSlot(index);
                          }}
                          className="absolute right-2 top-2 z-10 cursor-pointer text-3xl text-gray-500 opacity-0 transition-all duration-300 hover:rotate-90 hover:text-white group-hover:opacity-100"
                          title="Remove from upload"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    {slot.preview && (
                      <div className="space-y-2">
                        <input value={slot.name} onChange={(e) => handleSlotInputChange(index, "name", e.target.value)} placeholder="Name" className="w-full rounded border border-white/10 bg-black p-2 text-sm focus:border-orange-500" />
                        <input value={slot.category} onChange={(e) => handleSlotInputChange(index, "category", e.target.value)} placeholder="Category" className="w-full rounded border border-white/10 bg-black p-2 text-sm focus:border-orange-500" />
                        <input value={slot.price} onChange={(e) => handleSlotInputChange(index, "price", e.target.value)} placeholder="Price" className="w-full rounded border border-white/10 bg-black p-2 text-sm focus:border-orange-500" />
                        <select
                          value={slot.isPremium ? "premium" : "standard"}
                          onChange={(e) => handleSlotPremiumChange(index, e.target.value === "premium")}
                          className="w-full rounded border border-white/10 bg-black p-2 text-sm focus:border-orange-500 text-gray-300"
                        >
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full rounded-xl bg-orange-600 py-3 font-semibold transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Uploading..." : "Upload Posters"}
              </button>
            </section>
          )}
          {previewImage && <PreviewModal img={previewImage} close={() => setPreviewImage(null)} />}
          {activePanel === "UPLOADS" && (
            <section className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {posters.map((poster) => (
                <div key={poster.id} className="rounded-xl bg-[#111] p-3">
                  <img src={poster.imageUrl} alt={poster.name} className="h-40 w-full rounded object-cover" />
                  <p className="mt-3">{poster.name}</p>
                  <button onClick={() => handleDelete(poster.id)} className="mt-3 text-sm text-red-400 transition hover:text-red-300">
                    Delete
                  </button>
                </div>
              ))}
            </section>
          )}
          {activePanel === "LOGS" && (
            <section className="mx-auto max-w-3xl">
              <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/8 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition duration-500 hover:border-orange-500/30 hover:shadow-[0_0_60px_rgba(255,95,31,0.12)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl transition duration-500 group-hover:bg-orange-500/15" />
                <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                    Admin Logs
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">Operations Snapshot</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                    A quick view of session state, order activity, catalog status, and upload progress inside the dashboard.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Filter by Admin
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Showing {filteredSortedLogs.length} of {sortedLogs.length} log entries
                      </p>
                    </div>

                    <select
                      value={logAdminFilter}
                      onChange={(e) => setLogAdminFilter(e.target.value)}
                      className="rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none transition hover:border-orange-500/40 focus:border-orange-500"
                    >
                      <option value="ALL">All Admins</option>
                      {adminLogOptions.map((adminEmail) => (
                        <option key={adminEmail} value={adminEmail}>
                          {adminEmail}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    {sortedLogs.length === 0 ? (
                      <p className="text-gray-500">No activity yet</p>
                    ) : filteredSortedLogs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
                        No logs found for the selected admin.
                      </div>
                    ) : (
                      filteredSortedLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-xl border border-white/10 bg-[#111] p-4 shadow-md hover:border-orange-500/40 transition"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-orange-400">{log.adminEmail}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${log.action === "LOGIN"
                                  ? "bg-green-500/20 text-green-400"
                                  : log.action === "UPLOAD"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                            >
                              {log.action}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-300">{log.details}</p>
                          <p className="mt-2 text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* {activePanel === "PRICING" && (
            <section className="mx-auto max-w-3xl">
              <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/8 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition duration-500 hover:border-orange-500/30 hover:shadow-[0_0_60px_rgba(255,95,31,0.12)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl transition duration-500 group-hover:bg-orange-500/15" />
                <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                    Pricing Configuration
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">Set Pricing Tiers</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                    Configure standard, premium, and combo pricing for order calculations.
                  </p>

                </div>
              </div>
            </section>
          )} */}
        </div>
      </div>
      <AdminFooter />
    </>
  );
}

function PreviewModal({ img, close }: { img: string; close: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [pinchInitialDist, setPinchInitialDist] = useState<number | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const dragAmount = useRef(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragAmount.current = 0;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    dragAmount.current += Math.abs(dx) + Math.abs(dy);
    setPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    last.current = { x: e.clientX, y: e.clientY };
  };

  const stopDrag = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => {
      const newScale = Math.min(Math.max(1, prev + delta), 5);
      if (newScale === 1) setPos({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragAmount.current = 0;
    if (e.touches.length === 2) {
      const first = e.touches[0];
      const second = e.touches[1];
      setPinchInitialDist(Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY));
    } else if (e.touches.length === 1 && scale > 1) {
      setDragging(true);
      last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchInitialDist !== null) {
      const first = e.touches[0];
      const second = e.touches[1];
      const dist = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
      const delta = (dist - pinchInitialDist) * 0.02;
      setScale((prev) => {
        const newScale = Math.min(Math.max(1, prev + delta), 5);
        if (newScale === 1) setPos({ x: 0, y: 0 });
        return newScale;
      });
      setPinchInitialDist(dist);
    } else if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - last.current.x;
      const dy = e.touches[0].clientY - last.current.y;
      dragAmount.current += Math.abs(dx) + Math.abs(dy);
      setPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    setPinchInitialDist(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragAmount.current > 10) return;
    if (scale > 1) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleClose = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    close();
  };

  return (
    <div
      className="fixed left-0 top-0 z-[99999] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/95 p-8 md:p-12"
      onClick={handleClose}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <img
        src={img}
        draggable={false}
        onClick={handleClick}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`select-none transition-transform ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transition: dragging || pinchInitialDist ? "none" : "transform 0.15s ease-out",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
      />
      <button
        onClick={handleClose}
        className="absolute right-6 top-4 z-50 cursor-pointer p-2 text-3xl text-gray-500 transition-all duration-300 hover:rotate-90 hover:text-white"
      >
        &times;
      </button>
    </div>
  );
}
