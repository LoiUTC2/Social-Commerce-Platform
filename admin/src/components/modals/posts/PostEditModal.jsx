"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Badge } from "../../ui/badge"
import { Card, CardContent } from "../../ui/card"
import { Label } from "../../ui/label"
import { Switch } from "../../ui/switch"
import { X, Save, Plus } from "lucide-react"
import { toast } from "sonner"
import { updatePost } from "../../../services/postService"

export default function PostEditModal({ post, open, onOpenChange, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        content: "",
        hashtags: [],
        tags: [],
        emotionTags: [],
        location: "",
        privacy: "public",
        isSponsored: false,
    })
    const [newHashtag, setNewHashtag] = useState("")
    const [newTag, setNewTag] = useState("")
    const [newEmotionTag, setNewEmotionTag] = useState("")

    useEffect(() => {
        if (post) {
            setFormData({
                content: post.content || "",
                hashtags: post.hashtags || [],
                tags: post.tags || [],
                emotionTags: post.emotionTags || [],
                location: post.location || "",
                privacy: post.privacy || "public",
                isSponsored: post.isSponsored || false,
            })
        }
    }, [post])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!post) return

        try {
            setLoading(true)
            const response = await updatePost(post._id, formData)

            if (response.success) {
                toast.success("Cập nhật bài viết thành công")
                onSuccess?.()
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật bài viết")
            console.error("Error updating post:", error)
        } finally {
            setLoading(false)
        }
    }

    const addHashtag = () => {
        if (newHashtag.trim() && !formData.hashtags.includes(newHashtag.trim())) {
            setFormData((prev) => ({
                ...prev,
                hashtags: [...prev.hashtags, newHashtag.trim()],
            }))
            setNewHashtag("")
        }
    }

    const removeHashtag = (index) => {
        setFormData((prev) => ({
            ...prev,
            hashtags: prev.hashtags.filter((_, i) => i !== index),
        }))
    }

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()],
            }))
            setNewTag("")
        }
    }

    const removeTag = (index) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }))
    }

    const addEmotionTag = () => {
        if (newEmotionTag.trim() && !formData.emotionTags.includes(newEmotionTag.trim())) {
            setFormData((prev) => ({
                ...prev,
                emotionTags: [...prev.emotionTags, newEmotionTag.trim()],
            }))
            setNewEmotionTag("")
        }
    }

    const removeEmotionTag = (index) => {
        setFormData((prev) => ({
            ...prev,
            emotionTags: prev.emotionTags.filter((_, i) => i !== index),
        }))
    }

    if (!post) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="w-5 h-5 text-pink-600" />
                        Chỉnh sửa bài viết
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">Nội dung bài viết *</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                            placeholder="Nhập nội dung bài viết..."
                            rows={6}
                            required
                            className="border-pink-200 focus:border-pink-400"
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Vị trí</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                            placeholder="Nhập vị trí..."
                            className="border-pink-200 focus:border-pink-400"
                        />
                    </div>

                    {/* Privacy */}
                    <div className="space-y-2">
                        <Label>Quyền riêng tư</Label>
                        <Select
                            value={formData.privacy}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, privacy: value }))}
                        >
                            <SelectTrigger className="border-pink-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">Công khai</SelectItem>
                                <SelectItem value="friends">Bạn bè</SelectItem>
                                <SelectItem value="private">Riêng tư</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sponsored Status */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Bài viết tài trợ</Label>
                            <p className="text-sm text-gray-500">Đánh dấu bài viết này là bài tài trợ</p>
                        </div>
                        <Switch
                            checked={formData.isSponsored}
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isSponsored: checked }))}
                        />
                    </div>

                    {/* Hashtags */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <Label className="text-base font-semibold">Hashtags</Label>
                            <div className="mt-2 space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newHashtag}
                                        onChange={(e) => setNewHashtag(e.target.value)}
                                        placeholder="Thêm hashtag..."
                                        className="border-pink-200"
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                                    />
                                    <Button type="button" onClick={addHashtag} size="sm" className="bg-pink-600 hover:bg-pink-700">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {formData.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.hashtags.map((hashtag, index) => (
                                            <Badge key={index} variant="outline" className="border-pink-200 text-pink-600">
                                                #{hashtag}
                                                <button type="button" onClick={() => removeHashtag(index)} className="ml-1 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <Label className="text-base font-semibold">Tags</Label>
                            <div className="mt-2 space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Thêm tag..."
                                        className="border-pink-200"
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    />
                                    <Button type="button" onClick={addTag} size="sm" className="bg-pink-600 hover:bg-pink-700">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(index)} className="ml-1 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emotion Tags */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <Label className="text-base font-semibold">Emotion Tags</Label>
                            <div className="mt-2 space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newEmotionTag}
                                        onChange={(e) => setNewEmotionTag(e.target.value)}
                                        placeholder="Thêm emotion tag..."
                                        className="border-pink-200"
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmotionTag())}
                                    />
                                    <Button type="button" onClick={addEmotionTag} size="sm" className="bg-pink-600 hover:bg-pink-700">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {formData.emotionTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.emotionTags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeEmotionTag(index)}
                                                    className="ml-1 hover:text-red-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}