"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    status: string;
    assignedTo?: {
        _id: string;
        name: string;
        employeeId: string;
        email: string;
    };
}

export default function DevicesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchDevices();
        }
    }, [status, router]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/devices");
            setDevices(response.data.devices || []);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải danh sách thiết bị");
            console.error("Error fetching devices:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDevice = async (deviceId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) {
            try {
                setDeleting(true);
                await axios.delete(`/api/devices/${deviceId}`);
                fetchDevices();
            } catch (err: any) {
                setError(err.response?.data?.error || "Không thể xóa thiết bị");
                console.error("Error deleting device:", err);
            } finally {
                setDeleting(false);
            }
        }
    };

    const statusColors: Record<string, string> = {
        in_use: "bg-blue-100 text-blue-800",
        available: "bg-green-100 text-green-800",
        under_repair: "bg-yellow-100 text-yellow-800",
        disposed: "bg-red-100 text-red-800",
    };

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

    // Hàm để lấy tên hiển thị cho loại thiết bị theo cấu trúc phân loại mới
    const getDeviceTypeDisplayName = (device: Device) => {
        // Nếu có subType, ưu tiên hiển thị subType
        if (device.subType && deviceTypeLabels[device.subType]) {
            return deviceTypeLabels[device.subType];
        }
        
        // Nếu không có subType, hiển thị type
        if (deviceTypeLabels[device.type]) {
            return deviceTypeLabels[device.type];
        }
        
        // Trường hợp fallback, hiển thị type gốc
        return device.type;
    };

    const filteredDevices = devices.filter((device) => {
        // Lọc theo trạng thái
        if (statusFilter && device.status !== statusFilter) {
            return false;
        }

        // Tìm kiếm
        if (searchQuery) {
            const searchTerms = searchQuery.toLowerCase();
            return (
                device.name.toLowerCase().includes(searchTerms) ||
                device.serialNumber.toLowerCase().includes(searchTerms) ||
                device.manufacturer.toLowerCase().includes(searchTerms) ||
                device.model.toLowerCase().includes(searchTerms)
            );
        }

        return true;
    });

    const exportToExcel = () => {
        // Tạo dữ liệu cho file Excel
        const data = filteredDevices.map(device => ({
            'Tên thiết bị': device.name,
            'Loại': getDeviceTypeDisplayName(device),
            'Số sê-ri': device.serialNumber,
            'Nhà sản xuất': device.manufacturer,
            'Model': device.model,
            'Trạng thái': statusLabels[device.status] || device.status,
            'Người sử dụng': device.assignedTo ? device.assignedTo.name : ""
        }));

        // Tạo một workbook mới
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách thiết bị");

            // Tạo tên file với timestamp
            const fileName = `danh-sach-thiet-bi-${new Date().toISOString().slice(0, 10)}.xlsx`;

            // Xuất file Excel
            XLSX.writeFile(workbook, fileName);
        }).catch(err => {
            console.error("Không thể xuất Excel:", err);
            setError("Không thể xuất file Excel. Vui lòng thử lại sau!");
        });
    };

    if (loading && status !== "authenticated") {
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
                        <h1 className="text-xl font-bold">Quản lý Thiết bị</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/components" className="text-primary-foreground hover:underline">
                            Linh kiện
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold">Danh sách thiết bị</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="px-4 py-2 border rounded-md w-full sm:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select
                            className="px-4 py-2 border rounded-md bg-background"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="in_use">Đang sử dụng</option>
                            <option value="available">Khả dụng</option>
                            <option value="under_repair">Đang sửa chữa</option>
                            <option value="disposed">Đã thanh lý</option>
                        </select>

                        <Link
                            href="/devices/inactive"
                            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-center"
                        >
                            Thiết bị không hoạt động
                        </Link>

                        {filteredDevices.length > 0 && (
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-center"
                            >
                                Xuất Excel
                            </button>
                        )}

                        {session?.user?.role && ["admin", "manager"].includes(session.user.role) && (
                            <>
                                <Link
                                    href="/devices/reports"
                                    className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md hover:bg-indigo-200 text-center"
                                >
                                    Báo cáo & Phân tích
                                </Link>
                                <Link
                                    href="/devices/create"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                                >
                                    Thêm thiết bị
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10">
                        <p>Đang tải danh sách thiết bị...</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-10 bg-card border rounded-md">
                        <p className="text-muted-foreground">
                            {devices.length === 0
                                ? "Chưa có thiết bị nào trong hệ thống"
                                : "Không tìm thấy thiết bị nào phù hợp với bộ lọc"}
                        </p>
                        {session?.user?.role && ["admin", "manager"].includes(session.user.role) && devices.length === 0 && (
                            <Link
                                href="/devices/create"
                                className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Thêm thiết bị mới
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="px-4 py-2 text-left border-b">Tên thiết bị</th>
                                    <th className="px-4 py-2 text-left border-b">Loại</th>
                                    <th className="px-4 py-2 text-left border-b">Số sê-ri</th>
                                    <th className="px-4 py-2 text-left border-b">Nhà sản xuất</th>
                                    <th className="px-4 py-2 text-left border-b">Model</th>
                                    <th className="px-4 py-2 text-left border-b">Trạng thái</th>
                                    <th className="px-4 py-2 text-left border-b">Người sử dụng</th>
                                    <th className="px-4 py-2 text-center border-b">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevices.map((device) => (
                                    <tr key={device._id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 border-b">{device.name}</td>
                                        <td className="px-4 py-3 border-b">
                                            {getDeviceTypeDisplayName(device)}
                                        </td>
                                        <td className="px-4 py-3 border-b font-mono text-sm">
                                            {device.serialNumber}
                                        </td>
                                        <td className="px-4 py-3 border-b">{device.manufacturer}</td>
                                        <td className="px-4 py-3 border-b">{device.model}</td>
                                        <td className="px-4 py-3 border-b">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[device.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {statusLabels[device.status] || device.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-b">
                                            {device.assignedTo ? device.assignedTo.name : "-"}
                                        </td>
                                        <td className="px-4 py-3 border-b text-center">
                                            <div className="flex justify-center space-x-2">
                                                <Link
                                                    href={`/devices/${device._id}`}
                                                    className="px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 text-sm"
                                                >
                                                    Chi tiết
                                                </Link>
                                                {session?.user?.role && ["admin", "manager"].includes(session.user.role) && (
                                                    <>
                                                        <Link
                                                            href={`/devices/${device._id}/edit`}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                                        >
                                                            Sửa
                                                        </Link>
                                                        {session.user.role === "admin" && (
                                                            <button
                                                                className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                                                                onClick={() => handleDeleteDevice(device._id)}
                                                                disabled={deleting}
                                                            >
                                                                {deleting ? "Đang xóa..." : "Xóa"}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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