# 🌐 BitChord WebRadio • Pages Edition (GitHub Pages / Cloudflare Pages) 🐻

Versão **100% Client-Side** do BitChord WebRadio & Song Request Bot, pronta para ser hospedada gratuitamente no **GitHub Pages** ou **Cloudflare Pages** sem precisar de nenhum servidor Node.js ou VPS rodando!

---

## ⚡ Como Publicar no GitHub Pages (2 minutos)

1. Crie um repositório no seu GitHub (ex: `bitchord-radio`).
2. Abra o terminal nesta pasta (`bitchord-pages`) e envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "BitChord Pages com Mascote Roger"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/bitchord-radio.git
   git push -u origin main
   ```
3. No GitHub do seu repositório:
   - Vá em **Settings** > **Pages**.
   - Em **Branch**, selecione `main` e a pasta `/ (root)`.
   - Clique em **Save**.
4. Pronto! Seu site estará no ar em:
   `https://SEU-USUARIO.github.io/bitchord-radio/`

---

## ⚡ Como Publicar no Cloudflare Pages (Mais Rápido e Sem Limites)

1. Acesse o painel da [Cloudflare](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Clique em **Create application** > **Pages** > **Connect to Git** (ou arraste esta pasta diretamente em "Upload assets").
3. Se conectar via Git:
   - Escolha o repositório `bitchord-radio`.
   - Build command: *(deixe vazio)*
   - Build output directory: `.` *(raiz)*
4. Clique em **Save and Deploy**.
5. Pronto! Você terá seu link instantâneo: `https://bitchord-radio.pages.dev`

---

## 📺 Como Usar na Live

1. Abra a página principal no seu navegador (ex: `https://seu-site.pages.dev/`).
2. Digite o nome do seu canal da Twitch e clique em **Conectar Chat**.
3. O bot já começará a ouvir os pedidos `!sr <link>` do YouTube ou Spotify no chat!
4. **No OBS Studio:**
   - Adicione uma fonte **Navegador (Browser)** com a URL:
     ```
     https://seu-site.pages.dev/overlay.html
     ```
   - Largura: `550`, Altura: `180`.
   - O overlay sincroniza automaticamente com o player da live!
