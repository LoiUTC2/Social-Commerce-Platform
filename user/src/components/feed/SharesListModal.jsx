import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getPostShares, likePost, commentOrReply, sharePost } from '../../services/postInteractionService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// [Grok] Component hiển thị danh sách các bài viết chia sẻ trong modal, với phân trang và tương tác
export default function SharesListModal({ open, onOpenChange, shares }) {
    const [sharesList, setSharesList] = useState(shares || []); // Danh sách chia sẻ
    const [page, setPage] = useState(1); // Trang hiện tại
    const [limit] = useState(5); // Số item mỗi trang, khớp với API mặc định
    const [totalPages, setTotalPages] = useState(1); // Tổng số trang
    const [totalItems, setTotalItems] = useState(0); // Tổng số chia sẻ
    const [interactions, setInteractions] = useState({}); // [Grok] Lưu trạng thái tương tác (liked, likesCount, commentsCount, sharesCount)
    const { user, setShowLoginModal } = useAuth();

    // [Grok] Cập nhật sharesList khi prop shares thay đổi
    useEffect(() => {
        setSharesList(shares || []);
        setPage(1); // Reset về trang 1 khi prop shares thay đổi
        // [Grok] Khởi tạo trạng thái tương tác cho sharesList
        const initialInteractions = {};
        shares.forEach((share) => {
            initialInteractions[share._id] = {
                liked: user ? share.likedBy?.includes(user._id) : false,
                likesCount: share.likesCount || 0,
                commentsCount: share.commentsCount || 0,
                sharesCount: share.sharesCount || 0,
            };
        });
        setInteractions(initialInteractions);
    }, [shares, user]);

    // [Grok] Hàm tải danh sách chia sẻ cho trang cụ thể
    const fetchShares = async (pageToFetch) => {
        try {
            const postId = shares[0]?.sharedPost || shares[0]?._id;
            if (!postId) return; // [Grok] Tránh gọi API nếu không có postId
            const res = await getPostShares(postId, { page: pageToFetch, limit });
            const { shares: newShares, pagination } = res.data;
            setSharesList(newShares);
            setTotalPages(pagination.totalPages);
            setTotalItems(pagination.totalItems);
            setPage(pageToFetch);
            // [Grok] Cập nhật trạng thái tương tác cho shares mới
            const updatedInteractions = { ...interactions };
            newShares.forEach((share) => {
                updatedInteractions[share._id] = {
                    liked: user ? share.likedBy?.includes(user._id) : false,
                    likesCount: share.likesCount || 0,
                    commentsCount: share.commentsCount || 0,
                    sharesCount: share.sharesCount || 0,
                };
            });
            setInteractions(updatedInteractions);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách chia sẻ:', err);
            toast.error('Lỗi khi tải danh sách chia sẻ', { description: err.message });
        }
    };

    // [Grok] Xử lý chuyển sang trang tiếp theo
    const handleNextPage = () => {
        if (page < totalPages) {
            fetchShares(page + 1);
        }
    };

    // [Grok] Xử lý quay về trang trước
    const handlePrevPage = () => {
        if (page > 1) {
            fetchShares(page - 1);
        }
    };

    // [Grok] Xử lý thích bài viết
    const handleLike = async (shareId) => {
        if (!user) return setShowLoginModal(true);
        try {
            const res = await likePost(shareId);
            const { likesCount } = res.data;
            setInteractions((prev) => ({
                ...prev,
                [shareId]: {
                    ...prev[shareId],
                    liked: res.message.includes('Đã thích'),
                    likesCount,
                },
            }));
            toast.success(res.message);
        } catch (err) {
            console.error('Lỗi khi thích bài viết:', err);
            toast.error('Lỗi khi thích bài viết', { description: err.message });
        }
    };

    // [Grok] Xử lý bình luận (mở modal bình luận, giả định CommentModal được xử lý trong FeedItem)
    const handleComment = (shareId) => {
        if (!user) return setShowLoginModal(true);
        toast.info('Vui lòng mở bài viết để bình luận'); // [Grok] Hướng dẫn người dùng
    };

    // [Grok] Xử lý chia sẻ
    const handleShare = async (shareId) => {
        if (!user) return setShowLoginModal(true);
        try {
            const res = await sharePost(shareId, '', 'public');
            setInteractions((prev) => ({
                ...prev,
                [shareId]: {
                    ...prev[shareId],
                    sharesCount: (prev[shareId].sharesCount || 0) + 1,
                },
            }));
            toast.success('Chia sẻ thành công', { description: 'Bài viết đã được chia sẻ lên tường của bạn' });
        } catch (err) {
            console.error('Lỗi khi chia sẻ:', err);
            toast.error('Lỗi khi chia sẻ', { description: err.message });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Danh sách chia sẻ ({totalItems})</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {sharesList.length === 0 ? (
                        <p className="text-center text-gray-500">Chưa có lượt chia sẻ nào</p>
                    ) : (
                        sharesList.map((share) => (
                            <Card key={share._id} className="border-gray-200">
                                <CardContent className="p-3 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={share.author?._id?.avatar || '/avatar-default.jpg'}
                                            className="w-8 h-8 rounded-full"
                                            alt="Author"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">
                                                {share.author?.type === 'User' ? share.author?._id?.fullName : share.author?._id?.name || 'Người dùng'}
                                            </p>
                                            <p className="text-xs text-gray-500" title={format(new Date(share.createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}>
                                                {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true, locale: vi }).replace(/^khoảng /, '')}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-line">{share.content || 'Đã chia sẻ bài viết'}</p>
                                    {/* [Grok] Thanh tương tác */}
                                    <div className="flex justify-between items-center text-sm text-gray-600 px-2">
                                        <span className="cursor-pointer hover:underline">
                                            {interactions[share._id]?.likesCount || 0} lượt thích
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="cursor-pointer hover:underline">
                                                {interactions[share._id]?.commentsCount || 0} bình luận
                                            </span>
                                            <span className="cursor-pointer hover:underline">
                                                {interactions[share._id]?.sharesCount || 0} lượt chia sẻ
                                            </span>
                                        </div>
                                    </div>
                                    {/* [Grok] Nút tương tác hành động */}
                                    <div className="flex justify-around text-gray-700 border-t pt-2 text-sm">
                                        <button
                                            onClick={() => handleLike(share._id)}
                                            className={`flex items-center gap-1 hover:text-red-500 ${interactions[share._id]?.liked ? 'text-red-500' : ''}`}
                                        >
                                            <Heart size={16} className={interactions[share._id]?.liked ? 'fill-red-500' : ''} /> Thích
                                        </button>
                                        <button
                                            onClick={() => handleComment(share._id)}
                                            className="flex items-center gap-1 hover:text-blue-500"
                                        >
                                            <MessageCircle size={16} /> Bình luận
                                        </button>
                                        <button
                                            onClick={() => handleShare(share._id)}
                                            className="flex items-center gap-1 hover:text-green-500"
                                        >
                                            <Share size={16} /> Chia sẻ
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <Button
                            variant="outline"
                            onClick={handlePrevPage}
                            disabled={page === 1}
                            className="text-sm"
                        >
                            Trang trước
                        </Button>
                        <span className="text-sm text-gray-600">
                            Trang {page} / {totalPages} ({totalItems} chia sẻ)
                        </span>
                        <Button
                            variant="outline"
                            onClick={handleNextPage}
                            disabled={page === totalPages}
                            className="text-sm"
                        >
                            Trang sau
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}