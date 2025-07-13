import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { ScrollArea } from "../ui/scroll-area"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const allRecords = [
  { usn: "CS001", name: "Amit Kumar", subject: "Database Management", attendance: 92, status: "Good" },
  { usn: "CS002", name: "Priya Sharma", subject: "Database Management", attendance: 85, status: "Good" },
  { usn: "CS003", name: "Rahul Verma", subject: "Database Management", attendance: 72, status: "Poor" },
  { usn: "CS004", name: "Ananya Patel", subject: "Database Management", attendance: 95, status: "Good" },
  { usn: "CS005", name: "Vikram Singh", subject: "Database Management", attendance: 68, status: "Poor" },
  { usn: "CS006", name: "Neha Gupta", subject: "Data Structures", attendance: 88, status: "Good" },
  { usn: "CS007", name: "Rajesh Khanna", subject: "Data Structures", attendance: 76, status: "Average" },
  { usn: "CS008", name: "Kavita Jain", subject: "Data Structures", attendance: 94, status: "Good" },
  { usn: "CS009", name: "Deepak Kumar", subject: "Data Structures", attendance: 82, status: "Average" },
  { usn: "CS010", name: "Meera Reddy", subject: "Data Structures", attendance: 65, status: "Poor" },
]

const getStatusColor = (status: string) =>
  clsx(
    "rounded-full px-2 py-1 text-xs font-medium",
    status === "Good" && "bg-green-100 text-green-800",
    status === "Average" && "bg-yellow-100 text-yellow-800",
    status === "Poor" && "bg-red-100 text-red-800"
  )

const AttendanceRecords = () => {
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [page, setPage] = useState(1)

  const filteredData = useMemo(() => {
    return allRecords.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.usn.toLowerCase().includes(search.toLowerCase())
      const matchesSubject = subjectFilter === "all" || r.subject === subjectFilter
      return matchesSearch && matchesSubject
    })
  }, [search, subjectFilter])

  const pageSize = 10
  const pageCount = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

  const handleExport = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Attendance Records", 14, 20)
  
    const tableData = filteredData.map((r) => [
      r.usn,
      r.name,
      r.subject,
      `${r.attendance}%`,
      r.status,
    ])
  
    autoTable(doc, {
      startY: 30,
      head: [["USN", "Student Name", "Subject", "Attendance", "Status"]],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [22, 160, 133], // teal
      },
    })
  
    doc.save("attendance_records.pdf")
  }
  

  return (
    <div className="p-6 space-y-4 bg-white">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <Input
              placeholder="Search by student name or USN..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="w-full md:w-1/2"
            />
            <Select
              value={subjectFilter}
              onValueChange={(value) => {
                setPage(1)
                setSubjectFilter(value)
              }}
            >
              <SelectTrigger className="w-full md:w-1/4">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Database Management">Database Management</SelectItem>
                <SelectItem value="Data Structures">Data Structures</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="rounded border">
            <div className="flex justify-between items-center p-4 text-sm font-medium">
              <span>
                Showing {paginatedData.length} of {filteredData.length} attendance records
              </span>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>USN</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((record) => (
                  <TableRow key={record.usn}>
                    <TableCell>{record.usn}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{record.subject}</TableCell>
                    <TableCell>{record.attendance}%</TableCell>
                    <TableCell>
                      <span className={getStatusColor(record.status)}>{record.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
              disabled={page === pageCount}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AttendanceRecords
