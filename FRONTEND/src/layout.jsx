import { Outlet } from "react-router-dom";
import Sidebar from "./page/home/Sidebar";
import Topbar from "./page/home/components/Topbar";
import { useEffect, useState } from "react";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">

      <div className="fixed top-0 left-0 right-0 z-40">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode((prev) => !prev)}
        />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex pt-14 min-h-screen">

        <aside className={`
          fixed left-0 top-12 bottom-0 z-30 transition-all duration-300 ease-in-out
          bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden
          ${sidebarOpen ? "w-60 translate-x-0" : "w-0 -translate-x-full md:w-16 md:translate-x-0"}
        `}>
          <Sidebar sidebarOpen={sidebarOpen} />
        </aside>

        <main className={`
          flex-1 transition-all duration-300 ease-in-out
          ${sidebarOpen ? "md:ml-60" : "md:ml-16"}
          w-full px-4 py-6 md:px-8 md:py-8
        `}>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;