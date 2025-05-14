import { CodeSandbox } from "@codesandbox/sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Get API key from environment variables
		const apiKey = process.env.CODESANDBOX_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "CodeSandbox API key is not configured" },
				{ status: 500 }
			);
		}

		// Parse request body
		const { sandboxId } = await request.json();

		if (!sandboxId) {
			return NextResponse.json(
				{ error: "Missing required parameter: sandboxId" },
				{ status: 400 }
			);
		}

		// Initialize CodeSandbox SDK
		const sdk = new CodeSandbox(apiKey);

		console.log(`Opening existing devbox with ID: ${sandboxId}`);

		try {
			const sandbox = await sdk.sandbox.open(sandboxId);

			console.log("Successfully connected to sandbox with ID:", sandbox.id);

			// You might want to return more/different info depending on your needs
			return NextResponse.json({
				id: sandbox.id,
				status: "connected", // Or sandbox.status if available and relevant
				message: "Successfully connected to existing DevBox",
				// Add any other relevant details from the 'sandbox' object
			});
		} catch (sdkError: any) {
			console.error("SDK error details when opening sandbox:", sdkError);
			let errorMessage = "Failed to open devbox.";
			if (sdkError.message) {
				errorMessage += ` Details: ${sdkError.message}`;
			}
			// Consider checking sdkError.type for specific error handling
			// e.g., if (sdkError.type === 'not-found') { ... }
			return NextResponse.json(
				{ error: errorMessage, details: sdkError },
				{ status: 500 } // Or a more specific status code like 404 if not found
			);
		}
	} catch (error: any) {
		console.error("Error opening CodeSandbox devbox:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to open devbox" },
			{ status: 500 }
		);
	}
}
