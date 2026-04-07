import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useLoginLogic } from "../../hooks/useLoginLogic";

interface LoginMobileProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
  setUser: (user: any) => void;
}

const LoginMobile = ({ setRole, setPage, setUser }: LoginMobileProps) => {
  const {
    username,
    setUsername,
    password,
    setPassword,
    error,
    loading,
    showPassword,
    setShowPassword,
    handleLogin,
    handleForgotPassword,
  } = useLoginLogic({ setRole, setPage, setUser });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-[100dvh] pb-[env(safe-area-inset-bottom)] overflow-hidden flex flex-col w-full bg-gradient-to-b from-[#5B2EFF] via-[#6D28D9] to-[#8B5CF6]">
      {/* HEADER */}
      <div className="text-center space-y-1 pt-7 pb-4 shrink-0 px-4 animate-in fade-in zoom-in duration-500 delay-100">
        <p className="text-white text-sm font-medium opacity-90">Welcome to</p>
        <h1 className="text-white text-xl font-extrabold">NEURO CAMPUS</h1>
        <p className="text-white text-xs opacity-80">Login to access your Campus portal</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col justify-between px-4 max-w-sm w-full mx-auto py-3">
        <div className="flex flex-col gap-4">
          {/* ILLUSTRATION CARD */}
          <div className="w-full bg-[#EDE9FE] border border-white/40 rounded-2xl flex items-center justify-center h-[20vh] min-h-[120px] max-h-[180px] mb-1 animate-in fade-in zoom-in duration-500 delay-300">
            <img
              src="/image.png"
              alt="classroom"
              className="max-h-full object-contain"
            />
          </div>

          {/* LOGIN CARD */}
          <div className="w-full bg-[#F9FAFB] rounded-2xl shadow-md p-5 transition-all duration-300 hover:shadow-lg animate-in fade-in zoom-in duration-500 delay-400">
            {/* Card Header */}
            <div className="mb-3">
              <h2 className="text-center text-gray-700 text-lg font-semibold">Login</h2>
              <p className="text-center text-gray-400 text-sm mt-1">Sign in to access your account</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-xs text-center py-2 px-3 rounded-lg mb-3 border border-red-100">
                {error}
              </div>
            )}

            {/* Form Section */}
            <div className="space-y-3">
              {/* Username Field */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Username</label>
                <div className={`flex items-center bg-[#EDE9FE] rounded-xl px-3 py-2 border ${error ? 'border-red-300' : 'border-transparent'} transition-colors`}>
                  <User className={`mr-2 flex-shrink-0 ${error ? 'text-red-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter username"
                    disabled={loading}
                    className="bg-transparent outline-none flex-1 text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Password</label>
                <div className={`flex items-center bg-[#EDE9FE] rounded-xl px-3 py-2 border ${error ? 'border-red-300' : 'border-transparent'} transition-colors`}>
                  <Lock className={`mr-2 flex-shrink-0 ${error ? 'text-red-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter password"
                    disabled={loading}
                    className="bg-transparent outline-none flex-1 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className={`${error ? 'text-red-400' : 'text-gray-500'} flex-shrink-0 disabled:opacity-50 cursor-pointer ml-2 transition-colors`}
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50 cursor-pointer transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] text-white font-semibold text-sm shadow-lg shadow-purple-500/20 mt-2 hover:scale-[1.02] hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-70 cursor-pointer flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-white text-[11px] pb-4 mt-2">
          <p className="font-semibold opacity-90">AI-powered campus management system</p>
          <p className="opacity-80">Developed under Stalight Technology</p>
        </div>
      </div>
    </div>
  );
};

export default LoginMobile;