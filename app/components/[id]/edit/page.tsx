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
    serialNumber: string;
    type: string;
    subType?: string;
    category?: string;
}

export default function EditComponentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const componentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        type: "",
        subType: "",
        category: "",
        serialNumber: "",
        manufacturer: "",
        model: "",
        purchaseDate: "",
        warrantyExpiryDate: "",
        status: "",
        location: "",
        assignedTo: "",
        installedIn: "",
        notes: "",
        specs: {} as Record<string, string>
    });

    // Danh sách trường specs theo loại linh kiện
    const specFields: Record<string, string[]> = {
        ram: ["Capacity", "Type", "Speed", "Module"],
        storage: ["Capacity", "Interface", "Type", "RPM", "Cache"],
        cpu: ["Cores", "Threads", "Base Clock", "Boost Clock", "Socket", "TDP"],
        gpu: ["Memory", "Memory Type", "Core Clock", "Interface", "TDP"],
        motherboard: ["Socket", "Chipset", "Memory Slots", "Form Factor"],
        power_supply: ["Wattage", "Certification", "Modular", "Efficiency"],
        cooling: ["Type", "Size", "Max TDP", "Noise Level"],
        peripheral: ["Interface", "Compatibility"],
        cable: ["Type", "Length", "Connection Type"],
        network: ["Type", "Speed", "Ports", "Wireless Standard"],
        other: []
    };

    // Loại linh kiện
    const componentTypes = [
        { value: 'ram', label: 'RAM' },
        { value: 'storage', label: 'Ổ cứng / SSD' },
        { value: 'cpu', label: 'CPU' },
        { value: 'gpu', label: 'Card đồ họa' },
        { value: 'motherboard', label: 'Bo mạch chủ' },
        { value: 'power_supply', label: 'Nguồn' },
        { value: 'cooling', label: 'Tản nhiệt' },
        { value: 'peripheral', label: 'Thiết bị ngoại vi' },
        { value: 'cable', label: 'Cáp / Adapter' },
        { value: 'network', label: 'Thiết bị mạng' },
        { value: 'other', label: 'Khác' },
    ];

    // Cấu trúc phân loại linh kiện theo cấp bậc
    const componentTypesHierarchy = [
        // Linh kiện máy tính
        { value: "computer_component", label: "Linh kiện máy tính", category: "computing", subOptions: [
            { value: "cpu", label: "CPU / Vi xử lý" },
            { value: "ram", label: "RAM / Bộ nhớ" },
            { value: "storage", label: "Ổ cứng / SSD" },
            { value: "gpu", label: "Card đồ họa" },
            { value: "motherboard", label: "Bo mạch chủ" },
            { value: "power_supply", label: "Nguồn máy tính" },
            { value: "cooling", label: "Tản nhiệt" }
        ]},
        
        // Thiết bị ngoại vi
        { value: "peripheral_component", label: "Linh kiện ngoại vi", category: "peripheral", subOptions: [
            { value: "keyboard", label: "Bàn phím" },
            { value: "mouse", label: "Chuột" },
            { value: "headphone", label: "Tai nghe" },
            { value: "webcam", label: "Webcam" },
            { value: "microphone", label: "Microphone" },
            { value: "speaker", label: "Loa" }
        ]},
        
        // Linh kiện mạng
        { value: "network_component", label: "Linh kiện mạng", category: "network", subOptions: [
            { value: "network_card", label: "Card mạng" },
            { value: "network_adapter", label: "Bộ chuyển đổi mạng" },
            { value: "network_module", label: "Module mạng" },
            { value: "antenna", label: "Ăng-ten" }
        ]},
        
        // Cáp và bộ chuyển đổi
        { value: "cable_adapter", label: "Cáp & Bộ chuyển đổi", category: "connectivity", subOptions: [
            { value: "cable", label: "Cáp" },
            { value: "adapter", label: "Bộ chuyển đổi" },
            { value: "hub", label: "Hub / Bộ chia" },
            { value: "dock", label: "Dock" }
        ]},
        
        // Linh kiện khác
        { value: "other_component", label: "Linh kiện khác", category: "other" }
    ];

    // Trạng thái linh kiện
    const componentStatuses = [
        { value: 'in_use', label: 'Đang sử dụng' },
        { value: 'available', label: 'Khả dụng' },
        { value: 'under_repair', label: 'Đang sửa chữa' },
        { value: 'disposed', label: 'Đã thanh lý' },
    ];

    // Cập nhật specs khi thay đổi loại thiết bị
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

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Kiểm tra quyền hạn
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            // Tải thông tin linh kiện
            fetchComponent();

            // Tải danh sách nhân viên và thiết bị
            fetchEmployees();
            fetchDevices();
        }
    }, [status, session, router, componentId]);

    const fetchComponent = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/components/${componentId}`);
            const component = response.data;

            // Format dates for input fields
            const purchaseDate = component.purchaseDate ? new Date(component.purchaseDate).toISOString().split('T')[0] : "";
            const warrantyExpiryDate = component.warrantyExpiryDate ? new Date(component.warrantyExpiryDate).toISOString().split('T')[0] : "";

            setFormData({
                name: component.name || "",
                type: component.type || "ram",
                subType: component.subType || "",
                category: component.category || "",
                serialNumber: component.serialNumber || "",
                manufacturer: component.manufacturer || "",
                model: component.model || "",
                purchaseDate,
                warrantyExpiryDate,
                status: component.status || "available",
                location: component.location || "",
                assignedTo: component.assignedTo?._id || "",
                installedIn: component.installedIn?._id || "",
                notes: component.notes || "",
                specs: component.specs || {}
            });

            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin linh kiện");
            console.error("Error fetching component:", err);
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
        }
    };

    const fetchDevices = async () => {
        try {
            const response = await axios.get("/api/devices");
            setDevices(response.data.devices || []);
        } catch (err) {
            console.error("Error fetching devices:", err);
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
            if (!formData.name || !formData.manufacturer || !formData.model || !formData.purchaseDate) {
                setError("Vui lòng điền đầy đủ thông tin bắt buộc");
                setSubmitting(false);
                return;
            }

            // Kiểm tra xem không thể vừa gán cho nhân viên, vừa lắp vào thiết bị
            if (formData.assignedTo && formData.installedIn) {
                setError("Không thể vừa gán cho nhân viên, vừa lắp vào thiết bị");
                setSubmitting(false);
                return;
            }

            // Gửi request cập nhật linh kiện
            await axios.put(`/api/components/${componentId}`, formData);

            // Redirect khi thành công
            router.push(`/components/${componentId}`);
        } catch (err: any) {
            setError(err.response?.data?.error || "Đã xảy ra lỗi khi cập nhật linh kiện");
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
                        <Link href="/components" className="text-primary-foreground hover:underline">
                            Linh kiện
                        </Link>
                        <span>/</span>
                        <Link href={`/components/${componentId}`} className="text-primary-foreground hover:underline">
                            Chi tiết
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Chỉnh sửa linh kiện</h1>
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
                    <h2 className="text-2xl font-bold mb-6">Chỉnh sửa linh kiện</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium">
                                    Tên linh kiện <span className="text-destructive">*</span>
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
                                    Loại linh kiện <span className="text-destructive">*</span>
                                </label>
                                <div className="flex flex-col space-y-3">
                                    {/* Chọn loại linh kiện chính */}
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={(e) => {
                                            const selectedType = e.target.value;
                                            
                                            // Tìm loại linh kiện được chọn để lấy category
                                            const selectedComponent = componentTypesHierarchy.find(comp => comp.value === selectedType);
                                            
                                            setFormData(prev => ({
                                                ...prev,
                                                type: selectedType,
                                                subType: "",
                                                category: selectedComponent?.category || ""
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    >
                                        <option value="">-- Chọn loại linh kiện --</option>
                                        {componentTypesHierarchy.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Chọn loại linh kiện con nếu có */}
                                    {formData.type && componentTypesHierarchy.find(type => type.value === formData.type)?.subOptions && (
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
                                            <option value="">-- Chọn loại linh kiện chi tiết --</option>
                                            {componentTypesHierarchy
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
                                    Số sê-ri
                                </label>
                                <input
                                    type="text"
                                    id="serialNumber"
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                                <p className="text-xs text-muted-foreground">Không bắt buộc nếu linh kiện không có số sê-ri</p>
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
                                    {componentStatuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
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
                                <p className="text-xs text-muted-foreground">Không thể chọn cả nhân viên và thiết bị cùng lúc</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="installedIn" className="block text-sm font-medium">
                                    Lắp vào thiết bị
                                </label>
                                <select
                                    id="installedIn"
                                    name="installedIn"
                                    value={formData.installedIn}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    <option value="">-- Chọn thiết bị --</option>
                                    {devices.map((device) => (
                                        <option key={device._id} value={device._id}>
                                            {device.name} - {device.serialNumber} ({device.type}{device.subType ? ` - ${device.subType}` : ''})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">Không thể chọn cả nhân viên và thiết bị cùng lúc</p>
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
                                href={`/components/${componentId}`}
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                            >
                                {submitting ? "Đang xử lý..." : "Cập nhật linh kiện"}
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