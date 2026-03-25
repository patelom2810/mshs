/*
 * Pixel-calibrated values for bg.jpg (1080×1350):
 *
 * Available photo area: y=435 (after school strip) → y=1050 (before contact)
 * Left column: cx≈240
 *
 * Original circle: cx=250, cy≈647, r≈140  (scanned from poster)
 * Updated (per user): move photo DOWN + increase size
 *   cx=240, cy=710, r=195
 *   Circle top:  710-195 = 515  ✓ (well below strip at y=435)
 *   Circle bottom: 710+195 = 905
 *   Name at: y=960
 *   Space before contact (y≈1050): 90px ✓
 *
 * Ring: BROWN border (no glow/glass)
 */
const PHOTO_CX = 240;
const PHOTO_CY = 710;   // moved down from 650
const PHOTO_R  = 195;
const NAME_X   = 240;
const NAME_Y   = 965;

// Brown ring colors
const RING_OUTER_COLOR  = "#92400e";   // dark brown
const RING_INNER_COLOR  = "#d97706";   // amber/gold-brown
const RING_OUTER_WIDTH  = 10;
const RING_INNER_WIDTH  = 4;

// ── File preview ────────────────────────────────────────────────────────────
document.getElementById("imageInput").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  
  // Hide the previous result when a new photo is uploaded
  const rs = document.getElementById("resultSection");
  if (rs) rs.style.display = "none";

  document.getElementById("fileName").textContent = "📎 " + file.name;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById("previewImg").src = e.target.result;
    document.getElementById("previewWrap").style.display = "flex";
  };
  r.readAsDataURL(file);
});

// ── Generate ─────────────────────────────────────────────────────────────────
function generatePoster() {
  const name = document.getElementById("name").value.trim();
  const file = document.getElementById("imageInput").files[0];
  if (!name) { alert("કૃપા કરી નામ લખો ✏️"); return; }
  if (!file)  { alert("કૃપા કરી ફોટો પસંદ કરો 📷"); return; }
  if (file.size > 5 * 1024 * 1024) { alert("ફોટો 5MB થી નાનો હોવો જોઈએ"); return; }

  const btn     = document.getElementById("generateBtn");
  const loading = document.getElementById("loading");
  btn.disabled  = true;
  btn.classList.add("opacity-50", "cursor-not-allowed");
  loading.style.display = "block";

  const reader = new FileReader();
  reader.onload = e => loadGujaratiFontThenDraw(name, e.target.result, btn, loading);
  reader.readAsDataURL(file);
}

// ── Load Gujarati font into canvas ───────────────────────────────────────────
function loadGujaratiFontThenDraw(name, imgSrc, btn, loading) {
  // Using Anek Gujarati font for the canvas text
  const face = new FontFace(
    "CanvasGuj",
    // This is the direct woff2 URL for Anek Gujarati 700 weight for drawing the text onto canvas
    "url(https://fonts.gstatic.com/s/anekgujarati/v4/XoHo2YEz5sObqDygXG-1vys_wLdGz3Q.woff2)",
    { weight: "700" }
  );
  face.load()
    .then(f => document.fonts.add(f))
    .catch(() => {/* silent fallback */})
    .finally(() => drawPoster(name, imgSrc, btn, loading));
}

// ── Core canvas draw ──────────────────────────────────────────────────────────
function drawPoster(name, userImgSrc, btn, loading) {
  const canvas = document.getElementById("canvas");
  const ctx    = canvas.getContext("2d");

  const bg      = new Image();
  const userImg = new Image();
  let loaded    = 0;

  function tryDraw() {
    if (++loaded < 2) return;

    ctx.clearRect(0, 0, 1080, 1350);

    // 1 — Background
    if (bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, 1080, 1350);
    } else {
      ctx.fillStyle = "#f8f5ff";
      ctx.fillRect(0, 0, 1080, 1350);
    }

    const cx = PHOTO_CX;
    const cy = PHOTO_CY;
    const r  = PHOTO_R;

    // 2 — Circular user photo (object-fit: cover)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const iw   = userImg.naturalWidth  || userImg.width  || 1;
    const ih   = userImg.naturalHeight || userImg.height || 1;
    const side = Math.min(iw, ih);
    const sx   = (iw - side) / 2;
    const sy   = (ih - side) / 2;
    ctx.drawImage(userImg, sx, sy, side, side, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // 3 — Brown outer ring (solid, no glow)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + RING_OUTER_WIDTH / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = RING_OUTER_COLOR;
    ctx.lineWidth   = RING_OUTER_WIDTH;
    ctx.stroke();
    ctx.restore();

    // 4 — Thin amber inner accent ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + RING_OUTER_WIDTH + RING_INNER_WIDTH / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = RING_INNER_COLOR;
    ctx.lineWidth   = RING_INNER_WIDTH;
    ctx.stroke();
    ctx.restore();

    // 5 — Name text
    ctx.save();
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    let fontSize = 62;
    const maxW   = 420;
    const setFont = () => {
      ctx.font = `bold ${fontSize}px "CanvasGuj","Anek Gujarati","Noto Sans Gujarati","Mukta",sans-serif`;
    };
    setFont();
    while (ctx.measureText(name).width > maxW && fontSize > 24) {
      fontSize -= 2;
      setFont();
    }

    ctx.fillStyle = "#111111";
    ctx.fillText(name, NAME_X, NAME_Y);
    ctx.restore();

    // 6 — Export
    finalize(canvas, btn, loading, name);
  }

  bg.onload  = tryDraw;
  bg.onerror = tryDraw;
  userImg.onload  = tryDraw;
  userImg.onerror = () => {
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
    loading.style.display = "none";
    alert("ફોટો લોડ ન થઈ શક્યો. ફરી પ્રયાસ કરો.");
  };

  bg.crossOrigin      = "anonymous";
  userImg.crossOrigin = "anonymous";
  bg.src              = "images/bg.jpg";
  userImg.src         = userImgSrc;
}

function finalize(canvas, btn, loading, userName) {
  btn.disabled          = false;
  btn.classList.remove("opacity-50", "cursor-not-allowed");
  loading.style.display = "none";
  try {
    const url = canvas.toDataURL("image/png");
    document.getElementById("resultImg").src     = url;
    
    const downloadLink = document.getElementById("downloadLink");
    const downloadTextElement = document.getElementById("downloadText");
    const progressBar = document.getElementById("downloadProgress");

    // Reset download button state in case this is the second generation
    downloadTextElement.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ફોટો ડાઉનલોડ કરો`;
    progressBar.style.width = '0%';
    progressBar.classList.remove("bg-emerald-600", "bg-green-500");
    progressBar.classList.add("bg-black/20");
    downloadLink.classList.add("hover:-translate-y-1", "hover:shadow-[0_10px_25px_rgba(37,99,235,0.4)]");
    downloadLink.style.pointerEvents = "auto";
    
    downloadLink.href = url;
    
    // Add event listener for download progress and auto-refresh
    downloadLink.onclick = function(e) {
      // Prevent default behavior to handle download manually
      e.preventDefault();
      
      const link = this;
      const downloadTextElement = document.getElementById("downloadText");
      const progressBar = document.getElementById("downloadProgress");
      
      // Change to loading state
      downloadTextElement.innerHTML = 'ડાઉનલોડ થાય છે... <span id="progressPercent">0%</span>';
      link.classList.remove("hover:-translate-y-1", "hover:shadow-[0_10px_25px_rgba(37,99,235,0.4)]");
      link.style.pointerEvents = "none";
      
      let progress = 0;
      const progressPercent = document.getElementById("progressPercent");
      
      const interval = setInterval(() => {
        // Randomly increase progress to simulate real downloading
        progress += Math.random() * 15 + 5; 
        if (progress >= 100) progress = 100;
        
        progressBar.style.width = `${progress}%`;
        progressPercent.innerText = `${Math.floor(progress)}%`;
        
        if (progress === 100) {
          clearInterval(interval);
          
          // Change color to indicate completion visually
          progressBar.classList.remove("bg-green-500");
          progressBar.classList.add("bg-emerald-600"); // Darker/more distinct green on complete
          
          downloadTextElement.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ડાઉનલોડ પૂર્ણ`;
          
          // Programmatically trigger download
          const tempLink = document.createElement("a");
          tempLink.href = url;
          const safeName = userName ? userName.trim().replace(/\s+/g, '_') : 'photo';
          tempLink.download = `${safeName}.png`;
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);

          // Auto refresh after 1.5 seconds after download completion
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }, 150); // Updates every 150ms
    };

    const rs = document.getElementById("resultSection");
    rs.style.display = "block";
    rs.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alert("Download error — VS Code Live Server વાપરો.");
  }
}
