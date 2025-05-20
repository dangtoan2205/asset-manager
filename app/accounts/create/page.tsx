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

export default function CreateAccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        type: "vpn",
        subType: "",
        username: "",
        password: "",
        url: "",
        apiKey: "",
        accessToken: "",
        refreshToken: "",
        expiryDate: "",
        assignedTo: "",
        notes: "",
        lastPasswordChangeDate: "",
        status: "active",
        securityLevel: "medium",
        organization: "",
        department: "",
        projectId: ""
    });

    // Danh sách các loại tài khoản - Phân loại theo cấp bậc khoa học
    const accountTypes = [
        // Tài khoản mạng và VPN
        { value: "network_access", label: "Tài khoản truy cập mạng", category: "network", subOptions: [
            { value: "vpn", label: "VPN" },
            { value: "network_device", label: "Thiết bị mạng" },
            { value: "wifi", label: "WiFi/Mạng không dây" }
        ]},
        
        // Tài khoản quản lý mã nguồn
        { value: "code_repository", label: "Quản lý mã nguồn", category: "development", subOptions: [
            { value: "github", label: "GitHub" },
            { value: "gitlab", label: "GitLab" },
            { value: "bitbucket", label: "Bitbucket" },
            { value: "azure_devops", label: "Azure DevOps" }
        ]},
        
        // Tài khoản quản lý dự án
        { value: "project_management", label: "Quản lý dự án", category: "management", subOptions: [
            { value: "jira", label: "Jira" },
            { value: "confluence", label: "Confluence" },
            { value: "trello", label: "Trello" },
            { value: "asana", label: "Asana" },
            { value: "notion", label: "Notion" }
        ]},
        
        // Tài khoản đám mây
        { value: "cloud_service", label: "Dịch vụ đám mây", category: "cloud", subOptions: [
            { value: "aws", label: "Amazon Web Services" },
            { value: "azure", label: "Microsoft Azure" },
            { value: "gcp", label: "Google Cloud Platform" },
            { value: "alibaba_cloud", label: "Alibaba Cloud" },
            { value: "digital_ocean", label: "Digital Ocean" }
        ]},
        
        // Tài khoản giao tiếp và cộng tác
        { value: "communication", label: "Giao tiếp & cộng tác", category: "collaboration", subOptions: [
            { value: "slack", label: "Slack" },
            { value: "microsoft_teams", label: "Microsoft Teams" },
            { value: "zoom", label: "Zoom" },
            { value: "google_workspace", label: "Google Workspace" }
        ]},
        
        // Tài khoản hệ thống nội bộ
        { value: "internal_system", label: "Hệ thống nội bộ", category: "internal" },
        
        // Tài khoản khác
        { value: "other", label: "Khác", category: "other" }
    ];

    // Danh sách trạng thái
    const statusOptions = [
        { value: "active", label: "Hoạt động" },
        { value: "inactive", label: "Không hoạt động" },
        { value: "expired", label: "Hết hạn" },
    ];

    // Danh sách mức bảo mật
    const securityLevels = [
        { value: "low", label: "Thấp" },
        { value: "medium", label: "Trung bình" },
        { value: "high", label: "Cao" },
    ];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            setSubmitting(true);

            // Validate dữ liệu
            if (!formData.name || !formData.type || !formData.username) {
                setError("Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Loại tài khoản, Tên người dùng)");
                setSubmitting(false);
                return;
            }

            // Tạo dữ liệu gửi lên API
            const submitData: Record<string, any> = { ...formData };

            // Loại bỏ các trường rỗng trước khi gửi
            Object.keys(submitData).forEach(key => {
                if (submitData[key] === "") {
                    delete submitData[key];
                }
            });

            // Gửi request tạo tài khoản mới
            const response = await axios.post("/api/accounts", submitData);

            // Redirect khi thành công
            router.push("/accounts");
        } catch (err: any) {
            setError(err.response?.data?.error || "Đã xảy ra lỗi khi tạo tài khoản");
            console.error("Error creating account:", err);
            setSubmitting(false);
        }
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
                        <Link href="/accounts" className="text-primary-foreground hover:underline">
                            Quản lý tài khoản
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Tạo tài khoản mới</h1>
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
                    <h2 className="text-2xl font-bold mb-6">Tạo tài khoản mới</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium">
                                    Tên tài khoản <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    placeholder="VPN công ty, GitHub team X, AWS Dev..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="type" className="block text-sm font-medium">
                                    Loại tài khoản <span className="text-destructive">*</span>
                                </label>
                                <div className="flex flex-col space-y-3">
                                    {/* Chọn loại tài khoản chính */}
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={(e) => {
                                            const selectedType = e.target.value;
                                            
                                            // Tìm loại tài khoản được chọn để lấy category
                                            const selectedAccount = accountTypes.find(account => account.value === selectedType);
                                            
                                            setFormData(prev => ({
                                                ...prev,
                                                type: selectedType,
                                                subType: "",
                                                category: selectedAccount?.category || ""
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    >
                                        <option value="">-- Chọn loại tài khoản --</option>
                                        {accountTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Chọn loại tài khoản con nếu có */}
                                    {formData.type && accountTypes.find(type => type.value === formData.type)?.subOptions && (
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
                                            <option value="">-- Chọn loại tài khoản chi tiết --</option>
                                            {accountTypes
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
                                <label htmlFor="username" className="block text-sm font-medium">
                                    Tên người dùng <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium">
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    placeholder="Nhập mật khẩu nếu cần lưu trữ"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Chỉ điền nếu cần lưu trữ. Mật khẩu sẽ được bảo mật trong hệ thống.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="url" className="block text-sm font-medium">
                                    URL
                                </label>
                                <input
                                    type="text"
                                    id="url"
                                    name="url"
                                    value={formData.url}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="organization" className="block text-sm font-medium">
                                    Tổ chức
                                </label>
                                <input
                                    type="text"
                                    id="organization"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="department" className="block text-sm font-medium">
                                    Phòng ban
                                </label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="projectId" className="block text-sm font-medium">
                                    Mã dự án
                                </label>
                                <input
                                    type="text"
                                    id="projectId"
                                    name="projectId"
                                    value={formData.projectId}
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
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="securityLevel" className="block text-sm font-medium">
                                    Mức bảo mật
                                </label>
                                <select
                                    id="securityLevel"
                                    name="securityLevel"
                                    value={formData.securityLevel}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    {securityLevels.map((level) => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="assignedTo" className="block text-sm font-medium">
                                    Gán cho nhân viên
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

                            <div className="space-y-2">
                                <label htmlFor="expiryDate" className="block text-sm font-medium">
                                    Ngày hết hạn
                                </label>
                                <input
                                    type="date"
                                    id="expiryDate"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="lastPasswordChangeDate" className="block text-sm font-medium">
                                    Ngày thay đổi mật khẩu gần nhất
                                </label>
                                <input
                                    type="date"
                                    id="lastPasswordChangeDate"
                                    name="lastPasswordChangeDate"
                                    value={formData.lastPasswordChangeDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="space-y-2">
                                <label htmlFor="apiKey" className="block text-sm font-medium">
                                    API Key
                                </label>
                                <input
                                    type="text"
                                    id="apiKey"
                                    name="apiKey"
                                    value={formData.apiKey}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    placeholder="Nhập API key nếu có"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="space-y-2">
                                <label htmlFor="notes" className="block text-sm font-medium">
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
                        </div>

                        <div className="mt-8 flex justify-end space-x-4">
                            <Link
                                href="/accounts"
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                            >
                                {submitting ? "Đang xử lý..." : "Tạo tài khoản"}
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