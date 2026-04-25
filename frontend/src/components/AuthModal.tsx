import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import CompleteProfileModal from "./CompleteProfileModal";
import { apiUrl } from "../lib/api";

interface AuthModalProps {
  onClose?: () => void;
  onProfileIncomplete?: () => void;
}

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture?: string;
}

interface AuthUser {
  id: number | string;
  name?: string;
  email?: string;
  roll?: string;
  profilePic?: string;
  hostel?: string;
  phone?: string;
}

export default function AuthModal({ onClose, onProfileIncomplete }: AuthModalProps) {
  const [message, setMessage] = useState("");
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Sign in</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-3xl text-gray-500 transition-all duration-300 hover:rotate-90 hover:text-white"
              aria-label="Close sign in"
            >
              &times;
            </button>
          )}
        </div>

        <p className="mb-4 text-sm text-gray-400">
          Continue with your IITM Google account to place orders.
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (res: CredentialResponse) => {
              try {
                const token = res.credential!;
                const userData = JSON.parse(atob(token.split(".")[1])) as GoogleJwtPayload;

                const email = userData.email;

                if (!email.endsWith("@smail.iitm.ac.in")) {
                  toast.error("Only IITM students allowed");
                  return;
                }

                const payload = {
                  name: userData.name,
                  email: userData.email,
                  roll: email.split("@")[0].toLowerCase(),
                  profilePic: userData.picture
                };

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                const response = await fetch(apiUrl("/api/users/google-login"), {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(payload),
                  signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                  const errorText = await response.text().catch(() => "Login failed");
                  throw new Error(`Backend failed: ${errorText}`);
                }

                const data = await response.json();

                // 🔥 STORE TOKEN (MOST IMPORTANT)
                try {
                  localStorage.setItem("token", data.token);
                } catch (storageError) {
                  console.error("localStorage error:", storageError);
                  toast.error("Unable to save login session. Please check your browser settings.", { duration: 3000 });
                  return;
                }

                // 🔥 EXTRACT USER PROPERLY
                const normalizedUser = {
                  id: data.user.id, // ⭐ NOW EXISTS
                  name: data.user.name,
                  email: data.user.email,
                  roll: data.user.roll?.toLowerCase?.() ?? payload.roll,
                  profilePic: data.user.profilePic || payload.profilePic || "",
                  hostel: data.user.hostel,
                  phone: data.user.phone,
                };

                try {
                  localStorage.setItem("user", JSON.stringify(normalizedUser));
                } catch (storageError) {
                  console.error("localStorage error:", storageError);
                  toast.error("Unable to save user data. Please check your browser settings.", { duration: 3000 });
                  return;
                }

                if (!normalizedUser.hostel || !normalizedUser.phone) {
                  setUser(normalizedUser);
                  setShowCompleteProfile(true);
                  onProfileIncomplete?.();
                } else {
                  toast.success("Login success");
                  window.location.reload();
                }

              } catch (err) {
                console.error(err);
                if (err instanceof Error && err.name === 'AbortError') {
                  toast.error("Login timed out. Please check your connection and try again.");
                } else {
                  toast.error("Unable to sign in right now");
                }
              }
            }}
            onError={() => {
              setMessage("Google sign-in failed. Please try again.");
              toast.error("Google sign-in failed. Please try again.");
            }}
            useOneTap={false}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="300"
          />
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-orange-400">{message}</p>
        )}
      </div>

      {showCompleteProfile && user && (
        <CompleteProfileModal
          user={user}
          onDone={() => {
            setShowCompleteProfile(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
