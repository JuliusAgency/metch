import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  BarChart3,
} from "lucide-react";

const JobStats = ({ applications }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                <p className="text-gray-600">מועמדויות</p>
            </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{Math.floor(applications.length * 0.7)}</div>
                <p className="text-gray-600">התאמות</p>
            </CardContent>
        </Card>
    </div>
);

export default JobStats;