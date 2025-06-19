import axios from "axios"

export const uploadToCloudinary = async (file, options = {}) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "social_commerce_upload") // Thay bằng upload preset bạn tạo
    formData.append("cloud_name", "dsst228u9") // Cloud name của bạn

    // Determine resource type based on file type
    if (file.type.startsWith("video/")) {
        formData.append("resource_type", "video")
    } else {
        formData.append("resource_type", "image")
    }

    const endpoint = file.type.startsWith("video/")
        ? "https://api.cloudinary.com/v1_1/dsst228u9/video/upload"
        : "https://api.cloudinary.com/v1_1/dsst228u9/image/upload"

    try {
        const res = await axios.post(endpoint, formData, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                console.log(`Upload Progress: ${percentCompleted}%`)

                // Call progress callback if provided
                if (options.onProgress) {
                    options.onProgress(percentCompleted)
                }
            },
        })

        console.log("Cloudinary response:", res.data) // Debug log
        return {
            success: true,
            secure_url: res.data.secure_url,
            public_id: res.data.public_id,
            resource_type: res.data.resource_type,
        }
    } catch (error) {
        console.error("Cloudinary upload error:", error)
        throw error
    }
}
