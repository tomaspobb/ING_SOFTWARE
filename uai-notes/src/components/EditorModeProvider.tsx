"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Ctx = { editorMode: boolean; setEditorMode: (v: boolean) => void };
const EditorCtx = createContext<Ctx | null>(null);

export function EditorModeProvider({ children }: { children: React.ReactNode }) {
  const [editorMode, setEditorMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("editorMode");
    if (saved) setEditorMode(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("editorMode", editorMode ? "1" : "0");
  }, [editorMode]);

  return (
    <EditorCtx.Provider value={{ editorMode, setEditorMode }}>
      {children}
    </EditorCtx.Provider>
  );
}

export function useEditorMode() {
  const ctx = useContext(EditorCtx);
  if (!ctx) throw new Error("useEditorMode must be used within EditorModeProvider");
  return ctx;
}
