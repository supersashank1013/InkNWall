import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiUrl, isJwtExpired, clearAdminAuth } from "../lib/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token && !isJwtExpired(token)) {
      navigate("/admin");
      return;
    }

    if (token) {
      clearAdminAuth();
    }
  }, [navigate]);

  const handleLogin = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both username and password", { duration: 2000 });
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        toast.error("User ID or password is incorrect", { duration: 2000 });
        return;
      }

      const token = await res.text(); // ⚠️ your backend returns string

      // Ensure localStorage is available (some mobile browsers have restrictions)
      try {
        localStorage.setItem("adminToken", token);
      } catch (storageError) {
        console.error("localStorage error:", storageError);
        toast.error("Unable to save login session. Please check your browser settings.", { duration: 3000 });
        return;
      }

      toast.success("Admin login successful 🚀");

      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Login timed out. Please check your connection and try again.", { duration: 3000 });
      } else {
        toast.error("Login failed. Please try again.", { duration: 2000 });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-white px-6">
      <div className="w-full max-w-md bg-[#111]/80 border border-white/10 rounded-2xl p-8 space-y-6 shadow-xl">

        <h1 className="text-2xl font-bold text-center">Admin Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={email}
            className="w-full p-3 bg-black border border-white/10 rounded-lg focus:border-orange-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              className="w-full p-3 pr-12 bg-black border border-white/10 rounded-lg focus:border-orange-500 outline-none"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-orange-600 rounded-lg font-bold hover:bg-orange-500 transition active:bg-orange-700"
            disabled={!email.trim() || !password.trim()}
          >
            Login
          </button>
        </form>

      </div>
    </div>
  );
}
