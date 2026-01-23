import { Card, CardContent } from "@/components/ui/card";

const SeekerJobInfo = ({ job }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* About Card */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl h-full">
            <CardContent className="p-5 space-y-3 text-right" dir="rtl">
                <h3 className="font-bold text-lg text-blue-900">על המשרה</h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {job.description}
                </p>
            </CardContent>
        </Card>

        {/* Requirements Card */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl h-full">
            <CardContent className="p-5 space-y-3 text-right" dir="rtl">
                <h3 className="font-bold text-lg text-blue-900">דרישות</h3>
                <ul className="space-y-1.5">
                    {Array.isArray(job.requirements) ? (
                        job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                <span className="text-black mt-1.5">•</span>
                                <span className="leading-relaxed">{req}</span>
                            </li>
                        ))
                    ) : Array.isArray(job.structured_requirements) ? (
                        job.structured_requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                <span className="text-black mt-1.5">•</span>
                                <span className="leading-relaxed">{req.value}</span>
                            </li>
                        ))
                    ) : null}
                </ul>
            </CardContent>
        </Card>

        {/* Responsibilities Card */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl h-full">
            <CardContent className="p-5 space-y-3 text-right" dir="rtl">
                <h3 className="font-bold text-lg text-blue-900">תחומי אחריות</h3>
                <ul className="space-y-1.5">
                    {Array.isArray(job.responsibilities) ? (
                        job.responsibilities.map((res, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                <span className="text-black mt-1.5">•</span>
                                <span className="leading-relaxed">{res}</span>
                            </li>
                        ))
                    ) : Array.isArray(job.structured_education) ? (
                        job.structured_education.map((edu, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                <span className="text-black mt-1.5">•</span>
                                <span className="leading-relaxed">{edu.value}</span>
                            </li>
                        ))
                    ) : null}
                </ul>
            </CardContent>
        </Card>
    </div>
);

export default SeekerJobInfo;