import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import InvoiceModel, { IInvoice } from "@/models/Invoice";
import DeviceModel from "@/models/Device";
import ComponentModel from "@/models/Component";

// GET /api/invoices/[id] - Get a specific invoice by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoiceId = params.id;

        // Validate ID format
        if (!ObjectId.isValid(invoiceId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const invoice = await InvoiceModel.findById(invoiceId).populate(
            "createdBy",
            "name email"
        );

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoice" },
            { status: 500 }
        );
    }
}

// PUT /api/invoices/[id] - Update a specific invoice
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check authorization (only admin and manager can update invoices)
        const userRole = session.user.role;
        if (!userRole || !["admin", "manager"].includes(userRole)) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        const invoiceId = params.id;

        // Validate ID format
        if (!ObjectId.isValid(invoiceId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        const body = await request.json();

        await connectDB();

        // Don't allow changing the invoice number to one that already exists
        if (body.invoiceNumber) {
            const existingInvoice = await InvoiceModel.findOne({
                invoiceNumber: body.invoiceNumber,
                _id: { $ne: new ObjectId(invoiceId) },
            });

            if (existingInvoice) {
                return NextResponse.json(
                    { error: "Invoice number already exists" },
                    { status: 400 }
                );
            }
        }

        const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
            invoiceId,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedInvoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json(
            { error: "Failed to update invoice" },
            { status: 500 }
        );
    }
}

// DELETE /api/invoices/[id] - Delete a specific invoice
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin can delete invoices
        if (session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        const invoiceId = params.id;

        // Validate ID format
        if (!ObjectId.isValid(invoiceId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const invoice = await InvoiceModel.findById(invoiceId);

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Check if any items have been processed
        const processedItems = invoice.items.some((item: any) => item.processed);
        if (processedItems) {
            return NextResponse.json(
                { error: "Cannot delete invoice with processed items" },
                { status: 400 }
            );
        }

        await InvoiceModel.findByIdAndDelete(invoiceId);

        return NextResponse.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json(
            { error: "Failed to delete invoice" },
            { status: 500 }
        );
    }
} 