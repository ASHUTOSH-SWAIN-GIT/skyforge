"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Key, X, Plus, GripVertical, Trash2, Edit2 } from "lucide-react";
import { useCanvasStore, Column, TableNodeData } from "./store";

const DATA_TYPES = [
  "uuid",
  "serial",
  "varchar(255)",
  "text",
  "integer",
  "bigint",
  "smallint",
  "boolean",
  "timestamp",
  "timestamptz",
  "date",
  "time",
  "decimal(10,2)",
  "float",
  "double precision",
  "jsonb",
  "json",
  "bytea",
];

function TableNode({ id, data, selected }: NodeProps<TableNodeData>) {
  const { updateTableName, addColumn, updateColumn, deleteColumn, deleteTable, toggleColumnNotNull, toggleAllColumnsNotNull } =
    useCanvasStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"name" | "type" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handleDeleteTable = () => {
    if (showDeleteConfirm) {
      deleteTable(id);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Check if all columns (except primary keys) are NOT NULL
  const allColumnsNotNull = data.columns.length > 0 && data.columns.every((col: Column) => {
    // Primary keys are always NOT NULL, so exclude them from the check
    if (col.isPrimaryKey) return true;
    return (col.constraints || []).includes("NN");
  });

  const handleToggleAllNotNull = () => {
    toggleAllColumnsNotNull(id);
  };

  const handleToggleColumnNotNull = (columnId: string) => {
    toggleColumnNotNull(id, columnId);
  };

  return (
    <div 
      className={`bg-mocha-mantle border rounded-xl shadow-lg min-w-[300px] overflow-hidden transition-all duration-200 ${
        selected 
          ? "border-mocha-mauve shadow-mocha-mauve/20" 
          : "border-mocha-surface0 hover:border-mocha-surface1"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-mocha-surface0/50 border-b border-mocha-surface0">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-mocha-overlay0 hover:text-mocha-subtext0">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Table Name */}
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
            className="flex-1 bg-mocha-base text-mocha-text text-sm font-semibold px-2 py-1 rounded border border-mocha-mauve focus:outline-none"
          />
        ) : (
          <div 
            className="flex-1 flex items-center gap-2 group cursor-pointer"
            onClick={() => setIsEditingName(true)}
          >
            <h3 className="font-semibold text-mocha-text text-sm">
              {data.name}
            </h3>
            <Edit2 className="w-3 h-3 text-mocha-overlay0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Delete Table Button */}
        <button
          onClick={handleDeleteTable}
          className={`p-1.5 rounded transition-all ${
            showDeleteConfirm 
              ? "bg-mocha-red text-mocha-crust" 
              : "hover:bg-mocha-surface1 text-mocha-overlay0 hover:text-mocha-red"
          }`}
          title={showDeleteConfirm ? "Click again to confirm" : "Delete table"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* All Columns NOT NULL Toggle */}
      {data.columns.length > 0 && allColumnsNotNull && (
        <div className="px-3 py-2 border-b border-mocha-surface0/50 bg-mocha-surface0/20">
          <button
            onClick={handleToggleAllNotNull}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0/50 rounded transition-colors"
            title="All columns are NOT NULL. Click to make them nullable."
          >
            <span className="flex items-center gap-2">
              <span className="text-mocha-peach font-medium">All columns NOT NULL</span>
            </span>
            <span className="text-[10px] text-mocha-overlay0">Click to toggle off</span>
          </button>
        </div>
      )}

      {/* Column List */}
      <div className="py-1">
        {data.columns.length === 0 ? (
          <div className="px-4 py-4 text-center text-mocha-overlay0 text-sm">
            No columns yet. Add one below.
          </div>
        ) : (
          data.columns.map((column: Column) => (
            <div
              key={column.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-mocha-surface0/30 transition-colors group relative"
            >
              {/* Left Handle - Target */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${column.id}-target`}
                style={{
                  width: 10,
                  height: 10,
                  background: column.isPrimaryKey ? "#f9e2af" : "#6c7086",
                  border: "2px solid #313244",
                  borderRadius: "50%",
                  cursor: "crosshair",
                  left: -5,
                  zIndex: 20,
                }}
                className="!opacity-60 group-hover:!opacity-100 hover:!scale-125 transition-all"
              />

              {/* Primary Key Toggle */}
              <button
                onClick={() => handleTogglePrimaryKey(column.id, column.isPrimaryKey)}
                className={`flex-shrink-0 p-1 rounded transition-colors ${
                  column.isPrimaryKey
                    ? "text-mocha-yellow bg-mocha-yellow/10"
                    : "text-mocha-overlay0 hover:text-mocha-yellow hover:bg-mocha-yellow/10"
                }`}
                title={column.isPrimaryKey ? "Primary Key (click to remove)" : "Set as Primary Key"}
              >
                <Key className="w-3.5 h-3.5" />
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
                      handleColumnFieldChange(column.id, "name", e.currentTarget.value);
                    } else if (e.key === "Escape") {
                      setEditingColumnId(null);
                      setEditingField(null);
                    }
                  }}
                  className="flex-1 bg-mocha-base text-mocha-text text-sm px-2 py-0.5 rounded border border-mocha-mauve focus:outline-none min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  className="text-mocha-text text-sm flex-1 cursor-pointer hover:text-mocha-mauve truncate"
                  onClick={() => {
                    setEditingColumnId(column.id);
                    setEditingField("name");
                  }}
                  title="Click to edit"
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
                  className="text-mocha-subtext0 text-xs font-mono bg-mocha-base border border-mocha-mauve rounded px-2 py-1 focus:outline-none"
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
                  className="text-mocha-overlay0 text-xs font-mono cursor-pointer hover:text-mocha-subtext0 bg-mocha-surface0/50 px-2 py-0.5 rounded flex-shrink-0"
                  onClick={() => {
                    setEditingColumnId(column.id);
                    setEditingField("type");
                  }}
                  title="Click to change type"
                >
                  {column.type}
                </span>
              )}

              {/* Not Null Badge - Clickable to toggle */}
              {column.constraints && column.constraints.includes("NN") ? (
                <button
                  onClick={() => handleToggleColumnNotNull(column.id)}
                  className="text-[10px] text-mocha-peach font-medium flex-shrink-0 px-1.5 py-0.5 rounded hover:bg-mocha-peach/10 transition-colors"
                  title="Click to remove NOT NULL constraint"
                >
                  NN
                </button>
              ) : !column.isPrimaryKey ? (
                <button
                  onClick={() => handleToggleColumnNotNull(column.id)}
                  className="text-[10px] text-mocha-overlay0 font-medium flex-shrink-0 px-1.5 py-0.5 rounded hover:bg-mocha-surface0 hover:text-mocha-peach transition-colors opacity-0 group-hover:opacity-100"
                  title="Click to add NOT NULL constraint"
                >
                  NULL
                </button>
              ) : null}

              {/* Delete Column */}
              <button
                onClick={() => deleteColumn(id, column.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-mocha-red/20 rounded text-mocha-overlay0 hover:text-mocha-red flex-shrink-0"
                title="Delete column"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Right Handle - Source */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${column.id}-source`}
                style={{
                  width: 10,
                  height: 10,
                  background: column.isPrimaryKey ? "#f9e2af" : "#6c7086",
                  border: "2px solid #313244",
                  borderRadius: "50%",
                  cursor: "crosshair",
                  right: -5,
                  zIndex: 20,
                }}
                className="!opacity-60 group-hover:!opacity-100 hover:!scale-125 transition-all"
              />
            </div>
          ))
        )}
      </div>

      {/* Add Column Button */}
      <div className="px-3 py-2 border-t border-mocha-surface0/50">
        <button
          onClick={() => addColumn(id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-mocha-overlay0 hover:text-mocha-text hover:bg-mocha-surface0/50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </button>
      </div>
    </div>
  );
}

export default memo(TableNode);
