import { useState } from "react";
import { apiUrl } from "../lib/api";

interface ProfileUser {
  id: number | string;
  hostel?: string;
  phone?: string;
}

interface CompleteProfileModalProps {
  user: ProfileUser;
  onDone: () => void;
}

export default function CompleteProfileModal({ user, onDone }: CompleteProfileModalProps) {
  const [hostel, setHostel] = useState(user.hostel ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const isPhoneLocked = Boolean(user.phone);

  const handleSave = async () => {
    const res = await fetch(apiUrl(`/api/users/${user.id}`), {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}` // ⭐ ADD THIS
  },
  body: JSON.stringify({
    hostel,
    phone
  })
});

    console.log("USER ID:", user.id);

    const updated = await res.json();
    const existingUser = JSON.parse(localStorage.getItem("user") || "null");
    const normalizedUser = {
      ...existingUser,
      ...updated,
      roll: updated.roll?.toLowerCase?.() ?? updated.roll,
      profilePic: existingUser?.profilePic || updated?.profilePic || "",
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    onDone();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200]">
      <div className="bg-[#111] p-6 rounded-2xl space-y-4 w-[350px]">

        <h2 className="text-lg font-bold">Complete Profile</h2>

        <input
          placeholder="Hostel & Room"
          onChange={(e) => setHostel(e.target.value)}
          className="input"
        />

        <input
          value={phone}
          placeholder="Phone Number"
          onChange={(e) => setPhone(e.target.value)}
          disabled={isPhoneLocked}
          className={`input ${isPhoneLocked ? "opacity-50 cursor-not-allowed" : ""}`}
        />

        {isPhoneLocked && (
          <p className="text-xs text-gray-500">
            Phone number cannot be changed once entered.
          </p>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 bg-orange-600 rounded-xl font-bold"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
