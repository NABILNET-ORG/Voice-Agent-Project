"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { businessConfigApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function IntegrationsManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await businessConfigApi.get(user!.id);
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessConfigApi.update(user!.id, config);
      setMessage("Integration settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="text-center py-12 text-gray-400">
          Configuration not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-gray-400 mt-2">Manage third-party integrations</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {message && (
        <Card className={message.includes('Error') ? 'bg-red-500/10 border-red-500' : 'bg-green-500/10 border-green-500'}>
          <CardContent className="pt-6">
            <p className={message.includes('Error') ? 'text-red-400' : 'text-green-400'}>{message}</p>
          </CardContent>
        </Card>
      )}

      {/* Google Calendar */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                📅 Google Calendar
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">Sync bookings with Google Calendar</p>
            </div>
            <Badge className={config.google_calendar_sync_enabled ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
              {config.google_calendar_sync_enabled ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.google_calendar_sync_enabled}
              onCheckedChange={(checked) => setConfig({...config, google_calendar_sync_enabled: checked})}
            />
            <Label className="text-gray-300">Enable Google Calendar Sync</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Calendar ID</Label>
            <Input
              value={config.google_calendar_id || 'primary'}
              onChange={(e) => setConfig({...config, google_calendar_id: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📧 Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.send_owner_email}
              onCheckedChange={(checked) => setConfig({...config, send_owner_email: checked})}
            />
            <Label className="text-gray-300">Send owner email notifications</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Owner Email</Label>
            <Input
              type="email"
              value={config.owner_notification_email || ''}
              onChange={(e) => setConfig({...config, owner_notification_email: e.target.value})}
              placeholder="owner@example.com"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={config.customer_notification_email}
              onCheckedChange={(checked) => setConfig({...config, customer_notification_email: checked})}
            />
            <Label className="text-gray-300">Send customer email confirmations</Label>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📱 SMS Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.send_owner_sms}
              onCheckedChange={(checked) => setConfig({...config, send_owner_sms: checked})}
            />
            <Label className="text-gray-300">Send owner SMS notifications</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Owner Phone Number</Label>
            <Input
              type="tel"
              value={config.owner_notification_phone || ''}
              onChange={(e) => setConfig({...config, owner_notification_phone: e.target.value})}
              placeholder="+1 234-567-8900"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={config.customer_notification_sms}
              onCheckedChange={(checked) => setConfig({...config, customer_notification_sms: checked})}
            />
            <Label className="text-gray-300">Send customer SMS confirmations</Label>
          </div>
        </CardContent>
      </Card>

      {/* Call Recording */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🎙️ Call Recording
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enable_call_recording}
              onCheckedChange={(checked) => setConfig({...config, enable_call_recording: checked})}
            />
            <Label className="text-gray-300">Enable call recording</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
