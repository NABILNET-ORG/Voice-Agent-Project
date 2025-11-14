import { useState, useEffect } from 'react';
import { Save, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const defaultHours: DayHours = {
  open: '09:00',
  close: '17:00',
  closed: false,
};

const daysOfWeek: (keyof BusinessHours)[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const dayLabels: Record<keyof BusinessHours, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function BusinessHoursEditor() {
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<BusinessHours>({
    monday: { ...defaultHours },
    tuesday: { ...defaultHours },
    wednesday: { ...defaultHours },
    thursday: { ...defaultHours },
    friday: { ...defaultHours },
    saturday: { ...defaultHours, closed: true },
    sunday: { ...defaultHours, closed: true },
  });

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('business_hours')
        .single() as { data: { business_hours: Partial<BusinessHours> } | null; error: any };

      if (error) throw error;

      if (data?.business_hours && Object.keys(data.business_hours).length > 0) {
        // Merge fetched hours with defaults
        const fetchedHours = data.business_hours;
        setHours({
          monday: fetchedHours.monday || { ...defaultHours },
          tuesday: fetchedHours.tuesday || { ...defaultHours },
          wednesday: fetchedHours.wednesday || { ...defaultHours },
          thursday: fetchedHours.thursday || { ...defaultHours },
          friday: fetchedHours.friday || { ...defaultHours },
          saturday: fetchedHours.saturday || { ...defaultHours, closed: true },
          sunday: fetchedHours.sunday || { ...defaultHours, closed: true },
        });
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Get the config ID first
      const { data: configData } = await supabase
        .from('business_config')
        .select('id')
        .single() as { data: { id: string } | null };

      if (!configData?.id) throw new Error('Business config not found');

      // Update business hours - business_hours column exists as JSONB in database schema
      // TypeScript doesn't recognize JSONB columns properly, using ts-expect-error
      const { error } = await supabase
        .from('business_config')
        // @ts-expect-error - business_hours JSONB column exists in database
        .update({ business_hours: hours })
        .eq('id', configData.id);

      if (error) throw error;

      alert('Business hours saved successfully!');
    } catch (error) {
      console.error('Error saving business hours:', error);
      alert('Failed to save business hours');
    } finally {
      setLoading(false);
    }
  };

  const updateDayHours = (day: keyof BusinessHours, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const toggleClosed = (day: keyof BusinessHours) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed,
      },
    }));
  };

  const copyToAll = (day: keyof BusinessHours) => {
    const sourceHours = hours[day];
    const newHours = { ...hours };

    daysOfWeek.forEach((d) => {
      newHours[d] = { ...sourceHours };
    });

    setHours(newHours);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours & Availability
            </CardTitle>
            <CardDescription>
              Set your operating hours for each day of the week
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Hours'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {daysOfWeek.map((day) => (
          <Card key={day} className={hours[day].closed ? 'opacity-60' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {/* Day Name */}
                <div className="w-32">
                  <Label className="text-base font-semibold">{dayLabels[day]}</Label>
                </div>

                {/* Closed Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${day}-closed`}
                    checked={hours[day].closed}
                    onChange={() => toggleClosed(day)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <Label htmlFor={`${day}-closed`} className="cursor-pointer text-sm">
                    Closed
                  </Label>
                </div>

                {/* Time Inputs */}
                {!hours[day].closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${day}-open`} className="text-sm whitespace-nowrap">
                        Open:
                      </Label>
                      <Input
                        id={`${day}-open`}
                        type="time"
                        value={hours[day].open}
                        onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                        className="w-32"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${day}-close`} className="text-sm whitespace-nowrap">
                        Close:
                      </Label>
                      <Input
                        id={`${day}-close`}
                        type="time"
                        value={hours[day].close}
                        onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                        className="w-32"
                      />
                    </div>

                    {/* Copy to All Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToAll(day)}
                      className="ml-auto"
                    >
                      Copy to All
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Use "Copy to All" to apply the same hours to every day, then
            customize individual days as needed.
          </p>
          <p className="text-sm text-muted-foreground">
            ⏰ These hours will be used by your AI assistant to check availability when customers
            book appointments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
