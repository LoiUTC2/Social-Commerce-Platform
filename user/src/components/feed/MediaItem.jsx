import React from 'react';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MediaItem({ images = [], videos = [], postId }) {
    const navigate = useNavigate();

    // Combine images and videos into a single media array
    const allMedia = [...images, ...videos];
    const totalMediaCount = allMedia.length;
    const displayedMedia = allMedia.slice(0, 4);
    const remainingMedia = totalMediaCount > 4 ? totalMediaCount - 4 : 0;

    // Grid class based on number of displayed media
    const getGridClass = () => {
        switch (displayedMedia.length) {
            case 1: return "grid-cols-1 aspect-square max-h-64";
            case 2: return "grid-cols-2 aspect-[2/1] max-h-48";
            case 3: return "grid-cols-3 aspect-[3/1] max-h-40";
            case 4:
            default: return "grid-cols-2 grid-rows-2 aspect-square max-h-64";
        }
    };

    // Determine if a media item is a video
    const isVideo = (url) => {
        return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.avi') || videos.includes(url);
    };

    const navigateToPostDetail = () => {
        navigate(`/feed/post/${postId}`);
    };

    // Determine the layout and styling based on the number of media items
    const getLayoutClass = () => {
        if (displayedMedia.length === 1) {
            return "flex justify-center items-center h-100 w-full overflow-hidden bg-gray-200";
        } else if (displayedMedia.length === 2) {
            return "grid grid-cols-2 gap-2 h-80 w-full overflow-hidden";
        } else if (displayedMedia.length === 3) {
            return "grid grid-cols-3 gap-2 h-80 w-full overflow-hidden"; // Sửa thành grid-cols-3 cho 3 ảnh/video
        } else {
            return "grid grid-cols-2 gap-2 h-70 w-full overflow-hidden"; // 4 ảnh/video hoặc hơn: layout 2x2
        }
    };

    return (
        <>
            {totalMediaCount > 0 && (
                <div className="relative w-full mb-4">
                    <div className={getLayoutClass()}>
                        {displayedMedia.map((media, idx) => {
                            const isLastItemWithOverlay = idx === 3 && remainingMedia > 0;

                            return (
                                <div
                                    key={idx}
                                    className={`relative flex justify-center items-center rounded-lg overflow-hidden ${displayedMedia.length === 1 ? 'w-1/2 h-full bg-gray-200' : 'w-full h-full bg-gray-200'
                                        }`}
                                >
                                    {isVideo(media) ? (
                                        <>
                                            <video
                                                src={media}
                                                className="w-full h-full object-contain rounded-md"
                                                controls={true} // Thêm thanh tác vụ
                                                autoPlay={true} // Tự động phát
                                                muted // Tắt âm thanh mặc định để tránh lỗi autoPlay trên một số trình duyệt
                                                loop // Tự động phát lại
                                            />
                                            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                                                Video
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={media}
                                            alt={`Post media ${idx + 1}`}
                                            className="w-full h-full object-contain rounded-md"
                                        />
                                    )}

                                    {/* Overlay "+X" for the last item if there are more media */}
                                    {isLastItemWithOverlay && (
                                        <div
                                            className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer"
                                            onClick={navigateToPostDetail}
                                        >
                                            <div className="text-white text-2xl font-bold flex items-center">
                                                <Plus size={24} />
                                                {remainingMedia}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Product action buttons */}
                    <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                        <Button
                            size="sm"
                            variant="outline"
                            className="backdrop-blur bg-white/70"
                            onClick={() => navigate(`/marketplace/products/${5}`)}
                        >
                            Xem chi tiết
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/marketplace/checkout`)}>
                            Mua ngay
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}