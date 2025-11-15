"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { businessConfigApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Service {
  id?: string;
  name: string;
  category: string;
  duration?: number;
  price: number;
  description: string;
}

export default function ServicesManagement() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Service>({
    name: "",
    category: "",
    duration: 60,
    price: 0,
    description: ""
  });

  useEffect(() => {
    if (user?.id) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const config = await businessConfigApi.get(user!.id);
      setServices(config.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessConfigApi.update(user!.id, { services });
      setMessage("Services saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error saving services:', error);
      setMessage("Error saving services");
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!newService.name || newService.price <= 0) {
      setMessage("Please enter a service name and price");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const service = {
      ...newService,
      id: Date.now().toString()
    };

    setServices([...services, service]);
    setNewService({
      name: "",
      category: "",
      duration: 60,
      price: 0,
      description: ""
    });
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id!);
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const finishEdit = () => {
    setEditingId(null);
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
          <h1 className="text-3xl font-bold text-white">Services Management</h1>
          <p className="text-gray-400 mt-2">Manage your services and products</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Services"}
        </Button>
      </div>

      {message && (
        <Card className={message.includes('Error') ? 'bg-red-500/10 border-red-500' : 'bg-green-500/10 border-green-500'}>
          <CardContent className="pt-6">
            <p className={message.includes('Error') ? 'text-red-400' : 'text-green-400'}>{message}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Services */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Current Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No services configured yet. Add your first service below.
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    {editingId === service.id ? (
                      <div className="space-y-3">
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id!, 'name', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Service name"
                        />
                        <Input
                          value={service.category}
                          onChange={(e) => updateService(service.id!, 'category', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Category"
                        />
                        <Textarea
                          value={service.description}
                          onChange={(e) => updateService(service.id!, 'description', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={service.price}
                            onChange={(e) => updateService(service.id!, 'price', parseFloat(e.target.value))}
                            className="bg-gray-900 border-gray-700 text-white"
                            placeholder="Price"
                          />
                          <Input
                            type="number"
                            value={service.duration || 60}
                            onChange={(e) => updateService(service.id!, 'duration', parseInt(e.target.value))}
                            className="bg-gray-900 border-gray-700 text-white"
                            placeholder="Duration (min)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={finishEdit}
                            className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
                          >
                            Done
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="border-gray-700 text-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-lg">{service.name}</h4>
                          <p className="text-gray-400 text-sm mt-1">{service.category}</p>
                          {service.description && (
                            <p className="text-gray-500 text-sm mt-2">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            <Badge className="bg-[#84CC16] text-black">${service.price}</Badge>
                            {service.duration && (
                              <Badge className="bg-gray-700 text-white">{service.duration} min</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                            onClick={() => startEdit(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeService(service.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add New Service */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Add New Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Service Name *</Label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                placeholder="e.g., Haircut, Pizza Delivery"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Input
                value={newService.category}
                onChange={(e) => setNewService({...newService, category: e.target.value})}
                placeholder="e.g., Hair Services, Main Dishes"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Price *</Label>
              <Input
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Duration (minutes)</Label>
              <Input
                type="number"
                value={newService.duration || ''}
                onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value) || undefined})}
                placeholder="60"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={newService.description}
              onChange={(e) => setNewService({...newService, description: e.target.value})}
              placeholder="Describe this service..."
              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
            />
          </div>

          <Button
            onClick={addService}
            className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
