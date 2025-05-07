# CODEX: GitHub Repository Browser with CodeSandbox Devboxes

This application allows you to load any GitHub repository and view it in a CodeSandbox devbox environment, providing a full development environment with terminal/console access.

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and pnpm installed
- A CodeSandbox account with API access

### 2. Installation

```bash
# Install dependencies
pnpm install
```

### 3. API Key Configuration

1. Go to [CodeSandbox API Keys](https://codesandbox.io/t/api) to create an API key
2. Enable all permissions for the key
3. Create a `.env.local` file in the project root with:

```
CODESANDBOX_API_KEY=your_api_key_here
```

> ⚠️ Note: Never commit your API key to version control!

### 4. Start the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to use the application.

## How It Works

1. **Repository Loading**: Enter a GitHub repository URL in the input field and click "Load Repository" or press Enter.

2. **File Tree**: The application fetches the file structure of the repository and displays it in a tree view on the left side.

3. **DevBox Creation**: The app uses the CodeSandbox SDK through a server-side API endpoint to create a devbox environment with the repository's files.

4. **Interaction**: You can browse files in the tree view, and the terminal/console of the devbox will be displayed on the right side, allowing you to run commands and see output.

## Architecture

### Components

- **RepoBrowser**: Main component that handles repository URL input and loads repository data.
- **FileTree**: Displays the file structure as a navigable tree.
- **FileViewer**: Embeds the CodeSandbox devbox with terminal/console view.

### API Routes

- **/api/create-devbox**: Server-side endpoint that creates a CodeSandbox devbox using the SDK.

### Technology Stack

- Next.js with App Router
- TypeScript
- CodeSandbox SDK
- React Complex Tree (for file tree navigation)
- Tailwind CSS (for styling)

## Security Considerations

- The CodeSandbox API key is stored as an environment variable and only used server-side.
- API calls to create devboxes are handled through a secure API route to protect the API key.

## Troubleshooting

- **API Key Errors**: Ensure your CodeSandbox API key is properly configured in `.env.local` and has the necessary permissions.
- **Repository Loading Issues**: Verify the GitHub repository URL is correct and publicly accessible.
- **Devbox Creation Failures**: Check the console for detailed error messages.

## Limitations

- The application currently supports public GitHub repositories only.
- Very large repositories might be truncated in the file tree view.
- CodeSandbox devboxes have their own resource limitations based on your account plan.

## Development Notes

The application uses the CodeSandbox SDK to create devboxes, which are isolated development environments. This approach provides:

1. Full VM capabilities (unlike the deprecated Sandboxes)
2. Terminal access for running commands
3. IDE-like capabilities within the browser
4. Persistent development environments

When working with the code, be aware that the SDK operations require server-side execution to protect API keys.
