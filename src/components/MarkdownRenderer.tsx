import { useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { isSafeLink } from "../lib/format";

function CodeBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked outside a secure context.
    }
  };

  return (
    <div className="code-block">
      <button
        type="button"
        className="code-copy"
        onClick={copy}
        aria-label="复制代码"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? "已复制" : "复制"}</span>
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  return (
    <div className={`prose ${compact ? "prose-compact" : ""}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const safe = href && isSafeLink(href);
            return (
              <a
                {...props}
                href={safe ? href : undefined}
                target={href && /^https?:\/\//i.test(href) ? "_blank" : undefined}
                rel={href && /^https?:\/\//i.test(href) ? "noreferrer noopener" : undefined}
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            const safe = typeof src === "string" && isSafeLink(src);
            if (!safe) return null;
            return <img src={src} alt={alt ?? ""} loading="lazy" />;
          },
          pre({ children }) {
            return <CodeBlock>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
