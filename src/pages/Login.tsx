import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Mic2, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex bg-black">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-[#141414] border-r border-[#262626] text-white relative overflow-hidden">
        {/* Subtle lime green glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84CC16]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#84CC16]/3 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#84CC16] to-[#65A30D] flex items-center justify-center shadow-lime-md">
              <Mic2 className="h-7 w-7 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#84CC16]">AI Booking</h1>
              <p className="text-gray-400 text-sm">Voice Assistant</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              AI-Powered Voice<br/>Booking System
            </h2>
            <p className="text-lg text-gray-300">
              Automate your bookings with intelligent voice AI. Handle calls 24/7, manage schedules, and grow your business effortlessly.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-gray-300">
            <div className="h-8 w-8 rounded-full bg-[#84CC16]/20 flex items-center justify-center text-sm font-bold text-[#84CC16]">✓</div>
            <span>24/7 Automated Booking</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="h-8 w-8 rounded-full bg-[#84CC16]/20 flex items-center justify-center text-sm font-bold text-[#84CC16]">✓</div>
            <span>Real-time Analytics</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="h-8 w-8 rounded-full bg-[#84CC16]/20 flex items-center justify-center text-sm font-bold text-[#84CC16]">✓</div>
            <span>Calendar Integration</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#84CC16]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#84CC16]/3 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md p-8 bg-[#1A1A1A] border border-[#262626] shadow-lime-lg relative z-10">
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Welcome back</h3>
            <p className="text-gray-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-200">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="h-12 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="h-12 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#84CC16] to-[#65A30D] hover:from-[#65A30D] hover:to-[#84CC16] text-black font-semibold shadow-lime-md transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-[#84CC16] hover:text-[#65A30D] transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
