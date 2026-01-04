const SeekerJobInfo = ({ job }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[
            { title: "על המשרה", content: <p className="text-xs sm:text-sm leading-tight">{job.description}</p> },
            { title: "דרישות", content: <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">{Array.isArray(job.structured_requirements) ? job.structured_requirements.map((req, i) => <li key={i}>{req.value}</li>) : null}</ul> },
            { title: "תחומי אחריות", content: <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">{Array.isArray(job.structured_education) ? job.structured_education.map((edu, i) => <li key={i}>{edu.value}</li>) : null}</ul> }
        ].map(section => (
            <div key={section.title} className="bg-gray-50/70 border border-gray-200/60 rounded-lg p-4 text-right min-h-[180px] flex flex-col">
                <h3 className="font-bold text-base mb-2 text-gray-900">{section.title}</h3>
                <div className="text-gray-700 flex-grow">{section.content}</div>
            </div>
        ))}
    </div>
);

export default SeekerJobInfo;