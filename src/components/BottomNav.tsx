import { Home, ArrowLeftRight, CreditCard, Coins, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ArrowLeftRight, label: "Convert", path: "/convert" },
  { icon: Coins, label: "Assets", path: "/assets" },
  { icon: CreditCard, label: "Cards", path: "/cards" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed z-50 bg-card/85 backdrop-blur-xl border border-border
      bottom-0 left-0 right-0 border-t pb-safe
      lg:bottom-6 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:rounded-2xl lg:border lg:shadow-elevated lg:pb-0">
      <div className="max-w-lg lg:max-w-none mx-auto flex items-center justify-around py-2 px-2 lg:px-4 lg:gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium font-body">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-accent mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
