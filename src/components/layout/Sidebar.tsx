import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Phone,
  Settings,
  BarChart3,
  User,
  Mic2,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

const navigation = [
  { name: 'Live Demo', href: '/demo', icon: Mic2 },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Call History', href: '/calls', icon: Phone },
  { name: 'Business Settings', href: '/settings', icon: Settings },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Account', href: '/account', icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-[#141414] border-r border-[#262626]">
      {/* User Email at Top */}
      <div className="px-4 py-4 border-b border-[#262626]">
        <p className="text-xs text-gray-400 truncate">
          {user?.email || 'Loading...'}
        </p>
      </div>

      {/* Logo */}
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-[#84CC16]">AI Booking</h1>
        <p className="text-sm text-gray-400 mt-1">Voice Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-[#84CC16] text-black shadow-lime-glow'
                  : 'text-gray-300 hover:bg-[#202020] hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#262626] p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#202020]"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
