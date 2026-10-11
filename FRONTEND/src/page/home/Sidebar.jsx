import { Button } from "@/components/ui/button"
import { useNavigate, useLocation } from "react-router-dom"
import {
  MdHome,
  MdSubscriptions,
  MdHistory,
  MdThumbUp,
} from "react-icons/md"

const NAV_ITEMS = [
  { label: "Home", to: "/", icon: MdHome },
  { label: "Subscriptions", to: "/subscriptions", icon: MdSubscriptions },
]

const LIBRARY_ITEMS = [
  { label: "History", to: "/feed/history", icon: MdHistory },
  { label: "Liked videos", to: "/liked-videos", icon: MdThumbUp },
]

const SidebarItem = ({ label, open, to, icon: Icon }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(to)}
      title={!open ? label : undefined}
      className={`
        w-full transition-all duration-200
        text-gray-700 dark:text-zinc-200
        hover:bg-gray-100 dark:hover:bg-zinc-900
        ${open
          ? "justify-start px-3 gap-3 h-10"
          : "justify-center flex-col gap-0.5 h-auto py-2 px-0"
        }
        ${isActive ? "bg-gray-100 dark:bg-zinc-900 font-semibold" : ""}
      `}
    >
      <Icon className={`flex-shrink-0 ${open ? "text-xl" : "text-2xl"}`} />
      {open
        ? <span className="text-sm">{label}</span>
        : <span className="text-[10px] font-medium leading-tight">{label.split(" ")[0]}</span>
      }
    </Button>
  )
}

const Sidebar = ({ sidebarOpen }) => {
  return (
    <div className="flex flex-col h-full py-2">
      <nav className="space-y-1 px-2">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.label}
            label={item.label}
            to={item.to}
            icon={item.icon}
            open={sidebarOpen}
          />
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 px-2">
        {sidebarOpen && (
          <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400">
            Library
          </p>
        )}
        <nav className="space-y-1">
          {LIBRARY_ITEMS.map((item) => (
            <SidebarItem
              key={item.label}
              label={item.label}
              to={item.to}
              icon={item.icon}
              open={sidebarOpen}
            />
          ))}
        </nav>
      </div>
    </div>
  )
}

export default Sidebar