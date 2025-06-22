"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { uploadToCloudinary } from "../../utils/uploadToCloudinary"
import { toast } from "sonner"

export function ImageUpload({
    value,
    onChange,
    label = "Tải ảnh lên",
    className = "",
    maxSize = 5, // in MB
    aspectRatio = "square", // square, portrait, landscape, banner
    previewSize = "medium", // small, medium, large
}) {
    const [isUploading, setIsUploading] = useState(false)

    // Calculate height based on aspect ratio and preview size
    let height = "h-32" // Default medium square
    if (previewSize === "small") height = "h-24"
    if (previewSize === "large") height = "h-48"

    if (aspectRatio === "portrait") {
        if (previewSize === "small") height = "h-32"
        if (previewSize === "medium") height = "h-48"
        if (previewSize === "large") height = "h-64"
    } else if (aspectRatio === "landscape" || aspectRatio === "banner") {
        if (previewSize === "small") height = "h-20"
        if (previewSize === "medium") height = "h-24"
        if (previewSize === "large") height = "h-36"
    }

    const handleUpload = async () => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"

        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return

            if (file.size > maxSize * 1024 * 1024) {
                toast.error(`Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn ${maxSize}MB`)
                return
            }

            try {
                setIsUploading(true)
                const imageUrl = await uploadToCloudinary(file)
                onChange(imageUrl)
                toast.success("Tải ảnh lên thành công!")
            } catch (error) {
                console.error("Upload error:", error)
                toast.error("Lỗi khi tải ảnh lên. Vui lòng thử lại.")
            } finally {
                setIsUploading(false)
            }
        }

        input.click()
    }

    const handleRemove = (e) => {
        e.stopPropagation()
        onChange("")
    }

    return (
        <div
            className={`border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors image-upload-container ${className}`}
            onClick={handleUpload}
        >
            {value ? (
                <div className="relative">
                    <img
                        src={value || "/placeholder.svg"}
                        alt={label}
                        className={`w-full ${height} object-cover rounded-lg ${aspectRatio === "banner" ? "object-center" : ""}`}
                    />
                    <div className="upload-overlay rounded-lg">
                        <span className="upload-overlay-text">Thay đổi</span>
                    </div>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 z-10"
                        onClick={handleRemove}
                        disabled={isUploading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className={`flex flex-col items-center justify-center ${height}`}>
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 text-pink-500 animate-spin mb-2" />
                            <span className="text-sm text-gray-500">Đang tải lên...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">{label}</span>
                            <span className="text-xs text-gray-400 mt-1">
                                Tối đa {maxSize}MB
                                {aspectRatio === "banner" && " • Tỷ lệ 16:9 khuyến nghị"}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// CSS styles to add to your global CSS file
const styles = `
.image-upload-container {
  position: relative;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-upload-container:hover .upload-overlay {
  opacity: 1;
}

.upload-overlay-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}
`
