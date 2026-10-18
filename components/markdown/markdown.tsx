import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdown escapes raw HTML unless rehype-raw is added; keep it out.
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className ? `markdown ${className}` : "markdown"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({ children }) => <div className="markdown-table"><table>{children}</table></div> }} skipHtml>{source}</ReactMarkdown>
    </div>
  );
}
