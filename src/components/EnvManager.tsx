import React, { useState, useEffect } from "react";
import { Sliders, Plus, Trash2, Save, Check, Loader2 } from "lucide-react";

interface EnvManagerProps {
  lang: "bn" | "en";
  onEnvUpdated: () => void;
}

export const EnvManager: React.FC<EnvManagerProps> = ({
  lang,
  onEnvUpdated,
}) => {
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchEnv = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workspace/file?name=.env");
      if (res.ok) {
        const data = await res.json();
        const content = data.content || "";
        const pairs: Array<{ key: string; value: string }> = [];
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq !== -1) {
            pairs.push({
              key: trimmed.slice(0, eq).trim(),
              value: trimmed.slice(eq + 1).trim(),
            });
          }
        }
        setEnvVars(pairs);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnv();
  }, []);

  const handleAddRow = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: "key" | "value", val: string) => {
    const updated = [...envVars];
    updated[index][field] = val;
    setEnvVars(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const envObj: Record<string, string> = {};
      for (const item of envVars) {
        if (item.key.trim()) {
          envObj[item.key.trim()] = item.value;
        }
      }
      const res = await fetch("/api/workspace/env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: envObj }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onEnvUpdated();
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="env-manager-card" className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {lang === "bn" ? "এনভায়রনমেন্ট ভ্যারিয়েবল (.env)" : "Environment Variables (.env)"}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "bn"
                ? "বটের জন্য প্রয়োজনীয় ভ্যারিয়েবল যোগ করুন (যেমন: BOT_TOKEN, ADMIN_ID)"
                : "Variables injected into your bot's Python process environment"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "নতুন ভ্যারিয়েবল" : "Add Variable"}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors shadow-2xs disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {saveSuccess
                ? lang === "bn"
                  ? "সংরক্ষিত!"
                  : "Saved!"
                : lang === "bn"
                ? "সংরক্ষণ করুন"
                : "Save .env"}
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center text-xs text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          <span>Loading environment variables...</span>
        </div>
      ) : envVars.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          <p>
            {lang === "bn"
              ? "কোন কাস্টম ভ্যারিয়েবল নেই। 'নতুন ভ্যারিয়েবল' ক্লিক করে যুক্ত করুন।"
              : "No custom environment variables yet. Click 'Add Variable' to add one."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {envVars.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="KEY (e.g. BOT_TOKEN)"
                value={row.key}
                onChange={(e) => handleUpdateRow(idx, "key", e.target.value)}
                className="w-1/3 sm:w-1/4 font-mono text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50/70 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-slate-400 font-mono text-xs">=</span>
              <input
                type="text"
                placeholder="VALUE"
                value={row.value}
                onChange={(e) => handleUpdateRow(idx, "value", e.target.value)}
                className="flex-1 font-mono text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50/70 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => handleRemoveRow(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                title="Remove variable"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
