import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "../../lib/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/links", label: "Links" },
];

export function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800">
        <h1 className="text-sm font-semibold tracking-wide">LINK ANALYTICS</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-slate-400 hover:text-slate-200 px-3 py-2"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
