"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface InvoiceItem {
    _id?: string;
    type: string;
    name: string;
    quantity: number;
    unitPrice: number;
    specifications?: Record<string, string>;
    processed?: boolean;
    createdItemId?: string;
}

interface Invoice {
    _id: string;
    invoiceNumber: string;
    vendor: string;
    purchaseDate: string;
    totalAmount: number;
    currency: string;
    status: string;
    items: InvoiceItem[];
    notes?: string;
    createdBy: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export default function ProcessInvoicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState("");

    const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
    const [itemDetails, setItemDetails] = useState({
        name: "",
        type: "",
        serialNumber: "",
        manufacturer: "",
        model: "",
        warrantyExpiryDate: "",
        location: "",
        specs: {} as Record<string, string>,
    });

    // Device type options - Phân loại theo cấp bậc khoa học
    const deviceTypes = [
        // Máy tính và Laptop
        { value: "computer", label: "Máy tính để bàn", category: "computing" },
        { value: "laptop", label: "Laptop", category: "computing" },
        { value: "laptop_macbook", label: "MacBook", subType: "laptop", category: "computing", subOptions: [
            { value: "laptop_macbook_pro", label: "MacBook Pro" },
            { value: "laptop_macbook_air", label: "MacBook Air" }
        ]},
        { value: "desktop_mac", label: "Mac để bàn", subType: "computer", category: "computing", subOptions: [
            { value: "desktop_mac_mini", label: "Mac Mini" },
            { value: "desktop_mac_studio", label: "Mac Studio" },
            { value: "desktop_imac", label: "iMac" }
        ]},
        { value: "server", label: "Máy chủ", category: "computing" },
        
        // Thiết bị hiển thị
        { value: "monitor", label: "Màn hình", category: "display", subOptions: [
            { value: "monitor_24", label: "Màn hình 24 inch" },
            { value: "monitor_27", label: "Màn hình 27 inch" },
            { value: "monitor_32", label: "Màn hình 32 inch" },
            { value: "monitor_other", label: "Kích thước khác" }
        ]},
        
        // Thiết bị ngoại vi
        { value: "peripheral_input", label: "Thiết bị nhập liệu", category: "peripheral", subOptions: [
            { value: "keyboard", label: "Bàn phím" },
            { value: "mouse", label: "Chuột" },
            { value: "drawing_tablet", label: "Bảng vẽ" }
        ]},
        { value: "peripheral_audio", label: "Thiết bị âm thanh", category: "peripheral", subOptions: [
            { value: "headphone", label: "Tai nghe" },
            { value: "speaker", label: "Loa" }
        ]},
        { value: "peripheral_other", label: "Thiết bị ngoại vi khác", category: "peripheral" },
        
        // Thiết bị mạng và in ấn
        { value: "network", label: "Thiết bị mạng", category: "networking" },
        { value: "printer", label: "Máy in/Scan", category: "printing" },
        { value: "camera", label: "Camera", category: "imaging" },
        
        // Khác
        { value: "other", label: "Khác", category: "other" },
    ];

    const componentTypes = [
        // Linh kiện máy tính
        { value: "computer_part", label: "Linh kiện máy tính", category: "computing", subOptions: [
            { value: "cpu", label: "CPU/Bộ xử lý" },
            { value: "ram", label: "Bộ nhớ RAM" },
            { value: "storage", label: "Lưu trữ", subOptions: [
                { value: "storage_ssd", label: "Ổ SSD" },
                { value: "storage_hdd", label: "Ổ HDD" },
                { value: "storage_nvme", label: "Ổ NVMe" }
            ]},
            { value: "motherboard", label: "Bo mạch chủ" },
            { value: "gpu", label: "Card đồ họa" },
            { value: "power_supply", label: "Nguồn" },
            { value: "cooling", label: "Hệ thống làm mát" }
        ]},
        
        // Linh kiện mạng
        { value: "network_component", label: "Linh kiện mạng", category: "networking", subOptions: [
            { value: "network_card", label: "Card mạng" },
            { value: "network_adapter", label: "Bộ chuyển đổi mạng" },
            { value: "network_cable", label: "Cáp mạng" },
            { value: "network_accessory", label: "Phụ kiện mạng khác" }
        ]},
        
        // Phụ kiện
        { value: "accessory", label: "Phụ kiện", category: "accessories", subOptions: [
            { value: "cable", label: "Cáp kết nối" },
            { value: "adapter", label: "Bộ chuyển đổi" },
            { value: "docking_station", label: "Đế cắm/Dock" },
            { value: "charger", label: "Bộ sạc" },
            { value: "battery", label: "Pin" }
        ]},
        
        // Linh kiện màn hình
        { value: "display_part", label: "Linh kiện màn hình", category: "display" },
        
        // Linh kiện máy in
        { value: "printer_part", label: "Linh kiện máy in", category: "printing", subOptions: [
            { value: "toner", label: "Mực in" },
            { value: "drum", label: "Trống mực" },
            { value: "printer_roller", label: "Trục máy in" },
            { value: "printer_accessory", label: "Phụ kiện máy in khác" }
        ]},
        
        // Khác
        { value: "other", label: "Khác", category: "other" }
    ];

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Check if user has permission to process invoices
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            fetchInvoice();
        }
    }, [status, session, router, invoiceId]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/invoices/${invoiceId}`);
            const invoiceData = response.data;

            // Check if invoice is processable
            if (invoiceData.status !== "pending") {
                router.push(`/invoices/${invoiceId}`);
                return;
            }

            setInvoice(invoiceData);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin hóa đơn");
            console.error("Error fetching invoice:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectItem = (index: number) => {
        const item = invoice?.items[index];
        if (!item) return;

        setCurrentItemIndex(index);

        // Initialize form with item data
        setItemDetails({
            name: item.name,
            type: "", // Will be set by user
            serialNumber: "",
            manufacturer: invoice?.vendor || "",
            model: "",
            warrantyExpiryDate: "",
            location: "",
            specs: item.specifications || {},
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setItemDetails((prev) => ({ ...prev, [name]: value }));
    };

    const handleSpecChange = (specName: string, value: string) => {
        setItemDetails((prev) => ({
            ...prev,
            specs: { ...prev.specs, [specName]: value },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (currentItemIndex === null) return;

        // Validate form
        if (!itemDetails.name || !itemDetails.type || !itemDetails.manufacturer || !itemDetails.model) {
            setError("Vui lòng điền đầy đủ thông tin");
            return;
        }

        try {
            setProcessing(true);
            setError("");

            const response = await axios.post(`/api/invoices/${invoiceId}/process-item`, {
                itemIndex: currentItemIndex,
                itemDetails,
            });

            // Update invoice data with processed item
            const updatedInvoice = { ...invoice } as Invoice;
            if (updatedInvoice && updatedInvoice.items) {
                updatedInvoice.items[currentItemIndex].processed = true;
                updatedInvoice.items[currentItemIndex].createdItemId = response.data.item._id;

                if (response.data.invoiceStatus) {
                    updatedInvoice.status = response.data.invoiceStatus;
                }

                setInvoice(updatedInvoice);
            }

            // Reset form
            setCurrentItemIndex(null);
            setItemDetails({
                name: "",
                type: "",
                serialNumber: "",
                manufacturer: "",
                model: "",
                warrantyExpiryDate: "",
                location: "",
                specs: {},
            });

            // If all items are processed, redirect to invoice detail
            if (response.data.invoiceStatus === "processed") {
                router.push(`/invoices/${invoiceId}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Xử lý không thành công");
        } finally {
            setProcessing(false);
        }
    };

    // Format currency with thousand separators
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN");
    };

    // Get type options based on item type
    const getTypeOptions = () => {
        const item = invoice?.items[currentItemIndex || 0];
        if (!item) return [];

        return item.type === "device" ? deviceTypes : componentTypes;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Đang tải...</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy hóa đơn</h1>
                    <p className="mb-4">{error || "Hóa đơn không tồn tại hoặc đã bị xóa"}</p>
                    <Link href="/invoices" className="text-primary hover:underline">
                        Quay lại danh sách hóa đơn
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
                        <Link
                            href="/dashboard"
                            className="text-primary-foreground hover:underline"
                        >
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link
                            href="/invoices"
                            className="text-primary-foreground hover:underline"
                        >
                            Hóa đơn
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/invoices/${invoiceId}`}
                            className="text-primary-foreground hover:underline"
                        >
                            {invoice.invoiceNumber}
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Xử lý</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {session?.user?.name && <span>Xin chào, {session.user.name}</span>}
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
                <div className="max-w-5xl mx-auto">
                    <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Xử lý hóa đơn: {invoice.invoiceNumber}
                            </h2>
                            <p className="text-muted-foreground">
                                Tạo thiết bị và linh kiện từ hóa đơn mua hàng
                            </p>
                        </div>
                        <div>
                            <Link
                                href={`/invoices/${invoiceId}`}
                                className="px-4 py-2 border rounded-md hover:bg-muted inline-block"
                            >
                                Quay lại chi tiết
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* List of items */}
                        <div className="space-y-6">
                            <div className="bg-card border rounded-lg p-5">
                                <h3 className="text-lg font-semibold mb-3">
                                    Thiết bị / Linh kiện
                                </h3>
                                <div className="space-y-3">
                                    {invoice.items.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 border rounded-md ${currentItemIndex === index
                                                    ? "border-primary bg-primary/5"
                                                    : "hover:bg-muted/30"
                                                } ${item.processed ? "opacity-60" : ""}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium">
                                                        {item.type === "device" ? "Thiết bị: " : "Linh kiện: "}
                                                        {item.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        SL: {item.quantity} | Đơn giá:{" "}
                                                        {formatCurrency(item.unitPrice)} {invoice.currency}
                                                    </div>
                                                </div>
                                                {item.processed ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        Đã xử lý
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectItem(index)}
                                                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                                        disabled={currentItemIndex !== null}
                                                    >
                                                        Xử lý
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-card border rounded-lg p-5">
                                <h3 className="text-lg font-semibold mb-3">
                                    Thông tin hóa đơn
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                                        <p className="font-medium">{invoice.vendor}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày mua</p>
                                        <p className="font-medium">
                                            {new Date(invoice.purchaseDate).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng tiền</p>
                                        <p className="font-medium">
                                            {formatCurrency(invoice.totalAmount)} {invoice.currency}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Item details form */}
                        <div className="md:col-span-2">
                            {currentItemIndex !== null ? (
                                <div className="bg-card border rounded-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Tạo {invoice.items[currentItemIndex].type === "device" ? "thiết bị" : "linh kiện"} mới
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="block text-sm font-medium">
                                                    Tên <span className="text-destructive">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={itemDetails.name}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="type" className="block text-sm font-medium">
                                                    Loại <span className="text-destructive">*</span>
                                                </label>
                                                <select
                                                    id="type"
                                                    name="type"
                                                    value={itemDetails.type}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                                    required
                                                >
                                                    <option value="">-- Chọn loại --</option>
                                                    {getTypeOptions().map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="serialNumber" className="block text-sm font-medium">
                                                    Số sê-ri
                                                </label>
                                                <input
                                                    type="text"
                                                    id="serialNumber"
                                                    name="serialNumber"
                                                    value={itemDetails.serialNumber}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="manufacturer" className="block text-sm font-medium">
                                                    Nhà sản xuất <span className="text-destructive">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="manufacturer"
                                                    name="manufacturer"
                                                    value={itemDetails.manufacturer}
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
                                                    value={itemDetails.model}
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
                                                    value={itemDetails.warrantyExpiryDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="location" className="block text-sm font-medium">
                                                    Vị trí
                                                </label>
                                                <input
                                                    type="text"
                                                    id="location"
                                                    name="location"
                                                    value={itemDetails.location}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                                />
                                            </div>
                                        </div>

                                        {/* Thông số kỹ thuật */}
                                        <div className="mt-6 border-t pt-6">
                                            <h4 className="font-medium mb-4">Thông số kỹ thuật</h4>
                                            <div className="space-y-4">
                                                {Object.entries(itemDetails.specs).map(([key, value]) => (
                                                    <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                        <div className="md:col-span-1">
                                                            <label className="text-sm font-medium">{key}</label>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <input
                                                                type="text"
                                                                value={value}
                                                                onChange={(e) => handleSpecChange(key, e.target.value)}
                                                                className="w-full px-3 py-2 border rounded-md bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-4 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItemIndex(null)}
                                                className="px-4 py-2 border rounded-md hover:bg-muted"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                                            >
                                                {processing ? "Đang xử lý..." : "Tạo mới"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                                    <h3 className="text-xl font-semibold mb-3 text-center">
                                        Xử lý hóa đơn
                                    </h3>
                                    <p className="text-muted-foreground text-center mb-6">
                                        Chọn một thiết bị hoặc linh kiện từ danh sách để bắt đầu xử lý
                                    </p>
                                    {invoice.items.every((item) => item.processed) ? (
                                        <div className="text-center">
                                            <p className="text-green-600 font-medium mb-4">
                                                Tất cả các mục đã được xử lý.
                                            </p>
                                            <Link
                                                href={`/invoices/${invoiceId}`}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
                                            >
                                                Quay lại chi tiết
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p>
                                                Còn{" "}
                                                {
                                                    invoice.items.filter((item) => !item.processed).length
                                                }{" "}
                                                mục chưa xử lý
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
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