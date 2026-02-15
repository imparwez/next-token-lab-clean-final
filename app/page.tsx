/*
======================================================
NEXT TOKEN LAB — ELITE AI BLOG PLATFORM (FINAL BOSS)
======================================================

NEW ELITE FEATURES
✔ In-site markdown editor with LIVE preview
✔ Drag & drop image → auto insert into markdown (base64)
✔ Reading time auto-calculated
✔ Featured post section (latest)
✔ Scroll progress bar while reading
✔ Local admin-created blogs auto-saved (no manual index edit)
✔ Hidden admin console SHIFT+L
✔ "By MD Parwez" + full About kept

PUT THIS FILE → app/page.tsx
======================================================
*/

"use client";

import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search, Plus } from "lucide-react";

// Types
interface Post {
  slug: string;
  title: string;
  tag: string;
  date: string;
  local?: boolean;
  content?: string;
}

type CardProps = React.HTMLAttributes<HTMLDivElement>;
type BoxProps = React.HTMLAttributes<HTMLDivElement>;
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { children: React.ReactNode };
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// ---------- tiny ui ----------
const Card = (p: CardProps) => <div {...p} className="bg-zinc-900 border border-zinc-800 rounded-2xl cursor-pointer" />;
const Box = (p: BoxProps) => <div {...p} className="p-6 space-y-4" />;
const Badge = (p: BadgeProps) => <span className="text-xs bg-white/10 px-2 py-1 rounded">{p.children}</span>;
const Input = (p: InputProps) => <input {...p} className="bg-transparent outline-none w-full border border-zinc-800 rounded px-3 py-2" />;

// ---------- admin ----------
const ADMIN_EMAIL = "parrykaju@gmail.com";
const validAdmin = (e: string) => e?.trim().toLowerCase() === ADMIN_EMAIL;

// reading time helper
const readingTime = (txt: string) => Math.max(1, Math.ceil(txt.split(/\s+/).length / 200));

export default function Page() {
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [active, setActive] = useState<Post | null>(null);
  const [content, setContent] = useState("");

  // ⭐ editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMarkdown, setNewMarkdown] = useState("# New Blog\n\nWrite here...");

  // restore admin from localStorage
  useEffect(() => {
    const isAdminSaved = localStorage.getItem("ntl_admin") === "true";
    if (isAdminSaved) {
      setIsAdmin(true);
    }
  }, []);

  // secret login
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "l") setLoginOpen(v => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // load server blogs
  useEffect(() => {
    fetch("/blogs/index.json")
      .then(r => r.json())
      .then((server: Post[]) => {
        const local = JSON.parse(localStorage.getItem("ntl_local_posts") || "[]") as Post[];
        setPosts([...local, ...server]);
      })
      .catch(() => {
        const local = JSON.parse(localStorage.getItem("ntl_local_posts") || "[]") as Post[];
        setPosts(local);
      });
  }, []);

  // load content
  useEffect(() => {
    if (!active) return;
    const loadContent = async () => {
      if (active.local) {
        setContent(active.content || "");
        return;
      }
      const text = await fetch(`/blogs/${active.slug}.md`).then(r => r.text());
      setContent(text);
    };
    loadContent();
  }, [active]);

  // filter
  const filtered = posts.filter((p: Post) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || p.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  // get all unique tags for filtering
  const allTags = Array.from(new Set(posts.map(p => p.tag))).sort();

  // featured = newest
  const featured = filtered[0];

  // scroll progress
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const sc = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      setProgress(sc * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⭐ save local blog (auto index!)
  function saveLocalBlog() {
    if (!newTitle.trim()) return alert("Add title");
    const post: Post = {
      slug: "local-" + Date.now(),
      title: newTitle,
      tag: "NEW",
      date: new Date().toLocaleDateString(),
      local: true,
      content: newMarkdown
    };
    const existing = JSON.parse(localStorage.getItem("ntl_local_posts") || "[]") as Post[];
    const updated = [post, ...existing];
    localStorage.setItem("ntl_local_posts", JSON.stringify(updated));
    setPosts(p => [post, ...p]);
    setEditorOpen(false);
    setNewTitle("");
  }

  // ⭐ drag image → insert markdown
  function onDropImage(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setNewMarkdown(m => m + `\n\n![](${r.result})\n`);
    r.readAsDataURL(f);
  }

  const readTime = useMemo(() => readingTime(content || ""), [content]);

  return (
    <main className="min-h-screen bg-black text-white px-8 md:px-20 py-10 space-y-20">

      {/* progress bar */}
      {active && <div className="fixed top-0 left-0 h-1 bg-green-400" style={{ width: progress + "%" }} />}

      <nav className="flex justify-between items-center">
        <h1>NEXT TOKEN LAB</h1>
        <div className="flex gap-4 items-center">
          {isAdmin && !active && (
            <>
              <button onClick={() => setEditorOpen(true)} className="flex items-center gap-1 text-green-400 text-sm"><Plus size={16} />New</button>
              <button 
                onClick={() => { 
                  setIsAdmin(false); 
                  localStorage.removeItem("ntl_admin");
                  setEmail("");
                }} 
                className="text-green-400 text-sm hover:text-green-300 transition"
              >
                Logout
              </button>
            </>
          )}
          {isAdmin && active && (
            <button 
              onClick={() => { 
                setIsAdmin(false); 
                localStorage.removeItem("ntl_admin");
                setEmail("");
              }} 
              className="text-green-400 text-sm hover:text-green-300 transition"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* hero */}
      <section className="grid md:grid-cols-2 gap-14 items-center py-14">
        <div className="space-y-6">
          <div>
            <h2 className="text-5xl md:text-6xl font-semibold">Next Token <span className="text-green-400">Lab</span></h2>
            <p className="text-green-400 text-sm mt-3">Understanding. Building. Shipping.</p>
          </div>
          <div className="space-y-4 border-l-2 border-green-400/30 pl-6">
            <div>
              <div className="text-xs text-green-400 uppercase tracking-widest font-semibold letter-spacing-2">By MD Parwez</div>
              <div className="text-sm text-green-300 font-medium mt-1">AI/ML System Engineer • Token-First Architecture</div>
              <p className="text-base text-gray-200 mt-4 leading-relaxed">6+ years in AI/ML engineering with deep expertise in production systems, LLM architectures, and intelligent workflows. 4 years specializing in Data Science research, 2 years shipping real AI solutions.</p>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">Building systems that work. Not just prototypes — production-grade, scalable AI infrastructure designed for real-world impact.</p>
              <p className="text-sm text-green-400 italic mt-4 font-semibold">Not teaching AI. Engineering it.</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-green-400/30 rounded-2xl p-8 font-mono text-green-400 text-sm space-y-3 hover:border-green-400/50 transition shadow-lg shadow-green-400/10">
          <div className="text-green-300">$ <span className="text-green-400">predict</span>(next_token)</div>
          <div className="text-green-600 text-xs mt-4">{`// Core thinking: systems > hype`}</div>
          <div className="text-green-600 text-xs">{`// Architecture > buzzwords`}</div>
          <div className="text-green-600 text-xs">{`// Production > promises`}</div>
          <div className="text-green-500 text-xs mt-3 font-semibold">{`→ Let's build something real.`}</div>
        </div>
      </section>

      {/* WHY THIS LAB */}
      <section className="bg-gradient-to-r from-green-400/10 via-transparent to-green-400/5 border-l-4 border-green-400 rounded-lg p-8 md:p-10 space-y-4">
        <div className="space-y-4">
          <h3 className="text-2xl md:text-3xl font-bold text-white">Why I Started This Lab</h3>
          <div className="space-y-3">
            <p className="text-gray-300 text-base leading-relaxed">
              <span className="text-green-400 font-semibold">The problem:</span> Most engineers copy-paste code, use frameworks, deploy models — without truly understanding <span className="text-green-300 font-semibold italic">how they work</span>.
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              They don&apos;t ask the hard questions: What algorithm powers this? Why does this technique work? How does the system <span className="text-green-300 font-semibold italic">actually behave</span> in production? What are the tradeoffs?
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              <span className="text-green-400 font-semibold">My approach:</span> I obsess over research papers, deep architecture thinking, and real-world implementation. This lab is where I share those insights — the <span className="text-green-300 font-semibold italic">why</span> behind the <span className="text-green-300 font-semibold italic">how</span>.
            </p>
            <p className="text-gray-300 text-base leading-relaxed font-semibold text-green-300 mt-4">
              Real AI engineering. Real understanding. Real systems that work.
            </p>
          </div>
        </div>
      </section>

      {/* featured */}
      {featured && !active && (
        <section className="border border-green-400/30 rounded-2xl p-6 md:p-8 bg-gradient-to-r from-green-400/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="text-xs text-green-400 font-semibold uppercase">Latest Insight</div>
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold cursor-pointer hover:text-green-400 transition" onClick={() => setActive(featured)}>{featured.title}</h3>
          <p className="text-sm text-gray-400 mt-3">{featured.date} • {featured.tag}</p>
        </section>
      )}

      {/* search */}
      <section className="space-y-3">
        <label className="text-sm text-gray-400 uppercase tracking-wide">Explore Posts</label>
        <div className="flex items-center gap-3 border border-zinc-700 hover:border-green-400/50 transition rounded-xl px-4 py-3 bg-zinc-900/30">
          <Search size={18} className="text-green-400" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
        </div>
      </section>

      {/* TOPIC FILTER */}
      {allTags.length > 0 && (
        <section className="space-y-3">
          <label className="text-sm text-gray-400 uppercase tracking-wide">Filter by Topic</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                !selectedTag
                  ? "bg-green-400 text-black font-semibold"
                  : "border border-zinc-700 text-gray-400 hover:border-green-400"
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  selectedTag === tag
                    ? "bg-green-400 text-black font-semibold"
                    : "border border-zinc-700 text-gray-400 hover:border-green-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* list / article */}
      {!active ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-200">Insights Library ({filtered.length})</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {filtered.map((p: Post) => {
              const rt = p.local ? readingTime(p.content || "") : 3;
              return (
                <Card key={p.slug} onClick={() => setActive(p)} className="hover:border-green-400/50 hover:bg-zinc-800/50 transition">
                  <Box>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <Badge>{p.tag}</Badge>
                        <h3 className="text-lg font-semibold mt-3 text-gray-100">{p.title}</h3>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-zinc-800">
                      <span>{p.date}</span>
                      <span>{rt} min read</span>
                    </div>
                    <div className="text-green-400 text-sm mt-3 font-semibold">read →</div>
                  </Box>
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="max-w-3xl mx-auto">
          <button onClick={() => setActive(null)} className="text-green-400 mb-6">← back</button>
          <h1 className="text-4xl font-bold mb-2">{active?.title}</h1>
          <div className="text-sm text-gray-400 mb-6">{readTime} min read</div>
          <article className="prose prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></article>
        </section>
      )}

      {/* NEWSLETTER */}
      {/* Removed - keeping UI clean */}

      {/* ABOUT */}
      <section className="bg-gradient-to-br from-green-400/5 via-black to-black border border-green-400/20 rounded-2xl p-8 md:p-12 space-y-10">
        <div>
          <h2 className="text-4xl font-bold mb-8 text-white">About the Lab</h2>
          <p className="text-gray-200 text-lg leading-relaxed mb-4">
            I&apos;m <span className="text-green-400 font-semibold">MD Parwez</span>, an AI/ML system engineer with 6+ years in the field. I don&apos;t just use AI — I design and ship real systems that work at production scale.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            My focus: the hard part of AI. Understanding <span className="text-green-400 font-semibold">how models actually think</span>, designing <span className="text-green-400 font-semibold">robust architectures</span>, and building <span className="text-green-400 font-semibold">systems that scale</span>. From token mechanics to full pipeline engineering.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mt-4">
            I believe real AI engineering isn&apos;t about chasing the latest trend - it&apos;s about deep understanding, clear design patterns, and code that actually works. <span className="text-green-400 italic">Not teaching. Building.</span>
          </p>
        </div>

        <div className="border-t border-green-400/20 pt-8">
          <h3 className="text-2xl font-bold text-green-400 mb-6">Why Read This Lab</h3>
          <p className="text-gray-300 mb-6 text-base">Built for engineers and builders serious about understanding AI — not just using it.</p>
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-4 items-start">
              <span className="text-green-400 text-lg font-bold mt-0.5">→</span>
              <span className="text-base"><span className="text-green-300 font-semibold">Complex research, simple language:</span> Advanced AI concepts explained with engineering clarity</span>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-green-400 text-lg font-bold mt-0.5">→</span>
              <span className="text-base"><span className="text-green-300 font-semibold">Real architecture thinking:</span> LLM design, agent systems, and production patterns</span>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-green-400 text-lg font-bold mt-0.5">→</span>
              <span className="text-base"><span className="text-green-300 font-semibold">Token-first perspective:</span> Understanding how AI actually works at the core</span>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-green-400 text-lg font-bold mt-0.5">→</span>
              <span className="text-base"><span className="text-green-300 font-semibold">Practical & deployable:</span> Ideas you can ship, not just theory</span>
            </div>
          </div>
          <p className="text-gray-400 italic mt-8 text-base border-l-2 border-green-400/30 pl-4">The goal isn&apos;t to use AI. It&apos;s to truly understand how it works - and then build systems that matter.</p>
        </div>

        <div className="border-t border-green-400/20 pt-8">
          <h3 className="text-2xl font-bold text-green-400 mb-6">Connect & Collaborate</h3>
          <div className="flex flex-wrap gap-3">
            <a href="https://www.linkedin.com/in/md-parwez-3a44871b7/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-semibold border border-green-400 text-green-400 rounded-lg hover:bg-green-400 hover:text-black hover:shadow-lg hover:shadow-green-400/30 transition duration-200">LinkedIn</a>
            <a href="https://github.com/MdParwez" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-semibold border border-green-400 text-green-400 rounded-lg hover:bg-green-400 hover:text-black hover:shadow-lg hover:shadow-green-400/30 transition duration-200">GitHub</a>
          </div>
          <p className="text-gray-400 text-sm mt-4">Open for discussions on AI systems, architecture, and shipping real intelligence.</p>
        </div>

        <div className="border-t border-green-400/20 pt-8">
          <p className="text-green-400 font-mono text-sm tracking-wide">$ <span className="text-green-300">engineer_mindset</span> = think → design → build → deploy → improve</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-green-400/20 pt-16 pb-12">
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-green-400">Next Token Lab</h3>
            <p className="text-gray-300 mt-2 text-base">Engineering production AI systems. Real thinking. Real code. Real impact.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-2">
              <p className="text-xs uppercase text-green-400 font-bold tracking-widest">Philosophy</p>
              <p className="text-sm text-gray-300 font-mono">understand → architect → ship → scale → improve</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase text-green-400 font-bold tracking-widest">Approach</p>
              <p className="text-sm text-gray-300">Token-first thinking. Systems engineering. Machine learning at scale.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase text-green-400 font-bold tracking-widest">Mission</p>
              <p className="text-sm text-gray-300">Build real AI. Not hype. Not fluff. Engineering intelligence.</p>
            </div>
          </div>
          <div className="border-t border-green-400/20 pt-8 flex justify-between items-center text-xs text-gray-500">
            <p>© 2026 MD Parwez. Built with intelligence and Next.js.</p>
            <p className="text-green-400">Not teaching AI. Engineering it.</p>
          </div>
        </div>
      </footer>

      {/* editor */}
      {editorOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">New Blog</h3>
              <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.currentTarget.value)} />
              <textarea
                value={newMarkdown}
                onChange={(e) => setNewMarkdown(e.currentTarget.value)}
                onDrop={onDropImage}
                onDragOver={(e) => e.preventDefault()}
                className="w-full h-[420px] bg-black border border-zinc-800 rounded p-3 font-mono text-sm"
              />
              <div className="text-xs text-gray-500">Tip: drag image into editor</div>
              <div className="flex gap-3">
                <button onClick={saveLocalBlog} className="bg-green-400 text-black px-4 py-2 rounded">Publish</button>
                <button onClick={() => setEditorOpen(false)} className="border border-zinc-700 px-4 py-2 rounded">Close</button>
              </div>
            </div>
            <div className="border border-zinc-800 rounded p-4 overflow-auto max-h-[520px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{newMarkdown}</ReactMarkdown></div>
          </div>
        </div>
      )}

      {/* login */}
      {loginOpen && !isAdmin && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 p-4 rounded-xl flex flex-col gap-2">
          <Input placeholder="admin email" value={email} onChange={(e) => { setEmail(e.currentTarget.value); setLoginError(""); }} />
          <button onClick={() => { if (validAdmin(email)) { setIsAdmin(true); localStorage.setItem("ntl_admin", "true"); setLoginOpen(false); } else setLoginError("Denied"); }} className="px-3 py-1 bg-green-400 text-black rounded">Unlock</button>
          {loginError && <div className="text-red-400 text-xs">{loginError}</div>}
        </div>
      )}

    </main>
  );
}
