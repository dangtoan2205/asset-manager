"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Device {
    _id: string;
    name: string;
    type: string;
    serialNumber: string;
    model?: string;
    purchaseDate?: string;
    warrantyExpiration?: string;
    status: string;
    assignedTo?: any;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    maintenanceHistory?: {
        date: string;
        description: string;
        technician: string;
    }[];
    notes?: string;
}

export default function DeviceMaintenancePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [maintenanceModal, setMaintenanceModal] = useState(false);
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [maintenanceData, setMaintenanceData] = useState({
        description: "",
        technician: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [maintenanceFilter, setMaintenanceFilter] = useState<string>("all");

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
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
        }
    };

    const openMaintenanceModal = (device: Device) => {
        setCurrentDevice(device);
        setMaintenanceModal(true);
    };

    const closeMaintenanceModal = () => {
        setCurrentDevice(null);
        setMaintenanceModal(false);
        setMaintenanceData({
            description: "",
            technician: "",
        });
    };

    const handleMaintenanceDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMaintenanceData({
            ...maintenanceData,
            [name]: value,
        });
    };

    const recordMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentDevice) return;

        try {
            const response = await axios.post(`/api/devices/${currentDevice._id}/maintenance`, {
                description: maintenanceData.description,
                technician: maintenanceData.technician,
                date: new Date().toISOString(),
            });

            // Update the device in the local state
            setDevices(devices.map(device => 
                device._id === currentDevice._id ? response.data.device : device
            ));

            closeMaintenanceModal();
        } catch (error) {
            console.error("Error recording maintenance:", error);
        }
    };

    const calculateMaintenanceStatus = (device: Device) => {
        if (!device.nextMaintenanceDate) return "Không có lịch";
        
        const nextDate = new Date(device.nextMaintenanceDate);
        const today = new Date();
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return "Quá hạn";
        if (diffDays <= 30) return "Sắp đến hạn";
        return "Còn hạn";
    };

    const filteredDevices = devices.filter(device => {
        const matchesSearch = 
            device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.type.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter ? device.status === statusFilter : true;
        
        const maintenanceStatus = calculateMaintenanceStatus(device);
        const matchesMaintenance = 
            maintenanceFilter === "all" ||
            (maintenanceFilter === "due" && maintenanceStatus === "Sắp đến hạn") ||
            (maintenanceFilter === "overdue" && maintenanceStatus === "Quá hạn") ||
            (maintenanceFilter === "ok" && maintenanceStatus === "Còn hạn");
        
        return matchesSearch && matchesStatus && matchesMaintenance;
    });

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        }).format(date);
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
                <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/devices" className="text-primary-foreground hover:underline">
                            Thiết bị
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Bảo trì thiết bị</h1>
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
                    <h2 className="text-2xl font-bold">Quản lý bảo trì thiết bị</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                            href="/devices"
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                        >
                            Quay lại danh sách
                        </Link>
                    </div>
                </div>

                <div className="bg-card border rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-medium mb-4">Bộ lọc & Tìm kiếm</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
                            <input
                                type="text"
                                className="w-full border rounded-md p-2"
                                placeholder="Tên, Serial..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái thiết bị</label>
                            <select
                                className="w-full border rounded-md p-2 bg-background"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="available">Khả dụng</option>
                                <option value="in_use">Đang sử dụng</option>
                                <option value="under_repair">Đang sửa chữa</option>
                                <option value="disposed">Đã thanh lý</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái bảo trì</label>
                            <select
                                className="w-full border rounded-md p-2 bg-background"
                                value={maintenanceFilter}
                                onChange={(e) => setMaintenanceFilter(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="due">Sắp đến hạn</option>
                                <option value="overdue">Quá hạn</option>
                                <option value="ok">Còn hạn</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Tên thiết bị</th>
                                    <th className="px-4 py-3 text-left font-medium">Loại</th>
                                    <th className="px-4 py-3 text-left font-medium">Số serial</th>
                                    <th className="px-4 py-3 text-left font-medium">Bảo trì gần nhất</th>
                                    <th className="px-4 py-3 text-left font-medium">Bảo trì tiếp theo</th>
                                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                                    <th className="px-4 py-3 text-left font-medium">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredDevices.length > 0 ? (
                                    filteredDevices.map((device) => {
                                        const maintenanceStatus = calculateMaintenanceStatus(device);
                                        let statusClass = "";
                                        
                                        if (maintenanceStatus === "Quá hạn") {
                                            statusClass = "bg-red-100 text-red-800";
                                        } else if (maintenanceStatus === "Sắp đến hạn") {
                                            statusClass = "bg-yellow-100 text-yellow-800";
                                        } else if (maintenanceStatus === "Còn hạn") {
                                            statusClass = "bg-green-100 text-green-800";
                                        } else {
                                            statusClass = "bg-gray-100 text-gray-800";
                                        }

                                        return (
                                            <tr key={device._id} className="hover:bg-muted/30">
                                                <td className="px-4 py-3">{device.name}</td>
                                                <td className="px-4 py-3 capitalize">{device.type}</td>
                                                <td className="px-4 py-3">{device.serialNumber}</td>
                                                <td className="px-4 py-3">{formatDate(device.lastMaintenanceDate)}</td>
                                                <td className="px-4 py-3">{formatDate(device.nextMaintenanceDate)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
                                                        {maintenanceStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openMaintenanceModal(device)}
                                                            className="text-primary hover:underline text-sm"
                                                        >
                                                            Bảo trì
                                                        </button>
                                                        <Link
                                                            href={`/devices/${device._id}`}
                                                            className="text-primary hover:underline text-sm"
                                                        >
                                                            Xem chi tiết
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                                            Không tìm thấy thiết bị nào phù hợp với bộ lọc
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Maintenance Modal */}
            {maintenanceModal && currentDevice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Ghi nhận bảo trì</h3>
                            <button onClick={closeMaintenanceModal} className="text-muted-foreground hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={recordMaintenance} className="p-4">
                            <div className="mb-4">
                                <p className="font-medium mb-2">Thiết bị: {currentDevice.name}</p>
                                <p className="text-sm text-muted-foreground mb-4">Serial: {currentDevice.serialNumber}</p>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Mô tả công việc</label>
                                    <textarea
                                        name="description"
                                        className="w-full border rounded-md p-2 min-h-[100px]"
                                        placeholder="Mô tả chi tiết công việc bảo trì..."
                                        value={maintenanceData.description}
                                        onChange={handleMaintenanceDataChange}
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Kỹ thuật viên</label>
                                    <input
                                        type="text"
                                        name="technician"
                                        className="w-full border rounded-md p-2"
                                        placeholder="Tên kỹ thuật viên"
                                        value={maintenanceData.technician}
                                        onChange={handleMaintenanceDataChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeMaintenanceModal}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                                >
                                    Ghi nhận
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
