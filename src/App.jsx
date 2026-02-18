import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  bg: "#f0ece4", bgDark: "#2a2520", gold: "#b8963e", goldLight: "#c9a84c",
  text: "#4a4540", textLight: "#7a7570", white: "#faf8f4", black: "#1a1815",
};

const HERO_IMG = "/images/hero.jpg";

const PROJECTS = [
  { title: "Loft Urbano", category: "RESIDENCIAL", year: "2024", image: "/images/project-1.jpg" },
  { title: "Terraço Panorâmico", category: "RESIDENCIAL", year: "2024", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop" },
  { title: "Museu Contemporâneo", category: "CULTURAL", year: "2024", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop" },
  { title: "Villa Tropical", category: "RESIDENCIAL", year: "2024", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop" },
  { title: "Lobby Corporativo", category: "COMERCIAL", year: "2024", image: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop" },
  { title: "Cozinha Minimalista", category: "INTERIORES", year: "2024", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop" }
];

const RENDER_STYLES = [
  { id: "photorealistic", label: "Fotorrealista", prompt: "Transform this architectural photo/sketch into a stunning photorealistic architectural visualization render. Add realistic lighting, materials, textures, reflections, and atmospheric effects. Make it look like a professional CGI architectural render with warm natural lighting, high detail materials, and photorealistic quality. Keep the same composition and perspective." },
  { id: "modern", label: "Moderno", prompt: "Transform this architectural image into a sleek modern architectural render with clean lines, minimalist aesthetic, large glass panels, concrete and steel materials, neutral tones with warm accent lighting, contemporary furniture, and lush vegetation. Professional architectural visualization quality." },
  { id: "warm", label: "Aconchegante", prompt: "Transform this architectural image into a warm, cozy architectural render with natural wood materials, soft warm lighting, earth tones, comfortable textures, indoor plants, and inviting atmosphere. Add golden hour sunlight streaming through windows." },
  { id: "luxury", label: "Luxo", prompt: "Transform this architectural image into a luxury high-end architectural render with premium marble, gold accents, crystal chandeliers, rich fabrics, designer furniture, dramatic lighting, and opulent finishes." },
  { id: "night", label: "Noturno", prompt: "Transform this architectural image into a dramatic nighttime architectural render with warm interior lighting glowing through windows, exterior landscape lighting, dramatic sky, city lights in background, moody atmosphere." },
  { id: "sketch", label: "Sketch", prompt: "Transform this image into an artistic architectural sketch render with watercolor effects, hand-drawn pencil lines, artistic shading, architectural concept art with warm color palette." },
];

const SERVICES = [
  { icon: "grid", title: "Plantas Humanizadas", description: "Representacoes artisticas de plantas baixas com mobiliario, paisagismo e elementos de vida real." },
  { icon: "building", title: "Design de Interiores", description: "Imagens fotorrealistas de ambientes internos com atencao meticulosa a texturas e iluminacao." },
  { icon: "exterior", title: "Renderizacao Exterior", description: "Visualizacoes impactantes de fachadas e paisagismo para lancamentos imobiliarios." },
  { icon: "video", title: "Animacao 3D", description: "Passeios virtuais cinematograficos que contam a historia do seu empreendimento." },
];

const SIcon = ({ type }) => {
  const s = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: COLORS.gold, strokeWidth: 1.5 };
  if (type === "grid") return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (type === "building") return <svg {...s}><path d="M3 21h18M4 21V7l8-4 8 4v14"/><rect x="9" y="13" width="6" height="8"/><rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/></svg>;
  if (type === "exterior") return <svg {...s}><rect x="2" y="6" width="20" height="14" rx="1"/><path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2M2 12h20"/></svg>;
  return <svg {...s}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><polygon points="10,12 16,15 10,18" fill={COLORS.gold} stroke="none"/></svg>;
};

function useInView(t = 0.15) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t }); o.observe(el); return () => o.disconnect(); }, [t]);
  return [ref, v];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, v] = useInView();
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(30px)", transition: `all 0.8s cubic-bezier(0.23,1,0.32,1) ${delay}s`, ...style }}>{children}</div>;
}

function RenderTool({ font, fontSans }) {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(RENDER_STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [renderedImage, setRenderedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file); setRenderedImage(null); setError("");
    const r = new FileReader(); r.onload = (e) => setUploadedImage(e.target.result); r.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  const generateRender = async () => {
    if (!uploadedFile || !apiKey) return;
    setLoading(true); setError(""); setRenderedImage(null); setProgress(10);
    try {
      const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(uploadedFile); });
      setProgress(25);
      const prompt = customPrompt || selectedStyle.prompt;
      const body = { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: uploadedFile.type || "image/jpeg", data: b64 } }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], temperature: 1 } };
      setProgress(40);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setProgress(70);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Erro: ${res.status}`); }
      const data = await res.json(); setProgress(90);
      let found = false;
      if (data.candidates?.[0]?.content?.parts) { for (const p of data.candidates[0].content.parts) { if (p.inlineData) { setRenderedImage(`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`); found = true; break; } } }
      if (!found) throw new Error("O modelo nao retornou uma imagem. Tente novamente.");
      setProgress(100);
    } catch (err) { setError(err.message || "Erro ao gerar render."); } finally { setLoading(false); setTimeout(() => setProgress(0), 500); }
  };

  const download = () => { if (!renderedImage) return; const a = document.createElement("a"); a.href = renderedImage; a.download = `render-${Date.now()}.png`; a.click(); };

  const inpS = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "14px 16px", color: "white", fontFamily: fontSans, fontSize: 14, fontWeight: 300 };

  return (
    <section id="renderizar" style={{ padding: "clamp(60px,10vw,120px) clamp(20px,5vw,60px)", background: "linear-gradient(165deg,#1a1815,#2a2520 40%,#1e1b18)", color: "white" }}>
      <FadeIn>
        <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 16, fontWeight: 500 }}>FERRAMENTA DE IA</div>
        <h2 style={{ fontFamily: font, fontSize: "clamp(30px,5vw,48px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>Renderize com<br/><em style={{ fontWeight: 300 }}>Nano Banana</em></h2>
        <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,2vw,15px)", color: "rgba(255,255,255,0.5)", fontWeight: 300, maxWidth: 520, marginBottom: 48, lineHeight: 1.7 }}>Transforme fotos e sketches em renders arquitetonicos fotorrealistas usando o Gemini 2.5 Flash Image da Google.</p>
      </FadeIn>
      {!apiKeySet ? (
        <FadeIn delay={0.1}><div style={{ maxWidth: 520, marginBottom: 48 }}>
          <div style={{ background: "rgba(184,150,62,0.08)", border: "1px solid rgba(184,150,62,0.2)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span style={{ fontFamily: fontSans, fontSize: 13, color: COLORS.gold, fontWeight: 500 }}>Chave de API necessaria</span></div>
            <p style={{ fontFamily: fontSans, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontWeight: 300 }}>Obtenha sua chave gratuita em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.gold, textDecoration: "underline" }}>Google AI Studio</a>. Sua chave e usada apenas no seu navegador.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input type="password" placeholder="Cole sua Google AI API Key..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ ...inpS, flex: 1 }} />
            <button onClick={() => { if (apiKey.trim()) setApiKeySet(true); }} style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, color: COLORS.bgDark, background: apiKey.trim() ? COLORS.gold : "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "14px 24px", cursor: apiKey.trim() ? "pointer" : "default", whiteSpace: "nowrap" }}>ATIVAR</button>
          </div>
        </div></FadeIn>
      ) : (<>
        <FadeIn delay={0.05}><div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.1)", border: "1px solid rgba(184,150,62,0.25)", borderRadius: 100, padding: "8px 18px", marginBottom: 36 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} /><span style={{ fontFamily: fontSans, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>API conectada</span>
          <span onClick={() => { setApiKeySet(false); setApiKey(""); }} style={{ fontFamily: fontSans, fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer", marginLeft: 8 }}>Alterar</span>
        </div></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: 32, maxWidth: 1000 }}>
          <FadeIn delay={0.1}><div>
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? COLORS.gold : "rgba(255,255,255,0.12)"}`, borderRadius: 12, padding: uploadedImage ? 0 : 48, textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(184,150,62,0.08)" : "rgba(255,255,255,0.02)", overflow: "hidden", aspectRatio: uploadedImage ? "auto" : "4/3", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} style={{ display: "none" }} />
              {uploadedImage ? (<><img src={uploadedImage} alt="" style={{ width: "100%", display: "block", borderRadius: 10 }} /><div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "6px 12px" }}><span style={{ fontFamily: fontSans, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Clique para trocar</span></div></>) : (
                <div><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <p style={{ fontFamily: fontSans, fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 16, fontWeight: 300 }}>Arraste uma imagem ou<br/><span style={{ color: COLORS.gold }}>clique para selecionar</span></p></div>)}
            </div>
            <div style={{ marginTop: 24 }}><label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 12 }}>ESTILO DE RENDER</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{RENDER_STYLES.map((st) => (
                <button key={st.id} onClick={() => { setSelectedStyle(st); setCustomPrompt(""); }} style={{ fontFamily: fontSans, fontSize: 12, fontWeight: selectedStyle.id === st.id ? 500 : 300, padding: "8px 16px", borderRadius: 100, cursor: "pointer", border: selectedStyle.id === st.id ? `1px solid ${COLORS.gold}` : "1px solid rgba(255,255,255,0.1)", background: selectedStyle.id === st.id ? "rgba(184,150,62,0.15)" : "transparent", color: selectedStyle.id === st.id ? COLORS.goldLight : "rgba(255,255,255,0.5)" }}>{st.label}</button>
              ))}</div>
            </div>
            <div style={{ marginTop: 20 }}><label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 10 }}>PROMPT PERSONALIZADO <span style={{ fontSize: 9, opacity: 0.6 }}>(OPCIONAL)</span></label>
              <textarea placeholder="Ex: Render fotorrealista com golden hour, vegetacao tropical..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} style={{ ...inpS, resize: "vertical", minHeight: 80 }} />
            </div>
            <button onClick={generateRender} disabled={!uploadedImage || loading} style={{ width: "100%", marginTop: 20, fontFamily: fontSans, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, padding: "18px 32px", border: "none", borderRadius: 8, cursor: uploadedImage && !loading ? "pointer" : "default", background: uploadedImage && !loading ? `linear-gradient(135deg,${COLORS.gold},${COLORS.goldLight})` : "rgba(255,255,255,0.06)", color: uploadedImage && !loading ? COLORS.bgDark : "rgba(255,255,255,0.3)", position: "relative", overflow: "hidden" }}>
              {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><div style={{ width: 16, height: 16, border: "2px solid rgba(42,37,32,0.3)", borderTopColor: COLORS.bgDark, borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>RENDERIZANDO...</span> : "GERAR RENDER"}
              {loading && progress > 0 && <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: COLORS.bgDark, width: `${progress}%`, transition: "width 0.5s ease", opacity: 0.3 }}/>}
            </button>
            {error && <div style={{ marginTop: 16, padding: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}><p style={{ fontFamily: fontSans, fontSize: 13, color: "#f87171", fontWeight: 300, lineHeight: 1.5 }}>{error}</p></div>}
          </div></FadeIn>
          <FadeIn delay={0.2}><div>
            <label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 12 }}>RESULTADO</label>
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.02)", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {renderedImage ? (
                <div style={{ position: "relative", width: "100%" }}><img src={renderedImage} alt="Render" style={{ width: "100%", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, background: "linear-gradient(transparent,rgba(0,0,0,0.7))", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={download} style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", padding: "10px 20px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.4)", color: "white", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>DOWNLOAD</button>
                    <button onClick={generateRender} style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", padding: "10px 20px", border: "none", background: COLORS.gold, color: COLORS.bgDark, borderRadius: 6, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.bgDark} strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>REFAZER</button>
                  </div>
                </div>
              ) : loading ? (
                <div style={{ textAlign: "center", padding: 48 }}><div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,0.08)", borderTopColor: COLORS.gold, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} /><p style={{ fontFamily: font, fontSize: 18, color: "rgba(255,255,255,0.6)", fontWeight: 300, marginBottom: 8 }}>Criando seu render...</p><p style={{ fontFamily: fontSans, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Isso pode levar ate 30 segundos</p>{progress > 0 && <div style={{ width: 200, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, margin: "20px auto 0", overflow: "hidden" }}><div style={{ height: "100%", background: COLORS.gold, width: `${progress}%`, transition: "width 0.5s ease" }}/></div>}</div>
              ) : (
                <div style={{ textAlign: "center", padding: 48 }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg><p style={{ fontFamily: fontSans, fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 16 }}>O render aparecera aqui</p></div>
              )}
            </div>
          </div></FadeIn>
        </div>
      </>)}
    </section>
  );
}

export default function IARenderStudio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "", mensagem: "" });

  useEffect(() => { const h = () => setScrolled(window.scrollY > 50); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  const scrollTo = (id) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  const font = "'Cormorant Garamond','Georgia',serif";
  const fontSans = "'Montserrat','Helvetica Neue',sans-serif";
  const navItems = [{ l: "Renderizar", id: "renderizar" },{ l: "Portfolio", id: "portfolio" },{ l: "Sobre", id: "sobre" },{ l: "Servicos", id: "servicos" },{ l: "Contato", id: "contato" }];

  return (
    <div style={{ fontFamily: fontSans, color: COLORS.text, background: COLORS.bg, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}::selection{background:${COLORS.gold};color:white}@keyframes fadeInUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{transform:scale(1.1)}to{transform:scale(1)}}@keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.35)}input:focus,textarea:focus{outline:none;border-color:${COLORS.gold}!important}`}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 clamp(20px,5vw,60px)", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(240,236,228,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none", transition: "all 0.4s ease" }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ fontFamily: font, fontSize: 20, letterSpacing: 3, color: scrolled ? COLORS.black : "white", cursor: "pointer", transition: "color 0.4s" }}>
          <span style={{ fontWeight: 500, letterSpacing: 4 }}>IA RENDER</span> <span style={{ fontStyle: "italic", fontWeight: 300, fontSize: 17, letterSpacing: 1 }}>Studio</span>
        </div>
        <div onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 8 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 24, height: 1.5, background: scrolled ? COLORS.black : "white", transform: menuOpen ? (i===0 ? "rotate(45deg) translate(4.5px,4.5px)" : i===2 ? "rotate(-45deg) translate(4.5px,-4.5px)" : "none") : "none", opacity: menuOpen && i===1 ? 0 : 1, transition: "all 0.3s" }}/>)}
        </div>
      </nav>
      {menuOpen && <div style={{ position: "fixed", top: 72, left: 0, right: 0, bottom: 0, zIndex: 99, background: "rgba(240,236,228,0.98)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, animation: "fadeIn 0.3s ease" }}>
        {navItems.map((n,i) => <span key={n.id} onClick={() => scrollTo(n.id)} style={{ fontFamily: font, fontSize: 32, fontWeight: 400, color: COLORS.black, cursor: "pointer", animation: `slideDown 0.4s ease ${i*0.1}s both` }}>{n.l}</span>)}
      </div>}

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", padding: "0 clamp(20px,5vw,60px) clamp(60px,10vh,120px)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", animation: "scaleIn 1.5s ease both" }}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(60,50,40,0.3),rgba(60,50,40,0.5) 50%,rgba(40,35,28,0.75))" }}/>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 700, width: "100%", animation: "fadeInUp 1s ease 0.3s both" }}>
          <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>VISUALIZACAO ARQUITETONICA</div>
          <h1 style={{ fontFamily: font, fontSize: "clamp(36px,7vw,64px)", fontWeight: 400, lineHeight: 1.1, color: "white", marginBottom: 24 }}>Transformando<br/><em style={{ fontWeight: 300 }}>visoes em realidade</em></h1>
          <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,2vw,16px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontWeight: 300, maxWidth: 520, margin: "0 auto 40px" }}>Criando renderizacoes arquitetonicas fotorrealistas que dao vida aos seus projetos antes mesmo da construcao comecar.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => scrollTo("renderizar")} style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, color: COLORS.bgDark, background: COLORS.gold, border: "none", padding: "18px 36px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}>
              RENDERIZAR AGORA <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.bgDark} strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </button>
            <button onClick={() => scrollTo("portfolio")} style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 400, color: "white", background: "transparent", border: "1px solid rgba(255,255,255,0.4)", padding: "18px 36px", cursor: "pointer" }}>VER PORTFOLIO</button>
          </div>
        </div>
      </section>

      <RenderTool font={font} fontSans={fontSans} />

      {/* PORTFOLIO */}
      <section id="portfolio" style={{ padding: "clamp(60px,10vw,120px) clamp(20px,5vw,60px)", background: COLORS.bg }}>
        <FadeIn>
          <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 16, fontWeight: 500 }}>PORTFOLIO</div>
          <h2 style={{ fontFamily: font, fontSize: "clamp(32px,5vw,48px)", fontWeight: 400, lineHeight: 1.15, color: COLORS.black, marginBottom: 50 }}>Projetos<br/><em style={{ fontWeight: 300 }}>selecionados</em></h2>
        </FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {PROJECTS.map((p,i) => (
            <FadeIn key={p.title+i} delay={i*0.08}>
              <div style={{ cursor: "pointer" }}>
                <div style={{ width: "100%", borderRadius: 4, overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.8s cubic-bezier(0.23,1,0.32,1)" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 }}>
                  <div><h3 style={{ fontFamily: font, fontSize: "clamp(20px,3vw,26px)", fontWeight: 400, color: COLORS.black, marginBottom: 4 }}>{p.title}</h3>
                    <span style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: COLORS.textLight, fontWeight: 500 }}>{p.category}</span></div>
                  <span style={{ fontFamily: fontSans, fontSize: 14, color: COLORS.textLight, fontWeight: 300 }}>{p.year}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" style={{ padding: "clamp(60px,10vw,120px) clamp(20px,5vw,60px)", background: COLORS.bg }}>
        <FadeIn><div style={{ maxWidth: 680 }}>
          {["O IA Render Studio une arte, tecnologia e estrategia para criar experiencias visuais que vendem.",
            "Cada renderizacao e uma narrativa visual cuidadosamente construida, onde luz, materiais e atmosfera se unem para revelar a essencia do projeto antes mesmo de sua construcao.",
            "Nossa abordagem combina sensibilidade artistica com ferramentas de IA de ultima geracao, entregando renderizacoes fotorrealistas com agilidade e precisao.",
            "Trabalhamos em colaboracao proxima com arquitetos e desenvolvedores para garantir que cada imagem nao apenas represente, mas eleve a visao original do projeto."
          ].map((t,i) => <p key={i} style={{ fontFamily: font, fontSize: i===0 ? "clamp(18px,2.5vw,22px)" : "clamp(16px,2vw,20px)", lineHeight: 1.8, color: i===0 ? COLORS.text : COLORS.textLight, fontWeight: i===0 ? 400 : 300, marginBottom: 28 }}>{t}</p>)}
        </div></FadeIn>
      </section>

      {/* SERVICOS */}
      <section id="servicos" style={{ padding: "clamp(60px,10vw,100px) clamp(20px,5vw,60px)", background: COLORS.bg }}>
        <FadeIn><div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 40, fontWeight: 500 }}>SERVICOS</div></FadeIn>
        <div style={{ maxWidth: 680 }}>
          {SERVICES.map((s,i) => <FadeIn key={s.title} delay={i*0.08}><div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: "32px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}><SIcon type={s.icon}/><h3 style={{ fontFamily: font, fontSize: "clamp(18px,2.5vw,22px)", fontWeight: 500, color: COLORS.black }}>{s.title}</h3></div>
            <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,1.8vw,15px)", lineHeight: 1.7, color: COLORS.textLight, fontWeight: 300, paddingLeft: 38 }}>{s.description}</p>
          </div></FadeIn>)}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}/>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" style={{ padding: "clamp(60px,10vw,120px) clamp(20px,5vw,60px)", background: COLORS.bgDark, color: "white" }}>
        <FadeIn>
          <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>CONTATO</div>
          <h2 style={{ fontFamily: font, fontSize: "clamp(30px,5vw,44px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 24 }}>Vamos criar algo<br/><em style={{ fontWeight: 300 }}>extraordinario</em></h2>
          <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,2vw,16px)", lineHeight: 1.7, color: "rgba(255,255,255,0.6)", fontWeight: 300, maxWidth: 480, marginBottom: 48 }}>Transforme seu proximo projeto em uma experiencia visual inesquecivel. Entre em contato para discutirmos suas ideias.</p>
        </FadeIn>
        <FadeIn delay={0.15}><div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
          {[{ icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13L2 4"/></svg>, text: "contato@iarenderstudio.com" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>, text: "+55 11 97548-4747" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: "Sao Paulo, Brasil" }
          ].map((c,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>{c.icon}<span style={{ fontFamily: fontSans, fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: 300 }}>{c.text}</span></div>)}
        </div></FadeIn>
        <FadeIn delay={0.2}><div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 48 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" style={{ cursor: "pointer" }}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="rgba(255,255,255,0.6)" stroke="none"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" style={{ cursor: "pointer" }}><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </div>
        </div></FadeIn>
        <FadeIn delay={0.25}><div style={{ maxWidth: 500 }}>
          {[{ l: "NOME", t: "text", p: "Seu nome completo", k: "nome" },{ l: "EMAIL", t: "email", p: "seu@email.com", k: "email" }].map(f => (
            <div key={f.k} style={{ marginBottom: 24 }}><label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>{f.l}</label>
              <input type={f.t} placeholder={f.p} value={formData[f.k]} onChange={e => setFormData({...formData,[f.k]:e.target.value})} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "12px 0", color: "white", fontFamily: fontSans, fontSize: 15, fontWeight: 300 }} />
            </div>))}
          <div style={{ marginBottom: 36 }}><label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>MENSAGEM</label>
            <textarea placeholder="Conte-nos sobre seu projeto..." value={formData.mensagem} onChange={e => setFormData({...formData, mensagem: e.target.value})} rows={4} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "12px 0", color: "white", resize: "vertical", fontFamily: fontSans, fontSize: 15, fontWeight: 300 }} />
          </div>
          <button style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, color: COLORS.bgDark, background: COLORS.gold, border: "none", padding: "16px 40px", cursor: "pointer", width: "100%" }}>ENVIAR MENSAGEM</button>
        </div></FadeIn>
        <div style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: font, fontSize: 15, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>© 2024 IA Render Studio</span>
          <span style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>Sao Paulo, Brasil</span>
        </div>
      </section>
    </div>
  );
}
