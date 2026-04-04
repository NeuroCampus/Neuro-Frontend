import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Download } from "lucide-react";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useTheme } from "../../context/ThemeContext";
import { API_ENDPOINT } from "../../utils/config";

interface QPPending {
  id: number;
  subject: string;
  test_type: string;
  faculty: string;
  submitted_at: string;
  branch?: { id: number | null; name: string | null };
  status?: string;
  current_holder?: string | null;
  last_action?: { actor?: string; role?: string; action?: string; comment?: string } | null;
}

const AdminQPApprovals = () => {
  const [pendingQPs, setPendingQPs] = useState<QPPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQP, setSelectedQP] = useState<QPPending | null>(null);
  const [qpDetail, setQpDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchPendingQPs();
  }, []);

  const fetchQPDetail = async (qpId: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/hod-detail/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setQpDetail(data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching QP detail:", error);
      setQpDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!qpDetail) return;
    // reuse simple jsPDF-based exporter like HOD view
    // Lazy-import to avoid adding dependency here if not present
    // But project already uses jsPDF in HOD; assume available
    // @ts-ignore
    const jsPDF = require('jspdf').jsPDF || require('jspdf');
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text('Question Paper', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Subject: ${qpDetail.subject}`, 14, y);
    y += 6;
    doc.text(`Test Type: ${qpDetail.test_type}`, 14, y);
    y += 6;
    doc.text(`Faculty: ${qpDetail.faculty}`, 14, y);
    y += 10;

    let totalMarks = 0;
    (qpDetail.questions || []).forEach((q: any) => {
      (q.subparts || []).forEach((s: any) => {
        totalMarks += s.max_marks || 0;
      });
    });

    (qpDetail.questions || []).forEach((q: any) => {
      (q.subparts || []).forEach((s: any) => {
        doc.setFontSize(12);
        doc.text(`${q.question_number}${s.subpart_label}. ${s.content}`, 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(`(${s.max_marks} marks)`, 14, y);
        y += 6;
        doc.text(`CO: ${q.co}`, 14, y);
        y += 6;
        doc.text(`Blooms: ${q.blooms_level}`, 14, y);
        y += 8;
        if (y > 270) {
          doc.addPage();
          y = 10;
        }
      });
    });

    doc.setFontSize(12);
    doc.text(`Total Marks: ${totalMarks}`, 14, y);
    doc.save(`qp-${qpDetail.subject}-${qpDetail.test_type}.pdf`);
  };

  const fetchPendingQPs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/admin-pending/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPendingQPs(data.data);
      }
    } catch (error) {
      console.error("Error fetching pending QPs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (qpId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/admin-approve/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });
      const data = await response.json();
      if (data.success) {
        alert("QP approved and forwarded to COE.");
        setPendingQPs(pendingQPs.filter(qp => qp.id !== qpId));
        setSelectedQP(null);
        setComment("");
      } else {
        alert(data.message || "Failed to approve QP.");
      }
    } catch (error) {
      console.error("Error approving QP:", error);
      alert("Network error while approving QP.");
    } finally {
      setActionLoading(false);
    }
  };

  const MySwal = withReactContent(Swal);

  const handleReject = async (qpId: number) => {
    const result = await MySwal.fire({
      title: 'Confirm rejection',
      text: 'Are you sure you want to reject this question paper and send it back to HOD?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/admin-reject/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });
      const data = await response.json();
      if (data.success) {
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Rejected',
          text: data.message || 'QP rejected and sent back to HOD for review.',
          showConfirmButton: false,
          timer: 3000,
        });
        setPendingQPs(pendingQPs.filter(qp => qp.id !== qpId));
        setSelectedQP(null);
        setComment("");
      } else {
        MySwal.fire('Error', data.message || 'Failed to reject QP.', 'error');
      }
    } catch (error) {
      console.error("Error rejecting QP:", error);
      MySwal.fire('Network error', 'Network error while rejecting QP.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6">Loading pending QPs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Paper Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingQPs.length === 0 ? (
            <p className="text-center text-muted-foreground">No pending QPs for approval.</p>
          ) : (
            <div className="space-y-4">
              {pendingQPs.map((qp) => (
                <Card key={qp.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{qp.subject} - {qp.test_type}</h3>
                        {qp.status && (
                          (() => {
                            const s = qp.status;
                            if (s === 'rejected') return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
                            if (s === 'approved') return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
                            // pending states
                            if (s.startsWith('pending')) return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
                            return <Badge className="bg-gray-100 text-gray-800">{s}</Badge>;
                          })()
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Faculty: {qp.faculty}</p>
                      <p className="text-sm text-muted-foreground">Submitted: {new Date(qp.submitted_at).toLocaleDateString()}</p>
                      {qp.branch && (
                        <p className="text-sm text-muted-foreground">Branch: {qp.branch.name}</p>
                      )}
                      {qp.last_action ? (
                        <div>
                          <p className="text-sm text-muted-foreground">Last: {qp.last_action.action} by {qp.last_action.actor} ({qp.last_action.role})</p>
                          {qp.last_action.comment ? (
                            <p className="text-sm text-muted-foreground">Comment: {qp.last_action.comment}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                      <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedQP(qp); setQpDetail(null); fetchQPDetail(qp.id); }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedQP && (
        <Card>
          <CardHeader>
            <CardTitle>Review QP: {selectedQP.subject} - {selectedQP.test_type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailLoading ? (
              <div className="text-center py-4">Loading QP details...</div>
            ) : qpDetail ? (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold mb-4">Question Paper Preview</h4>
                <div className="space-y-4">
                  {qpDetail.questions.map((q: any, qIndex: number) => (
                    <div key={qIndex}>
                      {q.subparts.map((s: any, sIndex: number) => (
                        <div key={sIndex} className="mb-3">
                          <div className="font-medium">
                            {q.question_number}{s.subpart_label}.
                          </div>
                          <div className="mt-1">{s.content}</div>
                          <div className="mt-1 text-sm">({s.max_marks} marks)</div>
                          <div className="text-sm mt-1">CO: {q.co}</div>
                          <div className="text-sm">Blooms: {q.blooms_level}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="font-semibold pt-2 border-t">
                    Total Marks: {qpDetail.questions.reduce((total: number, q: any) => 
                      total + q.subparts.reduce((subTotal: number, s: any) => subTotal + s.max_marks, 0), 0
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Failed to load QP details
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Comment (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment for the faculty..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(selectedQP.id)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve & Forward to COE
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedQP.id)}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject & Send Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedQP(null);
                  setComment("");
                  setQpDetail(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminQPApprovals;