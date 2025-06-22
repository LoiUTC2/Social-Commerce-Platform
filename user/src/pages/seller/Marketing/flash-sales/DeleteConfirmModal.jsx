"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../../components/ui/dialog"
import { Button } from "../../../../components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận xóa",
    description = "Bạn có chắc chắn muốn thực hiện hành động này?",
    confirmText = "Xóa",
    variant = "destructive",
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">{description}</DialogDescription>
                </DialogHeader>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        className={variant === "destructive" ? "bg-red-500 hover:bg-red-600" : ""}
                    >
                        {confirmText}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
