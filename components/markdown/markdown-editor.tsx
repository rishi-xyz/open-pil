"use client";
import { useId } from "react";
import { Eye, Pencil } from "lucide-react";
import { Markdown } from "./markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export type MarkdownEditorProps = { value: string; onChange: (value: string) => void; disabled?: boolean; id?: string; label?: string; minRows?: "petition" | "reason"; limit?: number; invalid?: boolean };
export function MarkdownEditor({ value, onChange, disabled = false, id, label = "Reason", minRows = "reason", limit = 32768, invalid = false }: MarkdownEditorProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const bytes = new TextEncoder().encode(value).length;
  const over = bytes > limit;
  const minHeight = minRows === "petition" ? 320 : 160;
  const errorId = `${inputId}-error`;
  return <div><Tabs defaultValue="write" className="markdown-editor" data-invalid={invalid || over}><div className="markdown-editor-head"><TabsList aria-label={`${label} editor mode`}><TabsTrigger value="write"><Pencil size={14} aria-hidden="true" />Write</TabsTrigger><TabsTrigger value="preview"><Eye size={14} aria-hidden="true" />Preview</TabsTrigger></TabsList><span className="t-xs text-right" aria-live="polite" style={{ color: over ? "var(--bad)" : bytes >= limit * .9 ? "var(--warn)" : "var(--text-3)" }}>{bytes.toLocaleString("en-GB")} / {limit.toLocaleString("en-GB")} bytes</span></div><TabsContent value="write"><textarea id={inputId} aria-label={label} aria-invalid={invalid || over || undefined} aria-describedby={over ? errorId : undefined} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} style={{ minHeight }} /></TabsContent><TabsContent value="preview"><div className="markdown-editor-preview" style={{ minHeight }}>{value ? <Markdown source={value} /> : <p className="t-small text-muted-foreground">Nothing to preview yet.</p>}</div></TabsContent><div className="markdown-editor-footer">Markdown supported: headings, lists, bold, quotes, links and tables.</div></Tabs>{over && <p id={errorId} className="t-small text-destructive">The body is over {limit === 32768 ? "32 KB" : `${limit.toLocaleString("en-GB")} bytes`}. Shorten it before filing.</p>}</div>;
}
export function PetitionMarkdownEditor(props: MarkdownEditorProps) {
  return <MarkdownEditor minRows="petition" id="petition-body" label="Petition body" {...props} />;
}
