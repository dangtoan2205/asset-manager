import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import InvoiceModel, { IInvoice } from "@/models/Invoice";
import DeviceModel from "@/models/Device";
import ComponentModel from "@/models/Component";

// POST /api/invoices/[id]/process-item - Process an item from the invoice and create a device or component
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check authorization (only admin and manager can process invoice items)
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

        // Get request body
        const body = await request.json();
        const { itemIndex, itemDetails } = body;

        if (itemIndex === undefined || !itemDetails) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the invoice
        const invoice = await InvoiceModel.findById(invoiceId);

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Check if the item exists and is not already processed
        if (
            !invoice.items[itemIndex] ||
            invoice.items[itemIndex].processed
        ) {
            return NextResponse.json(
                { error: "Item not found or already processed" },
                { status: 400 }
            );
        }

        const invoiceItem = invoice.items[itemIndex];

        // Create the device or component
        let createdItem;
        const commonFields = {
            name: itemDetails.name || invoiceItem.name,
            manufacturer: itemDetails.manufacturer,
            model: itemDetails.model,
            purchaseDate: invoice.purchaseDate,
            status: "available",
            notes: `Purchased from ${invoice.vendor}. Invoice #${invoice.invoiceNumber}`,
            specs: itemDetails.specs || invoiceItem.specifications || {},
        };

        if (invoiceItem.type === "device") {
            createdItem = await DeviceModel.create({
                ...commonFields,
                type: itemDetails.type,
                serialNumber: itemDetails.serialNumber,
                warrantyExpiryDate: itemDetails.warrantyExpiryDate,
                location: itemDetails.location,
            });
        } else if (invoiceItem.type === "component") {
            createdItem = await ComponentModel.create({
                ...commonFields,
                type: itemDetails.type,
                serialNumber: itemDetails.serialNumber,
                warrantyExpiryDate: itemDetails.warrantyExpiryDate,
                location: itemDetails.location,
            });
        } else {
            return NextResponse.json(
                { error: "Invalid item type" },
                { status: 400 }
            );
        }

        // Update the invoice item with the created item's ID and mark as processed
        invoice.items[itemIndex].processed = true;
        invoice.items[itemIndex].createdItemId = createdItem._id;

        // Check if all items are processed and update invoice status if needed
        const allProcessed = invoice.items.every((item: any) => item.processed);
        if (allProcessed) {
            invoice.status = "processed";
        }

        await invoice.save();

        return NextResponse.json({
            message: "Item processed successfully",
            item: createdItem,
            invoiceStatus: invoice.status,
        });
    } catch (error) {
        console.error("Error processing invoice item:", error);
        return NextResponse.json(
            { error: "Failed to process invoice item" },
            { status: 500 }
        );
    }
} 