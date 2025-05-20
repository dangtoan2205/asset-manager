"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
}

export default function CreateDevicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        status: "available",
        location: "",
        assignedTo: "",
        notes: "",
        specs: {} as Record<string, string>
    });

    // Cấu trúc phân loại thiết bị theo cấp bậc khoa học
    const deviceCategories = [
        // Máy tính và Laptop
        {
            id: "computing",
            label: "Thiết bị tính toán",
            types: [
                {
                    id: "computer",
                    label: "Máy tính để bàn",
                    specs: ["CPU", "RAM", "Storage", "GPU", "OS"],
                    subTypes: []
                },
                {
                    id: "laptop",
                    label: "Laptop thông thường",
                    specs: ["CPU", "RAM", "Storage", "Display", "Battery", "OS"],
                    subTypes: []
                },
                {
                    id: "laptop_macbook",
                    label: "MacBook",
                    specs: ["Chip", "RAM", "Storage", "Display Size", "Display Resolution", "Battery", "macOS Version"],
                    subTypes: [
                        { id: "laptop_macbook_pro", label: "MacBook Pro" },
                        { id: "laptop_macbook_air", label: "MacBook Air" }
                    ]
                },
                {
                    id: "desktop_mac",
                    label: "Mac để bàn",
                    specs: ["Chip", "RAM", "Storage", "macOS Version"],
                    subTypes: [
                        { id: "desktop_mac_mini", label: "Mac Mini" },
                        { id: "desktop_mac_studio", label: "Mac Studio" },
                        { id: "desktop_imac", label: "iMac" }
                    ]
                },
                {
                    id: "server",
                    label: "Máy chủ",
                    specs: ["CPU", "RAM", "Storage", "RAID", "OS"],
                    subTypes: []
                }
            ]
        },
        
        // Thiết bị hiển thị
        {
            id: "display",
            label: "Thiết bị hiển thị",
            types: [
                {
                    id: "monitor",
                    label: "Màn hình",
                    specs: ["Size", "Resolution", "Panel", "Refresh Rate"],
                    subTypes: [
                        { id: "monitor_24", label: "Màn hình 24 inch" },
                        { id: "monitor_27", label: "Màn hình 27 inch" },
                        { id: "monitor_32", label: "Màn hình 32 inch" },
                        { id: "monitor_other", label: "Kích thước khác" }
                    ]
                }
            ]
        },
        
        // Thiết bị ngoại vi
        {
            id: "peripheral",
            label: "Thiết bị ngoại vi",
            types: [
                {
                    id: "peripheral_input",
                    label: "Thiết bị nhập liệu",
                    specs: [],
                    subTypes: [
                        { 
                            id: "keyboard", 
                            label: "Bàn phím",
                            specs: ["Type", "Layout", "Connectivity", "Backlight", "Battery Life"]
                        },
                        { 
                            id: "mouse", 
                            label: "Chuột",
                            specs: ["Type", "DPI", "Connectivity", "Buttons", "Battery Life"]
                        },
                        { id: "drawing_tablet", label: "Bảng vẽ" }
                    ]
                },
                {
                    id: "peripheral_audio",
                    label: "Thiết bị âm thanh",
                    specs: [],
                    subTypes: [
                        { 
                            id: "headphone", 
                            label: "Tai nghe",
                            specs: ["Type", "Connectivity", "Noise Cancellation", "Battery Life"]
                        },
                        { id: "speaker", label: "Loa" }
                    ]
                },
                {
                    id: "peripheral_other",
                    label: "Thiết bị ngoại vi khác",
                    specs: ["Interface", "Compatibility"],
                    subTypes: []
                }
            ]
        },
        
        // Thiết bị mạng và in ấn
        {
            id: "networking",
            label: "Thiết bị mạng",
            types: [
                {
                    id: "network",
                    label: "Thiết bị mạng",
                    specs: ["Type", "Ports", "Speed", "Protocol"],
                    subTypes: []
                }
            ]
        },
        {
            id: "printing",
            label: "Thiết bị in ấn",
            types: [
                {
                    id: "printer",
                    label: "Máy in/Scan",
                    specs: ["Type", "Technology", "Format", "Color"],
                    subTypes: []
                }
            ]
        },
        {
            id: "imaging",
            label: "Thiết bị hình ảnh",
            types: [
                {
                    id: "camera",
                    label: "Camera",
                    specs: ["Resolution", "Connectivity", "Features"],
                    subTypes: []
                }
            ]
        },
        
        // Khác
        {
            id: "other",
            label: "Khác",
            types: [
                {
                    id: "other",
                    label: "Khác",
                    specs: [],
                    subTypes: []
                }
            ]
        }
    ];

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

    // Khởi tạo specs ban đầu
    useEffect(() => {
        const initialSpecs: Record<string, string> = {};
        specFields[formData.type]?.forEach(field => {
            initialSpecs[field] = "";
        });
        setFormData(prev => ({ ...prev, specs: initialSpecs }));
    }, [formData.type]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Kiểm tra quyền hạn
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            // Tải danh sách nhân viên
            fetchEmployees();
        }
    }, [status, session, router]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/employees");
            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
        } finally {
            setLoading(false);
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

            // Gửi request tạo thiết bị
            await axios.post("/api/devices", formData);

            // Redirect khi thành công
            router.push("/devices");
        } catch (err: any) {
            setError(err.response?.data?.error || "Đã xảy ra lỗi khi tạo thiết bị");
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
                        <h1 className="text-xl font-bold">Thêm thiết bị mới</h1>
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
                    <h2 className="text-2xl font-bold mb-6">Thêm thiết bị mới</h2>

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
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category || ""}
                                        onChange={(e) => {
                                            const selectedCategory = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                category: selectedCategory,
                                                type: "",
                                                subType: "",
                                                specs: {}
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    >
                                        <option value="">-- Chọn nhóm thiết bị --</option>
                                        {deviceCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>

                                    {formData.category && (
                                        <select
                                            id="type"
                                            name="type"
                                            value={formData.type}
                                            onChange={(e) => {
                                                const selectedType = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    type: selectedType,
                                                    subType: "",
                                                    specs: {}
                                                }));

                                                // Tìm loại thiết bị được chọn và cập nhật specs
                                                const category = deviceCategories.find(c => c.id === formData.category);
                                                if (category) {
                                                    const type = category.types.find(t => t.id === selectedType);
                                                    if (type?.specs?.length > 0) {
                                                        const initialSpecs: Record<string, string> = {};
                                                        type.specs.forEach(field => {
                                                            initialSpecs[field] = "";
                                                        });
                                                        setFormData(prev => ({ ...prev, specs: initialSpecs }));
                                                    }
                                                }
                                            }}
                                            className="w-full px-3 py-2 border rounded-md bg-background"
                                            required
                                        >
                                            <option value="">-- Chọn loại thiết bị --</option>
                                            {deviceCategories
                                                .find(category => category.id === formData.category)
                                                ?.types.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                        </select>
                                    )}

                                    {formData.type && deviceCategories
                                        .find(category => category.id === formData.category)
                                        ?.types.find(type => type.id === formData.type)
                                        ?.subTypes.length > 0 && (
                                        <select
                                            id="subType"
                                            name="subType"
                                            value={formData.subType || ""}
                                            onChange={(e) => {
                                                const selectedSubType = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    subType: selectedSubType,
                                                    specs: {}
                                                }));

                                                // Tìm loại con được chọn và cập nhật specs nếu có
                                                const category = deviceCategories.find(c => c.id === formData.category);
                                                if (category) {
                                                    const type = category.types.find(t => t.id === formData.type);
                                                    if (type) {
                                                        const subType = type.subTypes.find(st => st.id === selectedSubType);
                                                        if (subType && 'specs' in subType && subType.specs?.length > 0) {
                                                            const initialSpecs: Record<string, string> = {};
                                                            subType.specs.forEach(field => {
                                                                initialSpecs[field] = "";
                                                            });
                                                            setFormData(prev => ({ ...prev, specs: initialSpecs }));
                                                        } else if (type.specs?.length > 0) {
                                                            // Nếu subType không có specs riêng, sử dụng specs của type
                                                            const initialSpecs: Record<string, string> = {};
                                                            type.specs.forEach(field => {
                                                                initialSpecs[field] = "";
                                                            });
                                                            setFormData(prev => ({ ...prev, specs: initialSpecs }));
                                                        }
                                                    }
                                                }
                                            }}
                                            className="w-full px-3 py-2 border rounded-md bg-background"
                                            required
                                        >
                                            <option value="">-- Chọn loại chi tiết --</option>
                                            {deviceCategories
                                                .find(category => category.id === formData.category)
                                                ?.types.find(type => type.id === formData.type)
                                                ?.subTypes.map((subType) => (
                                                    <option key={subType.id} value={subType.id}>
                                                        {subType.label}
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

                        {/* Thông số kỹ thuật - Hiển thị theo cấu trúc phân loại mới */}
                        {formData.type && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium mb-4">Thông số kỹ thuật</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.keys(formData.specs).map((specName) => (
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
                                href="/devices"
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                            >
                                {submitting ? "Đang xử lý..." : "Tạo thiết bị"}
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