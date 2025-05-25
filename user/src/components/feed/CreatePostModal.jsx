import React, { useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Image, Video, Smile, Lock, Globe, Users, ShoppingBag, X } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import { createPost } from '../../services/postService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import ProductSelectionModal from '../common/ProductSelectionModal ';

const CreatePostModal = ({ open, onOpenChange }) => {
    const { user } = useAuth();
    const [privacy, setPrivacy] = useState('public');
    const [content, setContent] = useState('');
    const [mediaList, setMediaList] = useState([]); // [{ file, preview, type }]
    const [selectedProducts, setSelectedProducts] = useState([]); // Sản phẩm được chọn
    const [showProductModal, setShowProductModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef(null);

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);

        const updated = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image',
        }));

        setMediaList((prev) => [...prev, ...updated]);
    };

    const resetPost = () => {
        setContent('');
        setMediaList([]);
        setSelectedProducts([]);
        setPrivacy('public');
        setShowEmojiPicker(false);
    };

    const privacyIcons = {
        public: <Globe size={14} />,
        friends: <Users size={14} />,
        private: <Lock size={14} />,
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Xử lý thêm emoji
    const handleEmojiClick = (emojiData) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end);
            setContent(newContent);
            
            // Đặt lại cursor position
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length;
                textarea.focus();
            }, 0);
        }
        setShowEmojiPicker(false);
    };

    // Lấy hình ảnh để hiển thị (ưu tiên media uploaded, sau đó là hình sản phẩm)
    const getDisplayMedia = () => {
        if (mediaList.length > 0) {
            return mediaList;
        }
        
        // Nếu không có media nhưng có sản phẩm, lấy hình sản phẩm
        if (selectedProducts.length > 0) {
            return selectedProducts.map(product => ({
                preview: product.image,
                type: 'product',
                productId: product.id,
                productName: product.name
            }));
        }
        
        return [];
    };

    const handlePost = async () => {
        try {
            const imageUrls = [];
            const videoUrls = [];

            // Upload media files
            for (const media of mediaList) {
                const url = await uploadToCloudinary(media.file);
                if (media.type === 'image') imageUrls.push(url);
                else videoUrls.push(url);
            }

            const hashtags = content.match(/#[\w]+/g) || [];
            const productIds = selectedProducts.map(p => p._id);

            const postData = {
                content,
                images: imageUrls,
                videos: videoUrls,
                productIds,
                hashtags,
                categories: [],
                location: '',
            };

            const res = await createPost(postData);
            toast.success('Đăng bài thành công!');
            console.log('Đăng bài thành công:', res);

            resetPost();
            onOpenChange(false);
        } catch (err) {
            toast.error('Đăng bài thất bại!');
            console.error('Lỗi đăng bài:', err);
        }
    };

    const displayMedia = getDisplayMedia();

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-xl bg-white rounded-xl shadow-lg max-h-[90vh] flex flex-col"
                    overlayClassName="bg-black/10 backdrop-blur-sm"
                >
                    <DialogHeader className="border-b pb-2 mb-2 flex-shrink-0">
                        <DialogTitle className="text-center text-lg font-semibold">Tạo bài viết</DialogTitle>
                    </DialogHeader>

                    {/* Phần nội dung có thể cuộn */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        {/* Avatar + quyền riêng tư */}
                        <div className="flex items-center gap-3 mb-3">
                            <img
                                src={user?.avatar}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <div className="font-medium">{user?.fullName}</div>
                                <div className="flex items-center text-sm text-gray-500 gap-1">
                                    {privacyIcons[privacy]}
                                    <Select value={privacy} onValueChange={setPrivacy}>
                                        <SelectTrigger className="h-6 text-xs w-auto px-2 py-0 bg-gray-100 border-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Công khai</SelectItem>
                                            <SelectItem value="friends">Bạn bè</SelectItem>
                                            <SelectItem value="private">Chỉ mình tôi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Nội dung bài viết với emoji picker */}
                        <div className="relative">
                            <Textarea
                                ref={textareaRef}
                                placeholder="Bạn đang nghĩ gì thế?"
                                className="min-h-[120px] resize-none text-base pr-10"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 p-1 h-8 w-8"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <Smile size={16} />
                            </Button>
                            
                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <div className="absolute top-12 right-0 z-50">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        width={300}
                                        height={400}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Hiển thị sản phẩm đã chọn */}
                        {selectedProducts.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag size={16} className="text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">
                                        Sản phẩm được gắn thẻ ({selectedProducts.length})
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProducts.map(product => (
                                        <Badge
                                            key={product.id}
                                            variant="secondary"
                                            className="bg-white border border-blue-300 text-blue-700 px-2 py-1"
                                        >
                                            <img 
                                                src={product.image} 
                                                alt={product.name}
                                                className="w-4 h-4 rounded mr-1"
                                            />
                                            {product.name}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-1 p-0 h-4 w-4"
                                                onClick={() => {
                                                    setSelectedProducts(prev => 
                                                        prev.filter(p => p.id !== product.id)
                                                    );
                                                }}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview ảnh/video */}
                        {displayMedia.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {displayMedia.map((media, idx) => (
                                    <div key={idx} className="relative">
                                        {media.type !== 'product' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-1 right-1 z-10"
                                                onClick={() => {
                                                    const updated = [...mediaList];
                                                    updated.splice(idx, 1);
                                                    setMediaList(updated);
                                                }}
                                            >
                                                ❌
                                            </Button>
                                        )}

                                        {media.type === 'image' ? (
                                            <img 
                                                src={media.preview} 
                                                alt="preview" 
                                                className="rounded-lg max-h-48 object-cover w-full" 
                                            />
                                        ) : media.type === 'video' ? (
                                            <video 
                                                controls 
                                                src={media.preview} 
                                                className="rounded-lg max-h-48 w-full" 
                                            />
                                        ) : (
                                            <div className="relative">
                                                <img 
                                                    src={media.preview} 
                                                    alt={media.productName} 
                                                    className="rounded-lg max-h-48 object-cover w-full" 
                                                />
                                                <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                                    <ShoppingBag size={10} className="inline mr-1" />
                                                    Sản phẩm
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Khu vực chọn ảnh/video */}
                        <div className="border rounded-lg p-4 mt-3 text-center text-gray-500 bg-gray-100">
                            <label className="cursor-pointer flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border">
                                    <Image size={20} />
                                </div>
                                <div className="font-medium mt-2">Thêm ảnh/video</div>
                                <p className="text-xs text-gray-400">hoặc kéo và thả</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleMediaChange}
                                />
                            </label>
                        </div>

                        {/* Thêm hành động */}
                        <div className="mt-4 border rounded-lg p-2 flex items-center justify-between text-gray-600 text-sm">
                            <span className="font-medium">Thêm vào bài viết của bạn</span>
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => document.querySelector('input[type="file"]').click()}
                                    className="hover:bg-gray-100 p-1 rounded"
                                >
                                    <Image size={18} className="text-green-500" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="hover:bg-gray-100 p-1 rounded"
                                >
                                    <Smile size={18} className="text-yellow-500" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowProductModal(true)}
                                    className="hover:bg-gray-100 p-1 rounded"
                                >
                                    <ShoppingBag size={18} className="text-blue-500" />
                                </button>
                                <Video size={18} className="text-red-500" />
                            </div>
                        </div>
                    </div>

                    {/* Nút đăng */}
                    <Button
                        className="w-full mt-3 flex-shrink-0"
                        disabled={content.trim() === '' && mediaList.length === 0 && selectedProducts.length === 0}
                        onClick={handlePost}
                    >
                        Đăng
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Modal chọn sản phẩm */}
            <ProductSelectionModal
                open={showProductModal}
                onOpenChange={setShowProductModal}
                selectedProducts={selectedProducts}
                onSelectProducts={setSelectedProducts}
            />
        </>
    );
};

export default CreatePostModal;