import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Mic2 } from 'lucide-react';

export function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Auto-login and redirect after successful signup
        setTimeout(() => {
          navigate('/bookings');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84CC16]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#84CC16]/3 rounded-full blur-3xl" />
        </div>
        <Card className="w-full max-w-md p-8 bg-[#1A1A1A] border border-[#262626] shadow-lime-lg relative z-10 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-[#84CC16] to-[#65A30D] p-4 shadow-lg shadow-[#84CC16]/30">
                <Mic2 className="h-10 w-10 text-black" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white">
              Account Created!
            </h2>
            <p className="text-gray-400 text-base">
              Your account has been successfully created. Redirecting to your dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84CC16]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#84CC16]/3 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md p-8 bg-[#1A1A1A] border border-[#262626] shadow-lime-lg relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#84CC16] to-[#65A30D] shadow-lg shadow-[#84CC16]/20">
              <Mic2 className="h-7 w-7 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              AI Booking
            </h1>
          </div>
          <p className="text-gray-400 text-center text-base">
            Create your account to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 px-4 py-3 rounded-lg backdrop-blur-sm animate-shake">
              <p className="text-sm font-medium text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-gray-200">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
              className="h-11 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]/20"
            />
          </div>

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
              className="h-11 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]/20"
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
              autoComplete="new-password"
              minLength={6}
              className="h-11 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]/20"
            />
            <p className="text-xs text-gray-500">
              Must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-200">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              className="h-11 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]/20"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[#84CC16] to-[#65A30D] hover:from-[#65A30D] hover:to-[#84CC16] text-black font-semibold shadow-lime-md transition-all duration-200"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#84CC16] hover:text-[#65A30D] font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
