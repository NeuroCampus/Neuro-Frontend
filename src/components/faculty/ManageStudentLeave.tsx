import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Filter } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const initialRequests = [
  {
    id: 1,
    student: "Sharma",
    usn: "1MS21CS001",
    department: "Computer Science",
    period: "Apr 15, 2025 to Apr 17, 2025",
    reason: "Medical emergency",
    status: "Pending",
  },
  {
    id: 2,
    student: "Kumar",
    usn: "1MS21CS002",
    department: "Electronics",
    period: "Apr 20, 2025 to Apr 22, 2025",
    reason: "Personal work",
    status: "Pending",
  },
  {
    id: 3,
    student: "Patel",
    usn: "1MS21CS003",
    department: "Computer Science",
    period: "Apr 10, 2025 to Apr 11, 2025",
    reason: "Conference attendance",
    status: "Approved",
  },
  {
    id: 4,
    student: "Singh",
    department: "Mechanical",
    period: "Apr 5, 2025 to Apr 7, 2025",
    reason: "Family function",
    status: "Rejected",
  },
]

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
}

const statusOptions = ["All", "Pending", "Approved", "Rejected"]

const ManageStudentLeave = () => {
  const [leaveRequests, setLeaveRequests] = useState(initialRequests)
  const [filterStatus, setFilterStatus] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const handleStatusChange = (id: number, newStatus: "Approved" | "Rejected") => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: newStatus } : req
      )
    )
  }

  const filteredRequests = leaveRequests.filter((req) => {
    const matchesStatus = filterStatus === "All" || req.status === filterStatus;
    const matchesSearch =
      req.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.usn ? req.usn.toLowerCase().includes(searchQuery.toLowerCase()) : false); // Safely handle undefined usn
    return matchesStatus && matchesSearch;
  });
  
  

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      <h2 className="text-2xl font-semibold mb-2">Leave Approvals</h2>
      <p className="text-gray-600 mb-6">Review and manage Student leave requests.</p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <input
          placeholder="Search student..."
          className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-1/2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="flex flex-col gap-1">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  className={cn(
                    "justify-start px-3 py-1 text-sm",
                    filterStatus === status && "bg-gray-100 font-medium"
                  )}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 border-b text-gray-700">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="font-medium">{req.student}</div>
                      <div className="text-gray-500 text-xs">{req.usn}</div>
                      <div className="text-gray-500 text-xs">{req.department}</div>
                    </td>
                    <td className="px-4 py-3">{req.period}</td>
                    <td className="px-4 py-3">{req.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${statusStyles[req.status as keyof typeof statusStyles]}`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "Pending" ? (
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 px-3 py-1.5"
                            onClick={() => handleStatusChange(req.id, "Approved")}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 px-3 py-1.5"
                            onClick={() => handleStatusChange(req.id, "Rejected")}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500" colSpan={5}>
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ManageStudentLeave
