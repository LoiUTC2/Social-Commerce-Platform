import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';

export function ShopApprovalPendingModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-2 border-pink-600 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <DialogHeader>
                    <div className="flex flex-col items-center py-6">
                        {/* Icon với hiệu ứng gradient */}
                        <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 shadow-lg">
                            <Clock className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>

                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            Shop đang chờ duyệt
                        </DialogTitle>

                        <DialogDescription className="text-center mt-2 text-gray-600 dark:text-gray-300">
                            Hồ sơ shop của bạn đang được hệ thống xem xét.
                            <br />
                            Thời gian duyệt thường từ <span className="font-medium text-pink-600 dark:text-pink-400">24-48 giờ</span>.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* Thông báo quan trọng */}
                <div className="px-4 pb-6">
                    <div className="flex items-start p-4 bg-pink-50 dark:bg-gray-800 rounded-lg border border-pink-200 dark:border-pink-900/50">
                        <AlertCircle className="flex-shrink-0 w-5 h-5 mt-1 text-pink-600 dark:text-pink-400" />
                        <div className="ml-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">Lưu ý quan trọng</h4>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                Vui lòng kiểm tra email thường xuyên để nhận thông báo khi shop được duyệt.
                                Bạn có thể chuẩn bị sản phẩm trong thời gian chờ đợi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
                    <Button
                        onClick={onClose}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 shadow-sm transition-colors"
                    >
                        Đã hiểu
                    </Button>

                    <Button
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-6"
                    >
                        Hỗ trợ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}