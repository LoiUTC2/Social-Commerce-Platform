"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { X, ChevronLeft, ChevronRight, Download, Share2, Heart, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Badge } from "../../components/ui/badge"

export default function MediaViewer({ media = [], initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMuted, setIsMuted] = useState(true)
    const [showControls, setShowControls] = useState(true)
    const videoRef = useRef(null)
    const controlsTimeoutRef = useRef(null)

    const currentMedia = media[currentIndex]
    const isVideo = currentMedia?.type === "video"

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case "Escape":
                    onClose()
                    break
                case "ArrowLeft":
                    handlePrevious()
                    break
                case "ArrowRight":
                    handleNext()
                    break
                case " ":
                    e.preventDefault()
                    if (isVideo) {
                        togglePlay()
                    }
                    break
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [currentIndex, isVideo])

    useEffect(() => {
        if (isVideo && videoRef.current) {
            if (isPlaying) {
                videoRef.current.play()
            } else {
                videoRef.current.pause()
            }
        }
    }, [isPlaying, currentIndex])

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))
        setIsPlaying(false)
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))
        setIsPlaying(false)
    }

    const togglePlay = () => {
        setIsPlaying(!isPlaying)
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
        }
    }

    const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false)
        }, 3000)
    }

    const handleDownload = () => {
        const link = document.createElement("a")
        link.href = currentMedia.url
        link.download = `media-${currentIndex + 1}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onMouseMove={handleMouseMove}>
            {/* Header Controls */}
            <div
                className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                            <X className="w-5 h-5" />
                        </Button>
                        <div className="text-white">
                            <span className="text-sm">
                                {currentIndex + 1} / {media.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Media source badge */}
                        {currentMedia.source === "product" && (
                            <Badge variant="secondary" className="bg-blue-500/80 text-white">
                                Sản phẩm: {currentMedia.productName}
                            </Badge>
                        )}
                        {currentMedia.source === "post" && (
                            <Badge variant="secondary" className="bg-green-500/80 text-white">
                                Bài viết
                            </Badge>
                        )}

                        <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white hover:bg-white/20">
                            <Download className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <Share2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <Heart className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            {media.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevious}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 w-12 h-12 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 w-12 h-12 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </>
            )}

            {/* Media Content */}
            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                {isVideo ? (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            src={currentMedia.url}
                            className="max-w-full max-h-[90vh] object-contain"
                            muted={isMuted}
                            loop
                            autoPlay={true}
                            controls={true}
                            playsInline
                            onClick={togglePlay}
                        />

                        {/* Video Controls */}
                        <div
                            className={`absolute bottom-4 left-4 right-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={togglePlay}
                                    className="text-white hover:bg-white/20 w-10 h-10"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleMute}
                                    className="text-white hover:bg-white/20 w-10 h-10"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>

                        {/* Play button overlay */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                                <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                                    <Play className="w-12 h-12 text-white fill-white" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <img
                        src={currentMedia.url || "/placeholder.svg"}
                        alt={`Media ${currentIndex + 1}`}
                        className="max-w-full max-h-[90vh] object-contain"
                    />
                )}
            </div>

            {/* Thumbnail Strip */}
            {media.length > 1 && (
                <div
                    className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 max-w-[80vw] overflow-x-auto">
                        {media.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${index === currentIndex ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                                    }`}
                            >
                                {item.type === "video" ? (
                                    <video src={item.url} className="w-full h-full object-cover" muted />
                                ) : (
                                    <img
                                        src={item.url || "/placeholder.svg"}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {item.type === "video" && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Play className="w-4 h-4 text-white fill-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
