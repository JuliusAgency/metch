const SeekerJobImages = ({ images }) => (
    <>
        {Array.isArray(images) && images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-10">
                {images.slice(0, 7).map((image, index) => (
                    <div key={index} className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden shadow-sm">
                        <img
                            src={image.url}
                            alt={`Workplace ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
        )}
    </>
);

export default SeekerJobImages;