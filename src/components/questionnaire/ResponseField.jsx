const ResponseField = ({ label, value }) => (
    <div className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-800 min-h-[48px] flex items-center justify-end">
        <p className="flex-1 text-right mr-4">{value}</p>
        <span className="text-gray-500 font-medium">{label}</span>
    </div>
);

export default ResponseField;