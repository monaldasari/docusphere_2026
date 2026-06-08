"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Scissors,
  Copy,
  Clipboard as ClipboardIcon,
  Type,
  FileText,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  HelpCircle,
  Hash,
  Shapes,
  Layout,
  Columns,
  Search,
  Replace,
  MousePointer2,
  FilePlus,
  ArrowRightLeft,
  Maximize2,
  Settings,
  ShieldCheck,
  Languages,
  MessageSquare,
  History,
  Scale,
  BookOpen,
  ZoomIn,
  Grid,
  Square,
  PanelLeft,
  Mail,
  UserPlus,
  Eye,
  FileSpreadsheet,
  Zap,
  Printer,
  Save,
  Download,
  Scroll,
  Stamp,
  CaseSensitive,
  MoreHorizontal,
  Plus,
  Bookmark,
  Sigma,
  Split,
  Paintbrush,
  Minimize2,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import React, { memo } from "react";

interface EditorToolbarProps {
  editor: Editor | null;
  onPrint?: () => void;
  onSave?: () => void;
  onTogglePaperMode?: () => void;
  isPaperMode?: boolean;
  showRuler?: boolean;
  setShowRuler?: (val: boolean) => void;
  showGridlines?: boolean;
  setShowGridlines?: (val: boolean) => void;
  orientation?: "portrait" | "landscape";
  setOrientation?: (val: "portrait" | "landscape") => void;
  margins?: "normal" | "wide" | "narrow";
  setMargins?: (val: "normal" | "wide" | "narrow") => void;
  pageColor?: string;
  setPageColor?: (val: string) => void;
  pageBorder?: string;
  setPageBorder?: (val: string) => void;
  watermark?: string;
  setWatermark?: (val: string) => void;
  zoom?: number;
  setZoom?: (val: number) => void;
  readMode?: boolean;
  setReadMode?: (val: boolean) => void;
  painterActive?: boolean;
  setPainterActive?: (val: boolean) => void;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  replaceTerm?: string;
  setReplaceTerm?: (val: string) => void;
  showSearch?: boolean;
  setShowSearch?: (val: boolean) => void;
  setShareModal?: (val: boolean) => void;
  pageSize?: "a4" | "letter" | "legal";
  setPageSize?: (val: "a4" | "letter" | "legal") => void;
  onImageUpload?: () => void;
}

type TabType = "HOME" | "INSERT" | "LAYOUT" | "DESIGN" | "REFERENCES" | "MAILINGS" | "REVIEW" | "VIEW" | "FILE";

export default function EditorToolbar({
  editor,
  onPrint,
  onSave,
  onTogglePaperMode,
  isPaperMode,
  showRuler,
  setShowRuler,
  showGridlines,
  setShowGridlines,
  orientation,
  setOrientation,
  margins,
  setMargins,
  pageColor,
  setPageColor,
  pageBorder,
  setPageBorder,
  watermark,
  setWatermark,
  zoom,
  setZoom,
  readMode,
  setReadMode,
  painterActive,
  setPainterActive,
  searchTerm,
  setSearchTerm,
  replaceTerm,
  setReplaceTerm,
  showSearch,
  setShowSearch,
  setShareModal,
  pageSize,
  setPageSize,
  onImageUpload
}: EditorToolbarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("HOME");
  const [showToast, setShowToast] = useState<string | null>(null);

  if (!editor) return null;

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2000);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "FILE", label: "File", icon: "📂" },
    { id: "HOME", label: "Home", icon: "🏠" },
    { id: "INSERT", label: "Insert", icon: "📄" },
    { id: "LAYOUT", label: "Layout", icon: "📐" },
    { id: "DESIGN", label: "Design", icon: "🎨" },
    { id: "REFERENCES", label: "References", icon: "📊" },
    { id: "MAILINGS", label: "Mailings", icon: "📧" },
    { id: "REVIEW", label: "Review", icon: "🔍" },
    { id: "VIEW", label: "View", icon: "📊" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "HOME":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="📋 Clipboard">
              <RibbonButton icon={<Scissors size={16} />} label="✂️ Cut" onClick={() => { editor.chain().focus().run(); document.execCommand('cut'); }} />
              <RibbonButton icon={<Copy size={16} />} label="📄 Copy" onClick={() => { editor.chain().focus().run(); document.execCommand('copy'); }} />
              <RibbonButton icon={<ClipboardIcon size={16} />} label="📥 Paste" onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  editor.chain().focus().insertContent(text).run();
                } catch (err) {
                  triggerToast("Please use Ctrl+V to paste");
                }
              }} />
              <RibbonButton
                icon={<Paintbrush size={16} />}
                label="Format Painter"
                active={painterActive}
                onClick={() => setPainterActive?.(!painterActive)}
              />
            </RibbonGroup>

            <RibbonGroup label="🔤 Font">
              <div className="flex flex-col gap-1.5 min-w-[120px]">
                {/* Font Family & Size Dropdowns */}
                <div className="flex gap-1">
                  <select
                    className="text-[10px] bg-[rgba(var(--surface-rgb),0.3)] border border-[rgba(var(--border-rgb),0.3)] rounded px-1 outline-none flex-1 py-0.5"
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    value={editor.getAttributes('textStyle').fontFamily || "Inter"}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times</option>
                    <option value="Courier New">Monospace</option>
                    <option value="Comic Sans MS">Comic Sans</option>
                  </select>
                  <select
                    className="text-[10px] bg-[rgba(var(--surface-rgb),0.3)] border border-[rgba(var(--border-rgb),0.3)] rounded px-1 outline-none w-16 py-0.5"
                    onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                    value={editor.getAttributes('textStyle').fontSize || "16px"}
                  >
                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96].map(sz => (
                      <option key={sz} value={`${sz}px`}>{sz}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="text-[10px] bg-[rgba(var(--surface-rgb),0.3)] border border-[rgba(var(--border-rgb),0.3)] rounded px-1 outline-none w-10 py-0.5"
                    min="1"
                    max="500"
                    placeholder="Size"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) editor.chain().focus().setFontSize(`${val}px`).run();
                    }}
                  />
                </div>

                <div className="flex gap-0.5">
                  <RibbonButton icon={<Bold size={14} />} label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
                  <RibbonButton icon={<Italic size={14} />} label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
                  <RibbonButton icon={<Underline size={14} />} label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
                  <RibbonButton icon={<Strikethrough size={14} />} label="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
                  <div className="w-px h-6 mx-1 bg-[rgba(var(--border-rgb),0.2)]" />
                  <RibbonButton icon={<Highlighter size={14} />} label="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Text Color</span>
                    <div className="flex items-center gap-1 bg-[rgba(var(--surface-rgb),0.3)] p-1 rounded border border-[rgba(var(--border-rgb),0.2)]">
                      {['#000000', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
                        <button key={c} onClick={() => editor.chain().focus().setColor(c).run()} className="w-4 h-4 rounded-full border shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: 'rgba(var(--border-rgb), 0.5)' }} title="Text Color" />
                      ))}
                      <div className="w-px h-4 bg-[rgba(var(--border-rgb),0.3)] mx-0.5" />
                      <button onClick={() => {
                        const picker = document.createElement('input');
                        picker.type = 'color';
                        picker.onchange = (e: any) => editor.chain().focus().setColor(e.target.value).run();
                        picker.click();
                      }} className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] hover:bg-[var(--surface-hover)]" title="More Colors">
                        <Palette size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 pl-1 justify-center border-l border-[rgba(var(--border-rgb),0.1)]">
                    <button
                      className={`p-0.5 rounded hover:bg-[var(--surface-hover)] ${editor.isActive('superscript') ? 'text-[var(--accent)] bg-[var(--surface-hover)]' : 'opacity-60'}`}
                      onClick={() => editor.chain().focus().toggleSuperscript().run()}
                      title="Superscript"
                    >
                      <Superscript size={12} />
                    </button>
                    <button
                      className={`p-0.5 rounded hover:bg-[var(--surface-hover)] ${editor.isActive('subscript') ? 'text-[var(--accent)] bg-[var(--surface-hover)]' : 'opacity-60'}`}
                      onClick={() => editor.chain().focus().toggleSubscript().run()}
                      title="Subscript"
                    >
                      <Subscript size={12} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 rounded-2xl border border-[rgba(var(--border-rgb),0.2)] bg-[var(--background)] p-3 text-[11px] text-[var(--muted)]">
                  <span className="font-semibold text-[var(--foreground)]">Quick tip:</span> click a swatch to change the selected text color, or use the palette icon to choose any custom shade.
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="📑 Paragraph">
              <div className="flex gap-0.5">
                <RibbonButton icon={<AlignLeft size={16} />} label="Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
                <RibbonButton icon={<AlignCenter size={16} />} label="Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
                <RibbonButton icon={<AlignRight size={16} />} label="Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
                <RibbonButton icon={<AlignJustify size={16} />} label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
              </div>
              <div className="flex gap-1 items-center mt-1">
                <RibbonButton icon={<List size={14} />} label="Bullets" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <RibbonButton icon={<ListOrdered size={14} />} label="Numbers" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                <RibbonButton icon={<CheckSquare size={14} />} label="Tasks" active={editor.isActive("taskList")} onClick={() => (editor.chain().focus() as any).toggleTaskList().run()} />
              </div>
            </RibbonGroup>

            <RibbonGroup label="🎯 Styles">
              <RibbonButton icon={<Heading1 size={18} />} label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
              <RibbonButton icon={<Heading2 size={18} />} label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
              <RibbonButton icon={<Quote size={18} />} label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            </RibbonGroup>

            <RibbonGroup label="🔍 Editing">
              <RibbonButton
                icon={<Search size={16} />}
                label="Find"
                active={showSearch}
                onClick={() => setShowSearch?.(true)}
              />
              <RibbonButton
                icon={<Replace size={16} />}
                label="Replace"
                active={showSearch}
                onClick={() => setShowSearch?.(true)}
              />
              <RibbonButton icon={<MousePointer2 size={16} />} label="Select All" onClick={() => editor.chain().focus().selectAll().run()} />
            </RibbonGroup>
          </div>
        );
      case "INSERT":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="📃 Pages">
              <RibbonButton icon={<Plus size={18} />} label="Blank Page" onClick={() => editor.chain().focus().insertContent('<p></p><div style="page-break-after:always"></div><p></p>').run()} />
              <RibbonButton icon={<Minus size={18} />} label="Break" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            </RibbonGroup>

            <RibbonGroup label="📊 Table">
              <div className="flex gap-1 flex-wrap max-w-[260px]">

                <RibbonButton
                  icon={<TableIcon size={18} />}
                  label="Insert"
                  onClick={() => {
                    const r = window.prompt("Rows:", "3");
                    if (!r) return;

                    const c = window.prompt("Columns:", "3");
                    if (!c) return;

                    editor
                      .chain()
                      .focus()
                      .insertTable({
                        rows: parseInt(r),
                        cols: parseInt(c),
                        withHeaderRow: true,
                      })
                      .run();
                  }}
                />

                <RibbonButton
                  icon={<Plus size={16} />}
                  label="Add Row"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                />

                <RibbonButton
                  icon={<Plus size={16} className="rotate-90" />}
                  label="Add Col"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                />

                <RibbonButton
                  icon={<Minus size={16} />}
                  label="Del Row"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                />

                <RibbonButton
                  icon={<Minus size={16} className="rotate-90" />}
                  label="Del Col"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                />

                <RibbonButton
                  icon={<Trash2 size={16} />}
                  label="Delete"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                />

                <RibbonButton
                  icon={<Split size={16} />}
                  label="Merge"
                  onClick={() => editor.chain().focus().mergeCells().run()}
                />

              </div>
            </RibbonGroup>


            <RibbonGroup label="🖼️ Illustrations">
              <div className="flex gap-1">
                <RibbonButton
                  icon={<ImageIcon size={16} />}
                  label="Pictures"
                  onClick={() => {
                    const choice = window.confirm("Click OK to upload from your computer, or Cancel to enter a URL.");
                    if (choice) {
                      onImageUpload?.();
                    } else {
                      const url = window.prompt("Enter Image URL:", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1000");
                      if (url) (editor.chain().focus() as any).setImage({ src: url }).run();
                    }
                  }}
                />
                <RibbonButton
                  icon={<Shapes size={16} />}
                  label="Symbols"
                  onClick={() => {
                    const symbols = ["©", "®", "™", "±", "÷", "×", "∞", "≈", "≠", "≤", "≥", "π", "α", "β", "γ", "δ", "€", "£", "¥", "•", "→", "←", "↑", "↓", "★", "♦", "♠", "♣", "♥", "✓", "✗", "⚡", "♻"];
                    const sym = window.prompt("Insert Symbol — choose:\n" + symbols.map((s, i) => `${i + 1}. ${s}`).join("  ") + "\n\nOr type your own:", "©");
                    if (sym !== null) {
                      editor.chain().focus().insertContent(sym || "©").run();
                      triggerToast(`Inserted: ${sym || "©"}`);
                    }
                  }}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup label="🔗 Links">
              <RibbonButton
                icon={<LinkIcon size={18} />}
                label="Hyperlink"
                active={editor.isActive("link")}
                onClick={() => {
                  let url = null;
                  try {
                    url = window.prompt("URL:", "https://google.com");
                  } catch (e) {
                    url = "https://google.com";
                  }
                  if (url) (editor.chain().focus() as any).setLink({ href: url }).run();
                }}
              />
            </RibbonGroup>

            <RibbonGroup label="🔠 Text">
              <RibbonButton
                icon={<Type size={18} />}
                label="Text Box"
                onClick={() => {
                  editor.chain().focus().insertContent('<div style="border: 1px solid var(--border); padding: 10px; margin: 10px 0; border-radius: 8px; background: rgba(var(--surface-rgb), 0.1);">[Text Box Content]</div>').run();
                }}
              />
              <RibbonButton
                icon={<CaseSensitive size={18} />}
                label="WordArt"
                onClick={() => {
                  const val = window.prompt("WordArt Text:", "DocuSphere");
                  if (val) {
                    editor.chain().focus().insertContent(`<h1 style="background: linear-gradient(45deg, var(--accent), #ff0080); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3rem; font-weight: 900; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2)); margin: 20px 0;">${val}</h1>`).run();
                  }
                }}
              />
            </RibbonGroup>
          </div>
        );
      case "LAYOUT":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="📏 Page Setup">
              <RibbonButton
                icon={<Scale size={18} />}
                label="Normal"
                active={margins === "normal"}
                onClick={() => setMargins?.("normal")}
              />
              <RibbonButton
                icon={<Maximize2 size={18} />}
                label="Wide"
                active={margins === "wide"}
                onClick={() => setMargins?.("wide")}
              />
              <RibbonButton
                icon={<Minimize2 size={18} />}
                label="Narrow"
                active={margins === "narrow"}
                onClick={() => setMargins?.("narrow")}
              />
              <div className="flex flex-col gap-1.5 ml-2 border-l border-[rgba(var(--border-rgb),0.2)] pl-2">
                <span className="text-[10px] font-semibold opacity-50">Size</span>
                <select
                  className="text-[10px] bg-[rgba(var(--surface-rgb),0.3)] border border-[rgba(var(--border-rgb),0.3)] rounded px-1 outline-none py-0.5"
                  value={pageSize}
                  onChange={(e) => setPageSize?.(e.target.value as any)}
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>
            </RibbonGroup>
            <RibbonGroup label="↕️ Orientation">
              <RibbonButton
                icon={<Plus size={18} className={orientation === "portrait" ? "" : "rotate-90"} />}
                label="Portrait"
                active={orientation === "portrait"}
                onClick={() => setOrientation?.("portrait")}
              />
              <RibbonButton
                icon={<Plus size={18} className={orientation === "landscape" ? "" : "rotate-90"} />}
                label="Landscape"
                active={orientation === "landscape"}
                onClick={() => setOrientation?.("landscape")}
              />
            </RibbonGroup>
            <RibbonGroup label="📋 Columns">
              <RibbonButton icon={<Columns size={20} />} label="One" active={true} onClick={() => {
                editor.chain().focus().insertContent('<div style="column-count: 1; column-gap: 2em;"><p>Single column text...</p></div>').run();
                triggerToast("Single column layout inserted");
              }} />
              <RibbonButton icon={<Columns size={20} className="rotate-90" />} label="Two" onClick={() => {
                editor.chain().focus().insertContent('<div style="column-count: 2; column-gap: 2em;"><p>Two-column text. Add your content here and it will flow into two columns automatically across the page width for a clean, professional layout.</p></div>').run();
                triggerToast("Two-column layout inserted");
              }} />
              <RibbonButton icon={<Columns size={20} className="opacity-60" />} label="Three" onClick={() => {
                editor.chain().focus().insertContent('<div style="column-count: 3; column-gap: 1.5em;"><p>Three-column text. Content flows across all three columns automatically.</p></div>').run();
                triggerToast("Three-column layout inserted");
              }} />
            </RibbonGroup>
          </div>
        );
      case "DESIGN":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="🎭 Themes">
              <RibbonButton icon={<Zap size={18} />} label="Professional" active onClick={() => triggerToast("Professional Theme Active")} />
              <RibbonButton icon={<Palette size={18} />} label="Modern" onClick={() => triggerToast("Modern Theme Applied")} />
              <RibbonButton icon={<Type size={18} />} label="Serif Styles" onClick={() => editor.chain().focus().setFontFamily("Georgia").run()} />
            </RibbonGroup>
            <RibbonGroup label="💧 Watermark">
              <RibbonButton
                icon={<Stamp size={18} />}
                label="Watermark"
                active={!!watermark}
                onClick={() => {
                  const val = window.prompt("Watermark Text (DRAFT, CONFIDENTIAL, etc.):", "DRAFT");
                  if (val !== null) setWatermark?.(val);
                }}
              />
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="text-[9px] font-medium opacity-80">Page Color</span>
                <div className="flex items-center gap-1 bg-[rgba(var(--surface-rgb),0.3)] p-1 rounded border border-[rgba(var(--border-rgb),0.2)]">
                  {['#ffffff', '#fdf6e3', '#f3f4f6', '#1e293b'].map(c => (
                    <button key={c} onClick={() => setPageColor?.(c)} className="w-4 h-4 rounded-full border shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: 'rgba(var(--border-rgb), 0.5)' }} title="Page Color" />
                  ))}
                  <div className="w-px h-4 bg-[rgba(var(--border-rgb),0.3)] mx-0.5" />
                  <button onClick={() => {
                    const picker = document.createElement('input');
                    picker.type = 'color';
                    picker.value = pageColor || '#ffffff';
                    picker.onchange = (e: any) => setPageColor?.(e.target.value);
                    picker.click();
                  }} className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] hover:bg-[var(--surface-hover)]" title="More Colors">
                    <Palette size={12} />
                  </button>
                </div>
              </div>
              <RibbonButton
                icon={<Square size={18} />}
                label="Borders"
                active={pageBorder !== "none"}
                onClick={() => {
                  const nextBorder: Record<string, string> = {
                    "none": "solid",
                    "solid": "dashed",
                    "dashed": "double",
                    "double": "none"
                  };
                  setPageBorder?.(nextBorder[pageBorder || "none"]);
                }}
              />
            </RibbonGroup>
          </div>
        );
      case "REFERENCES":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="📑 ToC">
              <RibbonButton
                icon={<List size={18} />}
                label="Table of Contents"
                onClick={() => {
                  editor.chain().focus().insertContent('<div style="border: 1px solid var(--border); padding: 15px; margin: 10px 0; border-radius: 8px; background: rgba(var(--surface-rgb), 0.05);"><h3 style="margin-top:0">Table of Contents</h3><p style="opacity:0.6;font-style:italic">Generated automatically from headings...</p></div>').run();
                  triggerToast("ToC Placeholder Inserted");
                }}
              />
            </RibbonGroup>
            <RibbonGroup label="📝 Footnotes">
              <RibbonButton
                icon={<FileText size={18} />}
                label="Footnote"
                onClick={() => {
                  editor.chain().focus().insertContent('<sup>[1]</sup>').run();
                  triggerToast("Footnote link added");
                }}
              />
            </RibbonGroup>
            <RibbonGroup label="📚 Citations">
              <RibbonButton icon={<BookOpen size={18} />} label="Bibliography" onClick={() => {
                editor.chain().focus().insertContent(`<div style="border-left: 3px solid var(--accent); padding: 10px 15px; margin: 10px 0; border-radius: 0 8px 8px 0; background: rgba(var(--surface-rgb), 0.05);"><p style="font-size:0.85em; margin:0;"><strong>References</strong></p><p style="font-size:0.8em; margin: 6px 0 0; opacity:0.7;">1. Author, A. (Year). Title. Publisher.</p></div>`).run();
                triggerToast("Bibliography block inserted");
              }} />
            </RibbonGroup>
          </div>
        );
      case "MAILINGS":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="✉️ Create">
              <RibbonButton icon={<Mail size={18} />} label="Envelopes" onClick={() => {
                editor.chain().focus().insertContent(`<div style="border: 2px solid var(--border); padding: 20px 30px; margin: 10px 0; border-radius: 8px; min-height: 120px; background: rgba(var(--surface-rgb),0.03);"><p style="margin:0 0 30px; font-size:0.75em; opacity:0.5;">Return Address</p><p style="margin: 0; font-size: 0.9em;"><strong>Recipient Name</strong><br/>123 Street Address<br/>City, State ZIP</p></div>`).run();
                triggerToast("Envelope template inserted");
              }} />
              <RibbonButton icon={<Square size={18} />} label="Labels" onClick={() => {
                editor.chain().focus().insertContent(`<table style="border-collapse: collapse; width: 100%;"><tbody><tr>${Array(3).fill(`<td style="border: 1px dashed var(--border); padding: 12px 8px; width: 33%; font-size:0.8em; text-align:left; vertical-align:top;">Name<br/>Address<br/>City, State</td>`).join("")}</tr><tr>${Array(3).fill(`<td style="border: 1px dashed var(--border); padding: 12px 8px; width: 33%; font-size:0.8em; text-align:left; vertical-align:top;">Name<br/>Address<br/>City, State</td>`).join("")}</tr></tbody></table>`).run();
                triggerToast("Label sheet inserted (6 labels)");
              }} />
            </RibbonGroup>
            <RibbonGroup label="🔄 Merge">
              <RibbonButton
                icon={<UserPlus size={18} />}
                label="Recipients"
                onClick={() => {
                  const name = window.prompt("Add Recipient Name:");
                  if (name) {
                    editor.chain().focus().insertContent(`<span style="background: rgba(var(--accent-rgb),0.15); padding: 2px 6px; border-radius: 4px; font-size:0.9em;">{{${name}}}</span>`).run();
                    triggerToast(`Merge field {{${name}}} inserted`);
                  }
                }}
              />
            </RibbonGroup>
          </div>
        );
      case "REVIEW":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="✔️ Proofing">
              <RibbonButton
                icon={<ShieldCheck size={18} />}
                label="Spell Check"
                onClick={() => {
                  const el = document.querySelector('.ProseMirror') as HTMLElement;
                  if (el) {
                    const current = el.getAttribute('spellcheck') === 'true';
                    el.setAttribute('spellcheck', (!current).toString());
                    triggerToast(`Spellcheck ${!current ? 'Enabled' : 'Disabled'}`);
                  }
                }}
              />
              <RibbonButton icon={<BookOpen size={18} />} label="Thesaurus" onClick={() => {
                const selected = window.getSelection()?.toString().trim();
                if (selected) {
                  window.open(`https://www.thesaurus.com/browse/${encodeURIComponent(selected)}`, '_blank');
                } else {
                  const word = window.prompt("Look up synonyms for:");
                  if (word) window.open(`https://www.thesaurus.com/browse/${encodeURIComponent(word)}`, '_blank');
                }
              }} />
              <RibbonButton
                icon={<Hash size={18} />}
                label="Word Count"
                onClick={() => {
                  const text = editor.getText();
                  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                  const chars = text.length;
                  const paras = editor.getJSON().content?.length || 0;
                  window.alert(`Document Statistics:\n\nWords: ${words}\nCharacters: ${chars}\nParagraphs: ${paras}`);
                }}
              />
            </RibbonGroup>
            <RibbonGroup label="💬 Comments">
              <RibbonButton icon={<MessageSquare size={18} />} label="New Comment" onClick={() => {
                const comment = window.prompt("Add your comment:");
                if (comment) {
                  editor.chain().focus().insertContent(
                    `<span style="border-bottom: 2px solid #f59e0b; background: rgba(245,158,11,0.1); padding: 1px 3px; border-radius: 2px; cursor: pointer;" title="Comment: ${comment.replace(/"/g, '&quot;')}">${editor.state.selection.empty ? '[Add text before commenting]' : ''}</span><aside style="display:block; margin: 4px 0; padding: 6px 10px; background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0; font-size: 0.8em; color: var(--muted);">💬 Comment: ${comment}</aside>`
                  ).run();
                  triggerToast("Comment added");
                }
              }} />
            </RibbonGroup>
            <RibbonGroup label="🔄 Tracking">
              <RibbonButton icon={<History size={18} />} label="Track Changes" onClick={() => {
                const content = editor.getHTML();
                const snapshot = `<!-- TRACK_SNAPSHOT:${Date.now()} -->` + content;
                localStorage.setItem('docusphere-track-snapshot', snapshot);
                triggerToast("Snapshot saved for tracking");
              }} />
              <div className="flex flex-col gap-1 justify-center">
                <button className="ribbon-button-small" onClick={() => { localStorage.removeItem('docusphere-track-snapshot'); triggerToast("Changes accepted & snapshot cleared"); }}>✅ Accept</button>
                <button className="ribbon-button-small" onClick={() => {
                  const snap = localStorage.getItem('docusphere-track-snapshot');
                  if (snap) {
                    const content = snap.replace(/<!--\s*TRACK_SNAPSHOT:\d+\s*-->/, '');
                    editor.commands.setContent(content);
                    triggerToast("Changes rejected — restored snapshot");
                  } else {
                    triggerToast("No snapshot found to restore");
                  }
                }}>❌ Reject</button>
              </div>
            </RibbonGroup>
          </div>
        );
      case "VIEW":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="👀 Views">
              <RibbonButton
                icon={<BookOpen size={18} />}
                label="Read Mode"
                active={readMode}
                onClick={() => setReadMode?.(!readMode)}
              />
              <RibbonButton icon={<Layout size={18} />} label="Print Layout" active={!readMode} onClick={() => setReadMode?.(false)} />
            </RibbonGroup>
            <RibbonGroup label="📏 Show">
              <RibbonButton
                icon={<Scale size={18} />}
                label="Ruler"
                active={showRuler}
                onClick={() => setShowRuler?.(!showRuler)}
              />
              <RibbonButton
                icon={<Grid size={18} />}
                label="Gridlines"
                active={showGridlines}
                onClick={() => setShowGridlines?.(!showGridlines)}
              />
            </RibbonGroup>
            <RibbonGroup label="🔍 Zoom">
              <div className="flex flex-col gap-1 items-center px-2">
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={zoom}
                  onChange={(e) => setZoom?.(parseInt(e.target.value))}
                  className="w-24 h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <span className="text-[10px] font-medium opacity-60">{zoom}%</span>
              </div>
              <RibbonButton icon={<Maximize2 size={18} />} label="Reset" onClick={() => setZoom?.(100)} />
            </RibbonGroup>
            <RibbonGroup label="🪟 Window">
              <RibbonButton icon={<Scroll size={18} />} label="Paper Mode" active={isPaperMode} onClick={onTogglePaperMode} />
              <RibbonButton
                icon={<Maximize2 size={18} />}
                label={document.fullscreenElement ? "Exit Full" : "Full Screen"}
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
              />
            </RibbonGroup>
          </div>
        );
      case "FILE":
        return (
          <div className="flex items-stretch h-full">
            <RibbonGroup label="💾 Manage">
              <RibbonButton
                icon={<FilePlus size={18} />}
                label="🆕 New"
                onClick={() => {
                  if (window.confirm("Start a new document? All unsaved changes will be lost.")) {
                    editor.chain().focus().clearContent().run();
                  }
                }}
              />
              <RibbonButton icon={<FileSpreadsheet size={18} />} label="📂 Open" onClick={() => { window.location.href = "/dashboard"; }} />
              <RibbonButton icon={<Save size={18} />} label="💾 Save" onClick={onSave} />
            </RibbonGroup>
            <RibbonGroup label="📤 Share & Export">
              <RibbonButton icon={<Printer size={18} />} label="🖨️ Print" onClick={onPrint} />
              <RibbonButton
                icon={<Download size={18} />}
                label="Export PDF"
                onClick={() => {
                  triggerToast("Optimizing for PDF...");
                  setTimeout(() => window.print(), 500);
                }}
              />
              <RibbonButton
                icon={<Share2 size={18} />}
                label="🔗 Share"
                onClick={() => {
                  triggerToast("Opening Share Panel...");
                  setShareModal?.(true);
                }}
              />
            </RibbonGroup>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-12 z-20 flex flex-col w-full pointer-events-none"
    >
      <div
        className="flex flex-col pointer-events-auto w-full transition-all duration-300 backdrop-blur-md"
        style={{
          background: "rgba(var(--surface-rgb), 0.4)",
          borderBottom: "1px solid rgba(var(--border-rgb), 0.3)",
          boxShadow: "0 8px 32px -4px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Tab Headers */}
        <div className="flex items-center px-4 pt-1 gap-1 border-b border-[rgba(var(--border-rgb),0.3)] bg-[rgba(var(--surface-rgb),0.5)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ribbon-tab flex items-center gap-1.5 ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent)] rounded-full" />
              )}
            </button>
          ))}

          <div className="flex-1" />

          <div className="flex items-center gap-2 px-3 opacity-60">
            <Undo size={14} className="cursor-pointer hover:text-[var(--accent)]" onClick={() => editor.chain().focus().undo().run()} />
            <Redo size={14} className="cursor-pointer hover:text-[var(--accent)]" onClick={() => editor.chain().focus().redo().run()} />
          </div>
        </div>

        {/* Ribbon Area */}
        <div className="h-28 px-4 py-2 flex items-center overflow-x-auto no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="flex items-stretch h-full gap-1"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl z-50 flex items-center gap-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--accent)",
              color: "var(--accent)"
            }}
          >
            <HelpCircle size={14} />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="flex items-center gap-0.5 h-full">
        {children}
      </div>
      <span className="ribbon-group-label whitespace-nowrap">{label}</span>
    </div>
  );
}

const RibbonButton = memo(({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -0.5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title={label}
      className={`ribbon-button ${active ? "active" : ""}`}
      transition={{ duration: 0.1 }}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg">
        {icon}
      </div>
      <span className="text-[9px] font-medium truncate max-w-[56px] opacity-80">{label}</span>
    </motion.button>
  );
});

RibbonButton.displayName = "RibbonButton";

// Missing icons helper
import { Tag, Share2 } from "lucide-react";
