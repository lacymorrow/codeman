"use client";

import { useEffect, useState } from "react";

interface FileViewerProps {
  selectedFile: string | null; // May become less relevant if CSB handles file navigation
  repoInfo: {
    user: string;
    repo: string;
  } | null;
  defaultBranch: string | null;
  sandboxEmbedUrl: string | null; // New prop
}

export default function FileViewer({
  selectedFile, // Keep for now, might be used to append ?file= to sandboxEmbedUrl
  repoInfo, // Keep for context, though sandboxEmbedUrl is primary
  defaultBranch, // Keep for context
  sandboxEmbedUrl,
}: FileViewerProps) {
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (sandboxEmbedUrl) {
      // Attempt to add parameters for console/terminal view and dark theme.
      // These are based on documentation and may need adjustment.
      // `view=terminal` seems to be for their newer "Devbox" or "Repository" environments.
      // `previewwindow=console` was for older sandboxes.
      // `editorsize=0` to hide editor, `hidenavigation=1` to hide CodeSandbox UI nav if possible.
      const params = new URLSearchParams();
      params.set("theme", "dark");
      // Try params for showing terminal/console and hiding editor/nav
      params.set("view", "terminal"); // For newer CSB Repositories/DevBoxes
      params.set("hidenavigation", "1");
      // params.set("editorsize", "0"); // This might be too aggressive initially
      // params.set("previewwindow", "console"); // Alternative for older sandbox devtools
      // params.set("expanddevtools", "1"); // Another option for devtools
      params.set("runonclick", "0"); // Auto-run the sandbox if possible

      // If a file is selected, try to append it to the URL
      // The base URL already includes the branch: /tree/branch
      // So, we need to append the file path relative to the repo root.
      // Example: https://codesandbox.io/embed/p/github/user/repo/tree/main?file=/src/App.js
      if (selectedFile) {
        params.set("file", `/${selectedFile}`);
      }

      const urlWithParams = `${sandboxEmbedUrl}?${params.toString()}`;
      setCurrentEmbedUrl(urlWithParams);
      console.log("FileViewer will load CodeSandbox URL:", urlWithParams);
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
      {/* Header can be simplified or removed if CSB provides enough context */}
      {/* <div className="file-viewer-header p-2 border-b">
        <h3>
          {selectedFile
            ? `Viewing: ${selectedFile}`
            : "CodeSandbox Environment"}
        </h3>
      </div> */}

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
          title={`CodeSandbox Environment - ${repoInfo?.repo}`}
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking; clipboard-write; clipboard-read"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
        ></iframe>
      </div>
    </div>
  );
}
