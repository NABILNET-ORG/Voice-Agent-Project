import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
}

export function ServicesEditor() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('services')
        .single() as { data: { services: Service[] } | null; error: any };

      if (error) throw error;

      const servicesArray = data?.services || [];
      setServices(servicesArray);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const saveServices = async (updatedServices: Service[]) => {
    setLoading(true);
    try {
      // Get the config ID first
      const { data: configData } = await supabase
        .from('business_config')
        .select('id')
        .single() as { data: { id: string } | null };

      if (!configData?.id) throw new Error('Business config not found');

      // Update services - services column exists as JSONB in database schema
      // TypeScript doesn't recognize JSONB columns properly, using ts-expect-error
      const { error } = await supabase
        .from('business_config')
        // @ts-expect-error - services JSONB column exists in database
        .update({ services: updatedServices })
        .eq('id', configData.id);

      if (error) throw error;

      setServices(updatedServices);
      alert('Services saved successfully!');
    } catch (error) {
      console.error('Error saving services:', error);
      alert('Failed to save services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    if (!formData.name.trim()) {
      alert('Service name is required');
      return;
    }

    const newService: Service = {
      id: crypto.randomUUID(),
      ...formData,
    };

    const updatedServices = [...services, newService];
    saveServices(updatedServices);

    // Reset form
    setFormData({ name: '', description: '', duration: 30, price: 0 });
    setIsAddingNew(false);
  };

  const handleUpdateService = () => {
    if (!editingService || !formData.name.trim()) {
      alert('Service name is required');
      return;
    }

    const updatedServices = services.map((s) =>
      s.id === editingService.id ? { ...editingService, ...formData } : s
    );

    saveServices(updatedServices);
    setEditingService(null);
    setFormData({ name: '', description: '', duration: 30, price: 0 });
  };

  const handleDeleteService = (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const updatedServices = services.filter((s) => s.id !== id);
    saveServices(updatedServices);
  };

  const startEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
    });
    setIsAddingNew(false);
  };

  const cancelEdit = () => {
    setEditingService(null);
    setIsAddingNew(false);
    setFormData({ name: '', description: '', duration: 30, price: 0 });
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingService(null);
    setFormData({ name: '', description: '', duration: 30, price: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Services & Products</CardTitle>
            <CardDescription>
              Configure the services or products your AI assistant can book
            </CardDescription>
          </div>
          {!isAddingNew && !editingService && (
            <Button onClick={startAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAddingNew || editingService) && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg">
                {isAddingNew ? 'Add New Service' : 'Edit Service'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Service Name *</Label>
                  <Input
                    id="service-name"
                    placeholder="e.g., Haircut, 30min Consultation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-duration">Duration (minutes) *</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-price">Price</Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  placeholder="Brief description of the service..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={isAddingNew ? handleAddService : handleUpdateService}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Service'}
                </Button>
                <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services List */}
        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No services configured yet.</p>
            <p className="text-sm mt-2">Click "Add Service" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className={editingService?.id === service.id ? 'opacity-50' : ''}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {service.duration} min
                        </span>
                        {service.price > 0 && (
                          <span className="text-sm font-medium text-primary">
                            ${service.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(service)}
                        disabled={isAddingNew || editingService !== null}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                        disabled={isAddingNew || editingService !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {services.length > 0 && !isAddingNew && !editingService && (
          <p className="text-sm text-muted-foreground mt-4">
            💡 Tip: These services will be available when customers book appointments via phone or
            the dashboard.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
