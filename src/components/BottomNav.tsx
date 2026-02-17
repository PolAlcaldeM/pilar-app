import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Mail, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/home', icon: Home, label: 'Inicio' },
  { path: '/habits', icon: BarChart3, label: 'Hábitos' },
  { path: '/letters', icon: Mail, label: 'Cartas' },
  { path: '/calendar', icon: Calendar, label: 'Calendario' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-1 rounded-2xl bg-primary/15"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={`relative z-10 transition-colors ${isActive ? 'text-primary-foreground stroke-[2.5]' : 'text-muted-foreground'}`}
                style={isActive ? { color: 'hsl(45 100% 45%)' } : undefined}
              />
              <span
                className={`relative z-10 text-[10px] mt-0.5 font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
