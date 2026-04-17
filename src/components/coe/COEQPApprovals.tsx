import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Download } from "lucide-react";
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useTheme } from "../../context/ThemeContext";
import { API_ENDPOINT } from "../../utils/config";
import { fetchWithTokenRefresh } from "../../utils/authService";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { theme } = useTheme();

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetchPendingQPs();
    fetchFinalizedQPs();
  }, []);

  // Ensure SweetAlert appears above Dialog and remains clickable.
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const styleId = 'swal2-global-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .swal2-container, .swal2-popup {
          z-index: 99999 !important;
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
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
    const result = await MySwal.fire({
      title: 'Confirm approval',
      text: 'Are you sure you want to finalize and approve this question paper?',
      icon: 'question',
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      reverseButtons: true,
      confirmButtonText: 'Yes, approve',
      cancelButtonText: 'Cancel',
      target: document.body,
    });

    if (!result || result.isDismissed || !result.isConfirmed) {
      MySwal.close();
      return;
    }

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
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Approved',
          text: data.message || 'QP finalized and approved for use.',
          showConfirmButton: false,
          timer: 3000,
        });
        // remove from pending list
        setPendingQPs(pendingQPs.filter(qp => qp.id !== qpId));
        // add to finalized list so UI updates immediately without refetch
        if (selectedQP) {
          const finalizedItem = { ...selectedQP, status: 'approved' };
          // avoid duplicates
          setFinalizedQPs(prev => [finalizedItem, ...prev.filter(q => q.id !== finalizedItem.id)]);
        }
        setDialogOpen(false);
        setSelectedQP(null);
        setQpDetail(null);
        setComment("");
      } else {
        MySwal.fire('Error', data.message || 'Failed to finalize QP.', 'error');
      }
    } catch (error) {
      console.error("Error finalizing QP:", error);
      MySwal.fire('Network error', 'Network error while finalizing QP.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchQPDetail = async (qpId: number) => {
    setDetailLoading(true);
    try {
      // use fetchWithTokenRefresh so we attempt token refresh on 401
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/admin/qps/${qpId}/coe-detail/`, { method: 'GET' });

      if (response.status === 401 || response.status === 403) {
        // try authenticated HOD detail as a fallback (may be accessible to other admin roles)
        try {
          const hodResp = await fetchWithTokenRefresh(`${API_ENDPOINT}/admin/qps/${qpId}/hod-detail/`, { method: 'GET' });
          if (hodResp.ok) {
            const hodData = await hodResp.json();
            if (hodData.success && hodData.data && hodData.data.length > 0) {
              setQpDetail(hodData.data[0]);
              MySwal.fire('Notice', 'Loaded QP via HOD detail endpoint.', 'info');
              return;
            }
          }
        } catch (e) {
          console.error('Authenticated HOD fallback failed', e);
        }

        // try a public fetch (no auth) as a last resort — some finalized QPs may be publicly viewable
        try {
          const publicResp = await fetch(`${API_ENDPOINT}/admin/qps/${qpId}/coe-detail/`);
          if (publicResp.ok) {
            const publicData = await publicResp.json();
            if (publicData.success && publicData.data && publicData.data.length > 0) {
              setQpDetail(publicData.data[0]);
              MySwal.fire('Notice', 'Loaded QP via public endpoint.', 'info');
              return;
            }
          }
        } catch (e) {
          console.error('Public fallback failed', e);
        }

        MySwal.fire('Forbidden', 'You do not have permission to view this QP detail (401/403).', 'error');
        return;
      }

      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setQpDetail(data.data[0]);
      } else if (data.success === false && data.message) {
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
      showCloseButton: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      reverseButtons: true,
      confirmButtonText: 'Yes, reject',
      cancelButtonText: 'Cancel',
      // Render at document.body so it's not trapped under portal layers.
      target: document.body,
    });

    if (!result || result.isDismissed || !result.isConfirmed) {
      MySwal.close();
      return;
    }

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
        setDialogOpen(false);
        setSelectedQP(null);
        setQpDetail(null);
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
                        onClick={() => { setSelectedQP(qp); setQpDetail(null); fetchQPDetail(qp.id); setDialogOpen(true); }}
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
                          setSelectedQP(qp);
                          setQpDetail(null);
                          fetchQPDetail(qp.id);
                          setDialogOpen(true);
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
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQP(null);
            setQpDetail(null);
            setComment("");
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className={`${theme === 'dark' ? 'bg-card text-foreground border border-border' : 'bg-white text-gray-900 border border-gray-200'} max-w-[720px] w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] md:w-[90vw] rounded-lg flex flex-col max-h-[92vh]`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
              Review QP: {selectedQP?.subject} - {selectedQP?.test_type}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto px-4 py-2 space-y-4 flex-1">
            {detailLoading ? (
              <div className="text-center py-4">Loading QP details...</div>
            ) : qpDetail ? (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold mb-4">Question Paper Preview</h4>
                <div className="space-y-4">
                  {qpDetail.questions.map((q: any, qIndex: number) => (
                    <div key={qIndex} className="space-y-3">
                      {q.subparts.map((s: any, sIndex: number) => {
                        const key = `${qIndex}-${sIndex}`;
                        const isExpanded = !!expanded[key];
                        const content = s.content || '';
                        const shortContent = content.length > 160 ? content.slice(0, 160) + '...' : content;

                        return (
                          <div key={sIndex} className="border rounded-md p-3 bg-white dark:bg-gray-900">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-medium text-sm">
                                {q.question_number}{s.subpart_label}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="text-sm text-gray-900 dark:text-gray-100 mb-1 flex-1">
                                    {isExpanded ? content : shortContent}
                                  </div>
                                  <div className="ml-2 flex-shrink-0">
                                    <Badge className="text-black font-semibold text-sm bg-transparent">{s.max_marks}m</Badge>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge className="text-black bg-transparent">CO: {q.co}</Badge>
                                  <Badge className="text-black bg-transparent">{q.blooms_level}</Badge>
                                  {content.length > 160 && (
                                    <button
                                      onClick={() => toggleExpanded(key)}
                                      className="text-sm text-primary-600 dark:text-primary-400 ml-2"
                                    >
                                      {isExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
              <div className="text-center py-4 text-muted-foreground">Failed to load QP details</div>
            )}

            {selectedQP?.status !== 'approved' && (
              <div>
                <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a final comment..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedQP?.status === 'approved' ? (
              <>
                <Button
                  onClick={() => qpDetail && printQP(qpDetail)}
                  className="w-full sm:w-auto justify-center whitespace-normal text-center bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde]"
                >
                  Print
                </Button>
                <Button
                  onClick={() => {
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
                  }}
                  className="w-full sm:w-auto justify-center whitespace-normal text-center bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde]"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedQP(null);
                    setQpDetail(null);
                    setComment("");
                  }}
                  className="w-full sm:w-auto justify-center whitespace-normal text-center"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => selectedQP && handleFinalize(selectedQP.id)}
                    disabled={actionLoading}
                    className={`w-full sm:w-auto justify-center transition-none whitespace-normal text-center ${theme === 'dark' ? 'border-green-500 text-green-400 bg-green-500/10 hover:bg-green-500/20 border' : 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100 border'}`}
                  >
                    <CheckCircle className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    Finalize & Approve
                  </Button>
                  <Button
                    onClick={() => selectedQP && handleReject(selectedQP.id)}
                    disabled={actionLoading}
                    className={`w-full sm:w-auto justify-center transition-none whitespace-normal text-center ${theme === 'dark' ? 'border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20 border' : 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100 border'}`}
                  >
                    <XCircle className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                    Reject & Send Back
                  </Button>
                </div>
                <div className="w-full sm:w-auto sm:ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setSelectedQP(null);
                      setComment("");
                      setQpDetail(null);
                    }}
                    className="w-full sm:w-auto justify-center whitespace-normal text-center"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default COEQPApprovals;