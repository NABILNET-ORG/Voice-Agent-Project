import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';

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

        {/* Other tabs - simplified placeholders */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services & Products</CardTitle>
              <CardDescription>
                Configure your offerings (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Service management interface will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours & Availability</CardTitle>
              <CardDescription>
                Set your operating hours (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Hours configuration interface will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations & Notifications</CardTitle>
              <CardDescription>
                Connect external services (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Integration settings will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
