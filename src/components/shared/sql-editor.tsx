import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { useTheme } from "@/lib/theme";

interface SqlEditorProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

export function SqlEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = "180px",
  className,
}: SqlEditorProps) {
  const [mounted, setMounted] = useState(false);
  const { resolved } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <textarea
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-md border border-input bg-muted/20 p-3 font-mono text-xs leading-relaxed focus:outline-none"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-md border border-input ${className || ""}`}>
      <CodeMirror
        value={value}
        height={minHeight}
        theme={resolved === "dark" ? "dark" : "light"}
        extensions={[sql()]}
        editable={!readOnly}
        onChange={(val) => onChange?.(val)}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: false,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
}
