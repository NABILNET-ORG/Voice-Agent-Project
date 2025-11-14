"use client";

import { useState } from "react";
import { User, Mail, Phone, Globe, Clock, Shield, CreditCard, Download, Trash2, Key, Smartphone, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AccountSettings() {
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1 234-567-8900",
    language: "en",
    timezone: "America/New_York"
  });

  const [usage, setUsage] = useState({
    calls: 245,
    bookings: 89,
    storage: 2.3
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const plans = {
    free: { name: "Free", calls: "100", bookings: "50", storage: "1 GB" },
    pro: { name: "Pro", calls: "1000", bookings: "500", storage: "10 GB" },
    enterprise: { name: "Enterprise", calls: "Unlimited", bookings: "Unlimited", storage: "100 GB" }
  };

  const currentPlan = "free";

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400 mt-2">Manage your profile and account preferences</p>
        </div>
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Profile Section */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/avatars/default.svg" alt="Profile" />
              <AvatarFallback className="text-lg bg-[#84CC16] text-black">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                Change Avatar
              </Button>
              <p className="text-gray-400 text-sm mt-2">JPG, PNG or GIF. Max size 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-800 border-gray-700 text-white opacity-50"
              />
              <p className="text-gray-500 text-sm">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-gray-300">Language Preference</Label>
              <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="bg-[#84CC16] text-black hover:bg-[#65A30D]">
            Save Profile Changes
          </Button>
        </CardContent>
      </Card>

      {/* Subscription & Billing */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Subscription & Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-medium">Current Plan</h3>
                <Badge variant="secondary" className="bg-[#84CC16] text-black">
                  {plans[currentPlan as keyof typeof plans].name}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mt-1">Manage your subscription and billing</p>
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-[#84CC16]" />
                <span className="text-gray-300 text-sm">Calls Made</span>
              </div>
              <p className="text-2xl font-bold text-white">{usage.calls}</p>
              <p className="text-gray-500 text-sm">of {plans[currentPlan as keyof typeof plans].calls}</p>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-[#84CC16]" />
                <span className="text-gray-300 text-sm">Bookings</span>
              </div>
              <p className="text-2xl font-bold text-white">{usage.bookings}</p>
              <p className="text-gray-500 text-sm">of {plans[currentPlan as keyof typeof plans].bookings}</p>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-[#84CC16]" />
                <span className="text-gray-300 text-sm">Storage</span>
              </div>
              <p className="text-2xl font-bold text-white">{usage.storage} GB</p>
              <p className="text-gray-500 text-sm">of {plans[currentPlan as keyof typeof plans].storage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-gray-400 text-sm">Update your account password</p>
                </div>
              </div>
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Active Sessions</p>
                  <p className="text-gray-400 text-sm">Manage your active sessions</p>
                </div>
              </div>
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                View Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-gray-400 text-sm">Receive booking confirmations and updates via email</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator className="bg-gray-800" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white font-medium">SMS Notifications</p>
              <p className="text-gray-400 text-sm">Receive booking confirmations via SMS</p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-[#1A1A1A] border-red-900">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
              <p className="text-white font-medium">Export All Data</p>
              <p className="text-gray-400 text-sm">Download all your account data</p>
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-700 text-red-500 hover:text-red-400 hover:bg-red-900/20">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1A1A1A] border-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-700 text-gray-300 hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}