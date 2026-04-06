import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Download } from "lucide-react";
import jsPDF from 'jspdf';
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

const COEQPApprovals = () => {
  const [pendingQPs, setPendingQPs] = useState<QPPending[]>([]);
  const [finalizedQPs, setFinalizedQPs] = useState<QPPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQP, setSelectedQP] = useState<QPPending | null>(null);
  const [qpDetail, setQpDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchPendingQPs();
    fetchFinalizedQPs();
  }, []);

  const fetchPendingQPs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/coe-pending/`, {
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

  const fetchFinalizedQPs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/coe-finalized/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFinalizedQPs(data.data);
      }
    } catch (error) {
      console.error("Error fetching finalized QPs:", error);
    }
  };

  const handleFinalize = async (qpId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/coe-finalize/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });
      const data = await response.json();
      if (data.success) {
        alert("QP finalized and approved for use.");
        setPendingQPs(pendingQPs.filter(qp => qp.id !== qpId));
        setSelectedQP(null);
        setComment("");
      } else {
        alert(data.message || "Failed to finalize QP.");
      }
    } catch (error) {
      console.error("Error finalizing QP:", error);
      alert("Network error while finalizing QP.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchQPDetail = async (qpId: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/coe-detail/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setQpDetail(data.data[0]);
      } else if (data.success === false && data.message) {
        // surface forbidden/error messages via toast
        MySwal.fire('Error', data.message, 'error');
      }
    } catch (err) {
      console.error('Error fetching QP detail:', err);
      MySwal.fire('Error', 'Failed to load QP detail', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  const printQP = (qp: any) => {
    if (!qp) return;
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;
    const title = `Question Paper - ${qp.subject} - ${qp.test_type}`;
    const styles = `
      body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color: #111; }
      h1 { font-size: 20px; margin-bottom: 8px; }
      .qp-meta { margin-bottom: 12px; }
      .question { margin-bottom: 10px; }
      .subpart { margin-left: 8px; margin-bottom: 6px; }
    `;

    let html = `<!doctype html><html><head><title>${title}</title><style>${styles}</style></head><body>`;
    html += `<h1>Question Paper</h1>`;
    html += `<div class="qp-meta"><strong>Subject:</strong> ${qp.subject} &nbsp; <strong>Test:</strong> ${qp.test_type} &nbsp; <strong>Faculty:</strong> ${qp.faculty}</div>`;
    qp.questions.forEach((q: any) => {
      html += `<div class="question">`;
      q.subparts.forEach((s: any) => {
        html += `<div class="subpart"><strong>${q.question_number}${s.subpart_label}.</strong> ${s.content} <em>(${s.max_marks} marks)</em></div>`;
      });
      html += `</div>`;
    });
    // total marks
    const total = qp.questions.reduce((total: number, q: any) => total + q.subparts.reduce((st: number, s: any) => st + (s.max_marks || 0), 0), 0);
    html += `<div style="margin-top:16px;"><strong>Total Marks:</strong> ${total}</div>`;
    html += `</body></html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    // give browser a bit of time to render before printing
    setTimeout(() => {
      try { win.focus(); win.print(); } catch (e) { console.error('Print failed', e); }
    }, 300);
  };

  const MySwal = withReactContent(Swal);

  const handleReject = async (qpId: number) => {
    const result = await MySwal.fire({
      title: 'Confirm rejection',
      text: 'Are you sure you want to reject this question paper and send it back to Admin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/coe-reject/`, {
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
          text: data.message || 'QP rejected and sent back to Admin for review.',
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
  }

  if (loading) {
    return <div className="text-center py-6">Loading pending QPs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Paper Final Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingQPs.length === 0 ? (
            <p className="text-center text-muted-foreground">No pending QPs for final approval.</p>
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
                        onClick={() => setSelectedQP(qp)}
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

      {/* Finalized QPs section */}
      <Card>
        <CardHeader>
          <CardTitle>Finalized Question Papers</CardTitle>
        </CardHeader>
        <CardContent>
          {finalizedQPs.length === 0 ? (
            <p className="text-center text-muted-foreground">No finalized QPs yet.</p>
          ) : (
            <div className="space-y-4">
              {finalizedQPs.map((qp) => (
                <Card key={`final-${qp.id}`} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{qp.subject} - {qp.test_type}</h3>
                        {qp.status && (
                          (() => {
                            const s = qp.status;
                            if (s === 'rejected') return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
                            if (s === 'approved') return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
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
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // open the same preview as pending review but read-only and provide download
                          setSelectedQP(qp);
                          fetchQPDetail(qp.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
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
            <CardTitle>Final Review QP: {selectedQP.subject} - {selectedQP.test_type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedQP.status === 'approved' ? (
              <div>
                    {detailLoading ? (
                      <div className="text-center py-4">Loading QP...</div>
                    ) : qpDetail ? (
                  <div>
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-semibold mb-4">Question Paper Preview</h4>
                      <div className="space-y-4">
                        {qpDetail.questions.map((q: any, qIndex: number) => (
                          <div key={qIndex}>
                            {q.subparts.map((s: any, sIndex: number) => (
                              <div key={sIndex} className="mb-3">
                                <div className="font-medium">{q.question_number}{s.subpart_label}.</div>
                                <div className="mt-1">{s.content}</div>
                                <div className="mt-1 text-sm">({s.max_marks} marks)</div>
                                <div className="text-sm mt-1">CO: {q.co}</div>
                                <div className="text-sm">Blooms: {q.blooms_level}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="font-semibold pt-2 border-t">Total Marks: {qpDetail.questions.reduce((total: number, q: any) => total + q.subparts.reduce((st: number, s: any) => st + s.max_marks, 0), 0)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => {
                        // create a simple print view
                        window.print();
                      }}>Print</Button>
                      <Button onClick={() => {
                        // Download PDF using jsPDF
                        if (!qpDetail) return;
                        const doc = new jsPDF();
                        let y = 10;
                        doc.setFontSize(14);
                        doc.text('Question Paper', 14, y);
                        y += 10;
                        doc.setFontSize(12);
                        doc.text(`Subject: ${qpDetail.subject}`, 14, y); y += 6;
                        doc.text(`Test Type: ${qpDetail.test_type}`, 14, y); y += 6;
                        doc.text(`Faculty: ${qpDetail.faculty}`, 14, y); y += 8;
                        qpDetail.questions.forEach((q: any) => {
                          q.subparts.forEach((s: any) => {
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
                            if (y > 270) { doc.addPage(); y = 10; }
                          });
                        });
                        doc.save(`qp-${qpDetail.subject}-${qpDetail.test_type}.pdf`);
                      }}> <Download className="w-4 h-4 mr-1"/> Download PDF</Button>
                      <Button variant="outline" onClick={() => { setSelectedQP(null); setQpDetail(null); }}>Close</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">Click "Load QP" to view the finalized paper.</div>
                )}
              </div>
            ) : (
              <div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a final comment..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleFinalize(selectedQP.id)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Finalize & Approve
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
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default COEQPApprovals;