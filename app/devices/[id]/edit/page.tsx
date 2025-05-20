"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
}

interface Device {
    _id: string;
    name: string;
    type: string;
    subType?: string;
    category?: string;
    serialNumber: string;
    manufacturer: string;
    model: string;
    purchaseDate: string;
    warrantyExpiryDate?: string;
    status: string;
    location?: string;
    assignedTo?: {
        _id: string;
        name: string;
        employeeId: string;
        email: string;
        department: string;
    };
    specs?: Record<string, string>;
    notes?: string;
}

// Cấu trúc phân loại thiết bị theo cấp bậc
const deviceTypes = [
    // Thiết bị máy tính
    { value: "computer_device", label: "Thiết bị máy tính", category: "computing", subOptions: [
        { value: "desktop", label: "Máy tính để bàn" },
        { value: "laptop", label: "Laptop thông thường" },
        { value: "macbook_pro", label: "MacBook Pro" },
        { value: "macbook_air", label: "MacBook Air" },
        { value: "mac_mini", label: "Mac Mini" },
        { value: "workstation", label: "Máy trạm" },
        { value: "server", label: "Máy chủ" }
    ]},
    
    // Thiết bị hiển thị
    { value: "display_device", label: "Thiết bị hiển thị", category: "display", subOptions: [
        { value: "monitor", label: "Màn hình máy tính" },
        { value: "monitor_24", label: "Màn hình 24 inch" },
        { value: "monitor_27", label: "Màn hình 27 inch" },
        { value: "monitor_32", label: "Màn hình 32 inch" },
        { value: "projector", label: "Máy chiếu" },
        { value: "tv", label: "TV" }
    ]},
    
    // Thiết bị mạng
    { value: "network_device", label: "Thiết bị mạng", category: "network", subOptions: [
        { value: "router", label: "Router" },
        { value: "switch", label: "Switch" },
        { value: "access_point", label: "Access Point" },
        { value: "firewall", label: "Firewall" },
        { value: "modem", label: "Modem" }
    ]},
    
    // Thiết bị ngoại vi
    { value: "peripheral", label: "Thiết bị ngoại vi", category: "peripheral", subOptions: [
        { value: "keyboard", label: "Bàn phím" },
        { value: "mouse", label: "Chuột" },
        { value: "headphone", label: "Tai nghe" },
        { value: "webcam", label: "Webcam" },
        { value: "scanner", label: "Máy quét" },
        { value: "printer", label: "Máy in" }
    ]},
    
    // Thiết bị lưu trữ
    { value: "storage_device", label: "Thiết bị lưu trữ", category: "storage", subOptions: [
        { value: "external_hdd", label: "Ổ cứng gắn ngoài" },
        { value: "external_ssd", label: "SSD gắn ngoài" },
        { value: "nas", label: "NAS (Network Attached Storage)" },
        { value: "san", label: "SAN (Storage Area Network)" }
    ]},
    
    // Thiết bị khác
    { value: "other", label: "Khác", category: "other" }
];

export default function EditDevicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const deviceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        type: "",
        subType: "",
        serialNumber: "",
        manufacturer: "",
        model: "",
        purchaseDate: "",
        warrantyExpiryDate: "",
        status: "",
        location: "",
        assignedTo: "",
        notes: "",
        specs: {} as Record<string, string>
    });

    // Danh sách trường specs theo loại thiết bị
    const specFields: Record<string, string[]> = {
        computer: ["CPU", "RAM", "Storage", "GPU", "OS"],
        laptop: ["CPU", "RAM", "Storage", "Display", "Battery", "OS"],
        macbook_pro: ["Chip", "RAM", "Storage", "Display Size", "Display Resolution", "Battery", "macOS Version"],
        macbook_air: ["Chip", "RAM", "Storage", "Display Size", "Display Resolution", "Battery", "macOS Version"],
        mac_mini: ["Chip", "RAM", "Storage", "macOS Version", "Ports"],
        printer: ["Type", "Technology", "Format", "Color"],
        monitor: ["Size", "Resolution", "Panel", "Refresh Rate"],
        monitor_24: ["Resolution", "Panel Type", "Refresh Rate", "Inputs", "Adjustable Stand"],
        monitor_27: ["Resolution", "Panel Type", "Refresh Rate", "Inputs", "Adjustable Stand"],
        monitor_32: ["Resolution", "Panel Type", "Refresh Rate", "Inputs", "Adjustable Stand"],
        camera: ["Resolution", "Connectivity", "Features"],
        headphone: ["Type", "Connectivity", "Noise Cancellation", "Battery Life"],
        mouse: ["Type", "DPI", "Connectivity", "Buttons", "Battery Life"],
        keyboard: ["Type", "Layout", "Connectivity", "Backlight", "Battery Life"],
        server: ["CPU", "RAM", "Storage", "RAID", "OS"],
        network: ["Type", "Ports", "Speed", "Protocol"],
        peripheral: ["Interface", "Compatibility"],
        other: []
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Kiểm tra quyền hạn
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            // Tải thông tin thiết bị
            fetchDevice();

            // Tải danh sách nhân viên
            fetchEmployees();
        }
    }, [status, session, router, deviceId]);

    // Cập nhật specs khi thay đổi loại thiết bị hoặc loại chi tiết
    useEffect(() => {
        if (formData.subType) {
            // Sử dụng subType để lấy trường specs phù hợp nếu có
            const existingSpecs = { ...formData.specs };
            const requiredSpecs = specFields[formData.subType] || specFields[formData.type] || [];

            // Thêm các trường mới
            const updatedSpecs: Record<string, string> = {};
            requiredSpecs.forEach(field => {
                updatedSpecs[field] = existingSpecs[field] || "";
            });

            // Cập nhật state
            setFormData(prev => ({ ...prev, specs: updatedSpecs }));
        } else if (formData.type) {
            // Nếu không có subType, sử dụng loại chính
            const existingSpecs = { ...formData.specs };
            const requiredSpecs = specFields[formData.type] || [];

            // Thêm các trường mới
            const updatedSpecs: Record<string, string> = {};
            requiredSpecs.forEach(field => {
                updatedSpecs[field] = existingSpecs[field] || "";
            });

            // Cập nhật state
            setFormData(prev => ({ ...prev, specs: updatedSpecs }));
        }
    }, [formData.type, formData.subType]);

    const fetchDevice = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/devices/${deviceId}`);
            const device = response.data;

            // Format dates for input fields
            const purchaseDate = device.purchaseDate ? new Date(device.purchaseDate).toISOString().split('T')[0] : "";
            const warrantyExpiryDate = device.warrantyExpiryDate ? new Date(device.warrantyExpiryDate).toISOString().split('T')[0] : "";

            // Xác định type và subType dựa trên dữ liệu từ API và danh sách thiết bị hiện tại
            let mainType = device.type;
            let subType = device.subType || "";

            // Nếu loại thiết bị không nằm trong danh sách type chính, có thể nó là subType
            if (mainType && !deviceTypes.some(t => t.value === mainType)) {
                // Tìm trong các subOptions của tất cả deviceTypes
                for (const type of deviceTypes) {
                    if (type.subOptions) {
                        const found = type.subOptions.find(sub => sub.value === mainType);
                        if (found) {
                            // Nếu tìm thấy, cập nhật mainType và subType
                            subType = mainType;
                            mainType = type.value;
                            break;
                        }
                    }
                }
            }

            setFormData({
                name: device.name || "",
                category: device.category || "",
                type: mainType || "computer_device", // Sử dụng giá trị default phù hợp
                subType: subType,
                serialNumber: device.serialNumber || "",
                manufacturer: device.manufacturer || "",
                model: device.model || "",
                purchaseDate,
                warrantyExpiryDate,
                status: device.status || "available",
                location: device.location || "",
                assignedTo: device.assignedTo?._id || "",
                notes: device.notes || "",
                specs: device.specs || {}
            });

            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin thiết bị");
            console.error("Error fetching device:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get("/api/employees");
            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSpecChange = (specName: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, [specName]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            setSubmitting(true);

            // Validate dữ liệu
            if (!formData.name || !formData.serialNumber || !formData.manufacturer || !formData.model || !formData.purchaseDate) {
                setError("Vui lòng điền đầy đủ thông tin bắt buộc");
                setSubmitting(false);
                return;
            }

            // Gửi request cập nhật thiết bị
            await axios.put(`/api/devices/${deviceId}`, formData);

            // Redirect khi thành công
            router.push(`/devices/${deviceId}`);
        } catch (err: any) {
            setError(err.response?.data?.error || "Đã xảy ra lỗi khi cập nhật thiết bị");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/devices" className="text-primary-foreground hover:underline">
                            Thiết bị
                        </Link>
                        <span>/</span>
                        <Link href={`/devices/${deviceId}`} className="text-primary-foreground hover:underline">
                            Chi tiết
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Chỉnh sửa thiết bị</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {session?.user?.name && (
                            <span>Xin chào, {session.user.name}</span>
                        )}
                        <Link
                            href="/api/auth/signout"
                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                        >
                            Đăng xuất
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto py-6 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">Chỉnh sửa thiết bị</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium">
                                    Tên thiết bị <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="type" className="block text-sm font-medium">
                                    Loại thiết bị <span className="text-destructive">*</span>
                                </label>
                                <div className="flex flex-col space-y-3">
                                    {/* Chọn loại thiết bị chính */}
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={(e) => {
                                            const selectedType = e.target.value;
                                            
                                            // Tìm loại thiết bị được chọn để lấy category
                                            const selectedDevice = deviceTypes.find(device => device.value === selectedType);
                                            
                                            setFormData(prev => ({
                                                ...prev,
                                                type: selectedType,
                                                subType: "",
                                                category: selectedDevice?.category || ""
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    >
                                        <option value="">-- Chọn loại thiết bị --</option>
                                        {deviceTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Chọn loại thiết bị con nếu có */}
                                    {formData.type && deviceTypes.find(type => type.value === formData.type)?.subOptions && (
                                        <select
                                            id="subType"
                                            name="subType"
                                            value={formData.subType}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    subType: e.target.value
                                                }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-md bg-background"
                                        >
                                            <option value="">-- Chọn loại thiết bị chi tiết --</option>
                                            {deviceTypes
                                                .find(type => type.value === formData.type)
                                                ?.subOptions?.map((subOption) => (
                                                    <option key={subOption.value} value={subOption.value}>
                                                        {subOption.label}
                                                    </option>
                                                ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="serialNumber" className="block text-sm font-medium">
                                    Số sê-ri <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="serialNumber"
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="manufacturer" className="block text-sm font-medium">
                                    Nhà sản xuất <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="manufacturer"
                                    name="manufacturer"
                                    value={formData.manufacturer}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="model" className="block text-sm font-medium">
                                    Model <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="model"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="purchaseDate" className="block text-sm font-medium">
                                    Ngày mua <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="purchaseDate"
                                    name="purchaseDate"
                                    value={formData.purchaseDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="warrantyExpiryDate" className="block text-sm font-medium">
                                    Ngày hết hạn bảo hành
                                </label>
                                <input
                                    type="date"
                                    id="warrantyExpiryDate"
                                    name="warrantyExpiryDate"
                                    value={formData.warrantyExpiryDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="status" className="block text-sm font-medium">
                                    Trạng thái <span className="text-destructive">*</span>
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                >
                                    <option value="available">Khả dụng</option>
                                    <option value="in_use">Đang sử dụng</option>
                                    <option value="under_repair">Đang sửa chữa</option>
                                    <option value="disposed">Đã thanh lý</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="location" className="block text-sm font-medium">
                                    Vị trí
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="assignedTo" className="block text-sm font-medium">
                                    Nhân viên được gán
                                </label>
                                <select
                                    id="assignedTo"
                                    name="assignedTo"
                                    value={formData.assignedTo}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {employees.map((employee) => (
                                        <option key={employee._id} value={employee._id}>
                                            {employee.name} ({employee.employeeId}) - {employee.department}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Thông số kỹ thuật */}
                        {specFields[formData.type]?.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium mb-4">Thông số kỹ thuật</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {specFields[formData.type]?.map((specName) => (
                                        <div key={specName} className="space-y-2">
                                            <label htmlFor={`spec-${specName}`} className="block text-sm font-medium">
                                                {specName}
                                            </label>
                                            <input
                                                type="text"
                                                id={`spec-${specName}`}
                                                value={formData.specs[specName] || ""}
                                                onChange={(e) => handleSpecChange(specName, e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md bg-background"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <label htmlFor="notes" className="block text-sm font-medium mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                            />
                        </div>

                        <div className="mt-8 flex justify-end space-x-4">
                            <Link
                                href={`/devices/${deviceId}`}
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                            >
                                {submitting ? "Đang xử lý..." : "Cập nhật thiết bị"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="bg-muted py-4">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    );
}