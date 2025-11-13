import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Mic2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        navigate('/bookings');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84CC16]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#84CC16]/3 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md p-8 card-enhanced relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#84CC16] to-[#65A30D] shadow-lg shadow-[#84CC16]/20">
              <Mic2 className="h-7 w-7 text-black" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              AI Booking System
            </h1>
          </div>
          <p className="text-muted-foreground text-center text-base">
            Sign in to manage your bookings and calls
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg backdrop-blur-sm animate-shake">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="input-enhanced h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-200">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="input-enhanced h-11"
            />
          </div>

          <Button type="submit" className="w-full btn-primary h-11" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
