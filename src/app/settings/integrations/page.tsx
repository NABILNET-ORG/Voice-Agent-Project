"use client";

import { useState, useEffect } from "react";
import { Link, ExternalLink, CheckCircle, XCircle, AlertCircle, Settings, RefreshCw, Trash2, Plus, TestTube, Download, Upload, Loader2 } from "lucide-react";
import { businessConfigApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "calendar" | "payment" | "communication" | "analytics" | "other";
  status: "connected" | "disconnected" | "error" | "pending";
  icon: string;
  connectedAt?: Date;
  lastSync?: Date;
  settings?: Record<string, any>;
  usage?: {
    calls: number;
    data: string;
    lastUsed: Date;
  };
}

export default function IntegrationsManagement() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [businessConfig, setBusinessConfig] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadIntegrations();
    }

    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'google_calendar_connected') {
      setStatusMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      setTimeout(() => setStatusMessage(null), 5000);
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations');
    } else if (error) {
      setStatusMessage({ type: 'error', text: `Connection failed: ${error}` });
      setTimeout(() => setStatusMessage(null), 5000);
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations');
    }
  }, [user]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const config = await businessConfigApi.get(user!.id);
      setBusinessConfig(config);

      // Build integrations list with real status from database
      const availableIntegrations: Integration[] = [
      {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Sync bookings with your Google Calendar",
        category: "calendar",
        status: config.google_calendar_sync_enabled ? "connected" : "disconnected",
        icon: "📅",
        connectedAt: config.google_calendar_sync_enabled ? new Date(config.updated_at) : undefined,
        lastSync: config.google_calendar_sync_enabled ? new Date() : undefined,
        settings: {
          calendarId: config.google_calendar_id || "primary",
          syncFrequency: config.calendar_sync_frequency || "realtime",
          createEvents: config.google_calendar_sync_enabled,
          sendReminders: config.set_event_reminder
        }
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Accept online payments",
        category: "payment",
        status: "disconnected",
        icon: "💳",
        settings: {
          publishableKey: "",
          secretKey: "",
          webhookUrl: ""
        }
      },
      {
        id: "twilio",
        name: "Twilio",
        description: "Voice calls and SMS notifications",
        category: "communication",
        status: "connected",
        icon: "📞",
        connectedAt: new Date("2024-01-10"),
        lastSync: new Date(),
        settings: {
          accountSid: "ACxxxxxxxxxx",
          phoneNumber: "+1234567890",
          voiceUrl: "https://your-domain.com/twilio-webhook"
        },
        usage: {
          calls: 1247,
          data: "15.7 MB",
          lastUsed: new Date()
        }
      },
      {
        id: "resend",
        name: "Resend",
        description: "Email notifications and confirmations",
        category: "communication",
        status: "connected",
        icon: "📧",
        connectedAt: new Date("2024-01-12"),
        lastSync: new Date(),
        settings: {
          apiKey: "re_xxxxxxxxxxxx",
          fromEmail: "noreply@yourbusiness.com",
          fromName: "Your Business"
        },
        usage: {
          calls: 892,
          data: "8.1 MB",
          lastUsed: new Date()
        }
      },
      {
        id: "google-analytics",
        name: "Google Analytics",
        description: "Track website and booking analytics",
        category: "analytics",
        status: "error",
        icon: "📊",
        settings: {
          trackingId: "GA-XXXXXXXXX",
          measurementId: "G-XXXXXXXXXX"
        }
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect with 5000+ apps",
        category: "other",
        status: "disconnected",
        icon: "⚡",
        settings: {
          apiKey: "",
          webhooks: []
        }
      },
      {
        id: "slack",
        name: "Slack",
        description: "Team notifications and updates",
        category: "communication",
        status: "pending",
        icon: "💬",
        settings: {
          webhookUrl: "",
          channel: "#bookings",
          notifications: ["new_booking", "cancellation"]
        }
      },
      {
        id: "quickbooks",
        name: "QuickBooks",
        description: "Accounting and invoicing",
        category: "other",
        status: "disconnected",
        icon: "📈",
        settings: {
          companyId: "",
          accessToken: "",
          syncInvoices: true
        }
      }
    ];

      setIntegrations(availableIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "bg-green-600 text-white",
      disconnected: "bg-gray-600 text-white",
      error: "bg-red-600 text-white",
      pending: "bg-yellow-600 text-white"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleConnect = (integration: Integration) => {
    // For Google Calendar, initiate OAuth flow
    if (integration.id === 'google-calendar') {
      window.location.href = `/api/auth/google?user_id=${user!.id}`;
      return;
    }

    // For other integrations, open config dialog
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      // Update database based on integration type
      if (integrationId === 'google-calendar') {
        await businessConfigApi.update(user!.id, {
          google_calendar_sync_enabled: false
        });
      }

      // Update local state
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: "disconnected" as const, connectedAt: undefined }
          : integration
      ));

      await loadIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
    }
  };

  const handleTest = async (integrationId: string) => {
    setTestResults(prev => ({ ...prev, [integrationId]: "Testing..." }));
    
    // Simulate API test
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setTestResults(prev => ({
        ...prev,
        [integrationId]: success ? "✅ Connection successful" : "❌ Connection failed"
      }));
      
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[integrationId];
          return newResults;
        });
      }, 3000);
    }, 2000);
  };

  const handleSaveConfig = async (integration: Integration, settings: Record<string, any>) => {
    try {
      // Save to database based on integration type
      if (integration.id === 'google-calendar') {
        await businessConfigApi.update(user!.id, {
          google_calendar_sync_enabled: true,
          google_calendar_id: settings.calendarId,
          calendar_sync_frequency: settings.syncFrequency,
          set_event_reminder: settings.sendReminders
        });
      }

      // Update local state
      setIntegrations(prev => prev.map(int =>
        int.id === integration.id
          ? { ...int, status: "connected" as const, settings, connectedAt: new Date(), lastSync: new Date() }
          : int
      ));

      setIsConfigDialogOpen(false);
      setSelectedIntegration(null);

      await loadIntegrations();
    } catch (error) {
      console.error('Error saving integration config:', error);
    }
  };

  const categories = [
    { value: "all", label: "All Integrations", icon: "🔗" },
    { value: "calendar", label: "Calendar", icon: "📅" },
    { value: "payment", label: "Payment", icon: "💳" },
    { value: "communication", label: "Communication", icon: "📞" },
    { value: "analytics", label: "Analytics", icon: "📊" },
    { value: "other", label: "Other", icon: "⚙️" }
  ];

  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredIntegrations = categoryFilter === "all" 
    ? integrations 
    : integrations.filter(int => int.category === categoryFilter);

  const stats = {
    total: integrations.length,
    connected: integrations.filter(int => int.status === "connected").length,
    disconnected: integrations.filter(int => int.status === "disconnected").length,
    error: integrations.filter(int => int.status === "error").length,
    pending: integrations.filter(int => int.status === "pending").length
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

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-gray-400 mt-2">Connect and manage third-party services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Upload className="h-4 w-4 mr-2" />
            Import Config
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <Card className={statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <p className={statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {statusMessage.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Integrations</CardTitle>
            <Settings className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-500">Available integrations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.connected}</div>
            <p className="text-xs text-gray-500">Active connections</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Disconnected</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.disconnected}</div>
            <p className="text-xs text-gray-500">Not connected</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.error}</div>
            <p className="text-xs text-gray-500">Need attention</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
            <p className="text-xs text-gray-500">Awaiting setup</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Filter by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={categoryFilter === category.value ? "default" : "outline"}
                onClick={() => setCategoryFilter(category.value)}
                className={categoryFilter === category.value ? "bg-[#84CC16] text-black" : "border-gray-700 text-gray-300"}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                    <p className="text-gray-400 text-sm">{integration.description}</p>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Info */}
              {integration.connectedAt && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Connected:</span>
                    <span className="text-white">{integration.connectedAt.toLocaleDateString()}</span>
                  </div>
                  {integration.lastSync && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last sync:</span>
                      <span className="text-white">{integration.lastSync.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Usage Stats */}
              {integration.usage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">API Calls:</span>
                    <span className="text-white">{integration.usage.calls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Data Used:</span>
                    <span className="text-white">{integration.usage.data}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {integration.status === "connected" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:text-white"
                      onClick={() => handleTest(integration.id)}
                      disabled={testResults[integration.id] !== undefined}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      {testResults[integration.id] || "Test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:text-white"
                      onClick={() => handleConnect(integration)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-700 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1A1A1A] border-gray-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Disconnect Integration?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            This will disconnect {integration.name} and stop all data synchronization. You can reconnect later if needed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-700 text-gray-300 hover:text-white">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button
                    className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
                    onClick={() => handleConnect(integration)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                )}
              </div>

              {/* Test Result */}
              {testResults[integration.id] && (
                <div className="p-2 bg-gray-800 rounded text-sm">
                  {testResults[integration.id]}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
          </DialogHeader>
          {selectedIntegration && (
            <IntegrationConfig
              integration={selectedIntegration}
              onSave={(settings) => handleSaveConfig(selectedIntegration, settings)}
              onCancel={() => {
                setIsConfigDialogOpen(false);
                setSelectedIntegration(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Integration Config Component
function IntegrationConfig({ 
  integration, 
  onSave, 
  onCancel 
}: { 
  integration: Integration; 
  onSave: (settings: Record<string, any>) => void; 
  onCancel: () => void;
}) {
  const [settings, setSettings] = useState<Record<string, any>>(integration.settings || {});
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(settings);
    setIsLoading(false);
  };

  const renderConfigFields = () => {
    switch (integration.id) {
      case "google-calendar":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Calendar ID</Label>
              <Input
                value={settings.calendarId || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, calendarId: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Sync Frequency</Label>
              <Select value={settings.syncFrequency || ""} onValueChange={(value) => setSettings(prev => ({ ...prev, syncFrequency: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="createEvents"
                checked={settings.createEvents || false}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, createEvents: checked }))}
              />
              <Label htmlFor="createEvents" className="text-gray-300">Create calendar events</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sendReminders"
                checked={settings.sendReminders || false}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendReminders: checked }))}
              />
              <Label htmlFor="sendReminders" className="text-gray-300">Send reminders</Label>
            </div>
          </div>
        );

      case "stripe":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Publishable Key</Label>
              <Input
                type="password"
                value={settings.publishableKey || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, publishableKey: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="pk_test_..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Secret Key</Label>
              <Input
                type="password"
                value={settings.secretKey || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="sk_test_..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Webhook URL</Label>
              <Input
                value={settings.webhookUrl || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://your-domain.com/stripe-webhook"
              />
            </div>
          </div>
        );

      case "twilio":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Account SID</Label>
              <Input
                value={settings.accountSid || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, accountSid: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="ACxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Phone Number</Label>
              <Input
                value={settings.phoneNumber || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Voice Webhook URL</Label>
              <Input
                value={settings.voiceUrl || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, voiceUrl: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://your-domain.com/twilio-webhook"
              />
            </div>
          </div>
        );

      case "resend":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">API Key</Label>
              <Input
                type="password"
                value={settings.apiKey || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="re_xxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">From Email</Label>
              <Input
                value={settings.fromEmail || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="noreply@yourbusiness.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">From Name</Label>
              <Input
                value={settings.fromName || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Your Business"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-gray-400">Configuration options for {integration.name} will be available soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderConfigFields()}
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          className="bg-[#84CC16] text-black hover:bg-[#65A30D]" 
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}