"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import * as XLSX from 'xlsx';
import DeviceAssignmentManager from "./DeviceAssignmentManager";
import ComponentAssignmentManager from "./ComponentAssignmentManager";
import AccountAssignmentManager from "./AccountAssignmentManager";

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    position: string;
    department: string;
    email: string;
    phone?: string;
    joinDate: string;
    status: string;
    location?: string;
    manager?: string;
    notes?: string;
    devices?: any[];
    components?: any[];
    accounts?: any[];
}

export default function EmployeeDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [devices, setDevices] = useState([]);
    const [components, setComponents] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchEmployeeData();
        }
    }, [status, router, employeeId]);

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/employees/${employeeId}`);
            
            // Lấy đúng cấu trúc dữ liệu từ response API
            if (response.data && response.data.employee) {
                setEmployee(response.data.employee);
                // Nếu API đã trả về danh sách thiết bị được gán
                if (response.data.assignedDevices) {
                    setDevices(response.data.assignedDevices);
                }
            } else {
                // Fallback nếu cấu trúc dữ liệu khác
                setEmployee(response.data);
            }

            // Fetch assigned devices, components, and accounts if not included in the response
            if (response.data && response.data.employee) {
                await Promise.all([
                    response.data.assignedDevices ? Promise.resolve() : fetchAssignedDevices(employeeId),
                    fetchAssignedComponents(employeeId),
                    fetchAssignedAccounts(employeeId)
                ]);
            }

            setError("");
        } catch (err: any) {
            console.error("Error fetching employee:", err);
            setError(err.response?.data?.error || "Không thể tải thông tin nhân viên");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedDevices = async (id: string) => {
        try {
            // Endpoint to get devices assigned to employee
            const response = await axios.get(`/api/devices?assignedTo=${id}`);
            setDevices(response.data.devices || []);
        } catch (err) {
            console.error("Error fetching assigned devices:", err);
        }
    };

    const fetchAssignedComponents = async (id: string) => {
        try {
            // Endpoint to get components assigned to employee
            const response = await axios.get(`/api/components?assignedTo=${id}`);
            setComponents(response.data.components || []);
        } catch (err) {
            console.error("Error fetching assigned components:", err);
        }
    };

    const fetchAssignedAccounts = async (id: string) => {
        try {
            // Endpoint to get accounts assigned to employee
            const response = await axios.get(`/api/accounts?assignedTo=${id}`);
            
            // Lọc ở phía frontend để chỉ lấy các tài khoản thực sự được gán
            const filteredAccounts = response.data.accounts.filter((account: any) => 
                account.assignedTo && account.assignedTo._id === id
            );
            
            setAccounts(filteredAccounts || []);
        } catch (err) {
            console.error("Error fetching assigned accounts:", err);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này không?")) {
            return;
        }

        try {
            await axios.delete(`/api/employees/${employeeId}`);
            router.push("/employees");
        } catch (err: any) {
            console.error("Error deleting employee:", err);
            setError(err.response?.data?.error || "Không thể xóa nhân viên");
        }
    };

    const handleUnassignAsset = async (type: string, assetId: string) => {
        try {
            await axios.post(`/api/unassign`, { type, assetId, employeeId });
            if (type === "device") {
                setDevices(devices.filter((device: any) => device._id !== assetId));
            } else if (type === "component") {
                setComponents(components.filter((component: any) => component._id !== assetId));
            } else if (type === "account") {
                setAccounts(accounts.filter((account: any) => account._id !== assetId));
            }
        } catch (err) {
            console.error("Error unassigning asset:", err);
        }
    };
    
    // Function to export employee asset details to Excel for handover documentation
    const exportToExcel = () => {
        if (!employee) return;
        
        // Format date for filename and display
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        const formattedDate = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        // Create a workbook
        const wb = XLSX.utils.book_new();
        
        // Create and style the main handover document worksheet
        const mainWs = XLSX.utils.aoa_to_sheet([]);
        
        // Set column widths for better presentation
        const columnWidths = [
            { wch: 15 }, // A
            { wch: 40 }, // B
            { wch: 15 }, // C
            { wch: 30 }, // D
            { wch: 15 }, // E
            { wch: 15 }, // F
        ];
        mainWs['!cols'] = columnWidths;
        
        // Add title and company information
        XLSX.utils.sheet_add_aoa(mainWs, [
            ['', 'BIÊN BẢN BÀN GIAO THIẾT BỊ VÀ TÀI KHOẢN', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', 'CÔNG TY: CÔNG TY ABC', '', '', '', ''],
            ['', 'Địa chỉ: Địa chỉ công ty', '', '', '', ''],
            ['', 'Số điện thoại: 0123456789', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', `Ngày lập biên bản: ${formattedDate}`, '', '', '', ''],
            ['', '', '', '', '', ''],
            ['I.', 'THÔNG TIN NHÂN VIÊN BÀN GIAO', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', 'Họ và tên:', employee.name, '', '', ''],
            ['', 'Mã nhân viên:', employee.employeeId, '', '', ''],
            ['', 'Phòng ban:', employee.department, '', '', ''],
            ['', 'Vị trí:', employee.position, '', '', ''],
            ['', 'Email:', employee.email, '', '', ''],
            ['', 'Điện thoại:', employee.phone || 'N/A', '', '', ''],
            ['', 'Trạng thái:', String(employee.status).trim() === 'active' ? 'Đang làm việc' : String(employee.status).trim() === 'on_leave' ? 'Đang nghỉ phép' : 'Đã nghỉ việc', '', '', ''],
            ['', '', '', '', '', ''],
            ['II.', 'DANH SÁCH THIẾT BỊ BÀN GIAO', '', '', '', ''],
            ['', '', '', '', '', ''],
        ]);
        
        // Add devices table header
        if (devices.length > 0) {
            XLSX.utils.sheet_add_aoa(mainWs, [
                ['STT', 'Tên thiết bị', 'Loại thiết bị', 'Số serial', 'Model', 'Ghi chú'],
            ], { origin: { r: 20, c: 0 } });
            
            // Add devices data
            const devicesData = devices.map((device: any, index: number) => [
                index + 1,
                device.name,
                device.type,
                device.serialNumber,
                device.model || '',
                device.notes || ''
            ]);
            
            XLSX.utils.sheet_add_aoa(mainWs, devicesData, { origin: { r: 21, c: 0 } });
            
            // Set current row for next section
            const componentStartRow = 21 + devices.length + 2;
            
            // Add components section title
            XLSX.utils.sheet_add_aoa(mainWs, [
                ['', '', '', '', '', ''],
                ['III.', 'DANH SÁCH LINH KIỆN BÀN GIAO', '', '', '', ''],
                ['', '', '', '', '', ''],
            ], { origin: { r: componentStartRow, c: 0 } });
            
            // Add components table header
            if (components.length > 0) {
                XLSX.utils.sheet_add_aoa(mainWs, [
                    ['STT', 'Tên linh kiện', 'Loại linh kiện', 'Số serial', 'Model', 'Ghi chú'],
                ], { origin: { r: componentStartRow + 3, c: 0 } });
                
                // Add components data
                const componentsData = components.map((component: any, index: number) => [
                    index + 1,
                    component.name,
                    component.type,
                    component.serialNumber,
                    component.model || '',
                    component.notes || ''
                ]);
                
                XLSX.utils.sheet_add_aoa(mainWs, componentsData, { origin: { r: componentStartRow + 4, c: 0 } });
                
                // Set current row for next section
                const accountStartRow = componentStartRow + 4 + components.length + 2;
                
                // Add accounts section title
                XLSX.utils.sheet_add_aoa(mainWs, [
                    ['', '', '', '', '', ''],
                    ['IV.', 'DANH SÁCH TÀI KHOẢN BÀN GIAO', '', '', '', ''],
                    ['', '', '', '', '', ''],
                ], { origin: { r: accountStartRow, c: 0 } });
                
                // Add accounts table header
                if (accounts.length > 0) {
                    XLSX.utils.sheet_add_aoa(mainWs, [
                        ['STT', 'Tên tài khoản', 'Loại', 'Username', 'Email', 'Ghi chú'],
                    ], { origin: { r: accountStartRow + 3, c: 0 } });
                    
                    // Add accounts data
                    const accountsData = accounts.map((account: any, index: number) => [
                        index + 1,
                        account.name,
                        account.type,
                        account.username,
                        account.email || '',
                        account.notes || ''
                    ]);
                    
                    XLSX.utils.sheet_add_aoa(mainWs, accountsData, { origin: { r: accountStartRow + 4, c: 0 } });
                    
                    // Add signature section
                    const signatureRow = accountStartRow + 4 + accounts.length + 4;
                    
                    XLSX.utils.sheet_add_aoa(mainWs, [
                        ['', '', '', '', '', ''],
                        ['', '', '', '', '', ''],
                        ['', 'NGƯỜI BÀN GIAO', '', 'NGƯỜI TIẾP NHẬN', '', ''],
                        ['', '(Ký, ghi rõ họ tên)', '', '(Ký, ghi rõ họ tên)', '', ''],
                        ['', '', '', '', '', ''],
                        ['', '', '', '', '', ''],
                        ['', '', '', '', '', ''],
                        ['', '', '', '', '', ''],
                        ['', `${employee.name}`, '', '....................................', '', ''],
                    ], { origin: { r: signatureRow, c: 0 } });
                } else {
                    // If no accounts, add signature section right after components
                    const signatureRow = accountStartRow + 4;
                    
                    XLSX.utils.sheet_add_aoa(mainWs, [
                        ['', '', '', '', '', ''],
                        ['', 'NGƯỜI BÀN GIAO', '', 'NGƯỜI TIẾP NHẬN', '', ''],
                        ['', '(Ký, ghi rõ họ tên)', '', '(Ký, ghi rõ họ tên)', '', ''],
                        ['', '', '', '', '', ''],
                        ['', '', '', '', '', ''],
                        ['', '', '', '', '', ''],
                        ['', `${employee.name}`, '', '....................................', '', ''],
                    ], { origin: { r: signatureRow, c: 0 } });
                }
            } else {
                // If no components, add accounts section right after devices
                const accountStartRow = componentStartRow + 3;
                
                // Add accounts section title
                XLSX.utils.sheet_add_aoa(mainWs, [
                    ['IV.', 'DANH SÁCH TÀI KHOẢN BÀN GIAO', '', '', '', ''],
                    ['', '', '', '', '', ''],
                ], { origin: { r: accountStartRow, c: 0 } });
                
                // Handle rest of accounts and signature section
                // (Similar logic as above)
            }
        } else {
            // If no devices, start with components directly
            // (Similar logic with adjusted row positions)
        }
        
        // Add the main worksheet to workbook
        XLSX.utils.book_append_sheet(wb, mainWs, 'Biên bản bàn giao');
        
        // Create an additional worksheet with detailed device data
        const detailsWs = XLSX.utils.json_to_sheet([
            ...devices.map((device: any) => ({
                'Loại': 'Thiết bị',
                'Tên': device.name,
                'Loại thiết bị': device.type,
                'Mã/Serial': device.serialNumber,
                'Model': device.model || '',
                'Trạng thái': device.status === 'available' 
                    ? 'Khả dụng' 
                    : device.status === 'in_use'
                    ? 'Đang sử dụng'
                    : device.status === 'under_repair'
                    ? 'Đang sửa chữa'
                    : 'Đã thanh lý',
                'Ngày cấp phát': device.assignedDate ? new Date(device.assignedDate).toLocaleDateString('vi-VN') : '',
                'Ghi chú': device.notes || ''
            })),
            ...components.map((component: any) => ({
                'Loại': 'Linh kiện',
                'Tên': component.name,
                'Loại thiết bị': component.type,
                'Mã/Serial': component.serialNumber,
                'Model': component.model || '',
                'Trạng thái': component.status === 'available' 
                    ? 'Khả dụng' 
                    : component.status === 'in_use'
                    ? 'Đang sử dụng'
                    : component.status === 'under_repair'
                    ? 'Đang sửa chữa'
                    : 'Đã thanh lý',
                'Ngày cấp phát': component.assignedDate ? new Date(component.assignedDate).toLocaleDateString('vi-VN') : '',
                'Ghi chú': component.notes || ''
            })),
            ...accounts.map((account: any) => ({
                'Loại': 'Tài khoản',
                'Tên': account.name,
                'Loại tài khoản': account.type,
                'Username': account.username,
                'Email': account.email || '',
                'Trạng thái': account.status === 'active' 
                    ? 'Hoạt động' 
                    : account.status === 'inactive'
                    ? 'Không hoạt động'
                    : 'Hết hạn',
                'Ngày cấp phát': account.assignedDate ? new Date(account.assignedDate).toLocaleDateString('vi-VN') : '',
                'Ngày hết hạn': account.expiryDate ? new Date(account.expiryDate).toLocaleDateString('vi-VN') : '',
                'Ghi chú': account.notes || ''
            }))
        ]);
        
        // Add details worksheet to workbook
        XLSX.utils.book_append_sheet(wb, detailsWs, 'Chi tiết tài sản');
        
        // Generate filename
        const fileName = `Bien_ban_ban_giao_${employee.employeeId}_${dateStr}.xlsx`;
        
        // Export to file
        XLSX.writeFile(wb, fileName);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Đang tải...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6 bg-destructive/10 text-destructive rounded-lg max-w-md">
                    <h2 className="text-xl font-bold mb-4">Đã xảy ra lỗi</h2>
                    <p>{error}</p>
                    <Link href="/employees" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md">
                        Quay lại danh sách nhân viên
                    </Link>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6 bg-muted rounded-lg max-w-md">
                    <h2 className="text-xl font-bold mb-4">Không tìm thấy nhân viên</h2>
                    <p>Nhân viên bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                    <Link href="/employees" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md">
                        Quay lại danh sách nhân viên
                    </Link>
                </div>
            </div>
        );
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/employees" className="text-primary-foreground hover:underline">
                            Nhân viên
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Chi tiết nhân viên</h1>
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
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold">{employee.name}</h2>
                            <p className="text-muted-foreground">Mã nhân viên: {employee.employeeId}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                                title="Export danh sách tài sản để làm biên bản bàn giao"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export Excel
                            </button>
                            <Link
                                href={`/employees/${employeeId}/edit`}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Chỉnh sửa
                            </Link>
                            {session?.user?.role === "admin" && (
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Thông tin cá nhân</h3>
                                <dl className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Họ tên:</dt>
                                        <dd>{employee.name}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Mã nhân viên:</dt>
                                        <dd>{employee.employeeId}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Vị trí:</dt>
                                        <dd>{employee.position}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Phòng ban:</dt>
                                        <dd>{employee.department}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Quản lý:</dt>
                                        <dd>{employee.manager || "N/A"}</dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Thông tin liên hệ</h3>
                                <dl className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Email:</dt>
                                        <dd>{employee.email}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Điện thoại:</dt>
                                        <dd>{employee.phone || "N/A"}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Vị trí làm việc:</dt>
                                        <dd>{employee.location || "N/A"}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Ngày bắt đầu:</dt>
                                        <dd>{formatDate(employee.joinDate)}</dd>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <dt className="font-medium text-muted-foreground">Trạng thái:</dt>
                                        <dd>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                String(employee.status).trim() === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : String(employee.status).trim() === 'on_leave'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {String(employee.status).trim() === 'active' 
                                                    ? 'Đang làm việc' 
                                                    : String(employee.status).trim() === 'on_leave'
                                                    ? 'Đang nghỉ phép'
                                                    : 'Đã nghỉ việc'}
                                            </span>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {employee.notes && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-2">Ghi chú</h3>
                                <p className="bg-muted/50 p-4 rounded-md">{employee.notes}</p>
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Thiết bị đã gán ({devices.length})</h3>
                                <button 
                                    onClick={() => setShowDeviceModal(true)} 
                                    className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                                >
                                    Quản lý thiết bị
                                </button>
                            </div>
                            {devices.length > 0 ? (
                                <div className="border rounded-md overflow-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">Tên thiết bị</th>
                                                <th className="px-4 py-2 text-left font-medium">Loại</th>
                                                <th className="px-4 py-2 text-left font-medium">Số serial</th>
                                                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                                                <th className="px-4 py-2 text-left font-medium">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {devices.map((device: any) => (
                                                <tr key={device._id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3">{device.name}</td>
                                                    <td className="px-4 py-3 capitalize">{device.type}</td>
                                                    <td className="px-4 py-3">{device.serialNumber}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            device.status === 'available' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : device.status === 'in_use'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {device.status === 'available' 
                                                                ? 'Khả dụng' 
                                                                : device.status === 'in_use'
                                                                ? 'Đang sử dụng'
                                                                : device.status === 'under_repair'
                                                                ? 'Đang sửa chữa'
                                                                : 'Đã thanh lý'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <Link href={`/devices/${device._id}`} className="text-primary hover:underline">
                                                                Xem
                                                            </Link>
                                                            <button 
                                                                onClick={() => handleUnassignAsset('device', device._id)}
                                                                className="text-destructive hover:underline text-sm"
                                                            >
                                                                Gỡ bỏ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Nhân viên chưa được gán thiết bị nào.</p>
                            )}
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Linh kiện đã gán ({components.length})</h3>
                                <button 
                                    onClick={() => setShowComponentModal(true)} 
                                    className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                                >
                                    Quản lý linh kiện
                                </button>
                            </div>
                            {components.length > 0 ? (
                                <div className="border rounded-md overflow-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">Tên linh kiện</th>
                                                <th className="px-4 py-2 text-left font-medium">Loại</th>
                                                <th className="px-4 py-2 text-left font-medium">Số serial</th>
                                                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                                                <th className="px-4 py-2 text-left font-medium">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {components.map((component: any) => (
                                                <tr key={component._id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3">{component.name}</td>
                                                    <td className="px-4 py-3 capitalize">{component.type}</td>
                                                    <td className="px-4 py-3">{component.serialNumber}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            component.status === 'available' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : component.status === 'in_use'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {component.status === 'available' 
                                                                ? 'Khả dụng' 
                                                                : component.status === 'in_use'
                                                                ? 'Đang sử dụng'
                                                                : component.status === 'under_repair'
                                                                ? 'Đang sửa chữa'
                                                                : 'Đã thanh lý'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <Link href={`/components/${component._id}`} className="text-primary hover:underline">
                                                                Xem
                                                            </Link>
                                                            <button 
                                                                onClick={() => handleUnassignAsset('component', component._id)}
                                                                className="text-destructive hover:underline text-sm"
                                                            >
                                                                Gỡ bỏ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Nhân viên chưa được gán linh kiện nào.</p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Tài khoản đã gán ({accounts.length})</h3>
                                <button 
                                    onClick={() => setShowAccountModal(true)} 
                                    className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                                >
                                    Quản lý tài khoản
                                </button>
                            </div>
                            {accounts.length > 0 ? (
                                <div className="border rounded-md overflow-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">Tên tài khoản</th>
                                                <th className="px-4 py-2 text-left font-medium">Loại</th>
                                                <th className="px-4 py-2 text-left font-medium">Tên người dùng</th>
                                                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                                                <th className="px-4 py-2 text-left font-medium">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {accounts.map((account: any) => (
                                                <tr key={account._id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3">{account.name}</td>
                                                    <td className="px-4 py-3 capitalize">{account.type}</td>
                                                    <td className="px-4 py-3">{account.username}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            account.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : account.status === 'inactive'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {account.status === 'active' 
                                                                ? 'Hoạt động' 
                                                                : account.status === 'inactive'
                                                                ? 'Không hoạt động'
                                                                : 'Hết hạn'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <Link href={`/accounts/${account._id}`} className="text-primary hover:underline">
                                                                Xem
                                                            </Link>
                                                            <button 
                                                                onClick={() => handleUnassignAsset('account', account._id)}
                                                                className="text-destructive hover:underline text-sm"
                                                            >
                                                                Gỡ bỏ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Nhân viên chưa được gán tài khoản nào.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Device Assignment Modal */}
            {showDeviceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Quản lý thiết bị của {employee.name}</h3>
                            <button onClick={() => setShowDeviceModal(false)} className="text-muted-foreground hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <DeviceAssignmentManager 
                            employeeId={employeeId} 
                            onAssign={(device) => {
                                setDevices([...devices, device]);
                            }}
                            onDismiss={() => setShowDeviceModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Component Assignment Modal */}
            {showComponentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Quản lý linh kiện của {employee.name}</h3>
                            <button onClick={() => setShowComponentModal(false)} className="text-muted-foreground hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <ComponentAssignmentManager 
                            employeeId={employeeId} 
                            onAssign={(component) => {
                                setComponents([...components, component]);
                            }}
                            onDismiss={() => setShowComponentModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Account Assignment Modal */}
            {showAccountModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Quản lý tài khoản của {employee.name}</h3>
                            <button onClick={() => setShowAccountModal(false)} className="text-muted-foreground hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <AccountAssignmentManager 
                            employeeId={employeeId} 
                            onAssign={(account) => {
                                setAccounts([...accounts, account]);
                            }}
                            onDismiss={() => setShowAccountModal(false)}
                        />
                    </div>
                </div>
            )}

            <footer className="bg-muted py-4">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    );
}
