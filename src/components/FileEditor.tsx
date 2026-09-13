import React, { useState, useEffect } from "react";
import {
  FileText,
  FileCode,
  Save,
  Trash2,
  PlayCircle,
  Plus,
  Loader2,
  Check,
  Code2,
} from "lucide-react";
import { WorkspaceFile } from "../types";

interface FileEditorProps {
  files: WorkspaceFile[];
  currentEntryFile: string;
  lang: "bn" | "en";
  onSelectEntryFile: (filename: string) => Promise<void>;
  onFileSaved: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  files,
  currentEntryFile,
  lang,
  onSelectEntryFile,
  onFileSaved,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Select first file if none selected or selected was deleted
  useEffect(() => {
    if (files.length > 0) {
      if (!selectedFileName || !files.some((f) => f.name === selectedFileName)) {
        const preferred =
          files.find((f) => f.name === currentEntryFile) ||
          files.find((f) => f.name === "bot.py") ||
          files.find((f) => f.name === "main.py") ||
          files[0];
        setSelectedFileName(preferred.name);
      }
    } else {
      setSelectedFileName("");
      setContent("");
      setOriginalContent("");
    }
  }, [files, currentEntryFile]);

  // Fetch content when selected file changes
  useEffect(() => {
    if (!selectedFileName) return;

    let isMounted = true;
    setIsLoading(true);
    fetch(`/api/workspace/file?name=${encodeURIComponent(selectedFileName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setContent(data.content ?? "");
          setOriginalContent(data.content ?? "");
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFileName]);

  const hasUnsavedChanges = content !== originalContent;

  const handleSave = async () => {
    if (!selectedFileName) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/workspace/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedFileName, content }),
      });
      if (res.ok) {
        setOriginalContent(content);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onFileSaved();
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(lang === "bn" ? `আপনি কি ${filename} ডিলিট করতে চান?` : `Delete ${filename}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/workspace/file?name=${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onFileSaved();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const safeName = newFileName.trim();
    try {
      const res = await fetch("/api/workspace/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: safeName, content: "" }),
      });
      if (res.ok) {
        setNewFileName("");
        setIsCreatingNew(false);
        setSelectedFileName(safeName);
        onFileSaved();
      }
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut Ctrl+S or Cmd+S
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  const lineCount = content.split("\n").length;

  return (
    <div id="file-editor-card" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
      {/* Top File Tabs & Actions Bar */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {files.map((f) => {
            const isSelected = f.name === selectedFileName;
            const isEntry = f.name === currentEntryFile;
            return (
              <button
                key={f.name}
                onClick={() => setSelectedFileName(f.name)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {f.name.endsWith(".py") ? (
                  <FileCode className={`w-3.5 h-3.5 ${isEntry ? "text-emerald-600" : "text-sky-600"}`} />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{f.name}</span>
                {isEntry && (
                  <span
                    className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-sans font-medium"
                    title={lang === "bn" ? "প্রধান এন্ট্রি ফাইল" : "Entry Point File"}
                  >
                    Entry
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors shrink-0"
            title={lang === "bn" ? "নতুন ফাইল তৈরি করুন" : "Create new file"}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "নতুন ফাইল" : "New File"}</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedFileName && selectedFileName.endsWith(".py") && selectedFileName !== currentEntryFile && (
            <button
              onClick={() => onSelectEntryFile(selectedFileName)}
              className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium transition-colors"
              title={lang === "bn" ? "এই ফাইলটি দিয়ে বট শুরু করুন" : "Set this file as execution entry point"}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "এন্ট্রি পয়েন্ট করুন" : "Set Entry"}</span>
            </button>
          )}

          {selectedFileName && (
            <button
              onClick={() => handleDelete(selectedFileName)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title={lang === "bn" ? "ফাইল ডিলিট করুন" : "Delete file"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="save-file-btn"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
              hasUnsavedChanges
                ? "bg-sky-600 hover:bg-sky-700 text-white shadow-2xs"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {saveSuccess
                ? lang === "bn"
                  ? "সংরক্ষিত!"
                  : "Saved!"
                : lang === "bn"
                ? "সেভ (Ctrl+S)"
                : "Save (Ctrl+S)"}
            </span>
          </button>
        </div>
      </div>

      {/* New file input popup */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreateFile}
          className="p-3 bg-sky-50/70 border-b border-sky-100 flex items-center gap-2 text-xs"
        >
          <Code2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="font-medium text-slate-700">
            {lang === "bn" ? "ফাইলের নাম:" : "File name:"}
          </span>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. config.py, helpers.py"
            autoFocus
            className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-sky-600 text-white rounded font-medium hover:bg-sky-700"
          >
            {lang === "bn" ? "তৈরি করুন" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingNew(false)}
            className="px-2 py-1 text-slate-500 hover:text-slate-800"
          >
            {lang === "bn" ? "বাতিল" : "Cancel"}
          </button>
        </form>
      )}

      {/* Editor Body */}
      <div className="flex-1 relative bg-slate-900 text-slate-100 font-mono text-xs flex overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>Loading file...</span>
          </div>
        ) : selectedFileName ? (
          <div className="w-full flex h-full">
            {/* Line numbers gutter */}
            <div className="select-none py-3 px-2 bg-slate-950 text-slate-600 text-right font-mono text-xs border-r border-slate-800 shrink-0 min-w-[42px]">
              {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                <div key={i} className="leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              id="code-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-5 resize-none focus:outline-hidden selection:bg-sky-700 overflow-y-auto"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <FileCode className="w-8 h-8 mb-2 stroke-1" />
            <p className="text-sm">
              {lang === "bn" ? "কোন ফাইল নির্বাচন করা নেই" : "No file selected"}
            </p>
            <p className="text-xs mt-1">
              {lang === "bn"
                ? "উপরে ফাইল সিলেক্ট করুন অথবা নতুন ফাইল তৈরি করুন"
                : "Select a file above or upload your bot files"}
            </p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-slate-950 px-3 py-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>
            {selectedFileName} {hasUnsavedChanges && <span className="text-amber-400 font-bold">•</span>}
          </span>
          <span>{lineCount} lines</span>
          <span>{content.length} chars</span>
        </div>
        <div>
          {selectedFileName.endsWith(".py")
            ? "Python 3"
            : selectedFileName === "requirements.txt"
            ? "Pip Requirements"
            : "Text"}
        </div>
      </div>
    </div>
  );
};
