import { useState, useEffect } from "react";
import { verifyOTP, resendOTP } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface OTPPageProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
  setUser: (user: any) => void;
}

const OTPPage = ({ setRole, setPage, setUser }: OTPPageProps) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const user_id = localStorage.getItem("temp_user_id") || "";

  useEffect(() => {
    if (!user_id && !isVerified) {
      setError("Session expired. Please log in again.");
      setTimeout(() => setPage("login"), 2000);
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled, user_id, setPage, isVerified]);

  const handleVerifyOTP = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setError("Please enter the OTP");
      return;
    }
    if (!user_id) {
      setError("User ID missing. Please log in again.");
      setTimeout(() => setPage("login"), 2000);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await verifyOTP({ user_id, otp: trimmedOtp });

      if (response.success) {
        setSuccess("OTP verified successfully");
        setIsVerified(true);
        setRole(response.role || "");
        setUser(response.profile || {});
        setTimeout(() => {
          setPage(response.role || "student");
        }, 1000);
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("OTP Verification Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!user_id) {
      setError("User ID missing. Please log in again.");
      setTimeout(() => setPage("login"), 2000);
      return;
    }

    setError(null);
    setSuccess(null);
    setResendDisabled(true);
    setCountdown(60);

    try {
      const response = await resendOTP({ user_id });

      if (response.success) {
        setSuccess("OTP resent successfully");
      } else {
        setError(response.message || "Failed to resend OTP");
        setResendDisabled(false);
        setCountdown(0);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setResendDisabled(false);
      setCountdown(0);
      console.error("Resend OTP Error:", err);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-indigo-900/60 backdrop-blur-[2px]"></div>

      <div className="container relative z-10 px-4 mx-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
            NEURO CAMPUS
          </h1>
          <p className="text-xl text-blue-100 font-light tracking-wide">
            AI-powered campus management system
          </p>
          <p className="text-sm text-blue-200 mt-1">
            Developed under Stalight Technology
          </p>
        </div>

        <Card className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Verify OTP</CardTitle>
            <CardDescription className="text-center text-blue-100">Enter the OTP sent to your registered email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-500/80 text-white p-3 rounded-md text-sm backdrop-blur-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/80 text-white p-3 rounded-md text-sm backdrop-blur-sm">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-white">OTP</label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200/70 focus-visible:ring-blue-400"
              />
            </div>

            <Button
              onClick={handleVerifyOTP}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-600/30"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setPage("login")}
                size="sm"
                className="text-blue-900 bg-white border-white hover:bg-gray-200"
              >
                Back to Login
              </Button>

              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={resendDisabled}
                size="sm"
                className="text-blue-900 bg-white border-white hover:bg-gray-200"
              >
                {resendDisabled
                  ? `Resend OTP (${countdown}s)`
                  : "Resend OTP"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-xs text-center text-blue-200/80">
          © {new Date().getFullYear()} NEURO CAMPUS. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
