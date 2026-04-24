import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Basic",
      price: "Trial",
      duration: "10 Days",
      description: "Perfect for exploring the core features of NeuroCampus.",
      features: [
        "Automated Attendance",
        "Student Management",
        "Basic Reports",
        "Email Support"
      ],
      icon: <Zap className="text-blue-500" size={24} />,
      color: "blue",
      link: "/neurocampus/basic"
    },
    {
      name: "Pro",
      price: "₹99,999",
      duration: "/year",
      description: "Advanced tools for growing institutions with full AI power.",
      features: [
        "All Basic Features",
        "AI Exam Proctoring",
        "Face Recognition",
        "Fees Management",
        "Priority Support"
      ],
      icon: <Shield className="text-[#a259ff]" size={24} />,
      color: "purple",
      link: "/neurocampus/pro",
      popular: true
    },
    {
      name: "Advance",
      price: "Custom",
      duration: "Enterprise",
      description: "Complete digital transformation for large universities.",
      features: [
        "All Pro Features",
        "White-label Branding",
        "Custom API Integrations",
        "Dedicated Account Manager",
        "On-premise Deployment"
      ],
      icon: <Crown className="text-amber-500" size={24} />,
      color: "gold",
      link: "/neurocampus/advance"
    }
  ];

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#a259ff] font-semibold tracking-wide uppercase mb-3"
        >
          Pricing Plans
        </motion.h2>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
        >
          Choose the right plan for <br />your institution
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-lg max-w-2xl mx-auto"
        >
          Whether you're a small coaching center or a large university, we have a plan that fits your needs and budget.
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className={`relative p-8 rounded-3xl border ${
              plan.popular ? 'border-[#a259ff] shadow-xl shadow-[#a259ff]/10' : 'border-gray-100 shadow-lg shadow-gray-100'
            } bg-white flex flex-col`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#a259ff] text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                {plan.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 font-medium">{plan.duration}</span>
              </div>
            </div>

            <div className="space-y-4 mb-10 flex-grow">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate(plan.link)}
              className={`w-full h-12 rounded-xl text-lg font-semibold transition-all ${
                plan.popular 
                  ? 'bg-[#a259ff] hover:bg-[#a259ff]/90 text-white' 
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              Get Started
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
