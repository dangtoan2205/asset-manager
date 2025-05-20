import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || "";
        const status = searchParams.get("status") || "";

        // Connect to the database
        const { db } = await connectToDatabase();

        // Build the query for inactive components (under_repair or disposed)
        const query: any = {
            status: { $in: ["under_repair", "disposed"] }
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { serialNumber: { $regex: search, $options: "i" } },
                { manufacturer: { $regex: search, $options: "i" } },
                { model: { $regex: search, $options: "i" } }
            ];
        }

        if (type) {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get components with pagination
        const components = await db
            .collection("components")
            .find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Get total count for pagination
        const total = await db.collection("components").countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Populate assigned employee or installed device information
        const populatedComponents = await Promise.all(
            components.map(async (component) => {
                if (component.assignedTo) {
                    const employee = await db
                        .collection("employees")
                        .findOne({ _id: component.assignedTo });
                    if (employee) {
                        component.assignedTo = {
                            _id: employee._id,
                            name: employee.name,
                            employeeId: employee.employeeId,
                            email: employee.email
                        };
                    }
                }

                if (component.installedIn) {
                    const device = await db
                        .collection("devices")
                        .findOne({ _id: component.installedIn });
                    if (device) {
                        component.installedIn = {
                            _id: device._id,
                            name: device.name,
                            serialNumber: device.serialNumber,
                            type: device.type
                        };
                    }
                }

                return component;
            })
        );

        return NextResponse.json({
            components: populatedComponents,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error("Error in /api/components/inactive:", error);
        return NextResponse.json(
            { error: "Failed to fetch inactive components" },
            { status: 500 }
        );
    }
} 