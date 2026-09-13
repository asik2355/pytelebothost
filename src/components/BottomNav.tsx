import React from "react";
import { Home, Server, CreditCard, ShoppingBag } from "lucide-react";

export type NavRoute = "/home" | "/services" | "/billing" | "/bot-store";

interface BottomNavProps {
  currentRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  isBotRunning?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onRouteChange,
  isBotRunning,
}) => {
  // English menu buttons requested by user: HOME, SERVICE, BILLING, BOT STORE (RUNNER removed)
  const navItems: Array<{
    route: NavRoute;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    hasBadge?: boolean;
  }> = [
    {
      route: "/home",
      name: "HOME",
      icon: Home,
    },
    {
      route: "/services",
      name: "SERVICE",
      icon: Server,
    },
    {
      route: "/billing",
      name: "BILLING",
      icon: CreditCard,
    },
    {
      route: "/bot-store",
      name: "BOT STORE",
      icon: ShoppingBag,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-3 sm:px-8 py-2"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md md:max-w-lg mx-auto flex items-center justify-around gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentRoute === item.route ||
            (item.route === "/home" && (currentRoute === ("/" as any) || currentRoute === "/home"));

          return (
            <button
              key={item.route}
              id={`nav-btn-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onRouteChange(item.route)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative group ${
                isActive
                  ? "text-sky-600 font-bold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium"
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-sky-500 rounded-full" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? "text-sky-600" : "text-slate-500"
                  }`}
                />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
                )}
              </div>

              <span className="text-[11px] sm:text-xs tracking-wider mt-1 whitespace-nowrap font-bold uppercase font-mono">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
