import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorMap = {
  blue: "from-blue-500 to-blue-600 text-blue-500",
  green: "from-green-500 to-green-600 text-green-500", 
  purple: "from-purple-500 to-purple-600 text-purple-500",
  orange: "from-orange-500 to-orange-600 text-orange-500"
};

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="glass-effect shadow-medium border-0 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${colorMap[stat.color]} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5 h-5 ${colorMap[stat.color].split(' ')[2]}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}