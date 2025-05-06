"use client";

import { cn } from "@/lib/utils"; // Assuming you have this utility from shadcn/ui
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react"; // Icons
import { useState } from "react";
import {
  ControlledTreeEnvironment,
  Tree,
  TreeItem,
  TreeItemIndex,
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css"; // Using modern theme

// Define the structure for your custom file/folder DATA
export interface FileTreeData {
  type: "file" | "folder";
  path: string; // Store the full path here for easier access
  // Add any other relevant data here, e.g., size, sha
}

// Props for the FileTree component
interface FileTreeProps {
  // The items prop expects Record<TreeItemIndex, TreeItem<YourDataType>>
  treeData: Record<TreeItemIndex, TreeItem<FileTreeData>>;
  onSelect: (item: TreeItem<FileTreeData>) => void; // Pass the full TreeItem back
}

export default function FileTree({ treeData, onSelect }: FileTreeProps) {
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

  // onSelectItems provides selected indices and the treeId
  const handleSelect = (selectedIndices: TreeItemIndex[], treeId: string) => {
    // Assuming single selection for now
    const selectedItemId = selectedIndices[0];

    setSelectedItems(selectedIndices); // Update internal selected state

    if (selectedItemId !== undefined) {
      // Access the selected item data from the treeData state using the index
      const selectedItem = treeData[selectedItemId]; // Already typed as TreeItem<FileTreeData>
      if (selectedItem) {
        onSelect(selectedItem); // Call the prop function passed from RepoBrowser
      }
    } else {
      // Handle deselection if needed (e.g., call onSelect with null or specific indicator)
      // For now, just update internal state
    }
  };

  return (
    <ControlledTreeEnvironment<FileTreeData> // Generic should be the DATA type
      items={treeData}
      // getItemTitle expects TreeItem<DataType> as input
      getItemTitle={(item) =>
        item.data.path.split("/").pop() || item.index.toString()
      } // Display last part of path or index
      viewState={{
        "file-tree": {
          focusedItem,
          expandedItems,
          selectedItems,
        },
      }}
      // Event handlers receive TreeItem<DataType>
      onFocusItem={(item) => setFocusedItem(item.index)}
      onExpandItem={(item) => setExpandedItems([...expandedItems, item.index])}
      onCollapseItem={(item) =>
        setExpandedItems(
          expandedItems.filter((expandedItem) => expandedItem !== item.index)
        )
      }
      onSelectItems={handleSelect} // Correctly typed now
    >
      <Tree<FileTreeData> // Generic should be the DATA type
        treeId="file-tree"
        rootItem="root"
        treeLabel="File Explorer"
        // Destructure props based on library's RenderItemParams<DataType>
        renderItem={({
          item,
          depth,
          children,
          title,
          arrow,
          context,
          info, // info is of type TreeInformation
        }) => {
          const hasChildren = item.children && item.children.length > 0;
          return (
            <li
              {...context.itemContainerWithChildrenProps}
              className={cn("rct-tree-item-li")}
            >
              <div
                {...context.itemContainerWithoutChildrenProps}
                style={{ paddingLeft: `${depth * 16}px` }}
                className={cn(
                  "flex items-center py-1 px-2 cursor-pointer rounded-md",
                  "hover:bg-accent/50",
                  context.isFocused && "bg-accent text-accent-foreground",
                  context.isSelected && "bg-primary/20 text-primary-foreground",
                  context.isExpanded ? "font-medium" : ""
                )}
              >
                {item.isFolder && (
                  <div
                    {...context.arrowProps}
                    className="rct-tree-item-arrow-container shrink-0 w-4 mr-1"
                  >
                    <div {...context.interactiveElementProps}>{arrow}</div>
                  </div>
                )}
                {!item.isFolder && <div className="shrink-0 w-4 mr-1"></div>}

                <div
                  className="flex items-center gap-1.5 flex-grow min-w-0"
                  {...context.interactiveElementProps}
                >
                  {item.isFolder ? (
                    <FolderIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="rct-tree-item-title flex-grow truncate">
                    {title}
                  </span>
                </div>
              </div>
              {children}
            </li>
          );
        }}
        renderItemArrow={({ item, context }) => {
          const hasChildren = item.children && item.children.length > 0;
          return item.isFolder ? (
            <ChevronRightIcon
              className={cn(
                "rct-tree-item-arrow h-4 w-4 text-muted-foreground transition-transform duration-200",
                context.isExpanded && "rotate-90",
                context.isFocused && "text-accent-foreground",
                !hasChildren && "opacity-0 cursor-default" // Use calculated hasChildren
              )}
            />
          ) : null;
        }}
        renderTreeContainer={({ children, containerProps }) => (
          <ul {...containerProps} className="rct-tree-root-ul p-1">
            {children}
          </ul>
        )}
      />
    </ControlledTreeEnvironment>
  );
}
