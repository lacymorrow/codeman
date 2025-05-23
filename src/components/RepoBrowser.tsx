"use client";
import { useCallback, useEffect, useState } from "react";
import type { TreeItem, TreeItemIndex } from "react-complex-tree";
import "../App.css";
import type { FileTreeData } from "./FileTree";
import FileTree from "./FileTree";
import FileViewer from "./FileViewer";

interface RepoInfo {
  user: string;
  repo: string;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export default function RepoBrowser() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/shipkit-io/bones");
  const [status, setStatus] = useState(
    "Enter a GitHub repository URL to load."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<
    Record<TreeItemIndex, TreeItem<FileTreeData>>
  >({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [devboxEmbedUrl, setDevboxEmbedUrl] = useState<string | null>(null);
  const [devboxId, setDevboxId] = useState<string | null>(null);
  const [isUniversalTemplate, setIsUniversalTemplate] = useState(false);
  const [savedDevboxIds, setSavedDevboxIds] = useState<string[]>([]);

  useEffect(() => {
    // Load saved devbox IDs from local storage on component mount
    const storedIds = localStorage.getItem("savedDevboxIds");
    if (storedIds) {
      try {
        const parsedIds = JSON.parse(storedIds);
        if (Array.isArray(parsedIds)) {
          setSavedDevboxIds(parsedIds);
        }
      } catch (error) {
        console.error(
          "Failed to parse savedDevboxIds from localStorage:",
          error
        );
      }
    }
  }, []);

  const isValidGitHubUrl = (url: string) => {
    const githubRegex =
      /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+\/?$/;
    return githubRegex.test(url);
  };

  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return null;
    }
    return {
      user: match[1],
      repo: match[2].replace(/\.git$/, ""),
    };
  };

  const loadRepository = useCallback(async () => {
    if (!repoUrl.trim()) {
      setStatus("Please enter a GitHub repository URL.");
      setIsError(true);
      return;
    }

    if (!isValidGitHubUrl(repoUrl)) {
      setStatus("Invalid GitHub repository URL format.");
      setIsError(true);
      return;
    }

    const info = extractRepoInfo(repoUrl);
    if (!info) {
      setStatus("Could not extract repository information from URL.");
      setIsError(true);
      return;
    }

    setStatus("Loading repository...");
    setIsLoading(true);
    setIsError(false);
    setRepoInfo(info);
    setTreeData({});
    setSelectedFile(null);
    setDefaultBranch(null);
    setDevboxEmbedUrl(null);
    setDevboxId(null);
    setIsUniversalTemplate(false);

    try {
      setStatus("Fetching repository metadata...");
      const repoMetaUrl = `https://api.github.com/repos/${info.user}/${info.repo}`;
      const metaResponse = await fetch(repoMetaUrl);

      if (!metaResponse.ok) {
        throw new Error(
          `Failed to fetch repository metadata (${metaResponse.status})`
        );
      }

      const repoData = await metaResponse.json();
      const branch = repoData.default_branch;
      setDefaultBranch(branch);
      setStatus(`Using default branch: ${branch}. Fetching file tree...`);

      const treeUrl = `https://api.github.com/repos/${info.user}/${info.repo}/git/trees/${branch}?recursive=1`;
      const treeResponse = await fetch(treeUrl);

      if (!treeResponse.ok) {
        throw new Error(`Failed to fetch file tree (${treeResponse.status})`);
      }

      const treeResult: GitHubTreeResponse = await treeResponse.json();

      if (treeResult.truncated) {
        console.warn(
          "File tree is truncated. Some files/folders might be missing."
        );
      }

      // Create a CodeSandbox devbox using our server API
      setStatus("Creating CodeSandbox devbox environment...");

      // Call our API route that securely handles the CodeSandbox SDK
      const createDevboxUrl = "/api/create-devbox";
      const devboxResponse = await fetch(createDevboxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubRepo: `${info.user}/${info.repo}`,
          branch: branch,
        }),
      });

      if (!devboxResponse.ok) {
        const errorData = await devboxResponse.json();
        throw new Error(
          `Failed to create devbox: ${errorData.error || devboxResponse.statusText}`
        );
      }

      const devboxData = await devboxResponse.json();
      if (!devboxData.id) {
        throw new Error("Failed to get devbox ID from API response.");
      }

      setDevboxId(devboxData.id);

      // Save the new devbox ID to local storage
      try {
        const currentSavedIds = [...savedDevboxIds];
        if (!currentSavedIds.includes(devboxData.id)) {
          currentSavedIds.push(devboxData.id);
          localStorage.setItem(
            "savedDevboxIds",
            JSON.stringify(currentSavedIds)
          );
          setSavedDevboxIds(currentSavedIds); // Update state
        }
      } catch (error) {
        console.error("Failed to save devbox ID to localStorage:", error);
        // Optionally, inform the user that saving failed but the devbox was created
      }

      // Check if this is a universal template
      setIsUniversalTemplate(
        devboxData.message?.includes("universal template") || false
      );

      // Construct the embed URL for the devbox
      const newEmbedUrl = `https://codesandbox.io/p/devbox/${devboxData.id}`;
      setDevboxEmbedUrl(newEmbedUrl);

      console.log(
        "CodeSandbox devbox environment created. Embed URL:",
        newEmbedUrl
      );
      setStatus("Repository loaded and CodeSandbox devbox environment ready.");

      // Build tree data for the file explorer
      const transformedData: Record<TreeItemIndex, TreeItem<FileTreeData>> = {
        root: {
          index: "root",
          isFolder: true,
          children: [],
          data: { type: "folder", path: "root" },
        },
      };

      for (const item of treeResult.tree) {
        const pathParts = item.path.split("/");
        let currentPath = "";
        let parentIndex = "root";

        for (const [index, part] of pathParts.entries()) {
          const previousPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const isLastPart = index === pathParts.length - 1;
          const itemIndex = currentPath;

          if (index > 0) {
            parentIndex = previousPath;
          }

          if (!transformedData[itemIndex]) {
            const isFolder = isLastPart ? item.type === "tree" : true;
            transformedData[itemIndex] = {
              index: itemIndex,
              isFolder: isFolder,
              children: isFolder ? [] : undefined,
              data: {
                type: isFolder ? "folder" : "file",
                path: item.path,
              },
            };

            if (transformedData[parentIndex]?.children) {
              if (!transformedData[parentIndex].children!.includes(itemIndex)) {
                transformedData[parentIndex].children!.push(itemIndex);
              }
            } else if (parentIndex !== "root") {
              // Avoid warning for root's direct children if pathParts is single
              console.warn(
                `Parent node ${parentIndex} not found or missing children array for ${itemIndex}`
              );
            } else if (
              parentIndex === "root" &&
              transformedData.root.children &&
              !transformedData.root.children!.includes(itemIndex)
            ) {
              transformedData.root.children!.push(itemIndex);
            }
          } else {
            // Existing item, ensure folder properties if it's a path segment or a tree item
            if (!isLastPart || item.type === "tree") {
              transformedData[itemIndex].isFolder = true;
              transformedData[itemIndex].data.type = "folder";
              if (!transformedData[itemIndex].children) {
                transformedData[itemIndex].children = [];
              }
            }
            // Ensure it's added to parent's children list if not already present
            if (
              transformedData[parentIndex]?.children &&
              !transformedData[parentIndex].children!.includes(itemIndex) &&
              parentIndex !== itemIndex
            ) {
              if (
                parentIndex === "root" &&
                transformedData.root.children &&
                !transformedData.root.children!.includes(itemIndex)
              ) {
                transformedData.root.children!.push(itemIndex);
              } else if (
                transformedData[parentIndex]?.children &&
                !transformedData[parentIndex].children!.includes(itemIndex)
              ) {
                transformedData[parentIndex].children!.push(itemIndex);
              }
            }
          }
        }
      }

      setTreeData(transformedData);
    } catch (error: any) {
      console.error("Error loading repository:", error);
      setStatus(`Error: ${error.message}`);
      setIsError(true);
      setRepoInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [repoUrl]);

  useEffect(() => {
    loadRepository();
  }, []);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      loadRepository();
    }
  };

  const handleFileSelect = (item: TreeItem<FileTreeData>) => {
    if (item && !item.isFolder) {
      setSelectedFile(item.data.path);
      setStatus(`Selected file: ${item.data.path}`);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">CODEX</h1>
        <p className="subtitle">BRUTALIST DEV ENVIRONMENT</p>
      </header>

      <main className="main">
        <div className="browser-container">
          <div className="repo-input-container">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://github.com/username/repository"
              className="repo-url-input"
              disabled={isLoading}
            />
            <button
              onClick={loadRepository}
              disabled={isLoading}
              className="load-repo-button"
              type="button"
            >
              {isLoading ? "Loading..." : "Load Repository"}
            </button>
          </div>

          <div className={`status-message ${isError ? "error" : ""}`}>
            {status}
          </div>

          <div className="content-container grid grid-cols-3 gap-4 p-4">
            <div className="file-tree-container col-span-1 border rounded p-2 overflow-auto max-h-[calc(100vh-200px)]">
              {repoInfo && Object.keys(treeData).length > 1 ? (
                <FileTree treeData={treeData} onSelect={handleFileSelect} />
              ) : isLoading ? (
                <p>Loading file tree...</p>
              ) : isError ? (
                <p className="text-red-500">Could not load file tree.</p>
              ) : (
                <p>No repository loaded or tree is empty.</p>
              )}
            </div>
            <div className="file-viewer-container col-span-2 border rounded overflow-auto max-h-[calc(100vh-200px)]">
              <FileViewer
                selectedFile={selectedFile}
                repoInfo={repoInfo}
                defaultBranch={defaultBranch}
                sandboxEmbedUrl={devboxEmbedUrl}
                isUniversalTemplate={isUniversalTemplate}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} CODEX. MIT LICENSE.</p>
      </footer>
    </div>
  );
}
