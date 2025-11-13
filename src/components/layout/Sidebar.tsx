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
    <div className="flex h-screen w-72 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-20 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <Mic2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">VoiceAI</span>
            <p className="text-xs text-gray-500">Booking Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-gradient-primary text-white shadow-glow-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-soft">
              {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'Loading...'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
