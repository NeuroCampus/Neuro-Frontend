import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { API_ENDPOINT } from "../../utils/config";

interface QPPending {
  id: number;
  subject: string;
  test_type: string;
  faculty: string;
  submitted_at: string;
  questions_count: number;
}

const AdminQPApprovals = () => {
  const [pendingQPs, setPendingQPs] = useState<QPPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQP, setSelectedQP] = useState<QPPending | null>(null);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchPendingQPs();
  }, []);

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

  const handleReject = async (qpId: number) => {
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
        alert("QP rejected and sent back to faculty.");
        setPendingQPs(pendingQPs.filter(qp => qp.id !== qpId));
        setSelectedQP(null);
        setComment("");
      } else {
        alert(data.message || "Failed to reject QP.");
      }
    } catch (error) {
      console.error("Error rejecting QP:", error);
      alert("Network error while rejecting QP.");
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
                      <h3 className="font-semibold">{qp.subject} - {qp.test_type}</h3>
                      <p className="text-sm text-muted-foreground">Faculty: {qp.faculty}</p>
                      <p className="text-sm text-muted-foreground">Submitted: {new Date(qp.submitted_at).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Questions: {qp.questions_count}</p>
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

      {selectedQP && (
        <Card>
          <CardHeader>
            <CardTitle>Review QP: {selectedQP.subject} - {selectedQP.test_type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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