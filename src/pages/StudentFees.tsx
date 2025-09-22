import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Receipt, AlertCircle, CheckCircle, Calendar, IndianRupee, Download } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface FeeData {
  total_fees: number;
  amount_paid: number;
  remaining_fees: number;
  due_date: string | null;
}

interface StudentFeesProps {
  user: any;
}

const StudentFees: React.FC<StudentFeesProps> = ({ user }) => {
  console.log('StudentFees user object:', user);
  console.log('StudentFees user.usn:', user?.usn);
  console.log('StudentFees user.username:', user?.username);

  // Fetch complete fee data from unauthenticated API endpoint
  const { data: feeData, isLoading, error } = useQuery({
    queryKey: ['studentCompleteFeeData', user?.usn || user?.username],
    queryFn: async (): Promise<any> => {
      const usn = user?.usn || user?.username;
      console.log('Making API call with USN:', usn);
      const response = await fetch(`http://127.0.0.1:8001/api/student/complete-fee-data/${usn}/`);
      console.log('API response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch fee data');
      }
      const data = await response.json();
      console.log('API response data:', data);
      return data;
    },
    enabled: !!(user?.usn || user?.username),
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
      <Alert className="max-w-2xl mx-auto mt-8">
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
    if (remaining === 0) return 'bg-green-100 text-green-800';
    if (remaining > 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (remaining: number) => {
    return remaining === 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/student/payments/${paymentId}/receipt/`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
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
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fee Information</h1>
        <p className="text-gray-600 mt-2">View your current fee status and payment details</p>
      </div>

      {/* Student Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Student Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold">{user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">USN</label>
              <p className="text-lg font-semibold">{user?.usn}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="text-lg font-semibold">{user?.dept}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Semester</label>
              <p className="text-lg font-semibold">{user?.semester}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(feeData?.fee_summary?.total_fees || 0)}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(feeData?.fee_summary?.amount_paid || 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining Fees</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(feeData?.fee_summary?.remaining_fees || 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(feeData?.fee_summary?.remaining_fees || 0)}
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={getStatusColor(feeData?.fee_summary?.remaining_fees || 0)}>
                {(feeData?.fee_summary?.remaining_fees || 0) === 0 ? 'All Paid' : 'Pending Payment'}
              </Badge>
              {feeData?.fee_summary?.due_date && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due Date: {new Date(feeData.fee_summary.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
            {(feeData?.fee_summary?.remaining_fees || 0) > 0 && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeData?.invoices && feeData.invoices.length > 0 ? (
            <div className="space-y-4">
              {feeData.invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">Semester {invoice.semester}</h3>
                      <p className="text-sm text-gray-600">Invoice #{invoice.invoice_number}</p>
                    </div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Paid Amount</p>
                      <p className="font-semibold text-green-600">{formatCurrency(invoice.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Balance</p>
                      <p className="font-semibold text-red-600">{formatCurrency(invoice.balance_amount)}</p>
                    </div>
                  </div>
                  {invoice.due_date && (
                    <p className="text-sm text-gray-600 mt-2">
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeData?.payments && feeData.payments.length > 0 ? (
            <div className="space-y-4">
              {feeData.payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{formatCurrency(payment.amount)}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.timestamp).toLocaleDateString()} • {payment.mode}
                      </p>
                      {payment.transaction_id && (
                        <p className="text-xs text-gray-500">Txn: {payment.transaction_id}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={payment.status === 'success' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
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
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeData?.receipts && feeData.receipts.length > 0 ? (
            <div className="space-y-4">
              {feeData.receipts.map((receipt) => (
                <div key={receipt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">Receipt #{receipt.receipt_number}</h3>
                      <p className="text-sm text-gray-600">
                        Amount: {formatCurrency(receipt.amount)}
                      </p>
                      {receipt.payment_date && (
                        <p className="text-sm text-gray-600">
                          Payment Date: {new Date(receipt.payment_date).toLocaleDateString()}
                        </p>
                      )}
                      {receipt.payment_mode && (
                        <p className="text-sm text-gray-600">
                          Mode: {receipt.payment_mode}
                        </p>
                      )}
                      {receipt.transaction_id && (
                        <p className="text-xs text-gray-500">Txn: {receipt.transaction_id}</p>
                      )}
                      {receipt.semester && (
                        <p className="text-xs text-gray-500">Semester: {receipt.semester}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(receipt.payment_id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No receipts available</p>
              <p className="text-sm">Receipts will appear here once payments are processed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFees;
