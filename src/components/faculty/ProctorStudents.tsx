import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { useState } from "react"

const students = [
  { usn: "1MS21CS001", name: "Aditya Sharma", semester: 6, status: "Good" },
  { usn: "1MS21CS015", name: "Bhavana Reddy", semester: 6, status: "Poor" },
  { usn: "1MS21CS026", name: "Chirag Patel", semester: 6, status: "Good" },
  { usn: "1MS21CS045", name: "Divya Mehra", semester: 6, status: "Average" },
  { usn: "1MS21CS060", name: "Eshwar Rajput", semester: 6, status: "Good" },
  { usn: "1MS21CS089", name: "Farhan Khan", semester: 6, status: "Poor" },
  { usn: "1MS21CS090", name: "Ganesh Kumar", semester: 6, status: "Average" },
  { usn: "1MS21CS099", name: "Haritha Jain", semester: 6, status: "Good" },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Good":
      return <Badge className="bg-green-100 text-green-800">{status}</Badge>
    case "Average":
      return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
    case "Poor":
      return <Badge className="bg-red-100 text-red-800">{status}</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

const ITEMS_PER_PAGE = 10

const ProctorStudents = () => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.usn.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginatedStudents = filteredStudents.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const handlePrevious = () => {
    setPage(prev => Math.max(prev - 1, 1))
  }

  const handleNext = () => {
    setPage(prev => Math.min(prev + 1, totalPages))
  }

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Proctor Students</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by USN or name..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">USN</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Current Semester</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-800">{student.usn}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{student.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{student.semester}</td>
                  <td className="px-4 py-2 text-sm">{getStatusBadge(student.status)}</td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-4">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handlePrevious} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-gray-700 self-center">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={handleNext} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProctorStudents
