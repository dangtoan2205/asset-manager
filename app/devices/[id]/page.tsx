"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

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
    createdAt: string;
    updatedAt: string;
}

export default function DeviceDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const deviceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [device, setDevice] = useState<Device | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchDevice();
        }
    }, [status, router, deviceId]);

    const fetchDevice = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/devices/${deviceId}`);
            setDevice(response.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin thiết bị");
            console.error("Error fetching device:", err);
        } finally {
            setLoading(false);
        }
    };

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

    // Hàm helper để lấy nhãn hiển thị cho loại thiết bị
    const getDeviceTypeLabel = (type: string, subType?: string) => {
        if (!type) return "-";
        
        const mainType = deviceTypes.find(t => t.value === type);
        if (!mainType) return type;
        
        // Nếu có subType, tìm nhãn tương ứng
        if (subType) {
            const subTypeOption = mainType.subOptions?.find(sub => sub.value === subType);
            if (subTypeOption) {
                return `${mainType.label} - ${subTypeOption.label}`;
            }
        }
        
        return mainType.label;
    };

    // Định dạng các nhãn
    const statusLabels: Record<string, string> = {
        in_use: "Đang sử dụng",
        available: "Khả dụng",
        under_repair: "Đang sửa chữa",
        disposed: "Đã thanh lý",
    };

    const deviceTypeLabels: Record<string, string> = {
        computer: "Máy tính",
        laptop: "Laptop",
        macbook_pro: "MacBook Pro",
        macbook_air: "MacBook Air",
        mac_mini: "Mac Mini",
        printer: "Máy in",
        monitor: "Màn hình",
        monitor_24: "Màn hình 24 inch",
        monitor_27: "Màn hình 27 inch",
        monitor_32: "Màn hình 32 inch",
        headphone: "Tai nghe",
        camera: "Camera",
        server: "Máy chủ",
        network: "Thiết bị mạng",
        mouse: "Chuột",
        keyboard: "Bàn phím",
        peripheral: "Thiết bị ngoại vi khác",
        other: "Khác",
    };

    const statusColors: Record<string, string> = {
        in_use: "bg-blue-100 text-blue-800",
        available: "bg-green-100 text-green-800",
        under_repair: "bg-yellow-100 text-yellow-800",
        disposed: "bg-red-100 text-red-800",
    };

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("vi-VN");
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
                        <h1 className="text-xl font-bold">Chi tiết thiết bị</h1>
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
                {error ? (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                        {error}
                    </div>
                ) : !device ? (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">Không tìm thấy thiết bị</p>
                        <Link
                            href="/devices"
                            className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Quay lại danh sách
                        </Link>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">{device.name}</h2>
                                <p className="text-muted-foreground">
                                    {getDeviceTypeLabel(device.type, device.subType)} &middot; {device.manufacturer} &middot; {device.model}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    href="/devices"
                                    className="px-3 py-1.5 border rounded-md hover:bg-muted text-sm"
                                >
                                    Quay lại
                                </Link>

                                {session?.user?.role && ["admin", "manager"].includes(session.user.role) && (
                                    <Link
                                        href={`/devices/${deviceId}/edit`}
                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                                    >
                                        Chỉnh sửa
                                    </Link>
                                )}

                                {session?.user?.role === "admin" && (
                                    <button
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                                        onClick={() => {
                                            if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) {
                                                // Xử lý xóa thiết bị
                                            }
                                        }}
                                    >
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Loại thiết bị</h3>
                                        <p className="font-medium">{getDeviceTypeLabel(device.type, device.subType)}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Danh mục</h3>
                                        <p className="font-medium">
                                            {device.category ? (
                                                <span className="capitalize">{device.category}</span>
                                            ) : (
                                                "-"
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Số sê-ri</h3>
                                        <p className="font-medium font-mono">{device.serialNumber}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Trạng thái</h3>
                                        <p>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[device.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {statusLabels[device.status] || device.status}
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Ngày mua</h3>
                                        <p className="font-medium">{formatDate(device.purchaseDate)}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Ngày hết hạn bảo hành</h3>
                                        <p className="font-medium">{formatDate(device.warrantyExpiryDate)}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Người sử dụng</h3>
                                        <p className="font-medium">
                                            {device.assignedTo ? (
                                                <span>
                                                    {device.assignedTo.name} ({device.assignedTo.employeeId})
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Vị trí</h3>
                                        <p className="font-medium">{device.location || "-"}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Ngày tạo</h3>
                                        <p className="font-medium">{formatDate(device.createdAt)}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-muted-foreground">Cập nhật lần cuối</h3>
                                        <p className="font-medium">{formatDate(device.updatedAt)}</p>
                                    </div>
                                </div>

                                {device.specs && Object.keys(device.specs).length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="font-semibold text-lg mb-3">Thông số kỹ thuật</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                            {Object.entries(device.specs).map(([key, value]) => (
                                                <div key={key}>
                                                    <h3 className="text-sm text-muted-foreground">{key}</h3>
                                                    <p className="font-medium">{value || "-"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {device.notes && (
                                    <div className="mt-8">
                                        <h3 className="font-semibold text-lg mb-3">Ghi chú</h3>
                                        <div className="p-4 bg-muted/30 rounded-md">
                                            <p className="whitespace-pre-wrap">{device.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="bg-muted py-4">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    );
}