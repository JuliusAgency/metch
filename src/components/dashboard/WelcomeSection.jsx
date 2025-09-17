import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function WelcomeSection({ user }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: Sun };
    return { text: "Good evening", icon: Moon };
  };

  const { text: greeting, icon: GreetingIcon } = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass-effect shadow-medium border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
        <CardContent className="relative p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GreetingIcon className="w-6 h-6 text-blue-500" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {greeting}, {user?.full_name?.split(' ')[0] || 'there'}!
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Ready to find your next opportunity? Let's make it happen.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {user?.available_for_work && (
                <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Available for work
                </Badge>
              )}
              {user?.experience_level && (
                <Badge variant="outline" className="border-blue-200 text-blue-700 px-3 py-1">
                  {user.experience_level.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}