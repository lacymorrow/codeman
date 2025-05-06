"use client";
import { useCallback, useEffect, useState } from "react";
import { TreeItem, TreeItemIndex } from "react-complex-tree";
import "../App.css";
import FileTree, { FileTreeData } from "./FileTree";
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

      const transformedData: Record<TreeItemIndex, TreeItem<FileTreeData>> = {
        root: {
          index: "root",
          isFolder: true,
          children: [],
          data: { type: "folder", path: "root" },
        },
      };

      treeResult.tree.forEach((item) => {
        const pathParts = item.path.split("/");
        let currentPath = "";

        pathParts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const isLastPart = index === pathParts.length - 1;
          const itemIndex = currentPath;

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

            const parentIndex =
              index === 0 ? "root" : pathParts.slice(0, index).join("/");
            if (transformedData[parentIndex]?.children) {
              if (!transformedData[parentIndex].children!.includes(itemIndex)) {
                transformedData[parentIndex].children!.push(itemIndex);
              }
            } else {
              console.warn(
                `Parent node ${parentIndex} not found or missing children array for ${itemIndex}`
              );
            }
          } else {
            if (!isLastPart || item.type === "tree") {
              transformedData[itemIndex].isFolder = true;
              transformedData[itemIndex].data.type = "folder";
              if (!transformedData[itemIndex].children) {
                transformedData[itemIndex].children = [];
              }
            }
            const parentIndex =
              index === 0 ? "root" : pathParts.slice(0, index).join("/");
            if (
              transformedData[parentIndex]?.children &&
              !transformedData[parentIndex].children!.includes(itemIndex)
            ) {
              transformedData[parentIndex].children!.push(itemIndex);
            }
          }
        });
      });

      setTreeData(transformedData);
      setStatus("Repository loaded successfully.");
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
    } else {
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
