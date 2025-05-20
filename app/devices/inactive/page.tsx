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

export default function InactiveDevicesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all_inactive");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchInactiveDevices();
        }
    }, [status, router]);

    const fetchInactiveDevices = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/devices");

            // Lọc các thiết bị không hoạt động (đang sửa chữa hoặc đã thanh lý)
            const inactiveDevices = response.data.devices.filter((device: Device) =>
                device.status === "under_repair" || device.status === "disposed"
            );

            setDevices(inactiveDevices || []);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải danh sách thiết bị không hoạt động");
            console.error("Error fetching inactive devices:", err);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xóa thiết bị
    const handleDeleteDevice = async (deviceId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) {
            try {
                setDeleting(true);
                // Gọi API xóa thiết bị
                await axios.delete(`/api/devices/${deviceId}`);

                // Tải lại danh sách thiết bị sau khi xóa
                fetchInactiveDevices();
            } catch (err: any) {
                setError(err.response?.data?.error || "Không thể xóa thiết bị");
                console.error("Error deleting device:", err);
            } finally {
                setDeleting(false);
            }
        }
    };

    // Hàm xuất Excel danh sách thiết bị không hoạt động
    const exportToExcel = () => {
        // Tạo dữ liệu cho file Excel
        const data = filteredDevices.map(device => ({
            'Tên thiết bị': device.name,
            'Loại': deviceTypeLabels[device.type] || device.type,
            'Số sê-ri': device.serialNumber,
            'Nhà sản xuất': device.manufacturer,
            'Model': device.model,
            'Trạng thái': statusLabels[device.status] || device.status,
            'Người sử dụng cuối': device.assignedTo ? device.assignedTo.name : ""
        }));

        // Tạo một workbook mới
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Thiết bị không hoạt động");

            // Tạo tên file với timestamp
            const fileName = `thiet-bi-khong-hoat-dong-${new Date().toISOString().slice(0, 10)}.xlsx`;

            // Xuất file Excel
            XLSX.writeFile(workbook, fileName);
        }).catch(err => {
            console.error("Không thể xuất Excel:", err);
            setError("Không thể xuất file Excel. Vui lòng thử lại sau!");
        });
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

    const filteredDevices = devices.filter((device) => {
        // Lọc theo trạng thái cụ thể
        if (statusFilter === "under_repair" && device.status !== "under_repair") {
            return false;
        } else if (statusFilter === "disposed" && device.status !== "disposed") {
            return false;
        }
        // Nếu chọn tất cả thiết bị không hoạt động thì hiển thị cả hai loại

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
                        <Link href="/devices" className="text-primary-foreground hover:underline">
                            Thiết bị
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Thiết bị không hoạt động</h1>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold">Danh sách thiết bị không hoạt động</h2>

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
                            <option value="all_inactive">Tất cả thiết bị không hoạt động</option>
                            <option value="under_repair">Đang sửa chữa</option>
                            <option value="disposed">Đã thanh lý</option>
                        </select>

                        <Link
                            href="/devices"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                        >
                            Tất cả thiết bị
                        </Link>

                        {filteredDevices.length > 0 && (
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-center"
                            >
                                Xuất Excel
                            </button>
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
                        <p>Đang tải danh sách thiết bị không hoạt động...</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-10 bg-card border rounded-md">
                        <p className="text-muted-foreground">
                            {devices.length === 0
                                ? "Không có thiết bị nào không hoạt động trong hệ thống"
                                : "Không tìm thấy thiết bị nào phù hợp với bộ lọc"}
                        </p>
                        <Link
                            href="/devices"
                            className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Xem tất cả thiết bị
                        </Link>
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
                                    <th className="px-4 py-2 text-left border-b">Người sử dụng cuối</th>
                                    <th className="px-4 py-2 text-center border-b">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevices.map((device) => (
                                    <tr key={device._id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 border-b">{device.name}</td>
                                        <td className="px-4 py-3 border-b">
                                            {deviceTypeLabels[device.type] || device.type}
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

                {/* Hiển thị tóm tắt số thiết bị không hoạt động nếu có */}
                {filteredDevices.length > 0 && (
                    <div className="mt-4 bg-card p-4 rounded-md border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Tóm tắt</h3>
                                <p>Tổng số thiết bị không hoạt động: <span className="font-bold">{devices.length}</span></p>
                                <p>Đang sửa chữa: <span className="font-bold">{devices.filter(d => d.status === "under_repair").length}</span></p>
                                <p>Đã thanh lý: <span className="font-bold">{devices.filter(d => d.status === "disposed").length}</span></p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-2">Lọc hiện tại</h3>
                                <p>Hiển thị: <span className="font-bold">{filteredDevices.length}</span> thiết bị</p>
                                <p>Trạng thái: <span className="font-bold">
                                    {statusFilter === "all_inactive"
                                        ? "Tất cả thiết bị không hoạt động"
                                        : statusFilter === "under_repair"
                                            ? "Đang sửa chữa"
                                            : "Đã thanh lý"}
                                </span></p>
                                {searchQuery && <p>Tìm kiếm: <span className="font-bold">{searchQuery}</span></p>}
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