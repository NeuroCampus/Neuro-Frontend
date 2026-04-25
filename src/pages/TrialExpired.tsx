import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldAlert, CreditCard, ArrowRight, Mail, Check, X, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { toast } from "sonner";

const TrialExpired = () => {
  const navigate = useNavigate();
  const orgName = localStorage.getItem("org_name") || "Your Organization";
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin" || role === "principal";
  
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "advance" | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    
    setIsUpgrading(true);
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/organizations/upgrade-plan/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Successfully upgraded to ${selectedPlan.toUpperCase()} plan!`);
        // Small delay to let toast be seen
        setTimeout(() => {
          window.location.href = "/dashboard"; // Redirect to dashboard
        }, 1500);
      } else {
        toast.error(result.message || "Upgrade failed");
      }
    } catch (error) {
      toast.error("An error occurred during upgrade");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30"
          >
            <Clock className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-white mb-4">Trial Period Expired</h1>
          <p className="text-indigo-100 text-lg max-w-md mx-auto">
            The 2-day trial for <span className="font-semibold text-white">{orgName}</span> has come to an end.
          </p>
        </div>
        
        <div className="p-12">
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <ShieldAlert className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Access Restricted</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your data is safe, but administrative and faculty features are temporarily locked until the plan is upgraded.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <CreditCard className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Upgrade to Continue</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Choose from our Pro or Advance plans to unlock full institutional management features.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAdmin ? (
              <Button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl text-base font-semibold transition-all group"
              >
                Renew & Upgrade Now
                <Zap className="ml-2 w-4 h-4 fill-white" />
              </Button>
            ) : (
              <Button 
                disabled
                className="bg-slate-100 text-slate-400 px-8 h-12 rounded-xl text-base font-semibold cursor-not-allowed"
              >
                Contact Admin to Renew
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = "mailto:support@stalight.in"}
              className="border-slate-200 text-slate-700 px-8 h-12 rounded-xl text-base font-semibold hover:bg-slate-50"
            >
              <Mail className="mr-2 w-4 h-4" />
              Contact Support
            </Button>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors"
            >
              Logout and return to home
            </button>
          </div>
        </div>
      </motion.div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Select Your New Plan</h2>
                  <p className="text-slate-500 text-sm">Upgrade <span className="font-medium text-indigo-600">{orgName}</span> to continue</p>
                </div>
                <button 
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 grid md:grid-cols-2 gap-8">
                {/* Pro Plan */}
                <div 
                  onClick={() => setSelectedPlan("pro")}
                  className={`relative p-8 rounded-2xl border-2 transition-all cursor-pointer group ${
                    selectedPlan === "pro" 
                      ? "border-indigo-600 bg-indigo-50/30" 
                      : "border-slate-100 hover:border-indigo-200"
                  }`}
                >
                  {selectedPlan === "pro" && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="mb-6">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">Most Popular</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro Plan</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-slate-900">₹4,999</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {["All Basic features", "Up to 1000 students", "Unlimited Faculty", "Advanced Analytics", "Priority Email Support"].map((feat, i) => (
                      <li key={i} className="flex items-center text-slate-600 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Advance Plan */}
                <div 
                  onClick={() => setSelectedPlan("advance")}
                  className={`relative p-8 rounded-2xl border-2 transition-all cursor-pointer group ${
                    selectedPlan === "advance" 
                      ? "border-violet-600 bg-violet-50/30" 
                      : "border-slate-100 hover:border-violet-200"
                  }`}
                >
                  {selectedPlan === "advance" && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="mb-6">
                    <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center w-fit">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Full Power
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Advance Plan</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-slate-900">₹9,999</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {["Everything in Pro", "Unlimited Students", "AI Campus Assistant", "Custom Domain Support", "24/7 Dedicated Manager"].map((feat, i) => (
                      <li key={i} className="flex items-center text-slate-600 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-slate-500 text-sm">
                  Your organization will be reactivated instantly.
                </p>
                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="h-11 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    disabled={!selectedPlan || isUpgrading}
                    onClick={handleUpgrade}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 rounded-xl font-semibold shadow-lg shadow-indigo-200"
                  >
                    {isUpgrading ? "Upgrading..." : `Confirm & Upgrade to ${selectedPlan ? selectedPlan.toUpperCase() : ""}`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrialExpired;
