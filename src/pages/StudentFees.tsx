import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Receipt, AlertCircle, CheckCircle, Calendar, IndianRupee, Download } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { loadStripe } from '@stripe/stripe-js';
import { useTheme } from "@/context/ThemeContext";

interface InvoiceComponent {
  component_name: string;
  component_amount: number;
  paid_amount: number;
  balance_amount: number;
}

interface InvoiceData {
  id: number;
  invoice_number: string;
  semester: number;
  academic_year: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  due_date: string | null;
  created_at: string | null;
  invoice_type: string;
  components?: InvoiceComponent[];
}

interface PaymentData {
  id: number;
  invoice_id: number;
  amount: number;
  mode: string;
  status: string;
  timestamp: string;
  transaction_id: string;
  payment_reference: string;
}

interface ReceiptData {
  id: number;
  receipt_number: string;
  amount: number;
  payment_id: number;
  payment_date: string;
  payment_mode: string;
  transaction_id: string;
  invoice_id: number;
  semester: number;
  generated_at: string;
}

interface StudentInfo {
  id: number;
  name: string;
  usn: string;
  dept: string;
  semester: number;
  admission_mode: string;
  status: boolean;
  email: string;
}

interface FeeSummary {
  total_fees: number;
  amount_paid: number;
  remaining_fees: number;
  due_date: string | null;
  payment_status: string;
}

interface FeeDataResponse {
  student: StudentInfo;
  fee_summary: FeeSummary;
  fee_breakdown: Record<string, number>;
  invoices: InvoiceData[];
  payments: PaymentData[];
  receipts: ReceiptData[];
  statistics: {
    total_invoices: number;
    total_payments: number;
    total_receipts: number;
    successful_payments: number;
    pending_payments: number;
    failed_payments: number;
  };
}

interface StudentFeesProps {
  user: any;
}

const StudentFees: React.FC<StudentFeesProps> = ({ user }) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'component'>('full');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Set<number>>(new Set());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { theme } = useTheme();

  console.log('StudentFees user object:', user);
  console.log('StudentFees user.usn:', user?.usn);
  console.log('StudentFees user.username:', user?.username);

  // Fetch complete fee data from Django backend
  const { data: feeData, isLoading, error } = useQuery<FeeDataResponse>({
    queryKey: ['studentCompleteFeeData', user?.usn || user?.username],
    queryFn: async (): Promise<FeeDataResponse> => {
      const response = await fetch(`http://127.0.0.1:8000/api/student/fee-data/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch fee data');
      }
      return await response.json();
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading fee information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={`max-w-2xl mx-auto mt-8 ${theme === 'dark' ? 'bg-red-900/20 border border-red-500 text-red-200' : 'bg-red-100 border border-red-200 text-red-800'}`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load fee information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (remaining: number) => {
    if (remaining === 0) return theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
    if (remaining > 0) return theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
    return theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (remaining: number) => {
    return remaining === 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
  };

  const handlePaymentClick = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setPaymentType('full');
    setSelectedComponents(new Set());
    setPaymentModalOpen(true);
  };

  const handleComponentPaymentClick = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setPaymentType('component');
    setSelectedComponents(new Set());
    setPaymentModalOpen(true);
  };

  const handleComponentToggle = (componentId: number) => {
    const newSet = new Set(selectedComponents);
    if (newSet.has(componentId)) {
      newSet.delete(componentId);
    } else {
      newSet.add(componentId);
    }
    setSelectedComponents(newSet);
  };

  const initiateStripePayment = async () => {
    try {
      setIsProcessingPayment(true);
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripeKey) {
        alert('Payment configuration error. Please contact support.');
        return;
      }

      const stripe = await loadStripe(stripeKey);
      if (!stripe) {
        alert('Failed to initialize payment. Please try again.');
        return;
      }

      if (!selectedInvoiceId) return;

      const response = await fetch(`http://127.0.0.1:8000/api/payments/create-checkout-session/${selectedInvoiceId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_type: paymentType,
          selected_components: paymentType === 'component' ? Array.from(selectedComponents) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { session_id, checkout_url } = await response.json();
      
      // Redirect to Stripe checkout with proper API key
      if (checkout_url) {
        // Use the checkout_url provided by backend if available
        window.location.href = checkout_url;
      } else if (session_id) {
        // Fallback: construct checkout URL with publishable key
        const checkoutUrl = `https://checkout.stripe.com/pay/${session_id}?key=${stripeKey}`;
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error initiating payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/payments/receipt/${paymentId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to download receipt');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt.');
    }
  };

  if (!feeData) return null;

  const currentInvoice = feeData?.invoices?.find(inv => inv.id === selectedInvoiceId);

  return (
    <div className={`container mx-auto p-6 max-w-4xl ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Fee Information</h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>View your current fee status and payment details</p>
      </div>

      {/* Student Info Card */}
      <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            <CreditCard className="h-5 w-5" />
            Student Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{feeData?.student?.name || 'N/A'}</p>
            </div>
            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>USN</label>
              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{feeData?.student?.usn || 'N/A'}</p>
            </div>
            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Department</label>
              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{feeData?.student?.dept || 'N/A'}</p>
            </div>
            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Semester</label>
              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{feeData?.student?.semester || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Fees</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
              {formatCurrency(feeData?.fee_summary?.total_fees || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount Paid</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              {formatCurrency(feeData?.fee_summary?.amount_paid || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Remaining Fees</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              {formatCurrency(feeData?.fee_summary?.remaining_fees || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Card */}
      <Card className={`mb-6 ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {getStatusIcon(feeData?.fee_summary?.remaining_fees || 0)}
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Badge className={getStatusColor(feeData?.fee_summary?.remaining_fees || 0)}>
                {(feeData?.fee_summary?.remaining_fees || 0) === 0 ? 'All Paid' : 'Pending Payment'}
              </Badge>
              {feeData?.fee_summary?.due_date && (
                <p className={`text-sm mt-2 flex items-center gap-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Calendar className="h-4 w-4" />
                  Due Date: {new Date(feeData.fee_summary.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
            {(feeData?.fee_summary?.remaining_fees || 0) > 0 && (
              <div className="flex gap-2">
                <Button 
                  className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  onClick={() => {
                    const inv = feeData?.invoices?.find(inv => inv.balance_amount > 0);
                    if (inv) handlePaymentClick(inv.id);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Full Amount
                </Button>
                <Button 
                  variant="outline"
                  className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                  onClick={() => {
                    const inv = feeData?.invoices?.find(inv => inv.balance_amount > 0);
                    if (inv) handleComponentPaymentClick(inv.id);
                  }}
                >
                  Pay by Component
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card className={`mb-6 ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            <Receipt className="h-5 w-5" />
            Fee Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeData?.invoices?.length ? (
            <div className="space-y-4">
              {feeData.invoices.map((invoice) => (
                <div key={invoice.id} className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Semester {invoice.semester}</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Invoice #{invoice.invoice_number}</p>
                    </div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className={`text-gray-600 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{formatCurrency(invoice.total_amount)}</p>
                    </div>
                    <div>
                      <p className={`text-gray-600 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Paid Amount</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(invoice.paid_amount)}</p>
                    </div>
                    <div>
                      <p className={`text-gray-600 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Balance</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{formatCurrency(invoice.balance_amount)}</p>
                    </div>
                  </div>
                  {invoice.balance_amount > 0 && (
                    <div className="flex gap-2">
                      <Button size="sm" className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`} onClick={() => handlePaymentClick(invoice.id)}>
                        Pay Full
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                        onClick={() => handleComponentPaymentClick(invoice.id)}
                      >
                        Pay by Component
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No invoices found</p>
          )}
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card className={`mb-6 ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeData?.payments?.length ? (
            <div className="space-y-4">
              {feeData.payments.map((payment) => (
                <div key={payment.id} className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{formatCurrency(payment.amount)}</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(payment.timestamp).toLocaleDateString()} • {payment.mode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={payment.status === 'success' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                        onClick={() => handleDownloadReceipt(payment.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No payment history</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className={`max-w-md ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
              {paymentType === 'full' ? 'Pay Full Amount' : 'Pay by Component'}
            </DialogTitle>
          </DialogHeader>

          {paymentType === 'full' ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount to Pay</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                  {formatCurrency(currentInvoice?.balance_amount || 0)}
                </p>
              </div>
              <Button 
                onClick={initiateStripePayment} 
                disabled={isProcessingPayment} 
                className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white w-full`}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Select components to pay:</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentInvoice?.components?.map((component, idx) => (
                  <div key={idx} className={`flex items-center space-x-3 p-2 border rounded ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <Checkbox 
                      checked={selectedComponents.has(idx)}
                      onCheckedChange={() => handleComponentToggle(idx)}
                      className={theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}
                    />
                    <Label className={`flex-1 cursor-pointer ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      <div>
                        <p className="font-medium">{component.component_name}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{formatCurrency(component.balance_amount)}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>

              {selectedComponents.size > 0 && (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Selected</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                    {formatCurrency(
                      (currentInvoice?.components || [])
                        .filter((_, idx) => selectedComponents.has(idx))
                        .reduce((sum, comp) => sum + comp.balance_amount, 0)
                    )}
                  </p>
                </div>
              )}

              <Button 
                onClick={initiateStripePayment} 
                disabled={isProcessingPayment || selectedComponents.size === 0} 
                className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white w-full`}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentFees;