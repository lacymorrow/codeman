"use client";

import Editor from "@monaco-editor/react";
// import * as monaco from "monaco-editor";
import { useEffect, useState } from "react";

// Configure Monaco Loader (optional, adjust path as needed)
// loader.config({ monaco });

interface FileViewerProps {
  selectedFile: string | null;
  repoInfo: {
    user: string;
    repo: string;
  } | null;
  defaultBranch: string | null;
}

export default function FileViewer({
  selectedFile,
  repoInfo,
  defaultBranch,
}: FileViewerProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("plaintext");

  useEffect(() => {
    // Determine language from file extension
    if (selectedFile) {
      const extension = selectedFile.split(".").pop()?.toLowerCase();
      // Basic language mapping, can be expanded
      switch (extension) {
        case "js":
        case "jsx":
          setLanguage("javascript");
          break;
        case "ts":
        case "tsx":
          setLanguage("typescript");
          break;
        case "css":
          setLanguage("css");
          break;
        case "html":
          setLanguage("html");
          break;
        case "json":
          setLanguage("json");
          break;
        case "md":
          setLanguage("markdown");
          break;
        // Add more languages as needed
        default:
          setLanguage("plaintext");
      }
    } else {
      setLanguage("plaintext");
    }

    async function fetchFileContent() {
      if (!selectedFile || !repoInfo || !defaultBranch) {
        setFileContent(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setFileContent(null);

      try {
        const rawUrl = `https://raw.githubusercontent.com/${repoInfo.user}/${repoInfo.repo}/${defaultBranch}/${selectedFile}`;

        const response = await fetch(rawUrl);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`File not found: ${selectedFile}`);
          } else {
            throw new Error(
              `Failed to fetch file: ${response.status} ${response.statusText}`
            );
          }
        }

        const content = await response.text();
        setFileContent(content);
      } catch (err: any) {
        console.error("Error fetching file content:", err);
        setError(err.message || "Failed to fetch file content");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFileContent();
  }, [selectedFile, repoInfo, defaultBranch]);

  if (!selectedFile) {
    return (
      <div className="file-viewer empty-state">
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  // Handle loading and error states before rendering editor
  if (isLoading) {
    return <div className="file-viewer loading">Loading file content...</div>;
  }

  if (error) {
    return <div className="file-viewer error-message">Error: {error}</div>;
  }

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <h3>{selectedFile}</h3>
      </div>

      <div className="file-viewer-content monaco-editor-container p-0">
        {/* Render Monaco Editor */}
        {fileContent !== null ? (
          <Editor
            height="100%" // Use container height
            language={language}
            value={fileContent}
            theme="vs-dark" // Or use 'light' or other themes
            options={{
              readOnly: false, // Allow editing
              minimap: { enabled: true },
              // Add other Monaco options as needed
            }}
            // Add onChange handler if you need to track edits
            // onChange={(newValue) => console.log('Content changed:', newValue)}
          />
        ) : (
          <div className="folder-message">
            Could not load file content or file is empty.
          </div>
        )}
      </div>
    </div>
  );
}
