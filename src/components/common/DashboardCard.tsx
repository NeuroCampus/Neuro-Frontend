import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useTheme } from "../../context/ThemeContext";

interface DashboardCardProps {
  title: string;
  description?: string;
  value?: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
  variant?: "default" | "admin";
  iconWrapperClassName?: string;
}

const DashboardCard = ({
  title,
  description,
  value,
  icon,
  trend,
  onClick,
  className,
  variant = "default",
  iconWrapperClassName,
}: DashboardCardProps) => {
  const { theme } = useTheme();

  if (variant === "admin") {
    const adminCardClasses =
      theme === "dark"
        ? "border-white/10 bg-slate-900/90 text-slate-50 shadow-[0_18px_38px_rgba(2,6,23,0.36)]"
        : "border-[#eff4ff] bg-white/92 text-slate-900 shadow-[0_18px_40px_rgba(186,205,243,0.38)]";

    const adminIconClasses =
      iconWrapperClassName ||
      (theme === "dark"
        ? "border-white/10 bg-white/5 text-slate-100"
        : "border-[#edf3ff] bg-[#f7faff] text-[#6d8ec7]");

    return (
      <motion.div
        className={`group relative overflow-hidden rounded-[28px] border p-5 transition-all duration-300 ${
          onClick ? "cursor-pointer" : ""
        } ${adminCardClasses} ${className || ""}`}
        onClick={onClick}
        whileHover={{ scale: 1.015, y: -4 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div
          className={`pointer-events-none absolute inset-x-6 top-0 h-16 rounded-b-[1.75rem] blur-xl ${
            theme === "dark" ? "bg-blue-500/10" : "bg-blue-100/90"
          }`}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
              {title}
            </p>
            {value !== undefined && value !== null && (
              <motion.div
                className={`mt-3 text-3xl font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >
                {value}
              </motion.div>
            )}
            {description && (
              <p className={`mt-2 text-sm leading-6 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                {description}
              </p>
            )}
            {trend && (
              <div
                className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  trend.isPositive
                    ? theme === "dark"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-emerald-100 text-emerald-700"
                    : theme === "dark"
                      ? "bg-rose-500/15 text-rose-300"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {trend.isPositive ? "+" : "-"} {Math.abs(trend.value)}%
              </div>
            )}
          </div>

          {icon && (
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border ${adminIconClasses}`}>
              {icon}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className={`w-full box-border ${theme === 'dark' 
        ? "bg-card border border-border text-foreground outline-none focus:ring-2 focus:ring-primary rounded-lg" 
        : "bg-white border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
        <Card
        className={`w-full transition-all duration-300 cursor-pointer backdrop-blur-sm ${
          theme === 'dark' 
            ? "bg-card/50 border-border hover:bg-card/70 hover:border-primary/30" 
            : "bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300"
        } ${className || ''}`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>{title}</CardTitle>
          {icon && (
            <motion.div 
              className={theme === 'dark' ? "w-5 h-5 text-primary" : "w-5 h-5 text-blue-500"}
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
        </CardHeader>
        <CardContent>
          {value !== undefined && value !== null && (
            <motion.div 
              className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {value}
            </motion.div>
          )}
          {description && (
            <motion.p 
              className={`text-xs mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}
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
                trend.isPositive 
                  ? (theme === 'dark' ? "text-green-400" : "text-green-600") 
                  : (theme === 'dark' ? "text-red-400" : "text-red-600")
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {trend.isPositive ? "+" : "-"} {Math.abs(trend.value)}%
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardCard;
