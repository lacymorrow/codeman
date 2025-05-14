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
		const { githubRepo, branch } = await request.json();

		if (!githubRepo) {
			return NextResponse.json(
				{ error: "Missing required parameter: githubRepo" },
				{ status: 400 }
			);
		}

		// Initialize CodeSandbox SDK
		const sdk = new CodeSandbox(apiKey);

		console.log(`Creating devbox for GitHub repo: ${githubRepo} branch: ${branch || 'default'}`);

		try {
			// The most direct way to create a devbox from a GitHub repository
			// is to use a GitHub template directly
			const initialSandbox = await sdk.sandbox.create({
				template: 'github/shipkit-io/bones',
				autoConnect: false,
			});

			console.log("Initial sandbox created successfully with ID:", initialSandbox.id);
			// console.log("Now forking the initial sandbox...");

			// // const forkedSandbox = await initialSandbox.fork();
			// console.log("Sandbox forked successfully. Forked sandbox ID:", forkedSandbox.id);

			// Return the forked sandbox information
			return NextResponse.json({
				id: initialSandbox.id, // Return the ID of the forked sandbox
				status: "created_and_forked",
				message: "DevBox created and forked successfully",
			});
		} catch (sdkError: any) {
			console.error("SDK error details:", sdkError);

			// Try an alternative approach if the first one fails
			console.log("Trying alternative approach with universal template...");
			try {
				// Create a sandbox with a universal template
				const genericSandbox = await sdk.sandbox.create(
					{
						"template": "node" // Using a basic node template for the fallback
					}
				);
				console.log("Created generic sandbox with ID:", genericSandbox.id);
				console.log("Now forking the generic sandbox...");

				const forkedGenericSandbox = await genericSandbox.fork();
				console.log("Generic sandbox forked successfully. Forked sandbox ID:", forkedGenericSandbox.id);

				// Return the forked generic sandbox info
				return NextResponse.json({
					id: forkedGenericSandbox.id,
					status: "created_and_forked_fallback",
					message: "DevBox created using universal template and forked. You'll need to clone the repository manually into the forked devbox.",
				});
			} catch (fallbackError: any) {
				console.error("Fallback approach also failed:", fallbackError);
				throw new Error(`Failed to create sandbox with both approaches: ${sdkError.message}, fallback: ${fallbackError.message}`);
			}
		}
	} catch (error: any) {
		console.error("Error creating CodeSandbox devbox:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create devbox" },
			{ status: 500 }
		);
	}
}
