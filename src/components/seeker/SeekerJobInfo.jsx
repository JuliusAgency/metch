const SeekerJobInfo = ({ job }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
            { title: "על המשרה", content: <p className="text-sm leading-relaxed">{job.description}</p> },
            { title: "דרישות", content: <ul className="list-disc list-inside space-y-2 text-sm">{job.structured_requirements?.map((req, i) => <li key={i}>{req.value}</li>)}</ul> },
            { title: "תחומי אחריות", content: <ul className="list-disc list-inside space-y-2 text-sm">{job.structured_education?.map((edu, i) => <li key={i}>{edu.value}</li>)}</ul> }
        ].map(section => (
            <div key={section.title} className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-6 text-right">
                <h3 className="font-bold text-lg mb-4 text-gray-900">{section.title}</h3>
                <div className="text-gray-700">{section.content}</div>
            </div>
        ))}
    </div>
);

export default SeekerJobInfo;