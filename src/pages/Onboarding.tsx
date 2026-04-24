import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, User, Mail, Phone, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { API_ENDPOINT } from "@/utils/config";
import { toast } from "@/components/ui/use-toast";

const Onboarding = () => {
  const { plan } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    org_name: "",
    admin_name: "",
    email: "",
    phone: "",
    plan: plan || "basic"
  });

  useEffect(() => {
    if (plan) {
      setFormData(prev => ({ ...prev, plan: plan.toLowerCase() }));
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINT}/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast({
          title: "Success!",
          description: "Your organization has been created. Check your email for credentials.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Onboarding Failed",
          description: data.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not connect to the server.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to NeuroCampus!</h1>
          <p className="text-gray-600 mb-8">
            Your organization <strong>{formData.org_name}</strong> has been successfully created. 
            We've sent an email to <strong>{formData.email}</strong> with your login credentials and setup instructions.
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="w-full bg-[#a259ff] hover:bg-[#a259ff]/90 h-12 rounded-xl"
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Section - Onboarding Info */}
      <motion.div 
        className="hidden lg:flex flex-1 bg-gradient-to-br from-[#a259ff] to-[#7c3aed] items-center justify-center p-12 relative overflow-hidden text-white"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="max-w-lg relative z-10">
          <motion.h1 
            className="text-5xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Start Your <br />Digital Campus <br />Journey.
          </motion.h1>
          <motion.p 
            className="text-xl text-white/80 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            NeuroCampus helps you manage your entire institution with AI-powered insights, automated attendance, and seamless communication.
          </motion.p>
          
          <div className="space-y-6">
            {[
              "Multi-tenant isolation for security",
              "Plan-based feature access",
              "Automated email onboarding",
              "Role-based dashboards"
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="flex items-center gap-3 text-white/90"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Right Section - Onboarding Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-8 bg-gray-50 lg:bg-white"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Organization</h2>
            <p className="text-gray-500">Selected Plan: <span className="text-[#a259ff] font-semibold capitalize">{formData.plan}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  required
                  placeholder="e.g. AMC College of Engineering"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-[#a259ff] focus:ring-[#a259ff]/10"
                  value={formData.org_name}
                  onChange={e => setFormData({...formData, org_name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Admin Name (Principal/Director)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  required
                  placeholder="e.g. Dr. Ravindra Kumar"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-[#a259ff] focus:ring-[#a259ff]/10"
                  value={formData.admin_name}
                  onChange={e => setFormData({...formData, admin_name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  required
                  type="email"
                  placeholder="principal@amccollege.edu"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-[#a259ff] focus:ring-[#a259ff]/10"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  required
                  type="tel"
                  placeholder="+91 9876543210"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-[#a259ff] focus:ring-[#a259ff]/10"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#a259ff] hover:bg-[#a259ff]/90 h-12 rounded-xl shadow-lg shadow-[#a259ff]/20 text-white font-semibold text-lg flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Complete Registration
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account? <span className="text-[#a259ff] cursor-pointer hover:underline" onClick={() => navigate("/")}>Login here</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
