"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface DeviceStats {
    total: number;
    byStatus: {
        available: number;
        in_use: number;
        under_repair: number;
        disposed: number;
        [key: string]: number;
    };
    byType: {
        computer: number;
        laptop: number;
        printer: number;
        monitor: number;
        camera: number;
        headphone: number;
        server: number;
        network: number;
        peripheral: number;
        other: number;
        [key: string]: number;
    };
    assigned: number;
    inactive: number;
}

interface DeviceAnalysis {
    byDepartment: Array<{
        department: string;
        count: number;
    }>;
    byAge: Array<{
        _id: string;
        count: number;
    }>;
    byWarranty: Array<{
        _id: string;
        count: number;
    }>;
    utilization: {
        total: number;
        inUse: number;
        utilizationRate: number;
    };
}

export default function DeviceReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DeviceStats | null>(null);
    const [analysis, setAnalysis] = useState<DeviceAnalysis | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }
            fetchReportData();
        }
    }, [status, router, session]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            // Fetch both stats and analysis in parallel
            const [statsRes, analysisRes] = await Promise.all([
                axios.get("/api/devices/stats"),
                axios.get("/api/devices/analysis")
            ]);

            setStats(statsRes.data);
            setAnalysis(analysisRes.data);
            setError("");
        } catch (err: any) {
            console.error("Error fetching report data:", err);
            setError(err.response?.data?.error || "Không thể tải dữ liệu báo cáo");
        } finally {
            setLoading(false);
        }
    };

    // Hàm xuất Excel báo cáo
    const exportReportToExcel = () => {
        if (!stats || !analysis) return;

        // Chuẩn bị dữ liệu báo cáo
        const statusData = [
            { 'Trạng thái': 'Khả dụng', 'Số lượng': stats.byStatus.available || 0 },
            { 'Trạng thái': 'Đang sử dụng', 'Số lượng': stats.byStatus.in_use || 0 },
            { 'Trạng thái': 'Đang sửa chữa', 'Số lượng': stats.byStatus.under_repair || 0 },
            { 'Trạng thái': 'Đã thanh lý', 'Số lượng': stats.byStatus.disposed || 0 }
        ];

        const typeData = [
            { 'Loại thiết bị': 'Máy tính', 'Số lượng': stats.byType.computer || 0 },
            { 'Loại thiết bị': 'Laptop', 'Số lượng': stats.byType.laptop || 0 },
            { 'Loại thiết bị': 'Máy in', 'Số lượng': stats.byType.printer || 0 },
            { 'Loại thiết bị': 'Màn hình', 'Số lượng': stats.byType.monitor || 0 },
            { 'Loại thiết bị': 'Camera', 'Số lượng': stats.byType.camera || 0 },
            { 'Loại thiết bị': 'Tai nghe', 'Số lượng': stats.byType.headphone || 0 },
            { 'Loại thiết bị': 'Máy chủ', 'Số lượng': stats.byType.server || 0 },
            { 'Loại thiết bị': 'Thiết bị mạng', 'Số lượng': stats.byType.network || 0 },
            { 'Loại thiết bị': 'Thiết bị ngoại vi', 'Số lượng': stats.byType.peripheral || 0 },
            { 'Loại thiết bị': 'Khác', 'Số lượng': stats.byType.other || 0 }
        ];

        const departmentData = analysis.byDepartment.map(item => ({
            'Phòng ban': item.department,
            'Số lượng thiết bị': item.count
        }));

        const ageLabels: Record<string, string> = {
            'under_6_months': 'Dưới 6 tháng',
            'under_1_year': '6 tháng - 1 năm',
            'under_2_years': '1 - 2 năm',
            'under_3_years': '2 - 3 năm',
            'over_3_years': 'Trên 3 năm'
        };

        const ageData = analysis.byAge.map(item => ({
            'Tuổi thiết bị': ageLabels[item._id] || item._id,
            'Số lượng': item.count
        }));

        const warrantyLabels: Record<string, string> = {
            'expired': 'Đã hết hạn',
            'expiring_soon': 'Sắp hết hạn (30 ngày)',
            'valid': 'Còn hiệu lực'
        };

        const warrantyData = analysis.byWarranty.map(item => ({
            'Bảo hành': warrantyLabels[item._id] || item._id,
            'Số lượng': item.count
        }));

        // Tạo workbook Excel
        import('xlsx').then(XLSX => {
            const wb = XLSX.utils.book_new();

            // Thêm các sheet cho từng loại dữ liệu
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusData), "Theo trạng thái");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeData), "Theo loại");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(departmentData), "Theo phòng ban");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ageData), "Theo tuổi");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warrantyData), "Bảo hành");

            // Lưu file
            const fileName = `bao-cao-thiet-bi-${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        }).catch(err => {
            console.error("Không thể xuất Excel:", err);
            setError("Không thể xuất file Excel. Vui lòng thử lại sau!");
        });
    };

    const deviceAgeLabels: Record<string, string> = {
        'under_6_months': 'Dưới 6 tháng',
        'under_1_year': '6 tháng - 1 năm',
        'under_2_years': '1 - 2 năm',
        'under_3_years': '2 - 3 năm',
        'over_3_years': 'Trên 3 năm'
    };

    const warrantyLabels: Record<string, string> = {
        'expired': 'Đã hết hạn',
        'expiring_soon': 'Sắp hết hạn (30 ngày)',
        'valid': 'Còn hiệu lực'
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
                        <Link href="/devices" className="text-primary-foreground hover:underline">
                            Thiết bị
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Báo cáo & Phân tích</h1>
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
                    <h2 className="text-2xl font-bold">Báo cáo & Phân tích thiết bị</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={fetchReportData}
                            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-center"
                        >
                            Làm mới dữ liệu
                        </button>

                        {(stats && analysis) && (
                            <button
                                onClick={exportReportToExcel}
                                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-center"
                            >
                                Xuất báo cáo Excel
                            </button>
                        )}

                        <Link
                            href="/devices"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                        >
                            Danh sách thiết bị
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10">
                        <p>Đang tải dữ liệu báo cáo...</p>
                    </div>
                ) : (
                    <>
                        {/* Tổng quan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="p-6 rounded-lg border bg-blue-100 text-blue-800 shadow-sm">
                                <h3 className="text-lg font-medium mb-2">Tổng thiết bị</h3>
                                <p className="text-3xl font-bold">{stats?.total || 0}</p>
                            </div>
                            <div className="p-6 rounded-lg border bg-indigo-100 text-indigo-800 shadow-sm">
                                <h3 className="text-lg font-medium mb-2">Tỷ lệ sử dụng</h3>
                                <p className="text-3xl font-bold">{analysis?.utilization?.utilizationRate.toFixed(1) || 0}%</p>
                            </div>
                            <div className="p-6 rounded-lg border bg-yellow-100 text-yellow-800 shadow-sm">
                                <h3 className="text-lg font-medium mb-2">Đang sửa chữa</h3>
                                <p className="text-3xl font-bold">{stats?.byStatus?.under_repair || 0}</p>
                            </div>
                            <div className="p-6 rounded-lg border bg-red-100 text-red-800 shadow-sm">
                                <h3 className="text-lg font-medium mb-2">Hết hạn bảo hành</h3>
                                <p className="text-3xl font-bold">
                                    {analysis?.byWarranty.find(w => w._id === 'expired')?.count || 0}
                                </p>
                            </div>
                        </div>

                        {/* Phân tích thiết bị theo phòng ban */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-4">Phân bổ thiết bị theo phòng ban</h3>
                            <div className="bg-card border rounded-lg p-6">
                                {analysis?.byDepartment.length === 0 ? (
                                    <p className="text-muted-foreground">Không có dữ liệu</p>
                                ) : (
                                    <div className="space-y-4">
                                        {analysis?.byDepartment.map((item, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span>{item.department}</span>
                                                    <span className="font-medium">{item.count}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2.5">
                                                    <div
                                                        className="bg-primary h-2.5 rounded-full"
                                                        style={{ width: `${(item.count / (stats?.total || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Phân tích tuổi thiết bị */}
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4">Phân tích tuổi thiết bị</h3>
                                {analysis?.byAge.length === 0 ? (
                                    <p className="text-muted-foreground">Không có dữ liệu</p>
                                ) : (
                                    <div className="space-y-4">
                                        {analysis?.byAge.map((item, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span>{deviceAgeLabels[item._id] || item._id}</span>
                                                    <span className="font-medium">{item.count}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2.5">
                                                    <div
                                                        className="bg-violet-500 h-2.5 rounded-full"
                                                        style={{ width: `${(item.count / (stats?.total || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Phân tích bảo hành */}
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4">Phân tích bảo hành</h3>
                                {analysis?.byWarranty.length === 0 ? (
                                    <p className="text-muted-foreground">Không có dữ liệu</p>
                                ) : (
                                    <div className="space-y-4">
                                        {analysis?.byWarranty.map((item, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span>{warrantyLabels[item._id] || item._id}</span>
                                                    <span className="font-medium">{item.count}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full ${item._id === 'expired' ? 'bg-red-500' :
                                                                item._id === 'expiring_soon' ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${(item.count / (analysis.byWarranty.reduce((acc, curr) => acc + curr.count, 0) || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="bg-card border rounded-lg p-6 mb-8">
                            <h3 className="text-lg font-semibold mb-4">Thông tin chi tiết theo trạng thái</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="px-4 py-2 text-left border-b">Trạng thái</th>
                                            <th className="px-4 py-2 text-left border-b">Số lượng</th>
                                            <th className="px-4 py-2 text-left border-b">Phần trăm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 border-b">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Khả dụng
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-b">{stats?.byStatus?.available || 0}</td>
                                            <td className="px-4 py-3 border-b">
                                                {stats?.total ? ((stats.byStatus?.available || 0) / stats.total * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 border-b">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Đang sử dụng
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-b">{stats?.byStatus?.in_use || 0}</td>
                                            <td className="px-4 py-3 border-b">
                                                {stats?.total ? ((stats.byStatus?.in_use || 0) / stats.total * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 border-b">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Đang sửa chữa
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-b">{stats?.byStatus?.under_repair || 0}</td>
                                            <td className="px-4 py-3 border-b">
                                                {stats?.total ? ((stats.byStatus?.under_repair || 0) / stats.total * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 border-b">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Đã thanh lý
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-b">{stats?.byStatus?.disposed || 0}</td>
                                            <td className="px-4 py-3 border-b">
                                                {stats?.total ? ((stats.byStatus?.disposed || 0) / stats.total * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
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