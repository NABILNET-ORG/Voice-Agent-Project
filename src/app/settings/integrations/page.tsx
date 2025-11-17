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
  category: "calendar" | "payment" | "communication" | "analytics" | "ai" | "other";
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
  // Check URL params once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    console.log('Integrations page loaded, checking URL params:', { success, error });

    if (success === 'google_calendar_connected') {
      setStatusMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations');
      // Clear any test results to avoid duplicate messages
      setTestResults({});
      // Reload integrations immediately to show new status
      if (user?.id) {
        loadIntegrations();
      }
      // Clear success message after delay
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } else if (error) {
      const message = params.get('message') || error;
      setStatusMessage({ type: 'error', text: `Connection failed: ${message}` });
      setTimeout(() => setStatusMessage(null), 5000);
      window.history.replaceState({}, '', '/settings/integrations');
    }
  }, [user]);

  // Load integrations data when user is ready
  useEffect(() => {
    if (user?.id) {
      loadIntegrations();
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
        id: "openai",
        name: "OpenAI",
        description: "GPT models for voice agent and knowledge base summarization",
        category: "ai",
        status: config.openai_api_key ? "connected" : "disconnected",
        icon: "🤖",
        connectedAt: config.openai_api_key ? new Date(config.updated_at) : undefined,
        settings: {
          apiKey: config.openai_api_key || "",
          apiKeyGeneral: config.openai_api_key_general || config.openai_api_key || "",
          apiKeyVoice: config.openai_api_key_voice || "",
          modelName: config.ai_model_name || "gpt-4o-realtime-preview-2024-12-17",
          provider: "openai",
          useForSummarization: config.ai_summarization_provider === 'openai' || !config.ai_summarization_provider,
          useForAnalytics: config.ai_analytics_provider === 'openai' || false,
          useForTranscription: config.ai_transcription_provider === 'openai' || false
        },
        usage: config.openai_api_key ? {
          calls: 0,
          data: "Configured",
          lastUsed: new Date()
        } : undefined
      },
      {
        id: "gemini",
        name: "Google Gemini",
        description: "Google's AI models for advanced reasoning and multimodal tasks",
        category: "ai",
        status: config.gemini_api_key ? "connected" : "disconnected",
        icon: "✨",
        connectedAt: config.gemini_api_key ? new Date(config.updated_at) : undefined,
        settings: {
          apiKey: config.gemini_api_key || "",
          apiKeyGeneral: config.gemini_api_key_general || config.gemini_api_key || "",
          apiKeyVoice: config.gemini_api_key_voice || "",
          modelName: (config.ai_voice_agent_provider === 'gemini' || config.ai_summarization_provider === 'gemini')
            ? (config.ai_model_name || "gemini-2.5-flash")
            : "gemini-2.5-flash",
          provider: "gemini",
          useForSummarization: config.ai_summarization_provider === 'gemini' || false,
          useForAnalytics: config.ai_analytics_provider === 'gemini' || false,
          useForTranscription: config.ai_transcription_provider === 'gemini' || false
        }
      },
      {
        id: "openrouter",
        name: "OpenRouter",
        description: "Access multiple AI models through a unified API",
        category: "ai",
        status: config.openrouter_api_key ? "connected" : "disconnected",
        icon: "⚡",
        connectedAt: config.openrouter_api_key ? new Date(config.updated_at) : undefined,
        settings: {
          apiKey: config.openrouter_api_key || "",
          modelName: "auto",
          provider: "openrouter",
          useForVoiceAgent: config.ai_voice_agent_provider === 'openrouter' || false,
          useForSummarization: config.ai_summarization_provider === 'openrouter' || false,
          useForAnalytics: config.ai_analytics_provider === 'openrouter' || false,
          useForTranscription: config.ai_transcription_provider === 'openrouter' || false
        }
      },
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
        status: config.stripe_secret_key && config.stripe_publishable_key ? "connected" : "disconnected",
        icon: "💳",
        connectedAt: config.stripe_secret_key ? new Date(config.updated_at) : undefined,
        settings: {
          publishableKey: config.stripe_publishable_key || "",
          secretKey: config.stripe_secret_key || "",
          webhookSecret: config.stripe_webhook_secret || "",
          webhookUrl: "https://voice-agent-project-snowy.vercel.app/api/payments/webhook"
        }
      },
      {
        id: "twilio",
        name: "Twilio",
        description: "Voice calls and SMS notifications",
        category: "communication",
        status: config.twilio_account_sid ? "connected" : "disconnected",
        icon: "📞",
        connectedAt: config.twilio_account_sid ? new Date(config.updated_at) : undefined,
        settings: {
          accountSid: config.twilio_account_sid || "",
          authToken: config.twilio_auth_token || "",
          phoneNumber: config.twilio_phone_number || "",
          voiceUrl: "https://voice-agent-project-snowy.vercel.app/api/voice-agent/twilio-webhook"
        }
      },
      {
        id: "resend",
        name: "Resend",
        description: "Email notifications and confirmations",
        category: "communication",
        status: config.resend_api_key ? "connected" : "disconnected",
        icon: "📧",
        connectedAt: config.resend_api_key ? new Date(config.updated_at) : undefined,
        settings: {
          apiKey: config.resend_api_key || "",
          fromEmail: config.resend_from_email || "",
          fromName: config.resend_from_name || ""
        }
      },
      {
        id: "google-analytics",
        name: "Google Analytics",
        description: "Track website and booking analytics",
        category: "analytics",
        status: "disconnected",
        icon: "📊",
        settings: {
          trackingId: "",
          measurementId: ""
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
    // Verify user is logged in
    if (!user?.id) {
      setStatusMessage({ type: 'error', text: 'Please log in first to connect integrations' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    // For Google Calendar, initiate OAuth flow if not connected
    if (integration.id === 'google-calendar' && integration.status !== 'connected') {
      console.log('Initiating Google OAuth for user:', user.id);
      window.location.href = `/api/auth/google?user_id=${user.id}`;
      return;
    }

    // For connected integrations or other integrations, open config dialog
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
      if (integration.id === 'openai') {
        const updateData: any = {
          openai_api_key: settings.apiKeyGeneral || settings.apiKey,
          openai_api_key_general: settings.apiKeyGeneral || settings.apiKey,
          openai_api_key_voice: settings.apiKeyVoice || null,
          ai_summarization_provider: settings.useForSummarization ? 'openai' : businessConfig.ai_summarization_provider === 'openai' ? null : businessConfig.ai_summarization_provider,
          ai_analytics_provider: settings.useForAnalytics ? 'openai' : businessConfig.ai_analytics_provider === 'openai' ? null : businessConfig.ai_analytics_provider,
          ai_transcription_provider: settings.useForTranscription ? 'openai' : businessConfig.ai_transcription_provider === 'openai' ? null : businessConfig.ai_transcription_provider
        };
        // Save model name if any feature is enabled for OpenAI
        if (settings.useForSummarization || settings.useForAnalytics || settings.useForTranscription) {
          updateData.ai_model_name = settings.modelName;
        }
        await businessConfigApi.update(user!.id, updateData);
        setStatusMessage({ type: 'success', text: 'OpenAI settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (integration.id === 'gemini') {
        const updateData: any = {
          gemini_api_key: settings.apiKeyGeneral || settings.apiKey,
          gemini_api_key_general: settings.apiKeyGeneral || settings.apiKey,
          gemini_api_key_voice: settings.apiKeyVoice || null,
          ai_summarization_provider: settings.useForSummarization ? 'gemini' : businessConfig.ai_summarization_provider === 'gemini' ? null : businessConfig.ai_summarization_provider,
          ai_analytics_provider: settings.useForAnalytics ? 'gemini' : businessConfig.ai_analytics_provider === 'gemini' ? null : businessConfig.ai_analytics_provider,
          ai_transcription_provider: settings.useForTranscription ? 'gemini' : businessConfig.ai_transcription_provider === 'gemini' ? null : businessConfig.ai_transcription_provider
        };
        // Save model name if any feature is enabled for Gemini
        if (settings.useForSummarization || settings.useForAnalytics || settings.useForTranscription) {
          updateData.ai_model_name = settings.modelName;
        }
        await businessConfigApi.update(user!.id, updateData);
        setStatusMessage({ type: 'success', text: 'Gemini settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (integration.id === 'openrouter') {
        const updateData: any = {
          openrouter_api_key: settings.apiKey,
          ai_voice_agent_provider: settings.useForVoiceAgent ? 'openrouter' : businessConfig.ai_voice_agent_provider === 'openrouter' ? null : businessConfig.ai_voice_agent_provider,
          ai_summarization_provider: settings.useForSummarization ? 'openrouter' : businessConfig.ai_summarization_provider === 'openrouter' ? null : businessConfig.ai_summarization_provider,
          ai_analytics_provider: settings.useForAnalytics ? 'openrouter' : businessConfig.ai_analytics_provider === 'openrouter' ? null : businessConfig.ai_analytics_provider,
          ai_transcription_provider: settings.useForTranscription ? 'openrouter' : businessConfig.ai_transcription_provider === 'openrouter' ? null : businessConfig.ai_transcription_provider
        };
        // Save model name if any feature is enabled for OpenRouter
        if (settings.useForVoiceAgent || settings.useForSummarization || settings.useForAnalytics || settings.useForTranscription) {
          updateData.ai_model_name = settings.modelName;
        }
        await businessConfigApi.update(user!.id, updateData);
        setStatusMessage({ type: 'success', text: 'OpenRouter settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (integration.id === 'google-calendar') {
        await businessConfigApi.update(user!.id, {
          google_calendar_id: settings.calendarId,
          calendar_sync_frequency: settings.syncFrequency,
          set_event_reminder: settings.sendReminders
        });

        setStatusMessage({ type: 'success', text: 'Google Calendar settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (integration.id === 'stripe') {
        await businessConfigApi.update(user!.id, {
          stripe_secret_key: settings.secretKey,
          stripe_publishable_key: settings.publishableKey,
          stripe_webhook_secret: settings.webhookSecret || null
        });

        setStatusMessage({ type: 'success', text: 'Stripe settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (integration.id === 'resend') {
        await businessConfigApi.update(user!.id, {
          resend_api_key: settings.apiKey,
          resend_from_email: settings.fromEmail || null,
          resend_from_name: settings.fromName || null
        });

        setStatusMessage({ type: 'success', text: 'Resend settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (integration.id === 'twilio') {
        await businessConfigApi.update(user!.id, {
          twilio_account_sid: settings.accountSid,
          twilio_auth_token: settings.authToken || null,
          twilio_phone_number: settings.phoneNumber
        });

        setStatusMessage({ type: 'success', text: 'Twilio settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      }

      // Update local state
      setIntegrations(prev => prev.map(int =>
        int.id === integration.id
          ? { ...int, settings, lastSync: new Date() }
          : int
      ));

      setIsConfigDialogOpen(false);
      setSelectedIntegration(null);

      await loadIntegrations();
    } catch (error) {
      console.error('Error saving integration config:', error);
      setStatusMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const categories = [
    { value: "all", label: "All Integrations", icon: "🔗" },
    { value: "ai", label: "AI Models", icon: "🤖" },
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
          <p className="text-gray-400 ml-4">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-center items-center py-24 flex-col">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-400">Please log in to manage integrations</p>
          <Button className="mt-4 bg-[#84CC16] text-black" onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
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
      case "openai":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">General AI Key</Label>
              <Input
                type="password"
                value={settings.apiKeyGeneral || settings.apiKey || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKeyGeneral: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500">
                For text AI features (summarization, analytics). Get from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">platform.openai.com</a>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Voice Agent Key (Optional)</Label>
              <Input
                type="password"
                value={settings.apiKeyVoice || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKeyVoice: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="sk-... (leave empty to use General AI Key)"
              />
              <p className="text-xs text-gray-500">
                Separate key for voice agent (Realtime API). Can be same as General AI Key or different for billing separation.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Default Model</Label>
              <Select
                value={settings.modelName?.startsWith('gpt-') ? settings.modelName : 'custom'}
                onValueChange={(value) => {
                  if (value !== 'custom') {
                    setSettings(prev => ({ ...prev, modelName: value, customModelName: '' }));
                  } else {
                    setSettings(prev => ({ ...prev, customModelName: prev.modelName || '' }));
                  }
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="gpt-4o-realtime-preview-2024-12-17">GPT-4o Realtime (Voice Agent)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="custom">Custom Model...</SelectItem>
                </SelectContent>
              </Select>
              {(settings.customModelName || settings.modelName?.startsWith('gpt-') === false) && (
                <Input
                  value={settings.customModelName || settings.modelName || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, modelName: e.target.value, customModelName: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                  placeholder="Enter custom model name (e.g., gpt-4o-2024-08-06)"
                />
              )}
              <p className="text-xs text-gray-500">Select a preset or enter a custom model identifier</p>
            </div>

            <div className="space-y-4 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-300">Use OpenAI For:</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useForVoiceAgent" className="text-gray-300 font-normal">Voice Agent</Label>
                  <p className="text-xs text-gray-500">Real-time voice conversations with customers</p>
                </div>
                <Switch
                  id="useForVoiceAgent"
                  checked={settings.useForVoiceAgent || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForVoiceAgent: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useForSummarization" className="text-gray-300 font-normal">Knowledge Base Summarization</Label>
                  <p className="text-xs text-gray-500">Summarize website content for AI context</p>
                </div>
                <Switch
                  id="useForSummarization"
                  checked={settings.useForSummarization || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForSummarization: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useForAnalytics" className="text-gray-300 font-normal">Analytics Insights</Label>
                  <p className="text-xs text-gray-500">Generate business insights and trends</p>
                </div>
                <Switch
                  id="useForAnalytics"
                  checked={settings.useForAnalytics || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForAnalytics: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useForTranscription" className="text-gray-300 font-normal">Call Transcription</Label>
                  <p className="text-xs text-gray-500">Transcribe and analyze call recordings</p>
                </div>
                <Switch
                  id="useForTranscription"
                  checked={settings.useForTranscription || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForTranscription: checked }))}
                />
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 text-sm text-gray-300">
              <strong>Note:</strong> Select which features should use OpenAI. You can assign different AI providers to different features.
            </div>
          </div>
        );

      case "gemini":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">General AI Key</Label>
              <Input
                type="password"
                value={settings.apiKeyGeneral || settings.apiKey || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKeyGeneral: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="AI..."
              />
              <p className="text-xs text-gray-500">
                For text AI features (summarization, analytics). Get from <a href="https://aistudio.google.com/apikey" target="_blank" className="text-blue-400 hover:underline">aistudio.google.com</a>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Voice Agent Key (Optional)</Label>
              <Input
                type="password"
                value={settings.apiKeyVoice || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKeyVoice: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="AI... (leave empty to use General AI Key)"
              />
              <p className="text-xs text-gray-500">
                Separate key for voice agent (Gemini Live API). Can be same as General AI Key or different for billing separation.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Default Model</Label>
              <Select
                value={settings.modelName?.startsWith('gemini-') ? settings.modelName : 'custom'}
                onValueChange={(value) => {
                  if (value !== 'custom') {
                    setSettings(prev => ({ ...prev, modelName: value, customModelName: '' }));
                  } else {
                    setSettings(prev => ({ ...prev, customModelName: prev.modelName || '' }));
                  }
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Latest)</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                  <SelectItem value="gemini-pro-latest">Gemini Pro (Latest)</SelectItem>
                  <SelectItem value="gemini-flash-latest">Gemini Flash (Latest)</SelectItem>
                  <SelectItem value="custom">Custom Model...</SelectItem>
                </SelectContent>
              </Select>
              {(settings.customModelName || settings.modelName?.startsWith('gemini-') === false) && (
                <Input
                  value={settings.customModelName || settings.modelName || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, modelName: e.target.value, customModelName: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                  placeholder="Enter custom Gemini model name..."
                />
              )}
              <p className="text-xs text-gray-500">Select a preset or enter a custom model identifier</p>
            </div>

            <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-4 mb-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Voice agent provider is now configured in <strong>Settings → AI Assistant Configuration</strong>
              </p>
            </div>

            <div className="space-y-4 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-300">Use Gemini For:</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gemini-summary" className="text-gray-300 font-normal">Knowledge Base Summarization</Label>
                  <p className="text-xs text-gray-500">Summarize website content for AI context</p>
                </div>
                <Switch
                  id="gemini-summary"
                  checked={settings.useForSummarization || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForSummarization: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gemini-analytics" className="text-gray-300 font-normal">Analytics Insights</Label>
                  <p className="text-xs text-gray-500">Generate business insights and trends</p>
                </div>
                <Switch
                  id="gemini-analytics"
                  checked={settings.useForAnalytics || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForAnalytics: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gemini-transcription" className="text-gray-300 font-normal">Call Transcription</Label>
                  <p className="text-xs text-gray-500">Transcribe and analyze call recordings</p>
                </div>
                <Switch
                  id="gemini-transcription"
                  checked={settings.useForTranscription || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForTranscription: checked }))}
                />
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 text-sm text-gray-300">
              <strong>Note:</strong> Gemini offers advanced reasoning and long context windows, ideal for complex tasks.
            </div>
          </div>
        );

      case "openrouter":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">OpenRouter API Key</Label>
              <Input
                type="password"
                value={settings.apiKey || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="sk-or-..."
              />
              <p className="text-xs text-gray-500">Get your API key from openrouter.ai</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Default Model</Label>
              <Select
                value={settings.modelName || 'auto'}
                onValueChange={(value) => {
                  if (value !== 'custom') {
                    setSettings(prev => ({ ...prev, modelName: value, customModelName: '' }));
                  } else {
                    setSettings(prev => ({ ...prev, customModelName: prev.modelName || '' }));
                  }
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="auto">Auto (Best Available)</SelectItem>
                  <SelectItem value="openai/gpt-4o">OpenAI GPT-4o</SelectItem>
                  <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="google/gemini-pro-1.5">Gemini Pro 1.5</SelectItem>
                  <SelectItem value="meta-llama/llama-3-70b">Llama 3 70B</SelectItem>
                  <SelectItem value="custom">Custom Model...</SelectItem>
                </SelectContent>
              </Select>
              {settings.customModelName && (
                <Input
                  value={settings.customModelName || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, modelName: e.target.value, customModelName: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                  placeholder="Enter custom model name (provider/model-name)"
                />
              )}
              <p className="text-xs text-gray-500">Select a preset or enter a custom model identifier (format: provider/model)</p>
            </div>

            <div className="space-y-4 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-300">Use OpenRouter For:</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="openrouter-voice" className="text-gray-300 font-normal">Voice Agent</Label>
                  <p className="text-xs text-gray-500">Real-time voice conversations with customers</p>
                </div>
                <Switch
                  id="openrouter-voice"
                  checked={settings.useForVoiceAgent || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForVoiceAgent: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="openrouter-summary" className="text-gray-300 font-normal">Knowledge Base Summarization</Label>
                  <p className="text-xs text-gray-500">Summarize website content for AI context</p>
                </div>
                <Switch
                  id="openrouter-summary"
                  checked={settings.useForSummarization || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForSummarization: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="openrouter-analytics" className="text-gray-300 font-normal">Analytics Insights</Label>
                  <p className="text-xs text-gray-500">Generate business insights and trends</p>
                </div>
                <Switch
                  id="openrouter-analytics"
                  checked={settings.useForAnalytics || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForAnalytics: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="openrouter-transcription" className="text-gray-300 font-normal">Call Transcription</Label>
                  <p className="text-xs text-gray-500">Transcribe and analyze call recordings</p>
                </div>
                <Switch
                  id="openrouter-transcription"
                  checked={settings.useForTranscription || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useForTranscription: checked }))}
                />
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 text-sm text-gray-300">
              <strong>Note:</strong> OpenRouter provides access to multiple AI models through a unified API.
            </div>
          </div>
        );

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
              <p className="text-xs text-gray-500">Get from: dashboard.stripe.com/test/apikeys</p>
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
              <p className="text-xs text-gray-500">Click "Reveal test key" in Stripe Dashboard</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Webhook Signing Secret (Optional)</Label>
              <Input
                type="password"
                value={settings.webhookSecret || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="whsec_..."
              />
              <p className="text-xs text-gray-500">From: dashboard.stripe.com/webhooks</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Webhook URL (Read-only)</Label>
              <Input
                value="https://voice-agent-project-snowy.vercel.app/api/payments/webhook"
                readOnly
                className="bg-gray-800 border-gray-700 text-gray-400"
              />
              <p className="text-xs text-gray-500">Configure this URL in Stripe Dashboard → Webhooks</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
              <p className="text-sm text-gray-300">
                <strong>Events to select:</strong> payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled, charge.refunded
              </p>
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
              <Label className="text-gray-300">Auth Token</Label>
              <Input
                type="password"
                value={settings.authToken || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, authToken: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Your Twilio Auth Token"
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
              <Label className="text-gray-300">Voice Webhook URL (Read-only)</Label>
              <Input
                value="https://voice-agent-project-snowy.vercel.app/api/voice-agent/twilio-webhook"
                readOnly
                className="bg-gray-800 border-gray-700 text-gray-400"
              />
              <p className="text-xs text-gray-500">Configure this in Twilio Console for your phone number</p>
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