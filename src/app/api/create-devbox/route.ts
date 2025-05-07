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
            console.log(`Creating devbox with template: github/${githubRepo}${branch ? `:${branch}` : ''}`);

            const sandbox = await sdk.sandbox.create({
                // GitHub template format is 'github/owner/repo:branch'
                // If branch is not specified, it uses the default branch
                template: `github/${githubRepo}${branch ? `:${branch}` : ''}`
            });

            console.log("Sandbox created successfully with ID:", sandbox.id);

            // Return the sandbox information
            return NextResponse.json({
                id: sandbox.id,
                status: "created",
                message: "DevBox created successfully",
            });
        } catch (sdkError: any) {
            console.error("SDK error details:", sdkError);

            // Try an alternative approach if the first one fails
            console.log("Trying alternative approach with universal template...");
            try {
                // Create a sandbox with a universal template
                const sandbox = await sdk.sandbox.create();
                console.log("Created generic sandbox with ID:", sandbox.id);

                // Return the sandbox info
                return NextResponse.json({
                    id: sandbox.id,
                    status: "created",
                    message: "DevBox created successfully with universal template. You'll need to clone the repository manually.",
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
