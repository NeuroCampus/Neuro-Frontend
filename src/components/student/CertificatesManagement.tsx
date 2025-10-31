import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";  // Add this import
import {
  Download,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { getCertificates } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";

// Mock data - replace with actual API data
const mockCertificates = [
  {
    id: 1,
    name: "Course Completion Certificate",
    issueDate: "2024-03-15",
    status: "issued",
    downloadUrl: "#",
  },
  {
    id: 2,
    name: "Academic Achievement Certificate",
    issueDate: "2024-02-20",
    status: "issued",
    downloadUrl: "#",
  },
];

const mockRequests = [
  {
    id: 1,
    type: "Bonafide Certificate",
    requestDate: "2024-04-01",
    status: "pending",
  },
  {
    id: 2,
    type: "Transfer Certificate",
    requestDate: "2024-03-28",
    status: "rejected",
    reason: "Invalid supporting documents",
  },
];

const CertificatesManagement = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [certificates, setCertificates] = useState<any[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchCertificates = async () => {
      const data = await getCertificates();
      if (data.success && Array.isArray(data.data)) {
        setCertificates(data.data);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
      <CardHeader>
        <CardTitle className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Certificates Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className={theme === 'dark' ? 'bg-[#232326]' : 'bg-gray-100'}>
            <TabsTrigger 
              value="view" 
              className={theme === 'dark' ? 
                'data-[state=active]:bg-[#1c1c1e] data-[state=active]:text-gray-200 text-gray-400' : 
                'data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500'
              }
            >
              View Certificates
            </TabsTrigger>
            <TabsTrigger 
              value="request" 
              className={theme === 'dark' ? 
                'data-[state=active]:bg-[#1c1c1e] data-[state=active]:text-gray-200 text-gray-400' : 
                'data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500'
              }
            >
              Request Certificate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            {/* Issued Certificates */}
            <div className="space-y-4">
              <h3 className={`font-medium mt-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Issued Certificates</h3>
              <div className="grid gap-4">
                {mockCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={`flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-[#232326]' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{cert.name}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Issued on: {cert.issueDate}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pending Requests */}
              <h3 className={`font-medium mt-6 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Certificate Requests</h3>
              <div className="grid gap-4">
                {mockRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border hover:bg-accent transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-[#232326]' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {request.status === "pending" ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : request.status === "rejected" ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{request.type}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Requested on: {request.requestDate}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          request.status === "pending"
                            ? "bg-yellow-500"
                            : request.status === "rejected"
                            ? "bg-red-500"
                            : "bg-green-500"
                        }
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </Badge>
                    </div>
                    {request.reason && (
                      <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                        Reason: {request.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificate-type" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Certificate Type</Label>
                <select
                  id="certificate-type"
                  className={theme === 'dark' ? 
                    'flex h-10 w-full rounded-md border border-gray-700 bg-[#232326] px-3 py-2 text-sm text-gray-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50' : 
                    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                  }
                >
                  <option value="" className={theme === 'dark' ? 'bg-[#232326] text-gray-200' : 'bg-white text-gray-900'}>Select certificate type</option>
                  <option value="bonafide" className={theme === 'dark' ? 'bg-[#232326] text-gray-200' : 'bg-white text-gray-900'}>Bonafide Certificate</option>
                  <option value="transfer" className={theme === 'dark' ? 'bg-[#232326] text-gray-200' : 'bg-white text-gray-900'}>Transfer Certificate</option>
                  <option value="completion" className={theme === 'dark' ? 'bg-[#232326] text-gray-200' : 'bg-white text-gray-900'}>Course Completion</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Purpose</Label>
                <Input
                  type="text"
                  id="purpose"
                  placeholder="State the purpose for requesting the certificate"
                  className={theme === 'dark' ? 'bg-[#232326] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-300'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supporting-doc" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Supporting Documents</Label>
                <Input
                  type="file"
                  id="supporting-doc"
                  className={`cursor-pointer ${theme === 'dark' ? 'bg-[#232326] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload any relevant supporting documents (if required)
                </p>
              </div>

              <Button 
                type="submit" 
                className={`w-full ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CertificatesManagement;