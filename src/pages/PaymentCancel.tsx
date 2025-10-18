import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, CreditCard, ArrowLeft } from 'lucide-react';

interface PaymentCancelProps {
  setPage?: (page: string) => void;
}

const PaymentCancel: React.FC<PaymentCancelProps> = ({ setPage }) => {
  // Get URL parameters from window.location
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('invoice_id');

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'student') {
      // Redirect to login if not authenticated or not a student
      window.location.href = '/';
      return;
    }
  }, []);

  // If no setPage prop provided (direct URL access), provide a fallback
  const handleNavigateBack = () => {
    if (setPage) {
      setPage('fees');
    } else {
      // Fallback: redirect to main app
      window.location.href = '/';
    }
  };

  const handleNavigateToDashboard = () => {
    if (setPage) {
      setPage('dashboard');
    } else {
      // Fallback: redirect to main app
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <CardTitle className="text-orange-600">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-orange-800">
              You can try again whenever you're ready to complete your payment.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleNavigateBack}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Return to Payment
            </Button>
            <Button
              variant="outline"
              onClick={handleNavigateToDashboard}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;