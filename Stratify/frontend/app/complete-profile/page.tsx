"use client";

import { useState } from "react";

export default function CompleteProfile() {
  const [username, setUsername] = useState("");

  const handleSave = async () => {
    await fetch("/api/save-profile", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
    window.location.href = "/";
  };

  return (
    <div className="p-10">
      <h2>Complete Your Profile</h2>
      <input
        className="border p-2"
        placeholder="Choose a username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <button className="p-2 bg-blue-500 text-white" onClick={handleSave}>
        Save
      </button>
    </div>
  );
}
