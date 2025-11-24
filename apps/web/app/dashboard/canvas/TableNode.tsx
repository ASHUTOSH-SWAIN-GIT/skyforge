"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Key, MoreVertical, X } from "lucide-react";
import { useCanvasStore, Column, TableNodeData } from "./store";

const DATA_TYPES = [
  "uuid",
  "varchar(255)",
  "text",
  "integer",
  "bigint",
  "boolean",
  "timestamp",
  "date",
  "decimal(10,2)",
  "jsonb",
];

function TableNode({ id, data, selected }: NodeProps<TableNodeData>) {
  const { updateTableName, addColumn, updateColumn, deleteColumn, deleteTable } =
    useCanvasStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"name" | "type" | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameChange = (newName: string) => {
    if (newName.trim()) {
      updateTableName(id, newName.trim());
    }
    setIsEditingName(false);
  };

  const handleColumnFieldChange = (
    columnId: string,
    field: "name" | "type",
    value: string
  ) => {
    if (field === "name" && value.trim()) {
      updateColumn(id, columnId, { name: value.trim() });
    } else if (field === "type") {
      updateColumn(id, columnId, { type: value });
    }
    setEditingColumnId(null);
    setEditingField(null);
  };

  const handleTogglePrimaryKey = (columnId: string, currentValue: boolean) => {
    updateColumn(id, columnId, { isPrimaryKey: !currentValue });
  };

  return (
    <div className="bg-mocha-mantle/80 backdrop-blur-sm border border-mocha-surface0 rounded-2xl shadow-xl min-w-[280px] overflow-hidden transition-all duration-300 hover:shadow-mocha-mauve/5 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-mocha-surface0/50 to-transparent border-b border-mocha-surface0">
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            defaultValue={data.name}
            onBlur={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleNameChange(e.currentTarget.value);
              } else if (e.key === "Escape") {
                setIsEditingName(false);
              }
            }}
            className="flex-1 bg-mocha-surface0 text-mocha-text text-sm font-bold px-2 py-1 rounded border border-mocha-mauve focus:outline-none"
          />
        ) : (
          <h3
            className="font-bold text-mocha-text text-sm flex-1 cursor-text"
            onDoubleClick={() => setIsEditingName(true)}
          >
            {data.name}
          </h3>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => deleteTable(id)}
            className="p-1 hover:bg-mocha-red/20 rounded transition-colors text-mocha-subtext0 hover:text-mocha-red"
            title="Delete table"
          >
            <X className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-mocha-surface0 rounded transition-colors text-mocha-subtext0 hover:text-mocha-text">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body - Column List */}
      <div className="py-2">
        {data.columns.map((column: Column) => (
          <div
            key={column.id}
            className="flex items-center gap-2 px-4 py-2.5 hover:bg-mocha-surface0/40 transition-colors group relative"
            title="Drag from right handle to connect, or connect to left handle"
          >
            {/* Left Handle - Target (for incoming connections) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${column.id}-target`}
              style={{
                width: 12,
                height: 12,
                background: column.isPrimaryKey ? "#f9e2af" : "#bac2de",
                border: "2px solid #1e1e2e",
                borderRadius: "50%",
                cursor: "crosshair",
                left: -6,
                zIndex: 20,
                opacity: 0.6,
              }}
              className="group-hover:!opacity-100 group-hover:!scale-125 transition-all duration-200"
            />

            {/* Key Icon - Clickable */}
            <button
              onClick={() => handleTogglePrimaryKey(column.id, column.isPrimaryKey)}
              className={`flex-shrink-0 transition-colors ml-1 ${
                column.isPrimaryKey
                  ? "text-mocha-yellow"
                  : "text-mocha-subtext0 hover:text-mocha-yellow"
              }`}
              title={column.isPrimaryKey ? "Primary Key" : "Set as Primary Key"}
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Column Name */}
            {editingColumnId === column.id && editingField === "name" ? (
              <input
                type="text"
                defaultValue={column.name}
                onBlur={(e) =>
                  handleColumnFieldChange(column.id, "name", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleColumnFieldChange(
                      column.id,
                      "name",
                      e.currentTarget.value
                    );
                  } else if (e.key === "Escape") {
                    setEditingColumnId(null);
                    setEditingField(null);
                  }
                }}
                className="flex-1 bg-mocha-surface0 text-mocha-text text-sm px-2 py-0.5 rounded border border-mocha-mauve focus:outline-none"
                autoFocus
              />
            ) : (
              <span
                className="text-mocha-text text-sm flex-1 cursor-text"
                onDoubleClick={() => {
                  setEditingColumnId(column.id);
                  setEditingField("name");
                }}
              >
                {column.name}
              </span>
            )}

            {/* Data Type */}
            {editingColumnId === column.id && editingField === "type" ? (
              <select
                defaultValue={column.type}
                onChange={(e) =>
                  handleColumnFieldChange(column.id, "type", e.target.value)
                }
                onBlur={() => {
                  setEditingColumnId(null);
                  setEditingField(null);
                }}
                className="text-mocha-subtext0 text-xs font-mono bg-mocha-surface0 border border-mocha-mauve rounded px-2 py-0.5 focus:outline-none"
                autoFocus
              >
                {DATA_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="text-mocha-subtext0 text-xs font-mono cursor-pointer hover:text-mocha-text"
                onDoubleClick={() => {
                  setEditingColumnId(column.id);
                  setEditingField("type");
                }}
              >
                {column.type}
              </span>
            )}

            {/* Constraints */}
            <div className="flex gap-1 flex-shrink-0">
              {column.constraints.map((constraint, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-xs bg-mocha-surface0 text-mocha-subtext0 rounded"
                >
                  {constraint}
                </span>
              ))}
            </div>

            {/* Delete Column Button */}
            <button
              onClick={() => deleteColumn(id, column.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-mocha-red/20 rounded text-mocha-subtext0 hover:text-mocha-red flex-shrink-0"
              title="Delete column"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Right Handle - Source (for outgoing connections) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${column.id}-source`}
              style={{
                width: 12,
                height: 12,
                background: column.isPrimaryKey ? "#f9e2af" : "#bac2de",
                border: "2px solid #1e1e2e",
                borderRadius: "50%",
                cursor: "crosshair",
                right: -6,
                zIndex: 20,
                opacity: 0.6,
              }}
              className="group-hover:!opacity-100 group-hover:!scale-125 transition-all duration-200"
            />
          </div>
        ))}
      </div>

      {/* Footer - Add Column Button */}
      <div className="px-4 py-2.5 border-t border-mocha-surface0">
        <button
          onClick={() => addColumn(id)}
          className="w-full text-left px-2 py-1.5 text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 rounded transition-colors"
        >
          + Add Column
        </button>
      </div>
    </div>
  );
}

export default memo(TableNode);

