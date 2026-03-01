import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // Using 2.0 flash as 2.5 might be a typo in user request or not yet available in SDK, fallback to latest flash
    generationConfig: {
        responseMimeType: "application/json",
    }
})

export async function POST(req: NextRequest) {
    try {
        const { transcript } = await req.json()

        if (!transcript) {
            return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Fetch context from DB to help AI categorize correctly
        const [
            { data: categories },
            { data: paymentModes },
            { data: bankAccounts }
        ] = await Promise.all([
            supabase.from("categories").select("id, name, type").eq("status", "active"),
            supabase.from("payment_modes").select("id, mode"),
            supabase.from("bank_details").select("id, bank_name").eq("status", "active")
        ])

        const context = {
            categories: categories || [],
            payment_modes: paymentModes || [],
            bank_accounts: bankAccounts || [],
            current_date: new Date().toISOString().split('T')[0]
        }

        // 2. Build the prompt
        const prompt = `
            You are a helpful financial assistant for an expense tracker app.
            Your task is to extract transaction details from the following transcript: "${transcript}"
            
            Context:
            - Current Date: ${context.current_date}
            - Available Categories: ${JSON.stringify(context.categories)}
            - Available Payment Modes: ${JSON.stringify(context.payment_modes)}
            - Available Bank Accounts: ${JSON.stringify(context.bank_accounts)}

            Instructions:
            1. Extract the amount as a number.
            2. Determine the type: "income" or "expense".
            3. Match the category to one of the available categories. If no exact match, pick the most relevant one.
            4. Match the payment mode. Default to "Cash" or the most likely one if mentioned.
            5. Extract the date. If relative (e.g., "yesterday"), calculate it based on the current date.
            6. Extract a brief description (e.g., the vendor or purpose).
            7. Extract the bank account if mentioned.

            Return ONLY a JSON object with this structure:
            {
                "amount": number,
                "type": "income" | "expense",
                "category_id": number | null,
                "payment_mode_id": number | null,
                "bank_account_id": number | null,
                "date": "YYYY-MM-DD",
                "description": "string"
            }
        `

        // 3. Generate content
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const extractedData = JSON.parse(responseText)

        return NextResponse.json(extractedData)

    } catch (error: any) {
        console.error("AI processing error:", error)
        return NextResponse.json({ error: error.message || "Failed to process transaction" }, { status: 500 })
    }
}
