import { useState, useEffect } from 'react';
import { Save, Calendar, CheckCircle2, XCircle, Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { ServicesEditor } from '../components/ServicesEditor';
import { BusinessHoursEditor } from '../components/BusinessHoursEditor';

interface BusinessConfig {
  id: string;
  business_name: string;
  business_type: string;
  business_description: string | null;
  phone_number: string | null;
  address: string | null;
  currency: string;
  ai_voice: string;
  ai_voice_personality: string;
  ai_system_instructions: string;
  greeting_template: string;
  confirmation_template: string;
}

export function Settings() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('*')
        .single();

      if (error) throw error;
      setConfig(data as BusinessConfig);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('business_config')
        .update(config as never)
        .eq('id', config.id);

      if (error) throw error;

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    // In a real implementation, this would initiate OAuth flow
    // For now, we'll simulate the connection
    alert('Google Calendar OAuth flow would be initiated here.\n\nIn production, this would redirect to Google OAuth consent screen.');
    setGoogleCalendarConnected(!googleCalendarConnected);
  };

  const handleTestNotification = (type: 'email' | 'sms') => {
    alert(`Test ${type} notification sent! Check your ${type === 'email' ? 'inbox' : 'phone'}.`);
  };

  if (!config) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your AI assistant and business details
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="hours">Availability</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Business Information Tab */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Basic details about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={config.business_name}
                    onChange={(e) =>
                      setConfig({ ...config, business_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Input
                    id="business_type"
                    value={config.business_type}
                    onChange={(e) =>
                      setConfig({ ...config, business_type: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={config.phone_number || ''}
                    onChange={(e) =>
                      setConfig({ ...config, phone_number: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={config.currency}
                    onChange={(e) =>
                      setConfig({ ...config, currency: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={config.address || ''}
                  onChange={(e) =>
                    setConfig({ ...config, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={config.business_description || ''}
                  onChange={(e) =>
                    setConfig({ ...config, business_description: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Customize how your AI assistant behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ai_voice">AI Voice</Label>
                  <Input
                    id="ai_voice"
                    value={config.ai_voice}
                    onChange={(e) =>
                      setConfig({ ...config, ai_voice: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai_voice_personality">Voice Personality</Label>
                  <Input
                    id="ai_voice_personality"
                    value={config.ai_voice_personality}
                    onChange={(e) =>
                      setConfig({ ...config, ai_voice_personality: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai_instructions">System Instructions</Label>
                <Textarea
                  id="ai_instructions"
                  value={config.ai_system_instructions}
                  onChange={(e) =>
                    setConfig({ ...config, ai_system_instructions: e.target.value })
                  }
                  rows={8}
                  placeholder="Define how the AI should interact with customers..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="greeting_template">Greeting Message</Label>
                <Input
                  id="greeting_template"
                  value={config.greeting_template}
                  onChange={(e) =>
                    setConfig({ ...config, greeting_template: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation_template">Confirmation Template</Label>
                <Textarea
                  id="confirmation_template"
                  value={config.confirmation_template}
                  onChange={(e) =>
                    setConfig({ ...config, confirmation_template: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <ServicesEditor />
        </TabsContent>

        <TabsContent value="hours">
          <BusinessHoursEditor />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Google Calendar
                  </CardTitle>
                  <CardDescription>
                    Sync bookings to your Google Calendar automatically
                  </CardDescription>
                </div>
                <Badge variant={googleCalendarConnected ? 'success' : 'default'}>
                  {googleCalendarConnected ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleCalendarConnected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="calendar-select">Target Calendar</Label>
                    <select
                      id="calendar-select"
                      value={selectedCalendar}
                      onChange={(e) => setSelectedCalendar(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <option value="primary">Primary Calendar</option>
                      <option value="work">Work Calendar</option>
                      <option value="bookings">Bookings Calendar</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      New bookings will be automatically added to this calendar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sync Options</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
                          readOnly
                        />
                        <span className="text-sm">Create events for new bookings</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
                          readOnly
                        />
                        <span className="text-sm">Update events when bookings change</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
                          readOnly
                        />
                        <span className="text-sm">Delete events when bookings are cancelled</span>
                      </label>
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleGoogleCalendarConnect}>
                    Disconnect Google Calendar
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-muted-foreground">
                    Connect your Google Calendar to automatically sync bookings as calendar events
                  </p>
                  <Button onClick={handleGoogleCalendarConnect}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure email alerts for bookings and calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive emails for new bookings and updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {emailNotifications && (
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="notification-email"
                      type="email"
                      placeholder="notifications@yourbusiness.com"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleTestNotification('email')}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Notifications
              </CardTitle>
              <CardDescription>
                Configure SMS alerts for bookings and calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable SMS Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive text messages for new bookings
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {smsNotifications && (
                <div className="space-y-2">
                  <Label htmlFor="notification-phone">Notification Phone</Label>
                  <div className="flex gap-2">
                    <Input
                      id="notification-phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleTestNotification('sms')}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
