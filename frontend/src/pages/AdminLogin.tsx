import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      window.location.href = "/admin";
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const token = await res.text(); // ⚠️ your backend returns string

      localStorage.setItem("adminToken", token);

      toast.success("Admin login successful 🚀");

      window.location.href = "/admin";
    } catch (err) {
      toast.error("Login failed ❌");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-white px-6">
      <div className="w-full max-w-md bg-[#111]/80 border border-white/10 rounded-2xl p-8 space-y-6 shadow-xl">

        <h1 className="text-2xl font-bold text-center">Admin Login</h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 bg-black border border-white/10 rounded-lg focus:border-orange-500 outline-none"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-black border border-white/10 rounded-lg focus:border-orange-500 outline-none"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-orange-600 rounded-lg font-bold hover:bg-orange-500 transition"
        >
          Login
        </button>

      </div>
    </div>
  );
}
