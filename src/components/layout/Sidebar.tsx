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

const navigation = [
  { name: 'Live Demo', href: '/demo', icon: Mic2 },
  { name: 'Appointments', href: '/bookings', icon: Calendar },
  { name: 'Call History', href: '/calls', icon: Phone },
  { name: 'Business Settings', href: '/settings', icon: Settings },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Account', href: '/account', icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo & Branding */}
      <div className="px-6 py-6 border-b border-muted">
        <h1 className="text-2xl font-bold text-primary">AI Booking</h1>
        <p className="text-sm text-muted-foreground mt-1">Voice Assistant</p>
      </div>

      {/* User Email */}
      <div className="px-6 py-4 border-b border-muted">
        <p className="text-sm text-muted-foreground truncate">
          {user?.email || 'Loading...'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
