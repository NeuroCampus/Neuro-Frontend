import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Circle, CalendarCheck2, CalendarX2 } from 'lucide-react'

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

interface LeaveRequest {
  id: number
  title: string
  name: string
  usn: string
  from?: string
  to?: string
  date?: string
  reason: string
  status: LeaveStatus
  appliedOn: string
}

const statusStyles = {
  Pending: 'text-yellow-700 bg-yellow-100',
  Approved: 'text-green-700 bg-green-100',
  Rejected: 'text-red-700 bg-red-100',
}

const LeaveRequests = () => {
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([
    {
      id: 1,
      title: 'Medical Leave',
      name: 'John Doe',
      usn: '123456789',
      from: '2025-04-15',
      to: '2025-04-17',
      reason: "Doctor's appointment and follow-up visits",
      status: 'Pending',
      appliedOn: '2025-04-12',
    },
    {
      id: 2,
      title: 'Family Function',
      name: 'Jane Smith',
      usn: '987654321',
      from: '2025-03-22',
      to: '2025-03-24',
      reason: "Sister's wedding",
      status: 'Approved',
      appliedOn: '2025-03-10',
    },
    {
      id: 3,
      title: 'Personal Leave',
      name: 'Alice Johnson',
      usn: '456789123',
      date: '2025-02-08',
      reason: 'Important personal matter to attend to',
      status: 'Rejected',
      appliedOn: '2025-02-05',
    },
  ])

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [name, setName] = useState('')
  const [usn, setUsn] = useState('')

  const handleSubmit = () => {
    const appliedOn = new Date().toISOString().split('T')[0];
    const newLeave: LeaveRequest = {
      id: leaveList.length + 1,
      title: 'New Leave',
      name,
      usn,
      from: startDate,
      to: endDate,
      reason,
      status: 'Pending', // Default status
      appliedOn,
    };
  
    // Validate leave dates
    if (startDate && endDate) {
      if (startDate < appliedOn || endDate < appliedOn) {
        newLeave.status = 'Rejected';
      }
    } else if (startDate) {
      if (startDate < appliedOn) {
        newLeave.status = 'Rejected';
      }
    }
  
    setLeaveList([newLeave, ...leaveList]);
    setStartDate('');
    setEndDate('');
    setReason('');
    setName('');
    setUsn('');
  };
  

  const renderStatus = (status: LeaveStatus) => {
    const baseClass = "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium"

    switch (status) {
      case 'Pending':
        return (
          <div className={`${baseClass} bg-yellow-100 text-yellow-800`}>
            <Circle className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
            Pending
          </div>
        )
      case 'Approved':
        return (
          <div className={`${baseClass} bg-green-100 text-green-700`}>
            <CalendarCheck2 className="w-4 h-4 text-green-600" />
            Approved
          </div>
        )
      case 'Rejected':
        return (
          <div className={`${baseClass} bg-red-100 text-red-700`}>
            <CalendarX2 className="w-4 h-4 text-red-600" />
            Rejected
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-black max-w-md rounded-xl p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Leave Application Form</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usn">USN</Label>
                <Input type="text" id="usn" value={usn} onChange={(e) => setUsn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Leave</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a detailed reason for your leave request"
                />
              </div>
              <Button onClick={handleSubmit} className="bg-blue-600 text-white mt-4 hover:bg-blue-700">
                Submit Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {leaveList.map((leave) => (
          <Card key={leave.id} className="bg-white text-black border border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-lg font-semibold">{leave.title}</div>
                {renderStatus(leave.status)}
              </div>
              <div className="text-sm text-gray-700 mb-1">
                <div>Name: {leave.name}</div>
                <div>USN: {leave.usn}</div>
                {leave.from && leave.to ? (
                  <>
                    From: {leave.from} To: {leave.to}
                  </>
                ) : (
                  <>Date: {leave.date}</>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-2">{leave.reason}</div>
              <div className="text-xs text-gray-500">Applied on: {leave.appliedOn}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default LeaveRequests
