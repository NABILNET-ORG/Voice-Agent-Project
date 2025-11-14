"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Phone, Mail, Lock, User, Building, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            business_name: formData.businessName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile record
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            business_name: formData.businessName,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Non-fatal - profile might be created by trigger
        }

        // 3. Create business config record with defaults
        const { error: configError } = await supabase
          .from("business_config")
          .insert({
            user_id: authData.user.id,
            business_name: formData.businessName || "My Business",
            business_type: "other",
            language: "en",
            timezone: "America/New_York",
            currency: "USD",
            ai_voice: "alloy",
            ai_personality: "professional",
            system_instructions: "You are a helpful AI assistant for booking appointments.",
            services: [],
            business_hours: {
              monday: { enabled: true, open: "09:00", close: "17:00" },
              tuesday: { enabled: true, open: "09:00", close: "17:00" },
              wednesday: { enabled: true, open: "09:00", close: "17:00" },
              thursday: { enabled: true, open: "09:00", close: "17:00" },
              friday: { enabled: true, open: "09:00", close: "17:00" },
              saturday: { enabled: false, open: "09:00", close: "17:00" },
              sunday: { enabled: false, open: "09:00", close: "17:00" },
            },
          });

        if (configError) {
          console.error("Business config creation error:", configError);
          // Non-fatal - config might be created by trigger
        }

        setSuccess(true);

        // Check if email confirmation is required
        if (authData.session) {
          // Auto-confirmed, redirect to dashboard with hard redirect
          setTimeout(() => {
            window.location.href = "/settings";
          }, 2000);
        } else {
          // Email confirmation required
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        }
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md bg-[#1A1A1A] border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-950 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-[#84CC16]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Account Created!</h2>
              <p className="text-gray-400">
                Your account has been successfully created. You will be redirected shortly...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-[#84CC16] mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#84CC16] to-[#65a30d] flex items-center justify-center shadow-lg shadow-[#84CC16]/20">
              <Phone className="h-8 w-8 text-black" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Get Started</h1>
          <p className="text-gray-400">Create your AI Booking account</p>
        </div>

        {/* Signup Form */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert className="bg-red-950/50 border-red-900">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium text-gray-300">
                  Business Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="My Awesome Business"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
                <p className="text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#84CC16] to-[#65a30d] text-black font-semibold hover:from-[#a3e635] hover:to-[#84CC16] transition-all shadow-lg shadow-[#84CC16]/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#84CC16] hover:text-[#a3e635] font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
