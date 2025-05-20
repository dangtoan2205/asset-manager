"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Component {
    _id: string;
    name: string;
    type: string;
    subType?: string;
    category?: string;
    serialNumber?: string;
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
    installedIn?: {
        _id: string;
        name: string;
        serialNumber: string;
        type: string;
        model: string;
    };
    specs?: Record<string, string>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export default function ComponentDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const componentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [component, setComponent] = useState<Component | null>(null);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Loại linh kiện
    const componentTypes: Record<string, string> = {
        ram: 'RAM',
        storage: 'Ổ cứng / SSD',
        cpu: 'CPU',
        gpu: 'Card đồ họa',
        motherboard: 'Bo mạch chủ',
        power_supply: 'Nguồn',
        cooling: 'Tản nhiệt',
        peripheral: 'Thiết bị ngoại vi',
        cable: 'Cáp / Adapter',
        network: 'Thiết bị mạng',
        other: 'Khác',
    };

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

    // Hàm helper để lấy nhãn hiển thị cho loại linh kiện
    const getComponentTypeLabel = (type: string, subType?: string) => {
        if (!type) return "-";
        
        const mainType = componentTypesHierarchy.find(t => t.value === type);
        if (!mainType) return componentTypes[type] || type;
        
        // Nếu có subType, tìm nhãn tương ứng
        if (subType) {
            const subTypeOption = mainType.subOptions?.find(sub => sub.value === subType);
            if (subTypeOption) {
                return `${mainType.label} - ${subTypeOption.label}`;
            }
        }
        
        return mainType.label;
    };

    // Trạng thái linh kiện
    const statusLabels: Record<string, string> = {
        in_use: "Đang sử dụng",
        available: "Khả dụng",
        under_repair: "Đang sửa chữa",
        disposed: "Đã thanh lý",
    };

    const statusColors: Record<string, string> = {
        in_use: "bg-blue-100 text-blue-800",
        available: "bg-green-100 text-green-800",
        under_repair: "bg-yellow-100 text-yellow-800",
        disposed: "bg-red-100 text-red-800",
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchComponent();
        }
    }, [status, router, componentId]);

    const fetchComponent = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/components/${componentId}`);
            setComponent(response.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin linh kiện");
            console.error("Error fetching component:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa linh kiện này?")) {
            return;
        }

        try {
            setDeleting(true);
            await axios.delete(`/api/components/${componentId}`);
            router.push("/components");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể xóa linh kiện");
            console.error("Error deleting component:", err);
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Đang tải...</p>
            </div>
        );
    }

    if (!component) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy linh kiện</h1>
                    <p className="mb-4">{error || "Linh kiện không tồn tại hoặc đã bị xóa"}</p>
                    <Link href="/components" className="text-primary hover:underline">
                        Quay lại danh sách linh kiện
                    </Link>
                </div>
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
                        <h1 className="text-xl font-bold">{component.name}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/devices" className="text-primary-foreground hover:underline">
                            Thiết bị
                        </Link>
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
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                        {error}
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        Chi tiết linh kiện: {component.name}
                    </h2>
                    <div className="flex gap-2">
                        <Link
                            href="/components"
                            className="px-4 py-2 border rounded-md hover:bg-muted"
                        >
                            Quay lại
                        </Link>
                        {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
                            <Link
                                href={`/components/${componentId}/edit`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Chỉnh sửa
                            </Link>
                        )}
                        {session?.user?.role === 'admin' && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-card rounded-lg border p-6">
                            <h3 className="text-xl font-semibold mb-4">Thông tin cơ bản</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Tên linh kiện</p>
                                    <p className="font-medium">{component.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Loại</p>
                                    <p className="font-medium">{getComponentTypeLabel(component.type, component.subType)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Nhà sản xuất</p>
                                    <p className="font-medium">{component.manufacturer}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Model</p>
                                    <p className="font-medium">{component.model}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Số sê-ri</p>
                                    <p className="font-medium font-mono">{component.serialNumber || "Không có"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                                    <p className="font-medium">
                                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[component.status] || "bg-gray-100"}`}>
                                            {statusLabels[component.status] || component.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Ngày mua</p>
                                    <p className="font-medium">
                                        {component.purchaseDate ? new Date(component.purchaseDate).toLocaleDateString('vi-VN') : "Không có"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Hết hạn bảo hành</p>
                                    <p className="font-medium">
                                        {component.warrantyExpiryDate ? new Date(component.warrantyExpiryDate).toLocaleDateString('vi-VN') : "Không có"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Vị trí</p>
                                    <p className="font-medium">{component.location || "Không có"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
                                    <p className="font-medium">
                                        {component.createdAt ? new Date(component.createdAt).toLocaleDateString('vi-VN') : "Không có"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {Object.keys(component.specs || {}).length > 0 && (
                            <div className="bg-card rounded-lg border p-6">
                                <h3 className="text-xl font-semibold mb-4">Thông số kỹ thuật</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(component.specs || {}).map(([key, value]) => (
                                        <div key={key}>
                                            <p className="text-sm text-muted-foreground mb-1">{key}</p>
                                            <p className="font-medium">{value || "Không có"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {component.notes && (
                            <div className="bg-card rounded-lg border p-6">
                                <h3 className="text-xl font-semibold mb-4">Ghi chú</h3>
                                <p className="whitespace-pre-line">{component.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card rounded-lg border p-6">
                            <h3 className="text-xl font-semibold mb-4">Phân công / Lắp đặt</h3>

                            {component.assignedTo ? (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Nhân viên được gán</p>
                                    <Link
                                        href={`/employees/${component.assignedTo._id}`}
                                        className="font-medium block hover:underline"
                                    >
                                        {component.assignedTo.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-2">ID nhân viên</p>
                                    <p className="font-medium">{component.assignedTo.employeeId}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Phòng ban</p>
                                    <p className="font-medium">{component.assignedTo.department}</p>
                                </div>
                            ) : component.installedIn ? (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Lắp vào thiết bị</p>
                                    <Link
                                        href={`/devices/${component.installedIn._id}`}
                                        className="font-medium block hover:underline"
                                    >
                                        {component.installedIn.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-2">Số sê-ri thiết bị</p>
                                    <p className="font-medium font-mono">{component.installedIn.serialNumber}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Loại thiết bị</p>
                                    <p className="font-medium">{component.installedIn.type}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Model thiết bị</p>
                                    <p className="font-medium">{component.installedIn.model}</p>
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    <p>Linh kiện chưa được gán cho nhân viên hoặc lắp vào thiết bị nào</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-card rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-2">Thời gian</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày tạo</p>
                                    <p className="font-medium">
                                        {component.createdAt ? new Date(component.createdAt).toLocaleString('vi-VN') : "Không có"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                                    <p className="font-medium">
                                        {component.updatedAt ? new Date(component.updatedAt).toLocaleString('vi-VN') : "Không có"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
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