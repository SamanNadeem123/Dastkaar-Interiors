import { NavLink, useLocation } from "react-router-dom";

export default function AccountTabs() {
  const location = useLocation();
  const tabs = [
    { to: "/account/profile", label: "Profile" },
    { to: "/account/orders", label: "My Orders" },
  ];
  return (
    <div className="mb-8 flex gap-2 border-b border-charcoal/10">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={`px-1 pb-3 text-sm font-medium transition-colors ${
            location.pathname === t.to || (t.to === "/account/profile" && location.pathname === "/account")
              ? "border-b-2 border-walnut text-charcoal"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
