import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  bg: "#f0ece4", bgDark: "#2a2520", gold: "#b8963e", goldLight: "#c9a84c",
  text: "#4a4540", textLight: "#7a7570", white: "#faf8f4", black: "#1a1815",
};

const HERO_IMG = `${process.env.PUBLIC_URL}/images/hero-render.jpg`;

const PROJECTS = [
  { title: "Loft Urbano", category: "RESIDENCIAL", year: "2024", image: `${process.env.PUBLIC_URL}/images/project-1.jpg` },
  { title: "Terraço Panorâmico", category: "RESIDENCIAL", year: "2024", image: `${process.env.PUBLIC_URL}/images/project-2.jpg` },
  { title: "Museu de Arte Contemporânea", category: "INSTITUCIONAL", year: "2023", image: `${process.env.PUBLIC_URL}/images/project-3.jpg` },
  { title: "Villa Tropical", category: "RESIDENCIAL", year: "2023", image: `${process.env.PUBLIC_URL}/images/project-4.jpg` },
  { title: "Grand Hotel Lobby", category: "HOTELARIA", year: "2024", image: `${process.env.PUBLIC_URL}/images/project-5.jpg` },
  { title: "Cozinha Minimalista", category: "INTERIORES", year: "2024", image: `${process.env.PUBLIC_URL}/images/project-6.jpg` },
];

const SERVICES = [
  { icon: "grid", title: "Plantas Humanizadas", description: "Representações artísticas de plantas baixas com mobiliário, paisagismo e elementos de vida real." },
  { icon: "building", title: "Design de Interiores", description: "Imagens fotorrealistas de ambientes internos com atenção meticulosa a texturas e iluminação." },
  { icon: "exterior", title: "Renderização Exterior", description: "Visualizações impactantes de fachadas e paisagismo para lançamentos imobiliários." },
  { icon: "video", title: "Animação 3D", description: "Passeios virtuais cinematográficos que contam a história do seu empreendimento." },
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

const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`;
const GEMINI_TEXT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const RENDER_STYLES = [
  { id: "photorealistic", label: "Fotorrealista", prompt: "ultra-realistic V-Ray photorealistic architectural visualization, shot with Canon EOS R5, 24mm tilt-shift lens, f/8, natural sunlight streaming through windows, physically accurate materials with bump maps and displacement, raytraced reflections on glass and polished surfaces, volumetric light with dust particles, global illumination, ambient occlusion, soft shadows, color grading similar to Architectural Digest magazine photography, 8K resolution" },
  { id: "modern", label: "Moderno", prompt: "contemporary modern architectural interior render in the style of Studio McGee and Norm Architects, clean Scandinavian-inspired design, floor-to-ceiling windows with sheer curtains, neutral warm palette with beige, cream and soft gray tones, natural oak wood flooring, fluted wall panels, curved organic furniture, statement pendant lighting, lush indoor plants, soft diffused natural light, shallow depth of field, editorial photography style" },
  { id: "minimalist", label: "Minimalista", prompt: "Japanese-inspired minimalist architectural render in the style of Tadao Ando and John Pawson, pure white concrete walls with subtle texture, dramatic natural light cutting through narrow openings, extreme simplicity with intentional negative space, monolithic forms, water features reflecting light, bamboo accents, wabi-sabi aesthetic, single statement furniture piece, contemplative atmosphere, shot at golden hour with long shadows" },
  { id: "luxury", label: "Luxo", prompt: "ultra-luxurious high-end penthouse architectural visualization, Calacatta Viola marble with dramatic purple veining, brushed brass and champagne gold metal accents, custom Italian furniture with rich velvet and leather upholstery, herringbone parquet flooring, coffered ceiling with recessed LED cove lighting, crystal chandelier, floor-to-ceiling panoramic windows with city skyline view, art gallery wall with statement piece, warm dramatic lighting with accent spots" },
  { id: "night", label: "Noturno", prompt: "cinematic nighttime architectural visualization, moody blue hour exterior with deep indigo sky gradient, warm amber 2700K interior lighting glowing through floor-to-ceiling windows, landscape lighting with uplights on trees and architectural features, pool or water feature reflecting warm lights, exterior pathway lighting, starry sky, long exposure photography style with light trails, volumetric fog, dramatic contrast between warm interior and cool exterior" },
];

function RenderTool() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [status, setStatus] = useState("idle"); // idle | loading | describing | done | error
  const [result, setResult] = useState(null); // { imageUrl, text }
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const font = "'Cormorant Garamond','Georgia',serif";
  const fontSans = "'Montserrat','Helvetica Neue',sans-serif";

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrorMsg("Envie apenas imagens (JPG, PNG)."); setStatus("error"); return; }
    if (file.size > 4 * 1024 * 1024) { setErrorMsg("Imagem muito grande. Máximo 4MB."); setStatus("error"); return; }
    setImage(URL.createObjectURL(file));
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const removeImage = () => { setImage(null); setImageBase64(null); setImageMime(null); };

  const describeImage = async () => {
    if (!imageBase64) return;
    setStatus("describing");
    try {
      const res = await fetch(GEMINI_TEXT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: "Descreva esta imagem em detalhes como um prompt de renderização arquitetônica profissional. Inclua: tipo de ambiente, materiais visíveis, iluminação, estilo arquitetônico, móveis, cores predominantes e atmosfera. Responda em português, formato de prompt direto e conciso, sem introduções ou explicações." }
          ]}],
          generationConfig: { responseModalities: ["TEXT"] }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
      if (textPart) setPrompt(textPart.text);
      setStatus("idle");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("quota") || msg.includes("Quota") || msg.includes("rate")) {
        setErrorMsg("Limite de uso da API atingido. Tente novamente em alguns minutos.");
      } else {
        setErrorMsg("Erro ao descrever imagem: " + msg);
      }
      setStatus("error");
    }
  };

  const generate = async () => {
    if (!prompt.trim() && !imageBase64) { setErrorMsg("Adicione uma imagem ou descreva o que deseja renderizar."); setStatus("error"); return; }
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const styleObj = RENDER_STYLES.find(s => s.id === style);
      const parts = [];
      if (imageBase64) parts.push({ inlineData: { mimeType: imageMime, data: imageBase64 } });

      const systemCtx = "You are a world-class architectural visualization artist specializing in photorealistic interior and exterior renders. You produce images indistinguishable from professional photography published in Architectural Digest, Dezeen, and ArchDaily. Every render must have: physically accurate lighting and shadows, realistic material textures with proper reflections, professional composition following the rule of thirds, appropriate depth of field, and a cinematic color grade.";
      let textPrompt;
      if (imageBase64 && prompt.trim()) {
        textPrompt = `${systemCtx}\n\nTransform this reference image into a high-end professional architectural render with the following style: ${styleObj.prompt}.\n\nUser specifications: ${prompt.trim()}\n\nMaintain the spatial layout and architectural proportions from the reference. Enhance all materials, lighting, and atmosphere to match the requested style. Output a single stunning architectural visualization image.`;
      } else if (imageBase64) {
        textPrompt = `${systemCtx}\n\nTransform this reference image into a high-end professional architectural render with the following style: ${styleObj.prompt}.\n\nKeep the same room layout, furniture placement, and architectural elements. Dramatically upgrade all materials, lighting, textures, and atmospheric effects. Output a single stunning architectural visualization image.`;
      } else {
        textPrompt = `${systemCtx}\n\nGenerate a high-end professional architectural visualization of: ${prompt.trim()}\n\nStyle direction: ${styleObj.prompt}\n\nThe image must look like a real photograph taken by a professional architectural photographer. Include realistic furniture, decor, materials, and vegetation. Output a single stunning architectural visualization image.`;
      }
      parts.push({ text: textPrompt });

      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const resParts = data.candidates?.[0]?.content?.parts || [];
      let imageUrl = null, resText = "";
      for (const part of resParts) {
        if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        if (part.text) resText = part.text;
      }
      if (!imageUrl) throw new Error("Nenhuma imagem foi gerada. Tente reformular o prompt.");
      setResult({ imageUrl, text: resText });
      setStatus("done");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("quota") || msg.includes("Quota") || msg.includes("rate")) {
        setErrorMsg("Limite de uso da API atingido. Tente novamente em alguns minutos.");
      } else {
        setErrorMsg("Erro: " + msg);
      }
      setStatus("error");
    }
  };

  const downloadResult = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `ia-render-studio-${Date.now()}.png`;
    a.click();
  };

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "14px 16px", fontFamily: fontSans, fontSize: 14, color: COLORS.text, fontWeight: 300, outline: "none", transition: "border-color 0.3s" };

  return (
    <section id="render" style={{ padding: `clamp(80px,12vw,140px) clamp(20px,5vw,60px)`, background: COLORS.bg }}>
      <FadeIn>
        <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 16, fontWeight: 500 }}>EXPERIMENTE</div>
        <h2 style={{ fontFamily: font, fontSize: "clamp(32px,5vw,48px)", fontWeight: 400, lineHeight: 1.15, color: COLORS.black, marginBottom: 16 }}>Teste nossa<br /><em style={{ fontWeight: 300 }}>renderização com IA</em></h2>
        <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,1.6vw,15px)", lineHeight: 1.7, color: COLORS.textLight, fontWeight: 300, maxWidth: 560, marginBottom: 48 }}>Envie uma imagem ou descreva o ambiente desejado. Nossa IA transformará sua visão em uma renderização profissional.</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px,4vw,60px)", alignItems: "start" }} className="render-grid">

          {/* LEFT — inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Upload area */}
            {!image ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? COLORS.gold : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "48px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.3s", background: dragOver ? "rgba(184,150,62,0.04)" : "rgba(255,255,255,0.4)" }}
              >
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.2" style={{ marginBottom: 16 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style={{ fontFamily: fontSans, fontSize: 14, color: COLORS.text, fontWeight: 400, marginBottom: 6 }}>Arraste uma imagem ou clique para enviar</div>
                <div style={{ fontFamily: fontSans, fontSize: 12, color: COLORS.textLight, fontWeight: 300 }}>JPG ou PNG • Máximo 4MB</div>
              </div>
            ) : (
              <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                <img src={image} alt="Upload" style={{ width: "100%", height: 220, objectFit: "cover", display: "block", borderRadius: 8 }} />
                <button onClick={removeImage} style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                {/* Describe button */}
                <button onClick={describeImage} disabled={status === "describing"} style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "8px 14px", cursor: status === "describing" ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s" }}>
                  {status === "describing" ? (
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: COLORS.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.goldLight} strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
                  )}
                  <span style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "white", fontWeight: 400 }}>{status === "describing" ? "Analisando..." : "Descrever Imagem"}</span>
                </button>
              </div>
            )}

            {/* Prompt */}
            <div>
              <label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: COLORS.textLight, display: "block", marginBottom: 8, fontWeight: 500 }}>DESCREVA O AMBIENTE</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Sala de estar ampla com pé-direito duplo, piso de madeira clara, sofá em L cinza, janelas do piso ao teto com vista para jardim..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              />
            </div>

            {/* Style selector */}
            <div>
              <label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: COLORS.textLight, display: "block", marginBottom: 10, fontWeight: 500 }}>ESTILO DE RENDERIZAÇÃO</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {RENDER_STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)} style={{ fontFamily: fontSans, fontSize: 12, fontWeight: style === s.id ? 500 : 300, letterSpacing: 1, color: style === s.id ? "white" : COLORS.text, background: style === s.id ? COLORS.gold : "rgba(255,255,255,0.6)", border: `1px solid ${style === s.id ? COLORS.gold : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "8px 18px", cursor: "pointer", transition: "all 0.3s" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button onClick={generate} disabled={status === "loading"} style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, color: "white", background: status === "loading" ? COLORS.textLight : COLORS.gold, border: "none", padding: "18px 40px", cursor: status === "loading" ? "wait" : "pointer", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, alignSelf: "flex-start", minWidth: 240, transition: "all 0.3s", opacity: status === "loading" ? 0.7 : 1 }}>
              {status === "loading" ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  RENDERIZANDO...
                </>
              ) : (
                <>
                  RENDERIZAR
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
                </>
              )}
            </button>

            {/* Error */}
            {status === "error" && (
              <div style={{ fontFamily: fontSans, fontSize: 13, color: "#c0392b", background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.15)", borderRadius: 6, padding: "12px 16px", fontWeight: 400 }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* RIGHT — result */}
          <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {status === "loading" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: `3px solid rgba(184,150,62,0.15)`, borderTopColor: COLORS.gold, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                <div style={{ fontFamily: fontSans, fontSize: 14, color: COLORS.textLight, fontWeight: 300 }}>Gerando renderização...</div>
                <div style={{ fontFamily: fontSans, fontSize: 12, color: COLORS.textLight, fontWeight: 300, marginTop: 6, opacity: 0.6 }}>Isso pode levar alguns segundos</div>
              </div>
            ) : result ? (
              <div style={{ width: "100%", animation: "fadeIn 0.6s ease" }}>
                <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                  <img src={result.imageUrl} alt="Renderização gerada" style={{ width: "100%", display: "block" }} />
                </div>
                {result.text && (
                  <p style={{ fontFamily: fontSans, fontSize: 13, color: COLORS.textLight, fontWeight: 300, lineHeight: 1.6, marginBottom: 16 }}>{result.text}</p>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={downloadResult} style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, color: "white", background: COLORS.gold, border: "none", padding: "12px 24px", cursor: "pointer", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    DOWNLOAD
                  </button>
                  <button onClick={() => { setResult(null); setStatus("idle"); }} style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 400, color: COLORS.text, background: "transparent", border: `1px solid rgba(0,0,0,0.12)`, padding: "12px 24px", cursor: "pointer", borderRadius: 4 }}>
                    NOVA RENDERIZAÇÃO
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", opacity: 0.4 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={COLORS.textLight} strokeWidth="0.8" style={{ marginBottom: 16 }}>
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <div style={{ fontFamily: fontSans, fontSize: 14, color: COLORS.textLight, fontWeight: 300 }}>A renderização aparecerá aqui</div>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

export default function IARenderStudio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "", tipo: "", mensagem: "" });

  useEffect(() => { const h = () => setScrolled(window.scrollY > 50); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  const scrollTo = (id) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  const font = "'Cormorant Garamond','Georgia',serif";
  const fontSans = "'Montserrat','Helvetica Neue',sans-serif";
  const navItems = [{ l: "Início", id: "hero" }, { l: "Render IA", id: "render" }, { l: "Portfólio", id: "portfolio" }, { l: "Sobre", id: "about" }, { l: "Contato", id: "contact" }];
  const pad = "clamp(20px,5vw,60px)";

  return (
    <div style={{ fontFamily: fontSans, color: COLORS.text, background: COLORS.bg, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}::selection{background:${COLORS.gold};color:white}@keyframes fadeInUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{transform:scale(1.1)}to{transform:scale(1)}}@keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes scrollLine{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}50.01%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.35)}input:focus,textarea:focus{outline:none;border-color:${COLORS.gold}!important}select{-webkit-appearance:none;-moz-appearance:none;appearance:none}@media(max-width:768px){.nav-links{display:none!important}.nav-hamburger{display:flex!important}.portfolio-grid{grid-template-columns:1fr!important}.about-grid{grid-template-columns:1fr!important}.contact-grid{grid-template-columns:1fr!important}.render-grid{grid-template-columns:1fr!important}}`}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: `0 ${pad}`, height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(240,236,228,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none", transition: "all 0.4s ease" }}>
        <a href="#hero" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ fontFamily: font, fontSize: 20, letterSpacing: 3, color: scrolled ? COLORS.black : "white", cursor: "pointer", transition: "color 0.4s", textDecoration: "none" }}>
          <span style={{ fontWeight: 600, letterSpacing: 4, textTransform: "uppercase" }}>IA RENDER</span>{" "}<span style={{ fontStyle: "italic", fontWeight: 300, fontSize: 17, letterSpacing: 1 }}>Studio</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {navItems.map(n => (
              <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); scrollTo(n.id); }} style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 400, color: scrolled ? COLORS.text : "rgba(255,255,255,0.85)", textDecoration: "none", cursor: "pointer", transition: "color 0.3s" }}>{n.l}</a>
            ))}
            <a href="/auth" style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, color: "white", background: COLORS.gold, textDecoration: "none", padding: "10px 24px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 8, transition: "opacity 0.3s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              LOGIN
            </a>
          </div>
          <div className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "pointer", display: "none", flexDirection: "column", gap: 5, padding: 8 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 24, height: 1.5, background: scrolled ? COLORS.black : "white", transform: menuOpen ? (i===0 ? "rotate(45deg) translate(4.5px,4.5px)" : i===2 ? "rotate(-45deg) translate(4.5px,-4.5px)" : "none") : "none", opacity: menuOpen && i===1 ? 0 : 1, transition: "all 0.3s" }}/>)}
          </div>
        </div>
      </nav>
      {menuOpen && <div style={{ position: "fixed", top: 72, left: 0, right: 0, bottom: 0, zIndex: 99, background: "rgba(240,236,228,0.98)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, animation: "fadeIn 0.3s ease" }}>
        {navItems.map((n,i) => <span key={n.id} onClick={() => scrollTo(n.id)} style={{ fontFamily: font, fontSize: 32, fontWeight: 400, color: COLORS.black, cursor: "pointer", animation: `slideDown 0.4s ease ${i*0.1}s both` }}>{n.l}</span>)}
        <a href="/auth" style={{ fontFamily: fontSans, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, color: "white", background: COLORS.gold, textDecoration: "none", padding: "14px 32px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          LOGIN
        </a>
      </div>}

      {/* HERO */}
      <section id="hero" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", padding: `0 ${pad} clamp(60px,10vh,120px)` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", animation: "scaleIn 1.5s ease both" }}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(60,50,40,0.3),rgba(60,50,40,0.5) 50%,rgba(40,35,28,0.75))" }}/>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 700, width: "100%", animation: "fadeInUp 1s ease 0.3s both" }}>
          <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>VISUALIZAÇÃO ARQUITETÔNICA</div>
          <h1 style={{ fontFamily: font, fontSize: "clamp(36px,7vw,64px)", fontWeight: 400, lineHeight: 1.1, color: "white", marginBottom: 24 }}>Transformando<br/><em style={{ fontWeight: 300 }}>visões em realidade</em></h1>
          <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,2vw,16px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontWeight: 300, maxWidth: 520, margin: "0 auto 40px" }}>Criando renderizações arquitetônicas fotorrealistas que dão vida aos seus projetos antes mesmo da construção começar.</p>
          <button onClick={() => scrollTo("portfolio")} style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 400, color: "white", background: "transparent", border: "1px solid rgba(255,255,255,0.4)", padding: "18px 36px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}>
            VER PORTFÓLIO <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
          </button>
        </div>
        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
          <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.4)", animation: "scrollLine 2s ease infinite" }}/>
        </div>
      </section>

      {/* RENDER TOOL */}
      <RenderTool />

      {/* PORTFOLIO */}
      <section id="portfolio" style={{ padding: `clamp(80px,12vw,140px) ${pad}`, background: COLORS.bg }}>
        <FadeIn>
          <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 16, fontWeight: 500 }}>PORTFÓLIO</div>
          <h2 style={{ fontFamily: font, fontSize: "clamp(32px,5vw,48px)", fontWeight: 400, lineHeight: 1.15, color: COLORS.black, marginBottom: 60 }}>Projetos<br/><em style={{ fontWeight: 300 }}>selecionados</em></h2>
        </FadeIn>
        <div className="portfolio-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "clamp(24px,4vw,48px)" }}>
          {PROJECTS.map((p,i) => (
            <FadeIn key={p.title+i} delay={i*0.08}>
              <div style={{ cursor: "pointer" }}>
                <div style={{ width: "100%", borderRadius: 4, overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.8s cubic-bezier(0.23,1,0.32,1)" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: font, fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 400, color: COLORS.black, marginBottom: 4 }}>{p.title}</h3>
                    <span style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: COLORS.textLight, fontWeight: 500 }}>{p.category}</span>
                  </div>
                  <span style={{ fontFamily: fontSans, fontSize: 14, color: COLORS.textLight, fontWeight: 300 }}>{p.year}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SOBRE + SERVICOS side by side */}
      <section id="about" style={{ padding: `clamp(80px,12vw,140px) ${pad}`, background: COLORS.bg }}>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,100px)", alignItems: "start" }}>
          {/* SOBRE - left */}
          <FadeIn>
            <div>
              <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 20, fontWeight: 500 }}>SOBRE</div>
              <h2 style={{ fontFamily: font, fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, lineHeight: 1.15, color: COLORS.black, marginBottom: 32 }}>
                <span style={{ fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>IA RENDER</span>{" "}<span style={{ fontStyle: "italic", fontWeight: 300 }}>Studio</span>
              </h2>
              {[
                "O IA Render Studio une arte, tecnologia e estratégia para criar experiências visuais que vendem.",
                "Cada renderização é uma narrativa visual cuidadosamente construída, onde luz, materiais e atmosfera se unem para revelar a essência do projeto antes mesmo de sua construção.",
                "Nossa abordagem combina sensibilidade artística com ferramentas de IA de última geração, entregando renderizações fotorrealistas com agilidade e precisão.",
                "Trabalhamos em colaboração próxima com arquitetos e desenvolvedores para garantir que cada imagem não apenas represente, mas eleve a visão original do projeto — o diferencial entre uma visualização técnica e uma obra que conecta, emociona e convence."
              ].map((t,i) => <p key={i} style={{ fontFamily: fontSans, fontSize: "clamp(14px,1.6vw,15px)", lineHeight: 1.8, color: COLORS.textLight, fontWeight: 300, marginBottom: 24 }}>{t}</p>)}
            </div>
          </FadeIn>

          {/* SERVICOS - right */}
          <FadeIn delay={0.15}>
            <div>
              <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: COLORS.gold, marginBottom: 32, fontWeight: 500 }}>SERVIÇOS</div>
              {SERVICES.map((s,i) => (
                <div key={s.title} style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: "28px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                    <SIcon type={s.icon}/>
                    <h3 style={{ fontFamily: font, fontSize: "clamp(18px,2.2vw,22px)", fontWeight: 500, color: COLORS.black }}>{s.title}</h3>
                  </div>
                  <p style={{ fontFamily: fontSans, fontSize: "clamp(13px,1.5vw,14px)", lineHeight: 1.7, color: COLORS.textLight, fontWeight: 300, paddingLeft: 38 }}>{s.description}</p>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}/>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contact" style={{ padding: `clamp(80px,12vw,140px) ${pad}`, background: COLORS.bgDark, color: "white" }}>
        <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,100px)", alignItems: "start" }}>
          {/* Left - info */}
          <FadeIn>
            <div>
              <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>CONTATO</div>
              <h2 style={{ fontFamily: font, fontSize: "clamp(30px,5vw,44px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 24 }}>Vamos criar algo<br/><em style={{ fontWeight: 300 }}>extraordinário</em></h2>
              <p style={{ fontFamily: fontSans, fontSize: "clamp(14px,1.6vw,15px)", lineHeight: 1.7, color: "rgba(255,255,255,0.6)", fontWeight: 300, maxWidth: 420, marginBottom: 40 }}>Transforme seu próximo projeto em uma experiência visual inesquecível. Entre em contato para discutirmos suas ideias.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
                {[
                  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13L2 4"/></svg>, text: "contato@iarender.com.br", href: "mailto:contato@iarender.com.br" },
                  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>, text: "+55 11 97548-4747", href: "tel:+5511975484747" },
                  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: "São Paulo, Brasil" }
                ].map((c,i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {c.icon}
                    {c.href ? (
                      <a href={c.href} style={{ fontFamily: fontSans, fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: 300, textDecoration: "none" }}>{c.text}</a>
                    ) : (
                      <span style={{ fontFamily: fontSans, fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: 300 }}>{c.text}</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 32 }}>
                <div style={{ display: "flex", gap: 20 }}>
                  <a href="#" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                  </a>
                  <a href="#" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Right - form */}
          <FadeIn delay={0.15}>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { l: "NOME", t: "text", p: "Seu nome completo", k: "nome" },
                { l: "EMAIL", t: "email", p: "seu@email.com", k: "email" },
              ].map(f => (
                <div key={f.k} style={{ marginBottom: 28 }}>
                  <label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} value={formData[f.k]} onChange={e => setFormData({...formData,[f.k]:e.target.value})} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "12px 0", color: "white", fontFamily: fontSans, fontSize: 15, fontWeight: 300 }} />
                </div>
              ))}

              <div style={{ marginBottom: 28 }}>
                <label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>TIPO DE PROJETO</label>
                <div style={{ position: "relative" }}>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "12px 0", color: formData.tipo ? "white" : "rgba(255,255,255,0.35)", fontFamily: fontSans, fontSize: 15, fontWeight: 300, cursor: "pointer", outline: "none" }}>
                    <option value="" style={{ background: COLORS.bgDark, color: "rgba(255,255,255,0.5)" }}>Selecione uma opção</option>
                    <option value="plantas" style={{ background: COLORS.bgDark, color: "white" }}>Plantas Humanizadas</option>
                    <option value="interior" style={{ background: COLORS.bgDark, color: "white" }}>Design de Interiores</option>
                    <option value="exterior" style={{ background: COLORS.bgDark, color: "white" }}>Renderização Exterior</option>
                    <option value="animation" style={{ background: COLORS.bgDark, color: "white" }}>Animação 3D</option>
                    <option value="other" style={{ background: COLORS.bgDark, color: "white" }}>Outro</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>

              <div style={{ marginBottom: 36 }}>
                <label style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>MENSAGEM</label>
                <textarea placeholder="Conte-me sobre seu projeto..." value={formData.mensagem} onChange={e => setFormData({...formData, mensagem: e.target.value})} rows={4} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "12px 0", color: "white", resize: "vertical", fontFamily: fontSans, fontSize: 15, fontWeight: 300 }} />
              </div>

              <button type="submit" style={{ fontFamily: fontSans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, color: "white", background: COLORS.gold, border: "none", padding: "18px 40px", cursor: "pointer", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, alignSelf: "flex-start", minWidth: 240 }}>
                ENVIAR MENSAGEM <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </button>
            </form>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: `32px ${pad}`, background: COLORS.bgDark, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: fontSans, fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>© 2026 IA Render Studio. Todos os direitos reservados.</span>
        <span style={{ fontFamily: fontSans, fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>Visualização Arquitetônica</span>
      </footer>
    </div>
  );
}
