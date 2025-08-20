import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface DashboardCardProps {
  title: string;
  description?: string;
  value?: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const DashboardCard = ({ title, description, value, icon, trend, onClick, className }: DashboardCardProps) => {
  return (
    <motion.div
    className="bg-[#232326] border text-gray-200 outline-none focus:ring-2 focus:ring-white rounded-lg"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <Card
        className={`bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-[#a259ff]/30 transition-all duration-300 cursor-pointer backdrop-blur-sm ${className || ''}`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-200">{title}</CardTitle>
          {icon && (
            <motion.div 
              className="w-5 h-5 text-[#a259ff]"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
        </CardHeader>
        <CardContent>
          {value && (
            <motion.div 
              className="text-2xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {value}
            </motion.div>
          )}
          {description && (
            <motion.p 
              className="text-xs text-gray-400 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {description}
            </motion.p>
          )}
          {trend && (
            <motion.div
              className={`text-xs mt-1 ${
                trend.isPositive ? "text-green-400" : "text-red-400"
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardCard;