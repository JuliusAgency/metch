import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const SeekerJobInfo = ({ job }) => (
    <Card className="bg-white border border-gray-200/90 shadow-sm rounded-2xl overflow-hidden mb-6">
        <CardContent className="p-8 space-y-8 text-right" dir="rtl">
            {/* Metch Analysis: Summary */}
            {job.metch_analysis?.summary && (
                <div className="space-y-3">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2 justify-start">
                        <Sparkles className="w-4 h-4 text-blue-500" /> מה מאצ' חושב על ההתאמה?
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {job.metch_analysis.summary}
                    </p>
                </div>
            )}

            {/* Job Description */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg text-blue-900">תיאור משרה</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                    {job.description}
                </p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg text-blue-900">תחומי אחריות</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    {Array.isArray(job.responsibilities) ? (
                        job.responsibilities.map((res, i) => <li key={i} className="leading-relaxed">{res}</li>)
                    ) : Array.isArray(job.structured_education) ? (
                        job.structured_education.map((edu, i) => <li key={i} className="leading-relaxed">{edu.value}</li>)
                    ) : null}
                </ul>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg text-blue-900">דרישות</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    {Array.isArray(job.requirements) ? (
                        job.requirements.map((req, i) => <li key={i} className="leading-relaxed">{req}</li>)
                    ) : Array.isArray(job.structured_requirements) ? (
                        job.structured_requirements.map((req, i) => <li key={i} className="leading-relaxed">{req.value}</li>)
                    ) : null}
                </ul>
            </div>

            {/* Metch Analysis: Reasoning */}
            {job.metch_analysis?.reasoning && (
                <div className="space-y-3">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2 justify-start">
                        <Sparkles className="w-4 h-4 text-blue-500" /> למה המשרה מתאימה לך?
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed italic py-2">
                        {job.metch_analysis.reasoning}
                    </p>
                </div>
            )}
        </CardContent>
    </Card>
);

export default SeekerJobInfo;