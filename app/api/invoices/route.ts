import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import InvoiceModel from "@/models/Invoice";

// GET /api/invoices - Retrieve all invoices with pagination and filtering
export async function GET(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const sortBy = searchParams.get("sortBy") || "purchaseDate";
        const sortOrder = searchParams.get("sortOrder") || "-1"; // Default to descending

        // Connect to the database
        await connectDB();

        // Build query filters
        const query: any = {};

        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: "i" } },
                { vendor: { $regex: search, $options: "i" } },
            ];
        }

        if (status) {
            query.status = status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Sort configuration
        const sort: any = {};
        sort[sortBy] = parseInt(sortOrder);

        // Execute query with pagination
        const invoices = await InvoiceModel.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("createdBy", "name email")
            .lean();

        // Get total count for pagination
        const total = await InvoiceModel.countDocuments(query);

        return NextResponse.json({
            invoices,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoices" },
            { status: 500 }
        );
    }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check authorization (only admin and manager can create invoices)
        const userRole = session.user.role;
        if (!userRole || !["admin", "manager"].includes(userRole)) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Get request body
        const body = await request.json();

        // Basic validation
        if (!body.invoiceNumber || !body.vendor || !body.purchaseDate || !body.items || !body.totalAmount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Connect to the database
        await connectDB();

        // Check if invoice number already exists
        const existingInvoice = await InvoiceModel.findOne({
            invoiceNumber: body.invoiceNumber,
        });

        if (existingInvoice) {
            return NextResponse.json(
                { error: "Invoice number already exists" },
                { status: 400 }
            );
        }

        // Create new invoice
        const newInvoice = new InvoiceModel({
            ...body,
            createdBy: new ObjectId(session.user.id),
            status: "pending",
        });

        await newInvoice.save();

        return NextResponse.json(newInvoice, { status: 201 });
    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json(
            { error: "Failed to create invoice" },
            { status: 500 }
        );
    }
} 