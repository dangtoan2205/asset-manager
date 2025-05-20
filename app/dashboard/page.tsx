"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// Add icons for different card types
import {
    FiMonitor,
    FiCpu,
    FiUsers,
    FiAlertCircle,
    FiClipboard,
    FiLogOut,
    FiKey
} from "react-icons/fi";

interface DeviceStats {
    totalDevices: number;
    availableDevices: number;
    inUseDevices: number;
    underRepairDevices: number;
    disposedDevices: number;
}

interface ComponentStats {
    totalComponents: number;
    availableComponents: number;
    inUseComponents: number;
    underRepairComponents: number;
    disposedComponents: number;
}

interface EmployeeStats {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
}

interface AccountStats {
    totalAccounts: number;
    statusStats: {
        active: number;
        inactive: number;
        expired: number;
    };
    typeStats: {
        vpn: number;
        github: number;
        bitbucket: number;
        jira: number;
        confluence: number;
        cloud: number;
        other: number;
    };
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
    const [componentStats, setComponentStats] = useState<ComponentStats | null>(null);
    const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
    const [accountStats, setAccountStats] = useState<AccountStats | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            Promise.all([
                fetchDeviceStats(),
                fetchComponentStats(),
                fetchEmployeeStats(),
                fetchAccountStats()
            ]).finally(() => setLoading(false));
        }
    }, [status, router]);

    const fetchDeviceStats = async () => {
        try {
            const response = await axios.get("/api/devices/stats");
            setDeviceStats({
                totalDevices: response.data.total || 0,
                availableDevices: response.data.byStatus?.available || 0,
                inUseDevices: response.data.byStatus?.in_use || 0,
                underRepairDevices: response.data.byStatus?.under_repair || 0,
                disposedDevices: response.data.byStatus?.disposed || 0
            });
        } catch (error) {
            console.error("Error fetching device stats:", error);
        }
    };

    const fetchComponentStats = async () => {
        try {
            const response = await axios.get("/api/components/stats");
            setComponentStats({
                totalComponents: response.data.total || 0,
                availableComponents: response.data.byStatus?.available || 0,
                inUseComponents: response.data.byStatus?.in_use || 0,
                underRepairComponents: response.data.byStatus?.under_repair || 0,
                disposedComponents: response.data.byStatus?.disposed || 0
            });
        } catch (error) {
            console.error("Error fetching component stats:", error);
        }
    };

    const fetchEmployeeStats = async () => {
        try {
            const response = await axios.get("/api/employees/stats");
            setEmployeeStats({
                totalEmployees: response.data.total || 0,
                activeEmployees: response.data.active || 0,
                inactiveEmployees: response.data.inactive || 0
            });
        } catch (error) {
            console.error("Error fetching employee stats:", error);
        }
    };

    const fetchAccountStats = async () => {
        try {
            const response = await axios.get("/api/accounts/stats");
            setAccountStats(response.data);
        } catch (error) {
            console.error("Error fetching account stats:", error);
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
                    <h1 className="text-xl font-bold">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {session?.user?.name && (
                            <span>
                                Xin chào, {session.user.name} 
                                {session?.user?.role && (
                                    <span className="ml-2 px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                                        Vai trò: {session.user.role}
                                    </span>
                                )}
                            </span>
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
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">Tổng quan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Device stats card */}
                        <Link
                            href="/devices"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Thiết bị</h3>
                                <FiMonitor className="text-primary text-2xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tổng số:</span>
                                    <span className="font-medium">{deviceStats?.totalDevices || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Khả dụng:</span>
                                    <span className="font-medium">{deviceStats?.availableDevices || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Đang sử dụng:</span>
                                    <span className="font-medium">{deviceStats?.inUseDevices || 0}</span>
                                </div>
                            </div>
                        </Link>

                        {/* Component stats card */}
                        <Link
                            href="/components"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Linh kiện</h3>
                                <FiCpu className="text-primary text-2xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tổng số:</span>
                                    <span className="font-medium">{componentStats?.totalComponents || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Khả dụng:</span>
                                    <span className="font-medium">{componentStats?.availableComponents || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Đang sử dụng:</span>
                                    <span className="font-medium">{componentStats?.inUseComponents || 0}</span>
                                </div>
                            </div>
                        </Link>

                        {/* Employee stats card */}
                        <Link
                            href="/employees"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Nhân viên</h3>
                                <FiUsers className="text-primary text-2xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tổng số:</span>
                                    <span className="font-medium">{employeeStats?.totalEmployees || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Đang làm việc:</span>
                                    <span className="font-medium">{employeeStats?.activeEmployees || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Đã nghỉ việc:</span>
                                    <span className="font-medium">{employeeStats?.inactiveEmployees || 0}</span>
                                </div>
                            </div>
                        </Link>

                        {/* Accounts card */}
                        <Link
                            href="/accounts"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Tài khoản hệ thống</h3>
                                <FiKey className="text-primary text-2xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tổng số:</span>
                                    <span className="font-medium">{accountStats?.totalAccounts || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Hoạt động:</span>
                                    <span className="font-medium">{accountStats?.statusStats?.active || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cloud:</span>
                                    <span className="font-medium">{accountStats?.typeStats?.cloud || 0}</span>
                                </div>
                            </div>
                        </Link>

                        {/* Invoices card */}
                        <Link
                            href="/invoices"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Hóa đơn mua hàng</h3>
                                <FiClipboard className="text-primary text-2xl" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-muted-foreground">Quản lý và xử lý hóa đơn mua thiết bị, linh kiện từ nhà cung cấp.</p>
                                <p className="text-sm text-primary font-medium">Xem danh sách hóa đơn →</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">Quản lý</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link
                            href="/devices/create"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiMonitor className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Thêm thiết bị mới</h3>
                                <p className="text-sm text-muted-foreground">Tạo mới thiết bị trong hệ thống</p>
                            </div>
                        </Link>

                        <Link
                            href="/components/create"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiCpu className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Thêm linh kiện mới</h3>
                                <p className="text-sm text-muted-foreground">Tạo mới linh kiện trong hệ thống</p>
                            </div>
                        </Link>

                        <Link
                            href="/employees/create"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiUsers className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Thêm nhân viên mới</h3>
                                <p className="text-sm text-muted-foreground">Tạo mới nhân viên trong hệ thống</p>
                            </div>
                        </Link>

                        <Link
                            href="/accounts/create"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiKey className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Thêm tài khoản mới</h3>
                                <p className="text-sm text-muted-foreground">Tạo mới tài khoản VPN, GitHub, Cloud...</p>
                            </div>
                        </Link>

                        <Link
                            href="/invoices/create"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiClipboard className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Tạo hóa đơn mua hàng</h3>
                                <p className="text-sm text-muted-foreground">Nhập thông tin hóa đơn mua thiết bị/linh kiện</p>
                            </div>
                        </Link>

                        <Link
                            href="/invoices/import"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiClipboard className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Import hóa đơn từ file</h3>
                                <p className="text-sm text-muted-foreground">Nhập hóa đơn từ file Excel đã có sẵn</p>
                            </div>
                        </Link>

                        {/* Maintenance link */}
                        <Link
                            href="/devices/maintenance"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiAlertCircle className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Bảo trì thiết bị</h3>
                                <p className="text-sm text-muted-foreground">Quản lý thiết bị cần bảo trì, sửa chữa</p>
                            </div>
                        </Link>

                        {/* Logout button */}
                        <Link
                            href="/api/auth/signout"
                            className="bg-card hover:bg-muted/50 transition-colors border rounded-lg p-6 shadow-sm flex items-center"
                        >
                            <div className="mr-4 bg-primary/10 p-3 rounded-full">
                                <FiLogOut className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Đăng xuất</h3>
                                <p className="text-sm text-muted-foreground">Thoát khỏi hệ thống</p>
                            </div>
                        </Link>
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