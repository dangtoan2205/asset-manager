"use client";

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiPlus, FiMinus, FiSave, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import axios from 'axios';
import Link from 'next/link';

interface InvoiceItem {
    type: string;
    name: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
    specifications?: { key: string; value: string }[];
}

interface InvoiceData {
    invoiceNumber: string;
    vendor: string;
    purchaseDate: string;
    totalAmount: number;
    currency: string;
    notes?: string;
    items: InvoiceItem[];
}

export default function ImportInvoicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const userRole = session?.user?.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Access Denied!</strong>
                    <span className="block sm:inline"> You don't have permission to access this page.</span>
                </div>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            if (selectedFile.type !== 'application/pdf' &&
                !selectedFile.type.includes('excel') &&
                !selectedFile.type.includes('spreadsheet')) {
                setError('Please upload a PDF or Excel file');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const processPdfWithOpenAI = async (file: File) => {
        setProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/invoices/extract', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const extractedData = response.data;

            // Convert the extracted data to our format
            const formattedData: InvoiceData = {
                invoiceNumber: extractedData.invoiceNumber || '',
                vendor: extractedData.vendor || '',
                purchaseDate: extractedData.purchaseDate || new Date().toISOString().split('T')[0],
                totalAmount: extractedData.totalAmount || 0,
                currency: extractedData.currency || 'VND',
                notes: extractedData.notes || '',
                items: extractedData.items?.map((item: any) => ({
                    type: item.type || 'device',
                    name: item.name || '',
                    serialNumber: item.serialNumber || '',
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                    specifications: item.specifications || []
                })) || []
            };

            setInvoiceData(formattedData);
        } catch (err: any) {
            console.error('Error processing file with OpenAI:', err);
            setError(`Error extracting data: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const processExcelFile = async (file: File) => {
        setProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/invoices/import-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setInvoiceData(response.data);
        } catch (err: any) {
            console.error('Error processing Excel file:', err);
            setError(`Error extracting data: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const processFile = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        if (file.type === 'application/pdf') {
            await processPdfWithOpenAI(file);
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            await processExcelFile(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (!invoiceData) return;

        setInvoiceData({
            ...invoiceData,
            [name]: value
        });
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        if (!invoiceData) return;

        const updatedItems = [...invoiceData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        };

        setInvoiceData({
            ...invoiceData,
            items: updatedItems
        });
    };

    const addItem = () => {
        if (!invoiceData) return;

        setInvoiceData({
            ...invoiceData,
            items: [
                ...invoiceData.items,
                {
                    type: 'device',
                    name: '',
                    quantity: 1,
                    unitPrice: 0,
                    specifications: []
                }
            ]
        });
    };

    const removeItem = (index: number) => {
        if (!invoiceData) return;

        const updatedItems = [...invoiceData.items];
        updatedItems.splice(index, 1);

        setInvoiceData({
            ...invoiceData,
            items: updatedItems
        });
    };

    const addSpecification = (itemIndex: number) => {
        if (!invoiceData) return;

        const updatedItems = [...invoiceData.items];
        const item = updatedItems[itemIndex];

        updatedItems[itemIndex] = {
            ...item,
            specifications: [
                ...(item.specifications || []),
                { key: '', value: '' }
            ]
        };

        setInvoiceData({
            ...invoiceData,
            items: updatedItems
        });
    };

    const removeSpecification = (itemIndex: number, specIndex: number) => {
        if (!invoiceData) return;

        const updatedItems = [...invoiceData.items];
        const item = updatedItems[itemIndex];

        const updatedSpecs = [...(item.specifications || [])];
        updatedSpecs.splice(specIndex, 1);

        updatedItems[itemIndex] = {
            ...item,
            specifications: updatedSpecs
        };

        setInvoiceData({
            ...invoiceData,
            items: updatedItems
        });
    };

    const handleSpecificationChange = (itemIndex: number, specIndex: number, field: 'key' | 'value', value: string) => {
        if (!invoiceData) return;

        const updatedItems = [...invoiceData.items];
        const item = updatedItems[itemIndex];

        if (!item.specifications) {
            item.specifications = [];
        }

        const updatedSpecs = [...item.specifications];
        updatedSpecs[specIndex] = {
            ...updatedSpecs[specIndex],
            [field]: value
        };

        updatedItems[itemIndex] = {
            ...item,
            specifications: updatedSpecs
        };

        setInvoiceData({
            ...invoiceData,
            items: updatedItems
        });
    };

    const validateInvoiceData = (): boolean => {
        if (!invoiceData) return false;

        if (!invoiceData.invoiceNumber || !invoiceData.vendor || !invoiceData.purchaseDate) {
            setError('Invoice number, vendor, and purchase date are required');
            return false;
        }

        if (invoiceData.items.length === 0) {
            setError('At least one item is required');
            return false;
        }

        for (const item of invoiceData.items) {
            if (!item.name || item.quantity <= 0 || item.unitPrice < 0) {
                setError('All items must have a name, positive quantity, and non-negative unit price');
                return false;
            }
        }

        return true;
    };

    const saveInvoice = async () => {
        if (!validateInvoiceData()) return;

        setSaving(true);
        setError(null);

        try {
            await axios.post('/api/invoices', invoiceData);
            setSaved(true);
            setTimeout(() => {
                router.push('/invoices');
            }, 2000);
        } catch (err: any) {
            console.error('Error saving invoice:', err);
            setError(`Error saving invoice: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setInvoiceData(null);
        setError(null);
        setSaved(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Import Invoice from File</h1>

            {saved ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Invoice saved successfully. Redirecting to invoice list...</span>
                </div>
            ) : null}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            {!invoiceData ? (
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Upload Invoice File (PDF or Excel)
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf,.xls,.xlsx,.csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <div className="flex items-center">
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                            >
                                <FiUpload className="mr-2" />
                                Select File
                            </label>
                            <span className="ml-3">{file ? file.name : 'No file selected'}</span>
                        </div>
                    </div>

                    <button
                        onClick={processFile}
                        disabled={!file || processing}
                        className={`w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center ${!file || processing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {processing ? (
                            <>
                                <FiLoader className="animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <FiCheck className="mr-2" />
                                Process File
                            </>
                        )}
                    </button>

                    <div className="mt-4 text-sm text-gray-600">
                        <p><strong>Note:</strong> For optimal results:</p>
                        <ul className="list-disc ml-5 mt-2">
                            <p>1. PDF files will be processed using AI to extract invoice data</p>
                            <p>2. Excel files should have columns for invoice details and items</p>
                            <p>3. You'll be able to review and edit the extracted data before saving</p>
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Review Invoice Data</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Invoice Number*
                            </label>
                            <input
                                type="text"
                                name="invoiceNumber"
                                value={invoiceData.invoiceNumber}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Vendor*
                            </label>
                            <input
                                type="text"
                                name="vendor"
                                value={invoiceData.vendor}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Purchase Date*
                            </label>
                            <input
                                type="date"
                                name="purchaseDate"
                                value={invoiceData.purchaseDate}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Total Amount*
                            </label>
                            <input
                                type="number"
                                name="totalAmount"
                                value={invoiceData.totalAmount}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Currency
                            </label>
                            <select
                                name="currency"
                                value={invoiceData.currency}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                                <option value="VND">VND</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={invoiceData.notes || ''}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                rows={3}
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Items</h3>

                    {invoiceData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold">Item #{index + 1}</h4>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <FiX className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Type*
                                    </label>
                                    <select
                                        value={item.type}
                                        onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="device">Device</option>
                                        <option value="component">Component</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Name*
                                    </label>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Serial Number
                                    </label>
                                    <input
                                        type="text"
                                        value={item.serialNumber || ''}
                                        onChange={(e) => handleItemChange(index, 'serialNumber', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Quantity*
                                    </label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Unit Price*
                                    </label>
                                    <input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-gray-700 text-sm font-bold">
                                        Specifications
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => addSpecification(index)}
                                        className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                                    >
                                        <FiPlus className="mr-1" /> Add Specification
                                    </button>
                                </div>

                                {(item.specifications || []).map((spec, specIndex) => (
                                    <div key={specIndex} className="flex items-center mt-2">
                                        <input
                                            type="text"
                                            value={spec.key}
                                            onChange={(e) => handleSpecificationChange(index, specIndex, 'key', e.target.value)}
                                            placeholder="Property"
                                            className="shadow appearance-none border rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        />
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => handleSpecificationChange(index, specIndex, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSpecification(index, specIndex)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            <FiMinus className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={addItem}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                        >
                            <FiPlus className="mr-2" />
                            Add Item
                        </button>
                    </div>

                    <div className="flex justify-between">
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>

                            <Link href="/invoices">
                                <button
                                    type="button"
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Back to Invoices
                                </button>
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={saveInvoice}
                            disabled={saving}
                            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {saving ? (
                                <>
                                    <FiLoader className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="mr-2" />
                                    Save Invoice
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">How It Works</h3>
                <ol className="list-decimal ml-5 space-y-2">
                    <li>Upload a PDF invoice or Excel file</li>
                    <li>Our system will extract data using advanced OCR (PDF) or directly parse Excel files</li>
                    <li>Review and edit the extracted information</li>
                    <li>Save the invoice to create entries in your system</li>
                </ol>
            </div>
        </div>
    );
} 