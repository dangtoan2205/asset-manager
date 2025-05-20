"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface InvoiceItem {
    type: string;
    name: string;
    quantity: number;
    unitPrice: number;
    specifications?: Record<string, string>;
}

export default function CreateInvoicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form data state
    const [formData, setFormData] = useState({
        invoiceNumber: "",
        vendor: "",
        purchaseDate: new Date().toISOString().split("T")[0], // Default to today
        totalAmount: 0,
        currency: "VND",
        notes: "",
        items: [] as InvoiceItem[],
    });

    // New item form state
    const [newItem, setNewItem] = useState<InvoiceItem>({
        type: "device",
        name: "",
        quantity: 1,
        unitPrice: 0,
        specifications: {},
    });

    // Temporary state for specification fields
    const [specKey, setSpecKey] = useState("");
    const [specValue, setSpecValue] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Check if user has permission to create invoices
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
            }
        }
    }, [status, session, router]);

    useEffect(() => {
        // Recalculate total amount when items change
        const total = formData.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );
        setFormData((prev) => ({ ...prev, totalAmount: total }));
    }, [formData.items]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const processedValue = name === "quantity" || name === "unitPrice"
            ? parseFloat(value) || 0
            : value;

        setNewItem((prev) => ({ ...prev, [name]: processedValue }));
    };

    const addSpecification = () => {
        if (!specKey.trim()) return;

        setNewItem((prev) => ({
            ...prev,
            specifications: {
                ...(prev.specifications || {}),
                [specKey]: specValue,
            },
        }));

        // Clear inputs
        setSpecKey("");
        setSpecValue("");
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...newItem.specifications };
        delete newSpecs[key];

        setNewItem((prev) => ({
            ...prev,
            specifications: newSpecs,
        }));
    };

    const addItem = () => {
        if (!newItem.name || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
            setError("Vui lòng điền đầy đủ thông tin cho thiết bị/linh kiện");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { ...newItem }],
        }));

        // Reset the new item form
        setNewItem({
            type: "device",
            name: "",
            quantity: 1,
            unitPrice: 0,
            specifications: {},
        });

        setError("");
    };

    const removeItem = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate form
        if (!formData.invoiceNumber || !formData.vendor || !formData.purchaseDate) {
            setError("Vui lòng điền đầy đủ thông tin hóa đơn");
            return;
        }

        if (formData.items.length === 0) {
            setError("Vui lòng thêm ít nhất một thiết bị hoặc linh kiện");
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post("/api/invoices", formData);

            router.push(`/invoices/${response.data._id}`);
        } catch (err: any) {
            setError(err.response?.data?.error || "Đã xảy ra lỗi khi tạo hóa đơn");
            setSubmitting(false);
        }
    };

    // Format currency with thousand separators
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN");
    };

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
                        <h1 className="text-xl font-bold">Tạo hóa đơn mới</h1>
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
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">Tạo hóa đơn mua hàng mới</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">Thông tin hóa đơn</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="invoiceNumber" className="block text-sm font-medium">
                                        Số hóa đơn <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="invoiceNumber"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="vendor" className="block text-sm font-medium">
                                        Nhà cung cấp <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="vendor"
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="purchaseDate" className="block text-sm font-medium">
                                        Ngày mua <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="purchaseDate"
                                        name="purchaseDate"
                                        value={formData.purchaseDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="currency" className="block text-sm font-medium">
                                        Đơn vị tiền tệ
                                    </label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="VND">VND - Việt Nam Đồng</option>
                                        <option value="USD">USD - Đô la Mỹ</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
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
                        </div>

                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">
                                Thêm thiết bị / linh kiện
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label htmlFor="itemType" className="block text-sm font-medium">
                                        Loại <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        id="itemType"
                                        name="type"
                                        value={newItem.type}
                                        onChange={handleNewItemChange}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="device">Thiết bị</option>
                                        <option value="component">Linh kiện</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="itemName" className="block text-sm font-medium">
                                        Tên <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="itemName"
                                        name="name"
                                        value={newItem.name}
                                        onChange={handleNewItemChange}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="itemQuantity" className="block text-sm font-medium">
                                        Số lượng <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="itemQuantity"
                                        name="quantity"
                                        value={newItem.quantity}
                                        onChange={handleNewItemChange}
                                        min="1"
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="itemUnitPrice" className="block text-sm font-medium">
                                        Đơn giá <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="itemUnitPrice"
                                        name="unitPrice"
                                        value={newItem.unitPrice}
                                        onChange={handleNewItemChange}
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-muted pt-6 mb-6">
                                <h4 className="font-medium mb-2">Thông số kỹ thuật (tùy chọn)</h4>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Tên thông số"
                                        value={specKey}
                                        onChange={(e) => setSpecKey(e.target.value)}
                                        className="px-3 py-2 border rounded-md bg-background flex-1"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Giá trị"
                                        value={specValue}
                                        onChange={(e) => setSpecValue(e.target.value)}
                                        className="px-3 py-2 border rounded-md bg-background flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSpecification}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                                    >
                                        Thêm
                                    </button>
                                </div>

                                {/* Display current specifications */}
                                {Object.keys(newItem.specifications || {}).length > 0 && (
                                    <div className="bg-muted/30 p-4 rounded-md mb-4">
                                        <h5 className="font-medium mb-2">Thông số đã thêm:</h5>
                                        <ul className="space-y-2">
                                            {Object.entries(newItem.specifications || {}).map(([key, value]) => (
                                                <li key={key} className="flex justify-between items-center">
                                                    <span>
                                                        <span className="font-medium">{key}:</span> {value}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSpecification(key)}
                                                        className="text-destructive hover:text-destructive/80"
                                                    >
                                                        Xóa
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    Thêm vào hóa đơn
                                </button>
                            </div>
                        </div>

                        {formData.items.length > 0 && (
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Danh sách thiết bị / linh kiện
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-sm">
                                                    Loại
                                                </th>
                                                <th className="px-4 py-3 text-left font-medium text-sm">
                                                    Tên
                                                </th>
                                                <th className="px-4 py-3 text-right font-medium text-sm">
                                                    Số lượng
                                                </th>
                                                <th className="px-4 py-3 text-right font-medium text-sm">
                                                    Đơn giá
                                                </th>
                                                <th className="px-4 py-3 text-right font-medium text-sm">
                                                    Thành tiền
                                                </th>
                                                <th className="px-4 py-3 text-center font-medium text-sm">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {formData.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-muted/50">
                                                    <td className="px-4 py-3">
                                                        {item.type === "device" ? "Thiết bị" : "Linh kiện"}
                                                    </td>
                                                    <td className="px-4 py-3">{item.name}</td>
                                                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(item.unitPrice)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="text-destructive hover:text-destructive/80"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold">
                                                <td colSpan={4} className="px-4 py-3 text-right">
                                                    Tổng cộng:
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatCurrency(formData.totalAmount)} {formData.currency}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 mt-8">
                            <Link
                                href="/invoices"
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                            >
                                {submitting ? "Đang xử lý..." : "Tạo hóa đơn"}
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