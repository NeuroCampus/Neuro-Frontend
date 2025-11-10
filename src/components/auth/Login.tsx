import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LockKeyhole, User, BookOpen, Users, GraduationCap } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";


interface LoginProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
  setUser: (user: any) => void;
}

const Login = ({ setRole, setPage, setUser }: LoginProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter both username and password");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await loginUser({ username: trimmedUsername, password: trimmedPassword });
      if (response.success) {
        if (response.message === "OTP sent") {
          localStorage.setItem("temp_user_id", response.user_id || "");
          setPage("otp");
        } else {
          // Authentication successful - navigate directly to appropriate dashboard
          const userRole = response.role;
          switch (userRole) {
            case "admin":
              navigate("/admin", { replace: true });
              break;
            case "hod":
              navigate("/hod", { replace: true });
              break;
            case "fees_manager":
              navigate("/fees-manager", { replace: true });
              break;
            case "teacher":
              navigate("/faculty", { replace: true });
              break;
            case "student":
              navigate("/dashboard", { replace: true });
              break;
            default:
              navigate("/", { replace: true });
          }
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
       {/* Right Section - Welcome & Illustration */}
      <motion.div 
        className="flex-1 bg-gradient-to-br from-[#a259ff] to-[#7c3aed] flex items-center justify-center p-8 relative overflow-hidden"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Decorative Blur Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full blur-lg" />
        </div>

        {/* Text Content */}
        <div className="relative z-10 text-center text-white max-w-lg">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Welcome to <br />
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              NEURO CAMPUS
            </span>
          </motion.h2>
          <motion.p
            className="text-lg text-white/90 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Login to access your Campus portal
          </motion.p>

          {/* Educator SVG Illustration */}
          <motion.div
            className="mx-auto w-80 md:w-96 max-w-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <motion.img
              src="/undraw_educator_6dgp.svg"
              alt="Educator Illustration"
              className="w-full h-auto drop-shadow-2xl filter brightness-110 contrast-110"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.15)) brightness(1.1) contrast(1.1)'
              }}
            />
          </motion.div>

          <motion.div
            className="mt-6 text-white/80 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            AI-powered campus management system
            <br />
            <span className="text-xs text-white/60 mt-2 block">Developed under Stalight Technology</span>
          </motion.div>
        </div>
      </motion.div>
      {/* Left Section - Login Form */}
      <motion.div 
        className="flex-1 bg-[#1c1c1e] flex items-center justify-center p-8"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
            <p className="text-gray-400 text-sm">Sign in to access your account</p>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {error && (
              <motion.div 
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#a259ff] focus:ring-[#a259ff]/20 rounded-lg h-12 transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-4 h-4 w-4 text-gray-500" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#a259ff] focus:ring-[#a259ff]/20 rounded-lg h-12 transition-all duration-300"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />

                {/* Eye Icon Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-4 text-gray-500 "
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setPage("forgot-password")}
                className="text-[#a259ff] hover:text-[#a259ff]/80 text-sm transition-colors duration-300"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#a259ff] hover:bg-[#a259ff]/90 text-white font-medium rounded-lg h-12 shadow-lg shadow-[#a259ff]/20 hover:shadow-[#a259ff]/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Login"
              )}
            </Button>

            <div className="text-center text-gray-400 text-sm">
              {" "}
              <span className="text-[#a259ff] hover:text-[#a259ff]/80 cursor-pointer transition-colors duration-300">
                
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
