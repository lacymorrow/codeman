"use client";

import { useEffect, useState } from "react";

interface FileViewerProps {
  selectedFile: string | null; // May become less relevant if CSB handles file navigation
  repoInfo: {
    user: string;
    repo: string;
  } | null;
  defaultBranch: string | null;
  sandboxEmbedUrl: string | null; // We'll keep this prop name for backwards compatibility
  isUniversalTemplate?: boolean; // New prop to indicate if we're using universal template
}

export default function FileViewer({
  selectedFile, // Keep for now, might be used to append ?file= to sandboxEmbedUrl
  repoInfo, // Keep for context, though sandboxEmbedUrl is primary
  defaultBranch, // Keep for context
  sandboxEmbedUrl, // This is now devboxEmbedUrl in practice
  isUniversalTemplate = false, // Default to false
}: FileViewerProps) {
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (sandboxEmbedUrl) {
      // For devboxes, the URL format and parameters are different
      // The base URL should be like: https://codesandbox.io/p/devbox/{id}

      // Construct URL with parameters for devbox terminal view
      const params = new URLSearchParams();

      // Devbox-specific parameters
      params.set("terminal", "1"); // Show terminal
      params.set("consolePanelVisible", "1"); // Show console
      params.set("terminalHeight", "50"); // Terminal height percentage (adjust as needed)
      params.set("hideNavigation", "1"); // Hide navigation if possible
      params.set("theme", "dark"); // Dark theme

      // If a file is selected, include it in the URL
      if (selectedFile) {
        params.set("file", `/${selectedFile}`);
      }

      const urlWithParams = `${sandboxEmbedUrl}?${params.toString()}`;
      setCurrentEmbedUrl(urlWithParams);
      console.log(
        "FileViewer will load CodeSandbox Devbox URL:",
        urlWithParams
      );
    } else {
      setCurrentEmbedUrl(null);
    }
  }, [sandboxEmbedUrl, selectedFile]);

  if (!currentEmbedUrl) {
    return (
      <div className="file-viewer empty-state flex items-center justify-center h-full">
        <p className="text-gray-500">
          {repoInfo
            ? "Loading CodeSandbox environment..."
            : "No repository loaded or CodeSandbox URL not available."}
        </p>
      </div>
    );
  }

  // The Monaco editor related states and logic are removed.
  // const [fileContent, setFileContent] = useState<string | null>(null);
  // const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string | null>(null);
  // const [language, setLanguage] = useState<string>("plaintext");
  // useEffect for fetching file content is removed.

  return (
    <div className="file-viewer w-full h-full flex flex-col">
      {isUniversalTemplate && repoInfo && (
        <div className="clone-instructions bg-gray-800 text-white p-3 border-b border-gray-700">
          <h3 className="text-lg font-bold mb-2">
            Repository Cloning Required
          </h3>
          <p className="mb-2">
            Using universal template. To access your repository, run this
            command in the terminal below:
          </p>
          <div className="clone-command bg-black p-2 rounded font-mono text-green-400 select-all">
            git clone https://github.com/{repoInfo.user}/{repoInfo.repo}.git
            repo && cd repo
            {defaultBranch &&
              defaultBranch !== "main" &&
              ` && git checkout ${defaultBranch}`}
          </div>
        </div>
      )}

      <div className="codesandbox-embed-container flex-grow w-full h-full p-0">
        <iframe
          src={currentEmbedUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "4px",
            overflow: "hidden",
          }}
          title={`CodeSandbox Devbox - ${repoInfo?.repo}`}
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking; clipboard-write; clipboard-read"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
        />
      </div>
    </div>
  );
}
