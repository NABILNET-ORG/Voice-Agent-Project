"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, Upload, Download, Search, Filter, Copy, Eye, EyeOff, TrendingUp, TrendingDown, DollarSign, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Service {
  id: string;
  name: string;
  category: string;
  duration?: number;
  price: number;
  description: string;
  requiresSlot?: boolean;
  bufferTime?: number;
  availableDays?: string[];
  availableForDelivery?: boolean;
  availableForPickup?: boolean;
  availableForDineIn?: boolean;
  dietaryInfo?: string[];
  preparationTime?: number;
  inStock?: boolean;
  serviceType?: string;
  priceType?: string;
  priorityLevel?: string;
  serviceAreas?: string;
  afterHoursAvailable?: boolean;
  requiredEquipment?: string;
  isActive: boolean;
  bookingCount: number;
  revenue: number;
  createdAt: Date;
  lastUpdated: Date;
}

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  useEffect(() => {
    // Generate comprehensive mock services data
    const mockServices: Service[] = [
      {
        id: "1",
        name: "Classic Haircut",
        category: "Hair Services",
        duration: 60,
        price: 50,
        description: "Professional haircut with wash and style",
        requiresSlot: true,
        bufferTime: 15,
        availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
        isActive: true,
        bookingCount: 145,
        revenue: 7250,
        createdAt: new Date("2024-01-15"),
        lastUpdated: new Date("2024-01-20")
      },
      {
        id: "2",
        name: "Full Color Treatment",
        category: "Hair Services",
        duration: 180,
        price: 150,
        description: "Complete hair coloring service with premium products",
        requiresSlot: true,
        bufferTime: 30,
        availableDays: ["tue", "wed", "thu", "fri"],
        isActive: true,
        bookingCount: 67,
        revenue: 10050,
        createdAt: new Date("2024-01-16"),
        lastUpdated: new Date("2024-01-22")
      },
      {
        id: "3",
        name: "Beard Trim & Style",
        category: "Men's Services",
        duration: 30,
        price: 25,
        description: "Professional beard trimming and styling",
        requiresSlot: true,
        bufferTime: 10,
        availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
        isActive: true,
        bookingCount: 89,
        revenue: 2225,
        createdAt: new Date("2024-01-17"),
        lastUpdated: new Date("2024-01-18")
      },
      {
        id: "4",
        name: "Deep Conditioning",
        category: "Hair Treatments",
        duration: 45,
        price: 40,
        description: "Intensive deep conditioning treatment",
        requiresSlot: true,
        bufferTime: 15,
        availableDays: ["mon", "tue", "wed", "thu", "fri"],
        isActive: true,
        bookingCount: 34,
        revenue: 1360,
        createdAt: new Date("2024-01-18"),
        lastUpdated: new Date("2024-01-19")
      },
      {
        id: "5",
        name: "Highlights",
        category: "Hair Services",
        duration: 150,
        price: 120,
        description: "Partial or full highlights",
        requiresSlot: true,
        bufferTime: 30,
        availableDays: ["tue", "wed", "thu", "fri"],
        isActive: false,
        bookingCount: 23,
        revenue: 2760,
        createdAt: new Date("2024-01-19"),
        lastUpdated: new Date("2024-01-25")
      },
      {
        id: "6",
        name: "Kids Haircut",
        category: "Hair Services",
        duration: 45,
        price: 35,
        description: "Haircut for children under 12",
        requiresSlot: true,
        bufferTime: 10,
        availableDays: ["sat", "sun"],
        isActive: true,
        bookingCount: 56,
        revenue: 1960,
        createdAt: new Date("2024-01-20"),
        lastUpdated: new Date("2024-01-21")
      }
    ];
    
    setServices(mockServices);
    setFilteredServices(mockServices);
  }, []);

  useEffect(() => {
    let filtered = services;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(service => 
        statusFilter === "active" ? service.isActive : !service.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Service];
      let bValue: any = b[sortBy as keyof Service];
      
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      return aValue > bValue ? 1 : -1;
    });

    setFilteredServices(filtered);
  }, [services, searchTerm, categoryFilter, statusFilter, sortBy]);

  const categories = Array.from(new Set(services.map(s => s.category)));

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    inactive: services.filter(s => !s.isActive).length,
    totalBookings: services.reduce((sum, s) => sum + s.bookingCount, 0),
    totalRevenue: services.reduce((sum, s) => sum + s.revenue, 0),
    avgPrice: services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0
  };

  const handleSaveService = (service: Service) => {
    if (editingService) {
      setServices(prev => prev.map(s => s.id === service.id ? { ...service, lastUpdated: new Date() } : s));
    } else {
      const newService: Service = {
        ...service,
        id: Date.now().toString(),
        isActive: true,
        bookingCount: 0,
        revenue: 0,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      setServices(prev => [...prev, newService]);
    }
    setIsDialogOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive, lastUpdated: new Date() } : s
    ));
  };

  const handleDuplicateService = (service: Service) => {
    const duplicatedService: Service = {
      ...service,
      id: Date.now().toString(),
      name: `${service.name} (Copy)`,
      bookingCount: 0,
      revenue: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    setServices(prev => [...prev, duplicatedService]);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Services Management</h1>
          <p className="text-gray-400 mt-2">Manage your service offerings and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-[#84CC16] text-black" : "border-gray-700 text-gray-300"}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-[#84CC16] text-black" : "border-gray-700 text-gray-300"}
          >
            Grid View
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#84CC16] text-black hover:bg-[#65A30D]">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
              </DialogHeader>
              <ServiceForm 
                service={editingService} 
                onSave={handleSaveService}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingService(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Services</CardTitle>
            <Users className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-500">All services</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <p className="text-xs text-gray-500">Currently available</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Inactive</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inactive}</div>
            <p className="text-xs text-gray-500">Currently unavailable</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
            <Clock className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">From all services</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Price</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.avgPrice.toFixed(0)}</div>
            <p className="text-xs text-gray-500">Per service</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="bookingCount">Bookings</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Display */}
      {viewMode === "table" ? (
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Services ({filteredServices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Service</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Duration</TableHead>
                    <TableHead className="text-gray-300">Price</TableHead>
                    <TableHead className="text-gray-300">Bookings</TableHead>
                    <TableHead className="text-gray-300">Revenue</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-xs text-gray-400 max-w-xs truncate">{service.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{service.category}</TableCell>
                      <TableCell className="text-gray-300">{service.duration ? `${service.duration} min` : "-"}</TableCell>
                      <TableCell className="text-gray-300">${service.price}</TableCell>
                      <TableCell className="text-gray-300">{service.bookingCount}</TableCell>
                      <TableCell className="text-gray-300">${service.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={service.isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-white p-1"
                            onClick={() => handleToggleStatus(service.id)}
                          >
                            {service.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-white p-1"
                            onClick={() => {
                              setEditingService(service);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-white p-1"
                            onClick={() => handleDuplicateService(service)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-red-500 p-1"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="bg-[#1A1A1A] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{service.name}</CardTitle>
                  <Badge className={service.isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                    {service.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Category</p>
                  <p className="text-white">{service.category}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Duration</p>
                    <p className="text-white">{service.duration ? `${service.duration} min` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-white">${service.price}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Bookings</p>
                    <p className="text-white">{service.bookingCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <p className="text-white">${service.revenue.toLocaleString()}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm">{service.description}</p>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white"
                    onClick={() => {
                      setEditingService(service);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white"
                    onClick={() => handleDuplicateService(service)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Service Form Component
function ServiceForm({ service, onSave, onCancel }: { 
  service: Service | null; 
  onSave: (service: Service) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Service>>(service || {
    name: "",
    category: "",
    duration: 60,
    price: 0,
    description: "",
    requiresSlot: true,
    bufferTime: 15,
    availableDays: ["mon", "tue", "wed", "thu", "fri"],
    isActive: true
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.price) return;
    
    const serviceData: Service = {
      id: service?.id || "",
      name: formData.name!,
      category: formData.category || "General",
      duration: formData.duration,
      price: formData.price!,
      description: formData.description || "",
      requiresSlot: formData.requiresSlot,
      bufferTime: formData.bufferTime,
      availableDays: formData.availableDays,
      isActive: formData.isActive || false,
      bookingCount: service?.bookingCount || 0,
      revenue: service?.revenue || 0,
      createdAt: service?.createdAt || new Date(),
      lastUpdated: new Date()
    };
    
    onSave(serviceData);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-300">Service Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-300">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-gray-300">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price" className="text-gray-300">Price *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive" className="text-gray-300">Active Service</Label>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="bg-[#84CC16] text-black hover:bg-[#65A30D]" onClick={handleSubmit}>
          <Save className="h-4 w-4 mr-2" />
          Save Service
        </Button>
      </div>
    </div>
  );
}