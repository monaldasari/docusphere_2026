"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Extension, Node as TiptapNode, Mark } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Maximize2,
  Minimize2,
  Check,
  Loader2,
  ChevronLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  Quote,
  Moon,
  Sun,
  Users,
  Save,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import SlashCommandMenu from "@/components/SlashCommandMenu";
import EditorToolbar from "@/components/EditorToolbar";
import { useTheme } from "@/components/ThemeProvider";
import { api, User } from "@/lib/api";

type SaveStatus = "idle" | "saving" | "saved";

const EMOJI_LIST = ["📄", "📝", "🗺️", "📐", "🔬", "🎨", "📊", "💡", "🚀", "⚡", "🌟", "🔥", "🤝", "📂", "📅", "✅", "🛠️", "⚙️", "🌍", "🏆", "📌", "📣", "🔒", "🔑"];

const PAGE_SIZES = {
  a4: { width: '210mm', height: '297mm' },
  letter: { width: '215.9mm', height: '279.4mm' },
  legal: { width: '215.9mm', height: '355.6mm' }
};

const MM_TO_PX = 96 / 25.4; // 3.7795 px/mm at 96dpi
const PAGE_HEIGHT_PX: Record<string, Record<string, number>> = {
  a4:     { portrait: Math.round(297   * MM_TO_PX), landscape: Math.round(210   * MM_TO_PX) },
  letter: { portrait: Math.round(279.4 * MM_TO_PX), landscape: Math.round(215.9 * MM_TO_PX) },
  legal:  { portrait: Math.round(355.6 * MM_TO_PX), landscape: Math.round(215.9 * MM_TO_PX) },
};

interface EditorPageProps {
  params: { id: string };
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: { setFontSize: (size: string) => ReturnType, unsetFontSize: () => ReturnType },
    fontFamily: { setFontFamily: (fontFamily: string) => ReturnType, unsetFontFamily: () => ReturnType },
    image: { setImage: (attributes: { src: string, alt?: string, title?: string }) => ReturnType }
  }
}

// Custom extensions
const FontFamilyExtension = FontFamily;
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
          renderHTML: attributes => {
            if (!attributes.fontSize) return {}
            const size = typeof attributes.fontSize === 'number' ? `${attributes.fontSize}px` : attributes.fontSize;
            return { style: `font-size: ${size}` }
          },
        },
      },
    }]
  },
  addCommands(): any {
    return {
      setFontSize: (fontSize: string | number) => ({ chain }: any) => {
        const size = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
        return chain().setMark('textStyle', { fontSize: size }).run()
      },
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

// Renamed to CustomLink to fix the Duplicate Warning
const CustomLink = Mark.create({
  name: 'customLink',
  priority: 100,
  inclusive: false,
  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      autolink: true,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow', class: 'text-accent underline cursor-pointer' },
    }
  },
  addAttributes() {
    return {
      href: { default: null },
      target: { default: this.options.HTMLAttributes.target },
      rel: { default: this.options.HTMLAttributes.rel },
      class: { default: this.options.HTMLAttributes.class },
    }
  },
  parseHTML() { return [{ tag: 'a[href]' }] },
  renderHTML({ HTMLAttributes }: any) { return ['a', HTMLAttributes, 0] },
  addCommands(): any {
    return {
      setLink: (attributes: any) => ({ chain }: any) => chain().setMark(this.name, attributes).setMeta('preventAutolink', true).run(),
      unsetLink: () => ({ chain }: any) => chain().unsetMark(this.name, { extendEmptyMark: true }).run(),
    }
  },
})

const Table = TiptapNode.create({
  name: 'table',
  addOptions() { return { HTMLAttributes: { class: 'border-collapse table-auto w-full my-4 border border-[var(--border)]' } } },
  content: 'tableRow+',
  group: 'block',
  parseHTML() { return [{ tag: 'table' }] },
  renderHTML({ HTMLAttributes }) { return ['table', HTMLAttributes, 0] },
})

const TableRow = TiptapNode.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)*',
  parseHTML() { return [{ tag: 'tr' }] },
  renderHTML() { return ['tr', 0] },
})

const TableCell = TiptapNode.create({
  name: 'tableCell',
  content: 'block+',
  addOptions() { return { HTMLAttributes: { class: 'border border-[var(--border)] p-2 min-w-[100px]' } } },
  parseHTML() { return [{ tag: 'td' }] },
  renderHTML({ HTMLAttributes }) { return ['td', HTMLAttributes, 0] },
})

const TableHeader = TiptapNode.create({
  name: 'tableHeader',
  content: 'block+',
  addOptions() { return { HTMLAttributes: { class: 'border border-[var(--border)] p-2 min-w-[100px] bg-[var(--surface-hover)] font-bold text-left' } } },
  parseHTML() { return [{ tag: 'th' }] },
  renderHTML({ HTMLAttributes }) { return ['th', HTMLAttributes, 0] },
})

const Image = TiptapNode.create({
  name: 'image',
  inline: true,
  group: 'inline',
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: null }, title: { default: null } }
  },
  parseHTML() { return [{ tag: 'img[src]' }] },
  renderHTML({ HTMLAttributes }: any) { return ['img', HTMLAttributes] },
  addCommands(): any {
    return {
      setImage: (options: any) => ({ chain }: any) => chain().insertContent({ type: this.name, attrs: options }).run(),
    }
  },
})

// ============================================================================
// 1. THE WORKSPACE COMPONENT (Only renders when Provider is 100% ready)
// ============================================================================
function EditorWorkspace({ params, ydoc, provider }: { params: { id: string }, ydoc: Y.Doc, provider: HocuspocusProvider | null }) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [docEmoji, setDocEmoji] = useState("📄");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [focusMode, setFocusMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [shareModal, setShareModal] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [bubbleMenu, setBubbleMenu] = useState({ visible: false, top: 0, left: 0 });
  const [floatingMenu, setFloatingMenu] = useState({ visible: false, top: 0, left: 0 });
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [wordCount, setWordCount] = useState(0);
  const [isShared, setIsShared] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [paperMode, setPaperMode] = useState(true);
  const [pageColor, setPageColor] = useState("#ffffff");
  const [pageBorder, setPageBorder] = useState("none");
  const [watermark, setWatermark] = useState("");
  const [zoom, setZoom] = useState(100);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "legal">("a4");
  const [readMode, setReadMode] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined);
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [painterActive, setPainterActive] = useState(false);
  const [painterMarks, setPainterMarks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isInitialLoad = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef(title);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const [showRuler, setShowRuler] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margins, setMargins] = useState<"normal" | "wide" | "narrow">("normal");

  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialContent, setInitialContent] = useState("");

  const [userColor] = useState(() =>
    ["#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"][Math.floor(Math.random() * 6)]
  );

  // Keep titleRef in sync so closures (onUpdate, timers) always have the latest title
  useEffect(() => { titleRef.current = title; }, [title]);

  useEffect(() => {
    import("@/lib/api").then(({ api }) => {
      api.auth.me().then((user) => {
        const storedProfile = typeof window !== "undefined" ? localStorage.getItem("docusphere-user-profile") : null;
        const savedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        if (user) {
          setCurrentUser({ ...user, avatarUrl: savedProfile?.avatarUrl || undefined });
        }
      });

      api.documents.get(params.id)
      .then((doc) => {
        setTitle(doc.title || "Untitled Document");
        setDocEmoji(doc.emoji || "📄");
        setIsShared(doc.shared || false);
        setIsStarred(doc.starred || false);
        setInviteToken(doc.inviteToken || undefined);
        setInitialContent(doc.content || "");
      })
      .catch(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem(`docusphere-doc-${params.id}`) : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setTitle(parsed.title || "Untitled Document");
            setInitialContent(parsed.content || "");
          } catch {
            setTitle("Untitled Document");
          }
        } else {
          setTitle("Untitled Document");
        }
      });
  });
}, [params.id]);

  // ResizeObserver for page break calculation
  useEffect(() => {
    if (!contentRef.current || !paperMode) { setPageBreaks([]); return; }
    const orientKey = orientation === 'portrait' ? 'portrait' : 'landscape';
    const pageH = PAGE_HEIGHT_PX[pageSize]?.[orientKey] ?? PAGE_HEIGHT_PX.a4.portrait;
    const observer = new ResizeObserver((entries) => {
      const totalH = entries[0]?.contentRect.height ?? 0;
      const breaks: number[] = [];
      let y = pageH;
      while (y < totalH) { breaks.push(Math.round(y)); y += pageH; }
      setPageBreaks(breaks);
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [paperMode, pageSize, orientation]);

  // INITIALIZE EDITOR WITH GUARANTEED PROVIDER
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ undoRedo: false, link: false }),
      Collaboration.configure({ document: ydoc }),
      ...(provider ? [CollaborationCaret.configure({
        provider: provider,
        user: { name: currentUser?.name || "Collaborator", color: userColor },
      })] : []),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamilyExtension,
      FontSize,
      Subscript,
      Superscript,
      Typography,
      CharacterCount,
      CustomLink, // Using the renamed CustomLink to avoid duplicates
      Image,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: ({ node }) => node.type.name === "heading" ? "Heading…" : "Press '/' for commands, or start writing…",
      }),
    ],
    editorProps: { attributes: { class: "focus:outline-none" } },
    onUpdate: ({ editor }) => {
      setWordCount(editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0);
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from);
      if (textBefore === "/") {
        const coords = editor.view.coordsAtPos(from);
        setSlashPos({ top: coords.bottom + 8, left: coords.left });
        setSlashOpen(true);
      } else if (!textBefore.startsWith("/")) {
        setSlashOpen(false);
      }
      // Auto-save (debounced 2s)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        if (params.id === 'new') return;
        const content = editor.getHTML();
        const text = editor.getText();
        setSaveStatus('saving');
        try {
          const { api } = await import('@/lib/api');
          await api.documents.update(params.id, {
            title: titleRef.current,
            content,
            excerpt: text.slice(0, 120) + (text.length > 120 ? '...' : ''),
          });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch { setSaveStatus('idle'); }
      }, 2000);
    },
  }, [provider]);

  useEffect(() => {
    if (!editor || !isInitialLoad.current) return;
    if (initialContent) {
      editor.commands.setContent(initialContent);
    }
    isInitialLoad.current = false;
  }, [editor, initialContent]);

  useEffect(() => {
    setSaveAsName(title || "Untitled Document");
  }, [title]);

  // Update cursor name when user data loads (only in collaborative mode)
  useEffect(() => {
    if (editor && currentUser && provider) {
      editor.commands.updateUser({
        name: currentUser.name || "Collaborator",
        color: userColor,
      });
    }
  }, [editor, currentUser, userColor, provider]);

  // Menus and Formatting
  useEffect(() => {
    if (!editor) return;
    const updateBubble = () => {
      const { selection } = editor.state;
      if (selection.empty) return setBubbleMenu(prev => ({ ...prev, visible: false }));
      const coords = editor.view.coordsAtPos(selection.from);
      const editorRect = editor.view.dom.getBoundingClientRect();
      setBubbleMenu({ visible: true, top: coords.top - editorRect.top - 44, left: coords.left - editorRect.left });
    };
    editor.on('selectionUpdate', updateBubble);
    editor.on('blur', () => setBubbleMenu(prev => ({ ...prev, visible: false })));
    return () => { editor.off('selectionUpdate', updateBubble); };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const updateFloating = () => {
      const { selection } = editor.state;
      if (!selection.empty) return setFloatingMenu(prev => ({ ...prev, visible: false }));
      const { $from } = selection;
      if (!($from.parent.type.name === 'paragraph' && $from.parent.content.size === 0)) {
        return setFloatingMenu(prev => ({ ...prev, visible: false }));
      }
      const coords = editor.view.coordsAtPos(selection.from);
      const editorRect = editor.view.dom.getBoundingClientRect();
      setFloatingMenu({ visible: true, top: coords.top - editorRect.top, left: coords.left - editorRect.left });
    };
    editor.on('selectionUpdate', updateFloating);
    editor.on('transaction', updateFloating);
    return () => {
      editor.off('selectionUpdate', updateFloating);
      editor.off('transaction', updateFloating);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || !painterActive) return;
    const handleSelection = () => {
      const { selection } = editor.state;
      if (selection.empty) return;
      if (painterMarks.length === 0) {
        setPainterMarks([...selection.$from.marks()]);
      } else {
        let chain = editor.chain().focus();
        painterMarks.forEach(mark => chain = chain.setMark(mark.type, mark.attrs));
        chain.run();
        setPainterActive(false);
        setPainterMarks([]);
      }
    };
    editor.on('selectionUpdate', handleSelection);
    return () => { editor.off('selectionUpdate', handleSelection); };
  }, [editor, painterActive, painterMarks]);

  // Metadata auto-save (title, emoji, shared, starred) – also calls API
  useEffect(() => {
    if (isInitialLoad.current || params.id === "new") return;
    const timer = setTimeout(async () => {
      const stored = localStorage.getItem(`docusphere-doc-${params.id}`);
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem(`docusphere-doc-${params.id}`, JSON.stringify({
        ...existing, title, emoji: docEmoji, shared: isShared, starred: isStarred, inviteToken,
      }));
      try {
        const { api } = await import("@/lib/api");
        await api.documents.update(params.id, { title, emoji: docEmoji, shared: isShared, starred: isStarred });
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [title, docEmoji, isShared, isStarred, inviteToken, params.id]);

  useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target as globalThis.Node)
    ) {
      setProfileOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const handleTitleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") editor?.commands.focus();
  };

  const handleManualSave = useCallback(async () => {
    setSaveAsName(title || "Untitled Document");
    setSaveAsModalOpen(true);
  }, [title]);

  const saveDocument = useCallback(
    async (newTitle?: string) => {
      if (!editor) return;
      const titleToSave = newTitle?.trim() || title || "Untitled Document";
      setSaveStatus("saving");
      const content = editor.getHTML();
      const text = editor.getText();
      const excerpt = text.trim().slice(0, 120) + (text.length > 120 ? "..." : "");
      const stored = localStorage.getItem(`docusphere-doc-${params.id}`);
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem(`docusphere-doc-${params.id}`, JSON.stringify({
        ...existing,
        content,
        title: titleToSave,
        excerpt,
        updatedAt: new Date().toISOString(),
      }));
      try {
        const { api } = await import("@/lib/api");
        const updated = await api.documents.update(params.id, {
          title: titleToSave,
          content,
          excerpt,
        });
        setTitle(titleToSave);
        if ((updated as any)?.inviteToken) setInviteToken((updated as any).inviteToken);
      } catch {
        triggerToast("Unable to save document right now.");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    [editor, params.id, title, triggerToast]
  );

  const confirmSaveAs = async () => {
    setSaveAsModalOpen(false);
    await saveDocument(saveAsName);
  };

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const avatarUrl = loadEvent.target?.result as string;
      setProfileUploading(true);
      try {
        const storedProfile = typeof window !== "undefined" ? localStorage.getItem("docusphere-user-profile") : null;
        const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};
        const updated = { ...(currentUser || {}), avatarUrl };
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "docusphere-user-profile",
            JSON.stringify({ ...existingProfile, avatarUrl })
          );
        }
        setCurrentUser(updated as any);
        triggerToast("Profile picture updated!");
      } catch (error) {
        console.error("Failed to update profile pic", error);
        triggerToast("Unable to update profile picture.");
      } finally {
        setProfileUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerProfileUpload = () => profileInputRef.current?.click();

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed editor-page"
      style={{ backgroundColor: "var(--background)", backgroundImage: "url('/background.jpg')" }}
    >
      {/* Top bar */}
      <AnimatePresence>
        {!focusMode && !readMode && (
          <motion.header
            key="topbar"
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="sticky top-0 z-30 flex items-center gap-3 px-4 h-12 backdrop-blur-md"
            style={{ background: "rgba(var(--surface-rgb), 0.4)", borderBottom: "1px solid rgba(var(--border-rgb), 0.3)" }}
          >
            <button onClick={() => router.push("/dashboard")} className="btn-ghost gap-1.5 pl-1.5 pr-2.5 py-1">
              <ChevronLeft size={14} />
              <span className="text-xs">Back</span>
            </button>
            <div className="w-px h-4" style={{ background: "var(--border)" }} />
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-base hover:scale-110 transition-transform relative">
                {docEmoji}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 4 }}
                      className="absolute top-full left-0 mt-2 surface p-2 grid grid-cols-6 gap-1 z-50"
                      style={{ boxShadow: "var(--shadow-lg)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {EMOJI_LIST.map((e) => (
                        <button
                          key={e}
                          className="w-8 h-8 rounded-lg text-base hover:bg-[var(--surface-hover)] flex items-center justify-center transition-all"
                          onClick={() => { setDocEmoji(e); setShowEmojiPicker(false); }}
                        >
                          {e}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="bg-transparent outline-none font-semibold text-sm truncate min-w-0"
                style={{ color: "var(--foreground)", fontFamily: "inherit" }}
                aria-label="Document title"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <AnimatePresence mode="wait">
                  {saveStatus !== "idle" && (
                    <motion.div
                      key={saveStatus}
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                      style={{
                        background: saveStatus === "saved" ? "var(--accent-light)" : "var(--surface-hover)",
                        color: saveStatus === "saved" ? "var(--accent)" : "var(--muted)",
                      }}
                    >
                      {saveStatus === "saving" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      {saveStatus === "saving" ? "Saving…" : "Saved"}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualSave}
                  className="btn-ghost w-8 h-8 justify-center p-0 relative"
                  title="Save now"
                >
                  <Save size={14} className={saveStatus === "saving" ? "animate-pulse text-[var(--accent)]" : ""} />
                  {saveStatus === "saved" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--surface)] flex items-center justify-center">
                      <Check size={6} className="text-white" />
                    </motion.div>
                  )}
                </motion.button>
              </div>

              <div className="hidden sm:flex items-center -space-x-1.5">
                {["#6366f1", "#3b82f6", "#22c55e"].map((color, i) => (
                  <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2" style={{ background: color, boxShadow: "0 0 0 2px var(--surface)" }} />
                ))}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium ring-2" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--muted)", boxShadow: "0 0 0 2px var(--surface)" }}>
                  +2
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShareModal(true)} className="btn-primary text-xs py-1.5 px-3">
                <Share2 size={12} /> Share
              </motion.button>

              <button onClick={toggleTheme} className="btn-ghost w-8 h-8 justify-center p-0">
                <AnimatePresence mode="wait">
                  <motion.span key={theme} initial={{ scale: 0.6, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.6, opacity: 0, rotate: 30 }} transition={{ duration: 0.18 }}>
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="btn-ghost w-8 h-8 justify-center p-0 rounded-full overflow-hidden border border-[var(--border)]"
                  title="Open profile"
                >
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-semibold">
                      {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--background)] border border-[var(--border)]">
                            {currentUser?.avatarUrl ? (
                              <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                                {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)]">{currentUser?.name || "Your profile"}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{currentUser?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <button
                          onClick={() => router.push("/profile")}
                          className="w-full rounded-xl px-3 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all"
                        >
                          Profile settings
                        </button>
                        <button
                          onClick={triggerProfileUpload}
                          className="w-full rounded-xl px-3 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all"
                        >
                          {profileUploading ? "Uploading..." : "Change picture"}
                        </button>
                        <button
                          onClick={async () => {
                            await api.auth.logout();
                            router.push("/login");
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-all"
                        >
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setFocusMode(!focusMode)} className="btn-ghost w-8 h-8 justify-center p-0">
                <Maximize2 size={14} />
              </button>
              <input
                type="file"
                ref={profileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePhotoChange}
              />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(focusMode || readMode) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            onClick={() => { setFocusMode(false); setReadMode(false); setShowToolbar(true); }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <Minimize2 size={12} /> Exit {readMode ? "Read Mode" : "Focus Mode"}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!focusMode && !readMode && showToolbar && (
          <motion.div key="toolbar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EditorToolbar
              editor={editor}
              onPrint={() => window.print()}
              onSave={handleManualSave}
              onTogglePaperMode={() => setPaperMode(!paperMode)}
              isPaperMode={paperMode}
              showRuler={showRuler} setShowRuler={setShowRuler}
              showGridlines={showGridlines} setShowGridlines={setShowGridlines}
              orientation={orientation} setOrientation={setOrientation}
              margins={margins} setMargins={setMargins}
              pageColor={pageColor} setPageColor={setPageColor}
              pageBorder={pageBorder} setPageBorder={setPageBorder}
              watermark={watermark} setWatermark={setWatermark}
              zoom={zoom} setZoom={setZoom}
              readMode={readMode} setReadMode={setReadMode}
              painterActive={painterActive} setPainterActive={setPainterActive}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              replaceTerm={replaceTerm} setReplaceTerm={setReplaceTerm}
              showSearch={showSearch} setShowSearch={setShowSearch}
              setShareModal={setShareModal} pageSize={pageSize} setPageSize={setPageSize}
              onImageUpload={() => fileInputRef.current?.click()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-3">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">New to DocuSphere?</p>
            <p className="text-xs text-[var(--muted)]">Start typing on the white page, then use the top toolbar to style text, change page settings, and save. The color swatches on the Home tab let you change the text color instantly.</p>
            <div className="grid gap-2 sm:grid-cols-3 text-[12px] text-[var(--foreground)]">
              <div className="rounded-2xl bg-[var(--background)] p-3 border border-[var(--border)]">
                <strong>Toolbar:</strong> formatting, font, and text colors in one place.
              </div>
              <div className="rounded-2xl bg-[var(--background)] p-3 border border-[var(--border)]">
                <strong>Save:</strong> use the Save button to preserve your title, content, and excerpt.
              </div>
              <div className="rounded-2xl bg-[var(--background)] p-3 border border-[var(--border)]">
                <strong>Share:</strong> open the Share panel to invite collaborators and manage links.
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && editor) {
            const reader = new FileReader();
            reader.onload = (event) => { (editor.chain().focus() as any).setImage({ src: event.target?.result as string }).run(); };
            reader.readAsDataURL(file);
          }
        }}
      />

      <div className={`flex-1 overflow-y-auto ${paperMode ? "paper-container" : ""}`} style={{ scrollBehavior: "smooth" }} onClick={() => { setShowEmojiPicker(false); if (!slashOpen) editor?.commands.focus(); }}>
        <motion.div
          ref={contentRef}
          layout
          className={`relative mx-auto transition-all duration-500 ${paperMode ? "paper-mode-active" : "py-12 px-6"}`}
          style={{
            width: paperMode ? (orientation === "portrait" ? PAGE_SIZES[pageSize].width : PAGE_SIZES[pageSize].height) : "100%",
            maxWidth: paperMode ? "none" : (focusMode ? "680px" : "840px"),
            minHeight: paperMode ? (orientation === "portrait" ? PAGE_SIZES[pageSize].height : PAGE_SIZES[pageSize].width) : "80vh",
            backgroundColor: pageColor,
            border: pageBorder === "none" ? "1px solid rgba(var(--border-rgb), 0.1)" : `${pageBorder === 'double' ? '3px' : '1px'} ${pageBorder} var(--border)`,
            transform: `scale(${zoom / 100})`, transformOrigin: "top center",
            padding: margins === "wide" ? "2in" : margins === "narrow" ? "0.4in" : "1in",
            marginTop: paperMode ? "40px" : "0", marginBottom: "100px",
            boxShadow: paperMode ? "0 20px 50px rgba(0,0,0,0.15)" : "none",
          }}
        >



          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
              <span className="text-[180px] font-black opacity-[0.03] -rotate-45 uppercase tracking-[0.2em] whitespace-nowrap">{watermark.repeat(5)}</span>
            </div>
          )}

          <div className="relative z-10">
            {editor && (
              <>
                <AnimatePresence>
                  {bubbleMenu.visible && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.12 }}
                      className="bubble-menu absolute z-50 pointer-events-auto" style={{ top: bubbleMenu.top, left: bubbleMenu.left }} onMouseDown={(e) => e.preventDefault()}
                    >
                      {[
                        { icon: <Bold size={12} />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), label: "Bold" },
                        { icon: <Italic size={12} />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), label: "Italic" },
                        { icon: <Code size={12} />, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code"), label: "Code" },
                        { icon: <Heading1 size={12} />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), label: "H1" },
                        { icon: <Heading2 size={12} />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), label: "H2" },
                        { icon: <Quote size={12} />, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), label: "Quote" },
                      ].map(({ icon, action, active, label }) => (
                        <button key={label} className={`bubble-btn ${active ? "is-active" : ""}`} onClick={action} aria-label={label} title={label}>{icon}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {floatingMenu.visible && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.12 }}
                      className="absolute z-40 flex items-center gap-1 pointer-events-auto" style={{ top: floatingMenu.top, left: floatingMenu.left - 28 }} onMouseDown={(e) => e.preventDefault()}
                    >
                      <button
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all" style={{ color: "var(--muted)", background: "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        onClick={() => {
                          const coords = editor.view.coordsAtPos(editor.state.selection.from);
                          setSlashPos({ top: coords.bottom + 8, left: coords.left });
                          setSlashOpen(true);
                        }}
                      >
                        <span className="font-mono text-base leading-none">+</span><span>Add block</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <div className="group/editor relative">
              <AnimatePresence>
                {showGridlines && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
                    style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                  />
                )}
              </AnimatePresence>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Google Docs-style page break lines */}
          {paperMode && pageBreaks.map((y, i) => (
            <div key={i} className="pointer-events-none select-none" style={{ position: 'absolute', top: y, left: 0, right: 0, zIndex: 20 }}>
              {/* Bottom shadow of page above */}
              <div style={{ height: '12px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), transparent)', position: 'absolute', top: 0, left: 0, right: 0 }} />
              {/* Gap strip */}
              <div style={{ height: '16px', background: 'var(--background)', borderTop: '1px solid rgba(var(--border-rgb),0.5)', borderBottom: '1px solid rgba(var(--border-rgb),0.5)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                <span style={{ fontSize: '9px', color: 'var(--muted)', opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' }}>Page {i + 2}</span>
              </div>
              {/* Top shadow of page below */}
              <div style={{ height: '12px', background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)', position: 'absolute', bottom: -12, left: 0, right: 0 }} />
            </div>
          ))}
        </motion.div>
      </div>

      <SlashCommandMenu editor={editor} open={slashOpen} onClose={() => setSlashOpen(false)} position={slashPos} />

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-40 right-10 z-50 w-64 surface p-4 shadow-2xl border flex flex-col gap-3" style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">Find & Replace</span>
              <button onClick={() => setShowSearch(false)} className="opacity-60 hover:opacity-100">×</button>
            </div>
            <input className="input-base text-xs py-1.5" placeholder="Find..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <input className="input-base text-xs py-1.5" placeholder="Replace with..." value={replaceTerm} onChange={(e) => setReplaceTerm(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 text-[10px] py-1" onClick={() => { }}>Find Next</button>
              <button className="btn-primary flex-1 text-[10px] py-1" onClick={() => {
                if (!searchTerm || !editor) return;
                const newContent = editor.getHTML().split(searchTerm).join(replaceTerm);
                editor.commands.setContent(newContent);
              }}>Replace All</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveAsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && setSaveAsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="surface w-full max-w-sm overflow-hidden rounded-3xl"
              style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Save document</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">Enter the file name before saving.</p>
                  </div>
                  <button onClick={() => setSaveAsModalOpen(false)} className="w-7 h-7 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] flex items-center justify-center">×</button>
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">File name</label>
                <input
                  className="input-base w-full text-sm"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmSaveAs(); }}
                  placeholder="Untitled Document"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSaveAsModalOpen(false)}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSaveAs}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && setShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="surface w-full max-w-md overflow-hidden" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)", borderRadius: "20px" }} onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Share Document</h3>
                    <p className="text-xs mt-0.5 truncate max-w-[280px]" style={{ color: "var(--muted)" }}>{docEmoji} {title || "Untitled Document"}</p>
                  </div>
                  <button onClick={() => setShareModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--surface-hover)] text-[var(--muted)]" style={{ fontSize: "16px" }}>×</button>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: isShared ? "rgba(var(--accent-rgb), 0.06)" : "var(--background)", border: `1px solid ${isShared ? "rgba(var(--accent-rgb),0.3)" : "var(--border)"}` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isShared ? "bg-[var(--accent-light)]" : "bg-[var(--surface-hover)]"}`}>
                      <Share2 size={14} style={{ color: isShared ? "var(--accent)" : "var(--muted)" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{isShared ? "Sharing Enabled" : "Sharing Disabled"}</p>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>{isShared ? "Anyone with the link can edit" : "Only you can access this document"}</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    const newShared = !isShared;
                    setIsShared(newShared);
                    try {
                      const { api } = await import("@/lib/api");
                      const updated = await api.documents.update(params.id, { shared: newShared });
                      if (newShared) {
                        setInviteToken((updated as any).inviteToken || undefined);
                        triggerToast("Sharing enabled — link generated!");
                      } else {
                        triggerToast("Sharing disabled");
                      }
                    } catch { triggerToast("Failed to update sharing settings"); }
                  }} className={`relative w-10 h-5 rounded-full transition-all duration-200 ${isShared ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${isShared ? "left-[22px]" : "left-[2px]"}`} />
                  </button>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Invite Collaborators</p>
                  <div className="flex gap-2">
                    <input
                      className="input-base text-sm flex-1" placeholder="Enter email address…" value={inviteEmailInput} onChange={(e) => setInviteEmailInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && inviteEmailInput.trim()) {
                          if (inviteEmailInput.includes("@")) {
                            const emailToInvite = inviteEmailInput.trim(); setInviteEmailInput("");
                            try {
                              const api = (await import("@/lib/api")).api; await api.documents.addCollaborator(params.id, emailToInvite);
                              setInvitedEmails(prev => [...new Set([...prev, emailToInvite])]);
                              if (!isShared) setIsShared(true); triggerToast(`Invited ${emailToInvite}`);
                            } catch (err: any) { triggerToast(err.message || "Failed to invite user"); }
                          } else triggerToast("Please enter a valid email address");
                        }
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary px-4 text-sm flex-shrink-0"
                      onClick={async () => {
                        if (inviteEmailInput.trim() && inviteEmailInput.includes("@")) {
                          const emailToInvite = inviteEmailInput.trim(); setInviteEmailInput("");
                          try {
                            const api = (await import("@/lib/api")).api; await api.documents.addCollaborator(params.id, emailToInvite);
                            setInvitedEmails(prev => [...new Set([...prev, emailToInvite])]);
                            if (!isShared) setIsShared(true); triggerToast(`Invited ${emailToInvite}`);
                          } catch (err: any) { triggerToast(err.message || "Failed to invite user"); }
                        }
                      }}
                    >
                      <Users size={13} /> Invite
                    </motion.button>
                  </div>
                  {invitedEmails.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {invitedEmails.map((email) => (
                        <div key={email} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: `hsl(${email.charCodeAt(0) * 7 % 360}, 60%, 50%)` }}>
                            {email[0].toUpperCase()}
                          </div>
                          <span className="text-xs flex-1 truncate" style={{ color: "var(--foreground)" }}>{email}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Can edit</span>
                          <button className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-lg leading-none ml-1" onClick={() => setInvitedEmails(prev => prev.filter(e => e !== email))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Invite Link</p>
                  <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: isShared && inviteToken ? "rgba(var(--accent-rgb), 0.04)" : "var(--background)", border: `1px solid ${isShared && inviteToken ? "rgba(var(--accent-rgb),0.2)" : "var(--border)"}` }}>
                    <div className="flex-1 min-w-0">
                      {isShared && inviteToken ? (
                        <><p className="text-[10px] font-medium mb-0.5" style={{ color: "var(--accent)" }}>🔗 Active Invite Link</p><p className="text-xs truncate font-mono opacity-70" style={{ color: "var(--foreground)" }}>{window.location.origin}/join/{inviteToken}</p></>
                      ) : (
                        <><p className="text-[10px] font-medium mb-0.5" style={{ color: "var(--muted)" }}>No active link</p><p className="text-xs opacity-50" style={{ color: "var(--muted)" }}>Enable sharing above to create a link</p></>
                      )}
                    </div>
                    <motion.button
                      whileHover={isShared && inviteToken ? { scale: 1.03 } : {}} whileTap={isShared && inviteToken ? { scale: 0.97 } : {}}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all flex-shrink-0 ${isShared && inviteToken ? "bg-[var(--accent)] text-white" : "opacity-30 cursor-not-allowed"} ${linkCopied ? "bg-[var(--success)]" : ""}`}
                      disabled={!isShared || !inviteToken}
                      onClick={() => {
                        if (inviteToken) {
                          navigator.clipboard.writeText(`${window.location.origin}/join/${inviteToken}`); setLinkCopied(true); triggerToast("Invite link copied to clipboard!"); setTimeout(() => setLinkCopied(false), 2000);
                        }
                      }}
                    >
                      {linkCopied ? <><Check size={11} />Copied!</> : "Copy Link"}
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center -space-x-1.5">
                    {["#6366f1", "#3b82f6", "#22c55e"].map((color, i) => (
                      <div key={i} className="w-6 h-6 rounded-full ring-2 ring-[var(--surface)] flex items-center justify-center text-white text-[8px] font-bold" style={{ background: color }}>{["A", "V", "K"][i]}</div>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{3 + invitedEmails.length} collaborator{3 + invitedEmails.length !== 1 ? "s" : ""} with access</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!focusMode && (
          <motion.div
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            className="sticky bottom-0 flex items-center justify-between px-5 py-2 text-xs backdrop-blur-md"
            style={{ background: "rgba(var(--surface-rgb), 0.4)", borderTop: "1px solid rgba(var(--border-rgb), 0.3)", color: "var(--muted)" }}
          >
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span><span className="w-px h-3" style={{ background: "var(--border)" }} />
              <span>Press <kbd className="font-mono px-1 py-0.5 rounded text-[10px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>/</kbd> for commands</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowToolbar(!showToolbar)} className="hover:text-[var(--foreground)] transition-colors">{showToolbar ? "Hide toolbar" : "Show toolbar"}</button>
              <span className="w-px h-3" style={{ background: "var(--border)" }} />
              <button onClick={() => setFocusMode(true)} className="hover:text-[var(--foreground)] transition-colors">Focus mode</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-12 left-1/2 z-[100] px-6 py-3 rounded-2xl backdrop-blur-md shadow-2xl border flex items-center gap-3"
            style={{ background: "rgba(var(--surface-rgb), 0.8)", borderColor: "rgba(var(--border-rgb), 0.5)", color: "var(--foreground)" }}
          >
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 2. THE WRAPPER COMPONENT (Non-blocking — editor loads immediately from DB)
// WebSocket (Hocuspocus) is attempted in background; falls back to offline mode
// after 5 seconds so the editor is NEVER blocked by WebSocket availability.
// ============================================================================
export default function EditorPage({ params }: EditorPageProps) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

    // Only attempt WebSocket if a real URL is configured (not localhost fallback)
    if (!wsUrl || wsUrl.includes("localhost")) {
      console.info("[Editor] No WebSocket server configured — running in offline mode.");
      return;
    }

    let destroyed = false;
    // 5-second hard timeout — if WS hasn't connected, we still show the editor
    const timeout = setTimeout(() => {
      if (!destroyed) {
        console.warn("[Editor] WebSocket timed out — continuing in offline mode.");
      }
    }, 5000);

    const p = new HocuspocusProvider({
      url: wsUrl,
      name: params.id,
      document: ydoc,
      onStatus: ({ status }) => {
        if (status === "connected") {
          clearTimeout(timeout);
          if (!destroyed) setProvider(p);
        }
      },
    });

    return () => {
      destroyed = true;
      clearTimeout(timeout);
      p.destroy();
    };
  }, [params.id, ydoc]);

  // Always render — provider may be null (offline mode) or a live WS instance
  return <EditorWorkspace params={params} ydoc={ydoc} provider={provider} />;
}

