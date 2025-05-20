import mongoose, { Schema, models, model } from 'mongoose';

export interface IInvoice {
    invoiceNumber: string;
    vendor: string;
    purchaseDate: Date;
    totalAmount: number;
    currency: string;
    status: string; // 'pending', 'processed', 'cancelled'
    items: Array<{
        type: string; // 'device' or 'component'
        name: string;
        quantity: number;
        unitPrice: number;
        specifications?: Record<string, string>;
        processed?: boolean;
        createdItemId?: Schema.Types.ObjectId; // Reference to created device or component
    }>;
    notes?: string;
    attachmentUrl?: string;
    createdBy: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        vendor: { type: String, required: true },
        purchaseDate: { type: Date, required: true },
        totalAmount: { type: Number, required: true },
        currency: { type: String, required: true, default: 'VND' },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'processed', 'cancelled'],
            default: 'pending'
        },
        items: [{
            type: { type: String, required: true, enum: ['device', 'component'] },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: { type: Number, required: true },
            specifications: { type: Map, of: String },
            processed: { type: Boolean, default: false },
            createdItemId: { type: Schema.Types.ObjectId }
        }],
        notes: { type: String },
        attachmentUrl: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

// Sửa cách model được đăng ký
const Invoice = models.Invoice || model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;