// components/Header.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";
import { useAlertStore } from "@/app/store/alertStore";
import { updateUserApi, uploadProfilePicApi } from "@/lib/userapi";
import { motion, AnimatePresence } from "framer-motion";

const Header: React.FC = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  
  // Track if it's the first load
  const [isFirstLoad, setIsFirstLoad] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("headerAnimated")) {
      setIsFirstLoad(true);
      sessionStorage.setItem("headerAnimated", "true");
    }
  }, []);

  const { alerts, unreadCount, notificationsEnabled, toggleNotifications, clearUnread } = useAlertStore();

  // Profile Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hover state for nav links
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("userData");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || "");
        setEmail(user.email || "");
        setOriginalEmail(user.email || "");
        if (user.profile_pic) {
          if (user.profile_pic.startsWith("http")) {
            setProfilePic(user.profile_pic);
          } else {
            setProfilePic(`http://localhost:4000${user.profile_pic}`);
          }
        }
      } catch (e) {
        console.error("Error parsing userData", e);
      }
    }
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setLoadingProfile(true);
    try {
      const userStr = localStorage.getItem("userData");
      if (!userStr || !originalEmail) throw new Error("User not found in storage");
      const user = JSON.parse(userStr);

      let newPicUrl = user.profile_pic;
      if (selectedFile) {
        const userId = user.id || user._id;
        if (!userId) throw new Error("User ID not found");
        const picRes = await uploadProfilePicApi(userId, selectedFile);
        if (newPicUrl.startsWith("http")) {
          setProfilePic(newPicUrl);
        } else {
          setProfilePic(`http://localhost:4000${newPicUrl}`);
        }
      }

      let updatedUser = user;
      if (username !== user.username || email !== originalEmail) {
        const updateRes = await updateUserApi(originalEmail, { username, email });
        updatedUser = updateRes.user;
      }

      updatedUser.profile_pic = newPicUrl;
      localStorage.setItem("userData", JSON.stringify({ ...user, ...updatedUser }));

      if (email !== originalEmail) {
        setProfileMsg("Email updated! Redirecting to verification...");
        localStorage.setItem("email", email);
        setTimeout(() => router.push("/otpverification"), 1000);
      } else {
        setProfileMsg("Profile updated successfully!");
        setProfileOpen(false);
      }
    } catch (err: any) {
      setProfileMsg(err.message || "Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/Dashboard" },
    { name: "Strategy Builder", path: "/CreateStrategyPage" },
    { name: "Backtests", path: "/BacktestPage" },
    { name: "Portfolios", path: "/PortfolioPage" },
    { name: "Community", path: "/CommunityFeedPage" },
  ];

  return (
    <motion.header
      initial={isFirstLoad ? { y: -64, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`sticky top-0 z-10 w-full backdrop-blur-md border-b ${
        darkMode
          ? "bg-[#230f0f]/95 border-[#2d2d2d]/50"
          : "bg-[#f8f5f5]/80 border-[#e5e7eb]/50"
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Mobile Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`md:hidden flex items-center justify-center text-2xl ${
            darkMode ? "text-white" : "text-black"
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </motion.button>

        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-1 cursor-pointer ${
            darkMode ? "text-gray-100" : "text-gray-800"
          } mx-auto md:mx-0`}
          onClick={() => router.push("/Dashboard")}
          style={{ originX: 0 }}
        >
          <motion.svg
            className="w-6 h-6 text-[#f90606]"
            fill="currentColor"
            viewBox="0 0 48 48"
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
          >
            <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" />
          </motion.svg>
          <h2 className="text-lg font-bold">Stratify</h2>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex ml-16 items-center gap-2 mx-auto">
          {menuItems.map((item) => (
            <motion.a
              key={item.name}
              onClick={() => router.push(item.path)}
              onHoverStart={() => setHoveredNav(item.name)}
              onHoverEnd={() => setHoveredNav(null)}
              className={`relative text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
              whileHover={{ color: "#f90606" }}
              transition={{ duration: 0.15 }}
            >
              {item.name}
              {/* Animated underline */}
              <motion.span
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                style={{ background: "#f90606", originX: 0 }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  hoveredNav === item.name
                    ? { scaleX: 1, opacity: 1 }
                    : { scaleX: 0, opacity: 0 }
                }
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </motion.a>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex flex-1 justify-end items-center gap-2">
          {/* New Strategy Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 16px rgba(249,6,6,0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/CreateStrategyPage")}
            className="hidden md:flex h-10 px-4 py-2 rounded-lg font-bold text-sm text-white bg-[#f90606]"
          >
            + New Strategy
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (!notificationsOpen) clearUnread();
              }}
              className={`hidden md:flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm border relative ${
                darkMode
                  ? "bg-[#1a1a1a] border-[#2d2d2d] text-white"
                  : "bg-white border-[#e5e7eb] text-black"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {notificationsEnabled ? "notifications" : "notifications_off"}
              </span>
              {notificationsEnabled && unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold border border-white dark:border-gray-900"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`absolute right-0 top-12 mt-2 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                    darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-gray-200"
                  }`}
                >
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? "border-[#2d2d2d]" : "border-gray-100"}`}>
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Trade Alerts
                    </h3>
                    <button
                      onClick={toggleNotifications}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      {notificationsEnabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {!notificationsEnabled ? (
                      <div className="p-8 text-center text-gray-500">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">
                          notifications_off
                        </span>
                        <p className="text-sm">Notifications disabled</p>
                      </div>
                    ) : alerts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">No new alerts</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {alerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className={`p-4 border-b last:border-0 ${darkMode ? "border-[#2d2d2d]" : "border-gray-100"}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`material-symbols-outlined text-lg mt-0.5 ${alert.type === "buy" ? "text-green-500" : "text-red-500"}`}>
                                {alert.type === "buy" ? "arrow_upward" : "arrow_downward"}
                              </span>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                  {alert.text}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dark mode toggle */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`flex h-10 px-2.5 rounded-lg font-bold text-sm border ${
              darkMode
                ? "bg-[#1a1a1a] border-[#2d2d2d] text-white"
                : "bg-white border-[#e5e7eb] text-black"
            }`}
            onClick={toggleTheme}
          >
            <span className="material-symbols-outlined text-xl mt-1">dark_mode</span>
          </motion.button>

          {/* Profile avatar */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setProfileOpen(true)}
            className={`bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0 ${
              darkMode ? "bg-[#1a1a1a] border border-[#2d2d2d]" : "bg-white border border-[#e5e7eb]"
            }`}
            style={{
              backgroundImage: profilePic
                ? `url('${profilePic}')`
                : "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBaUJB8pEnUmzv3LH_A7MuXo9A-P0eS4MvoFTKwYUqHXBquSsZv-67HqYfHXZEKUeCsOCDy1I431YiE-pmkGWaoitdl4B2PkdrCvdxtLzFCvFRYXuraquPzCTqqRb_dutsU6Um8j04aXwV2v0hTztFT5GqhC3kP_Fhwk4UuWcoi1N1WAWhrkqmB3FmMeew_tsbwhRtM5iui-3azKw1PrtR5aDHyOc0U7zXWnB7utYX3AiVabB6fNO089r_CJvXasltKjWPCs2N-sWRv')",
            }}
          />
        </div>
      </div>

      {/* Profile Slide-in Panel */}
      {profileOpen && typeof document !== "undefined" && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={() => setProfileOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className={`fixed top-0 right-0 h-full w-full max-w-sm z-[100] shadow-2xl flex flex-col ${
              darkMode ? "bg-[#111] border-l border-[#2d2d2d] text-white" : "bg-white border-l border-gray-200 text-black"
            }`}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-[#2d2d2d]" : "border-gray-100"}`}>
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setProfileOpen(false)}
                className={`p-1.5 rounded-full ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <span className="material-symbols-outlined block text-xl">close</span>
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="size-24 rounded-full bg-cover bg-center border-2 border-dashed border-gray-400 relative group overflow-hidden cursor-pointer"
                    style={{
                      backgroundImage: profilePic
                        ? `url('${profilePic}')`
                        : "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBaUJB8pEnUmzv3LH_A7MuXo9A-P0eS4MvoFTKwYUqHXBquSsZv-67HqYfHXZEKUeCsOCDy1I431YiE-pmkGWaoitdl4B2PkdrCvdxtLzFCvFRYXuraquPzCTqqRb_dutsU6Um8j04aXwV2v0hTztFT5GqhC3kP_Fhwk4UuWcoi1N1WAWhrkqmB3FmMeew_tsbwhRtM5iui-3azKw1PrtR5aDHyOc0U7zXWnB7utYX3AiVabB6fNO089r_CJvXasltKjWPCs2N-sWRv')",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                    </div>
                  </motion.div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <p className="text-sm font-medium opacity-60">Tap to change avatar</p>
                </div>

                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 opacity-80">Username</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:border-[#f90606] transition-colors ${
                        darkMode ? "bg-[#1a1a1a] border-[#333] text-white" : "bg-gray-50 border-gray-200 text-black"
                      }`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 opacity-80">Email</label>
                    <input
                      type="email"
                      className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:border-[#f90606] transition-colors ${
                        darkMode ? "bg-[#1a1a1a] border-[#333] text-white" : "bg-gray-50 border-gray-200 text-black"
                      }`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {email !== originalEmail && (
                      <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Changing email requires OTP verification.
                      </p>
                    )}
                  </div>
                </div>

                {profileMsg && (
                  <div className={`p-3 rounded-lg text-sm font-medium text-center ${
                    profileMsg.includes("Failed") || profileMsg.includes("Error")
                      ? "bg-red-500/10 text-red-500"
                      : "bg-green-500/10 text-green-500"
                  }`}>
                    {profileMsg}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loadingProfile}
                  whileHover={!loadingProfile ? { scale: 1.02 } : {}}
                  whileTap={!loadingProfile ? { scale: 0.98 } : {}}
                  className="w-full py-3.5 rounded-lg bg-[#f90606] text-white font-bold hover:bg-[#e30606] transition-colors disabled:opacity-50 mt-4"
                >
                  {loadingProfile ? "Saving..." : "Save Changes"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>,
        document.body
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`md:hidden fixed top-16 left-0 h-full w-54 p-6 flex flex-col gap-4 ${
              darkMode ? "bg-black text-gray-200" : "bg-white/95 text-gray-800"
            } shadow-lg z-50`}
          >
            {menuItems.map((item) => (
              <a
                key={item.name}
                onClick={() => {
                  router.push(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                  darkMode ? "hover:bg-gray-700/40 hover:text-[#f90606]" : "hover:bg-gray-200/40 hover:text-[#f90606]"
                }`}
              >
                {item.name}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
