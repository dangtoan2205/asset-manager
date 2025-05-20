import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check authorization
        const userRole = session.user.role;
        if (userRole !== "admin" && userRole !== "manager") {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Get the form data from the request
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No PDF file uploaded" },
                { status: 400 }
            );
        }

        // Check if it's a PDF
        if (!file.name.endsWith(".pdf")) {
            return NextResponse.json(
                { error: "Uploaded file must be a PDF" },
                { status: 400 }
            );
        }

        // Save the file to a temporary location
        const fileName = `${uuidv4()}.pdf`;
        const filePath = path.join(tempDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        // Read the file as base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString("base64");

        // Prepare system prompt
        const systemPrompt = `
      You are a precise invoice information extractor. Extract the following information from the PDF invoice:
      1. Invoice number
      2. Vendor name
      3. Purchase date in YYYY-MM-DD format
      4. Total amount
      5. Currency
      6. Line items, including:
         - Item name
         - Type (device or component)
         - Quantity
         - Unit price
         - Specifications (if available)
      
      Return the data in JSON format as follows:
      {
        "invoiceNumber": "string",
        "vendor": "string",
        "purchaseDate": "YYYY-MM-DD",
        "totalAmount": number,
        "currency": "string",
        "items": [
          {
            "name": "string",
            "type": "device" or "component",
            "quantity": number,
            "unitPrice": number,
            "specifications": {
              "key1": "value1",
              "key2": "value2",
              ...
            }
          },
          ...
        ]
      }
    `;

        // Call OpenAI API to extract invoice information
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract the invoice information from this PDF.",
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:application/pdf;base64,${base64File}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1500,
        });

        // Clean up the temporary file
        fs.unlinkSync(filePath);

        // Get the extracted data
        const extractedContent = response.choices[0]?.message?.content || "";

        let invoiceData;
        try {
            // Find JSON content in the response
            const jsonMatch = extractedContent.match(/```json\n([\s\S]*?)\n```/) ||
                extractedContent.match(/{[\s\S]*}/) ||
                [];

            const jsonContent = jsonMatch[1] || extractedContent;
            invoiceData = JSON.parse(jsonContent.trim());
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            return NextResponse.json(
                { error: "Failed to parse invoice data" },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: invoiceData });
    } catch (error) {
        console.error("Error extracting invoice:", error);
        return NextResponse.json(
            { error: "Error processing the invoice" },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
}; 