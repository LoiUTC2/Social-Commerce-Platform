import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

const LikesListModal = ({ open, onOpenChange, likes = [] }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md bg-white rounded-xl shadow-lg"
                overlayClassName="bg-black/10 backdrop-blur-sm"
            >
                <DialogHeader className="border-b pb-2 mb-2">
                    <DialogTitle className="text-center text-lg font-semibold">
                        Những người đã thích bài viết
                    </DialogTitle>
                </DialogHeader>

                {/* Danh sách người thích */}
                <div className="max-h-96 overflow-y-auto space-y-3 mt-2">
                    {likes.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">Chưa có ai thích bài viết này</div>
                    ) : (
                        likes.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100">
                                <img
                                    src={user.avatar || '/avatar-default.jpg'}
                                    alt={user.fullName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">{user.fullName}</div>
                                    {/* <div className="text-xs text-gray-400">Bạn bè</div> nếu sau này muốn thêm label */}
                                </div>
                                <Button size="sm" variant="outline">
                                    Nhắn tin
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LikesListModal;
