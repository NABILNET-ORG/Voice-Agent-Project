'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle, Calendar, Mail } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setIsVerifying(false);
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch booking');
        }

        setBooking(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsVerifying(false);
      }
    };

    // Wait a moment for webhook to process
    setTimeout(fetchBooking, 2000);
  }, [bookingId]);

  if (isVerifying) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Verifying Payment
            </CardTitle>
            <CardDescription>Please wait while we confirm your payment...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">This should only take a moment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Payment Verification Failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              There was an issue verifying your payment. Please check your bookings or contact support.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/bookings/list">View Bookings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>Your booking has been confirmed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {booking && (
            <div className="rounded-lg bg-muted p-6 space-y-3">
              <h3 className="font-semibold text-lg">Booking Details</h3>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{booking.service_or_item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{booking.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{booking.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Total Paid:</span>
                  <span className="font-semibold text-green-600">
                    ${booking.total_amount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Confirmation Email</p>
                <p className="text-muted-foreground">
                  A confirmation email has been sent to {booking?.customer_email}
                </p>
              </div>
            </div>

            {booking?.google_calendar_event_id && (
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Calendar Event</p>
                  <p className="text-muted-foreground">
                    Added to your Google Calendar
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href="/bookings/list">View All Bookings</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Booking ID: {bookingId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Payment success page
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
