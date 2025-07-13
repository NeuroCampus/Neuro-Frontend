import { useState } from "react";
import { forgotPassword } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface ForgotPasswordProps {
  setPage: (page: string) => void;
}

const ForgotPassword = ({ setPage }: ForgotPasswordProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await forgotPassword({ email: trimmedEmail });

      if (response.success) {
        setSuccess("OTP sent successfully to your email");
        localStorage.setItem("temp_user_id", response.user_id || "");
        setTimeout(() => {
          setPage("reset-password");
        }, 2000);
      } else {
        setError(response.message || "Failed to process request");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Forgot Password Error:", err);
    } finally {
      setLoading(false);
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
            <CardTitle className="text-2xl font-bold text-center text-white">Forgot Password</CardTitle>
            <CardDescription className="text-center text-blue-100">Enter your email to receive a password reset OTP</CardDescription>
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
              <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200/70 focus-visible:ring-blue-400"
                required
              />
            </div>

            <Button
              onClick={handleForgotPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-600/30"
              disabled={loading}
            >
              {loading ? "Processing..." : "Send OTP"}
            </Button>

            <div className="text-center">
              <span
                className="text-blue-100 cursor-pointer hover:text-white text-sm transition-colors"
                onClick={() => setPage("login")}
              >
                Back to Login
              </span>
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

export default ForgotPassword;
