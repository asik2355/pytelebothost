import React, { useState, useRef } from "react";
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface FileUploaderProps {
  lang: "bn" | "en";
  onFilesUploaded: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  lang,
  onFilesUploaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    success?: string[];
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/workspace/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadFeedback({
          success: data.uploaded,
        });
        onFilesUploaded();
      } else {
        setUploadFeedback({
          error: data.error || "Upload failed",
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        error: err.message || "Network error during upload",
      });
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  return (
    <div id="file-uploader-section" className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === "bn"
                ? "Python ফাইল এবং Requirements আপলোড করুন"
                : "Upload Python Files & Requirements.txt"}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "bn"
                ? "আপনার bot.py / main.py এবং requirements.txt ড্র্যাগ করে ফেলুন অথবা সিলেক্ট করুন"
                : "Drag and drop your bot.py, requirements.txt, or helper modules"}
            </p>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-sky-500 bg-sky-50/60 scale-[0.99]"
            : "border-slate-300 hover:border-sky-400 hover:bg-slate-50/60 bg-slate-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".py,.txt,.env,.json,.yaml,.yml"
          onChange={handleFileInputChange}
          className="hidden"
          id="file-upload-input"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {isUploading
                ? lang === "bn"
                  ? "আপলোড হচ্ছে..."
                  : "Uploading files..."
                : lang === "bn"
                ? "ফাইল এখানে ড্রপ করুন অথবা ক্লিক করে সিলেক্ট করুন"
                : "Drop files here or click to browse"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "bn"
                ? "সমর্থিত: .py (Python Code), requirements.txt, .env, ইত্যাদি (সর্বোচ্চ ২০টি ফাইল)"
                : "Supported: .py, requirements.txt, .env, modules, config (up to 20 files)"}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">
              <FileCode className="w-3 h-3 text-emerald-600" /> bot.py / main.py
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">
              <FileCode className="w-3 h-3 text-sky-600" /> requirements.txt
            </span>
          </div>
        </div>
      </div>

      {/* Feedback status */}
      {uploadFeedback?.success && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold">
              {lang === "bn" ? "সফলভাবে আপলোড হয়েছে: " : "Successfully uploaded: "}
            </span>
            <span className="font-mono">{uploadFeedback.success.join(", ")}</span>
          </div>
        </div>
      )}

      {uploadFeedback?.error && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadFeedback.error}</span>
        </div>
      )}
    </div>
  );
};
