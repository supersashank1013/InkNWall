import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import type { Poster } from "./data/posters";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategoryBar from "./components/CategoryBar";
import PosterGrid from "./components/PosterGrid";
import CartSidebar from "./components/CartSideBar";
import PosterModal from "./components/PosterModal";
import Footer from "./components/Footer";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import AnnouncementBar from "./components/AnnouncementBar";
import { apiUrl } from "./lib/api";

export interface CartItem extends Poster {
  quantity: number;
}

interface CategoryOption {
  label: string;
  count: number;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/*" element={<HomePage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </Router>
  );
}

function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const location = useLocation();

  const fromLocation = location.state as {
    cart?: CartItem[];
    openCart?: boolean;
  } | null;

  const [cart, setCart] = useState<CartItem[]>(() => {
    const incomingCart = fromLocation?.cart;
    if (Array.isArray(incomingCart) && incomingCart.length > 0) {
      return incomingCart;
    }

    const saved = localStorage.getItem("cart");
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(() => Boolean(fromLocation?.openCart));
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [highlightedPoster, setHighlightedPoster] = useState<{ id: number; nonce: number } | null>(null);
  const shopRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (fromLocation?.openCart) {
      navigate(location.pathname, {
        replace: true,
        state: {
          ...(location.state as object | null),
          openCart: false,
        },
      });
    }
  }, [fromLocation?.openCart, location.pathname, location.state, navigate]);

  useEffect(() => {
    fetch(apiUrl("/api/posters"))
      .then((res) => res.json())
      .then(
        (
          data: {
            id: number;
            name: string;
            price: number;
            imageUrl: string;
            category: string;
          }[]
        ) => {
          const formatted = data.map((poster) => ({
            id: poster.id,
            name: poster.name,
            price: poster.price,
            img: poster.imageUrl,
            cat: poster.category,
          }));

          setPosters(formatted);
        }
      )
      .catch((err) => console.error(err));
  }, []);

  const normalizedSelectedCategory = category.trim().toLowerCase();

  const categoryOptions: CategoryOption[] = [
    { label: "ALL", count: posters.length },
    ...Array.from(
      posters.reduce((categoryMap, poster) => {
        const normalizedCategory = poster.cat?.trim().toUpperCase();

        if (!normalizedCategory) return categoryMap;

        categoryMap.set(
          normalizedCategory,
          (categoryMap.get(normalizedCategory) ?? 0) + 1
        );

        return categoryMap;
      }, new Map<string, number>())
    ).map(([label, count]) => ({ label, count })),
  ];

  const selectedCategoryCount =
    normalizedSelectedCategory === "all"
      ? posters.length
      : categoryOptions.find(
          (option) => option.label.toLowerCase() === normalizedSelectedCategory
        )?.count ?? 0;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const posterId = Number(params.get("poster"));

    if (!posterId || posters.length === 0) return;

    const matchedPoster = posters.find((poster) => poster.id === posterId);
    if (!matchedPoster) return;

    window.requestAnimationFrame(() => {
      setCategory("ALL");
      setSearch(matchedPoster.name);
      setModalImg(matchedPoster.img);
      shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.search, posters]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const filteredPosters = posters.filter((poster) => {
    const searchTerm = search.toLowerCase().trim();
    const posterCategory = poster.cat?.trim().toLowerCase() ?? "";

    return (
      (normalizedSelectedCategory === "all" ||
        posterCategory === normalizedSelectedCategory) &&
      (poster.name.toLowerCase().includes(searchTerm) ||
        (poster.cat?.toLowerCase() ?? "").includes(searchTerm))
    );
  });

  const addToCart = (id: number) => {
    const item = posters.find((poster) => poster.id === id);
    if (!item) return;

    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...prev, { ...item, quantity: 1 }];
    });

    toast.success(`${item.name} added to cart`);
  };

  const focusPosterCard = (posterId: number) => {
    setCategory("ALL");
    setSearch("");
    setModalImg(null);

    window.requestAnimationFrame(() => {
      setHighlightedPoster({ id: posterId, nonce: Date.now() });
    });
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="relative flex min-h-screen flex-col overflow-clip bg-[#050505] pt-36 font-sans text-gray-100 antialiased selection:bg-orange-600 selection:text-white sm:pt-40 md:pt-16">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none fixed inset-x-0 top-[-14rem] z-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(255,95,31,0.2),transparent_60%)]" />
      <div className="pointer-events-none fixed -left-24 top-1/3 z-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 bottom-8 z-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,0)_100%)]" />

      <Toaster
        position="top-left"
        gutter={12}
        toastOptions={{
          duration: 2500,
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid #FF5F1F",
            padding: "12px 16px",
            fontSize: "13px",
          },
        }}
      />

      <div className="relative z-20">
        <Navbar
          search={search}
          setSearch={setSearch}
          cartCount={totalItems}
          toggleCart={() => setIsCartOpen(!isCartOpen)}
        />
        <AnnouncementBar />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-grow flex-col gap-5 px-3 py-4 sm:px-6 sm:py-6 lg:gap-8 lg:px-8 lg:py-8">
        <Hero onFeaturedPosterSelect={focusPosterCard} />
        <CategoryBar
          categoryOptions={categoryOptions}
          selectedCategory={category}
          selectedCategoryCount={selectedCategoryCount}
          setCategory={setCategory}
        />
        <PosterGrid
          shopRef={shopRef}
          posters={filteredPosters}
          cart={cart}
          setCart={setCart}
          addToCart={addToCart}
          openModal={setModalImg}
          highlightedPoster={highlightedPoster}
        />
      </main>

      <CartSidebar
        cart={cart}
        isOpen={isCartOpen}
        toggleCart={() => setIsCartOpen(!isCartOpen)}
        setCart={setCart}
      />

      {modalImg && <PosterModal img={modalImg} close={() => setModalImg(null)} />}

      <Footer />
    </div>
  );
}

export default App;
