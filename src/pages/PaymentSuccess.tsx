import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Download, ArrowLeft } from 'lucide-react';

interface PaymentSuccessProps {
  setPage?: (page: string) => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ setPage }) => {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Get URL parameters from window.location
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
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

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/payments/status/${sessionId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
        setPaymentStatus(data.payment_status === 'paid' ? 'success' : 'error');
      } else {
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-600">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleNavigateBack}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Return to Fees Page
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-green-800 font-medium">Payment Confirmed</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {formatCurrency(paymentDetails?.amount_total / 100 || 0)}
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p><strong>Transaction ID:</strong> {paymentDetails?.session_id}</p>
            <p><strong>Invoice ID:</strong> {invoiceId}</p>
            <p><strong>Status:</strong> {paymentDetails?.payment_status}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleNavigateBack}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View Fee Details
            </Button>
            {paymentDetails?.payment_id && (
              <Button
                variant="outline"
                onClick={() => {
                  // Download receipt functionality
                  fetch(`http://127.0.0.1:8000/api/payments/receipt/${paymentDetails.payment_id}/`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                  })
                  .then(response => response.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `receipt_${paymentDetails.payment_id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  })
                  .catch(error => {
                    console.error('Error downloading receipt:', error);
                    alert('Failed to download receipt. Please try from the fees page.');
                  });
                }}
                className="w-full"
              >
                Download Receipt
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;