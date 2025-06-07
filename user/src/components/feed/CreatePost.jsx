import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Video, Image, Smile } from 'lucide-react';
import avtAcount from '../../assets/anh-avatar-trang-tron.jpg';
import CreatePostModal from './CreatePostModal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
    const { user, setShowLoginModal } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleCreatePost = async () => {
        if (!user) return setShowLoginModal(true)
        setOpen(true);
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 cursor-pointer " onClick={() => handleCreatePost()}>
                <div className="flex items-center gap-3">
                    <img
                        src={user?.avatar || avtAcount}
                        alt="user avatar"
                        className="w-10 h-10 rounded-full object-cover"
                        onClick={() => navigate(`/feed/profile/${user?.slug}`)}
                    />
                    <Input
                        className="rounded-full bg-gray-100 px-4"
                        placeholder={`${user?.fullName || user?.name || "Bạn"} ơi, bạn đang nghĩ gì thế?`}
                    />
                </div>

                <hr />

                <div className="flex justify-between text-sm text-gray-600 px-2">
                    <button className="flex items-center gap-1 hover:text-pink-500">
                        <Video size={16} className="text-red-500" /> Video trực tiếp
                    </button>
                    <button className="flex items-center gap-1 hover:text-pink-500">
                        <Image size={16} className="text-green-500" /> Ảnh/video
                    </button>
                    <button className="flex items-center gap-1 hover:text-pink-500">
                        <Smile size={16} className="text-yellow-500" /> Cảm xúc/hoạt động
                    </button>
                </div>
            </div>
            <CreatePostModal open={open} onOpenChange={setOpen} />
        </>
    );
};

export default CreatePost;
