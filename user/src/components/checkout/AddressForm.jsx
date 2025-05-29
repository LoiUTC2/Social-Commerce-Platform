"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Checkbox } from "../ui/checkbox"

export default function AddressForm({ initialAddress = {}, onSubmit, onCancel }) {
    const [address, setAddress] = useState({
        fullName: initialAddress.fullName || "",
        phone: initialAddress.phone || "",
        address: initialAddress.address || "",
        ward: initialAddress.ward || "",
        district: initialAddress.district || "",
        city: initialAddress.city || "",
        province: initialAddress.province || "",
        isDefault: initialAddress.isDefault || false,
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setAddress((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(address)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Họ tên người nhận</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        value={address.fullName}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                        id="phone"
                        name="phone"
                        value={address.phone}
                        onChange={handleChange}
                        placeholder="0901234567"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ cụ thể</Label>
                <Input
                    id="address"
                    name="address"
                    value={address.address}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ward">Phường/Xã</Label>
                    <Input id="ward" name="ward" value={address.ward} onChange={handleChange} placeholder="Phường/Xã" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="district">Quận/Huyện</Label>
                    <Input
                        id="district"
                        name="district"
                        value={address.district}
                        onChange={handleChange}
                        placeholder="Quận/Huyện"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">Thành phố</Label>
                    <Input id="city" name="city" value={address.city} onChange={handleChange} placeholder="Thành phố" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="province">Tỉnh</Label>
                    <Input id="province" name="province" value={address.province} onChange={handleChange} placeholder="Tỉnh" />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="isDefault"
                    checked={address.isDefault}
                    onCheckedChange={(checked) => setAddress((prev) => ({ ...prev, isDefault: checked }))}
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                    Đặt làm địa chỉ mặc định
                </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                    Lưu địa chỉ
                </Button>
            </div>
        </form>
    )
}
