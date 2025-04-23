import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Image, Video, Smile, Lock, Globe, Users } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';


const CreatePostModal = ({ open, onOpenChange }) => {
    const [privacy, setPrivacy] = useState('public');
    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null);

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedia({
                file,
                preview: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image',
            });
        }
    };

    const resetPost = () => {
        setContent('');
        setMedia(null);
        setPrivacy('public');
    };

    const privacyIcons = {
        public: <Globe size={14} />,
        friends: <Users size={14} />,
        private: <Lock size={14} />,
    };

    const handlePost = async () => {
        let uploadedUrl = '';

        if (media?.file) {
            uploadedUrl = await uploadToCloudinary(media.file);
        }

        const postData = {
            content,
            media: uploadedUrl,
            privacy,
        };

        console.log('Post data gửi về server:', postData);

        // TODO: gọi API lưu post vào DB tại đây (sau khi có link media)
        resetPost();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-xl bg-white rounded-xl shadow-lg"
                overlayClassName="bg-black/10 backdrop-blur-sm"
            >
                <DialogHeader className="border-b pb-2 mb-2">
                    <DialogTitle className="text-center text-lg font-semibold">Tạo bài viết</DialogTitle>
                </DialogHeader>

                {/* Avatar + quyền riêng tư */}
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src="/avatar-default.jpg"
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <div className="font-medium">Lại Hữu Lợi</div>
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

                {/* Nội dung bài viết */}
                <Textarea
                    placeholder="Lợi ơi, bạn đang nghĩ gì thế?"
                    className="min-h-[120px] resize-none text-base"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                {/* Preview ảnh/video nếu có */}
                {media && (
                    <div className="mt-3 relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => setMedia(null)}
                        >
                            ❌
                        </Button>
                        {media.type === 'image' ? (
                            <img
                                src={media.preview}
                                alt="preview"
                                className="rounded-lg max-h-60 object-cover mx-auto"
                            />
                        ) : (
                            <video controls src={media.preview} className="rounded-lg max-h-60 mx-auto" />
                        )}
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
                            onChange={handleMediaChange}
                        />
                    </label>
                </div>

                {/* Thêm hành động */}
                <div className="mt-4 border rounded-lg p-2 flex items-center justify-between text-gray-600 text-sm">
                    <span className="font-medium">Thêm vào bài viết của bạn</span>
                    <div className="flex gap-3">
                        <Image size={18} className="text-green-500" />
                        <Smile size={18} className="text-yellow-500" />
                        <Video size={18} className="text-red-500" />
                    </div>
                </div>

                {/* Nút đăng */}
                <Button
                    className="w-full mt-3"
                    disabled={content.trim() === '' && !media}
                    onClick={handlePost}
                >
                    Đăng
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePostModal;
