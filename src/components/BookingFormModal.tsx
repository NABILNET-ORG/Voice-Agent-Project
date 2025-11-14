import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface BookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BookingFormModal({
  open,
  onOpenChange,
  onSuccess,
}: BookingFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceOrItem, setServiceOrItem] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [bookingType, setBookingType] = useState<'appointment' | 'delivery'>('appointment');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [basePrice, setBasePrice] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch services on component mount
  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

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

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);

    if (serviceId === 'custom') {
      // Allow custom service
      setServiceOrItem('');
      setDurationMinutes('60');
      setBasePrice('');
    } else {
      // Auto-fill service details
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setServiceOrItem(service.name);
        setDurationMinutes(service.duration.toString());
        if (service.price > 0) {
          setBasePrice(service.price.toString());
        }
      }
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setServiceOrItem('');
    setSelectedServiceId('');
    setBookingType('appointment');
    setDate('');
    setTime('');
    setDurationMinutes('60');
    setBasePrice('');
    setDeliveryAddress('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call create-booking-manual function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-manual`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            serviceOrItem,
            bookingType,
            date,
            time,
            durationMinutes: parseInt(durationMinutes) || 60,
            basePrice: basePrice ? parseFloat(basePrice) : null,
            totalAmount: basePrice ? parseFloat(basePrice) : null,
            deliveryAddress: deliveryAddress || null,
            notes: notes || null,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Success!
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Customer Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Booking Details</h3>

            <div className="space-y-2">
              <Label htmlFor="bookingType">
                Booking Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={bookingType}
                onValueChange={(value: 'appointment' | 'delivery') =>
                  setBookingType(value)
                }
              >
                <SelectTrigger id="bookingType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection */}
            {services.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="service">
                    Service <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedServiceId}
                    onValueChange={handleServiceSelect}
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.duration}min
                          {service.price > 0 && ` - $${service.price.toFixed(2)}`}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show custom input if "Custom Service" is selected */}
                {selectedServiceId === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customService">
                      Service Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customService"
                      value={serviceOrItem}
                      onChange={(e) => setServiceOrItem(e.target.value)}
                      placeholder="Enter service name..."
                      required
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="serviceOrItem">
                  Service/Item <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="serviceOrItem"
                  value={serviceOrItem}
                  onChange={(e) => setServiceOrItem(e.target.value)}
                  placeholder="Haircut, Plumbing Repair, Pizza Delivery, etc."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  💡 Configure services in Settings → Services tab for a better experience
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">
                  Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">Price ($)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="50.00"
                />
              </div>
            </div>

            {bookingType === 'delivery' && (
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
