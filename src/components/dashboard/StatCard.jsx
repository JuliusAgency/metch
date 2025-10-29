import { Card, CardContent } from "@/components/ui/card";

const StatCard = ({ icon: Icon, title, value, color = "bg-blue-50" }) => (
  <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
    <CardContent className="p-6 text-center">
      <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <p className="text-gray-600 font-medium text-sm">{title}</p>
    </CardContent>
  </Card>
);

export default StatCard;