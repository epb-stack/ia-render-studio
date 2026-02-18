# IA Render Studio

Site de portfólio + ferramenta de renderização com IA para visualização arquitetônica.

## Funcionalidades

- **Portfólio** de renderizações arquitetônicas
- **Ferramenta Nano Banana** - transforma fotos/sketches em renders usando Gemini 2.5 Flash Image
- 6 estilos de render: Fotorrealista, Moderno, Aconchegante, Luxo, Noturno, Sketch
- Upload via drag & drop
- Download do resultado

## Deploy

O site é automaticamente publicado via GitHub Actions em:
**https://epb-stack.github.io/ia-render-studio**

## Desenvolvimento local

```bash
npm install
npm start
```

## Imagens do Portfólio

Coloque suas imagens em `public/images/`:
- `hero.jpg` - imagem de fundo do hero
- `project-1.jpg` a `project-6.jpg` - projetos do portfólio

(Projetos 2-6 usam imagens do Unsplash como fallback)
