/**
 * Bilkan AI - Interactive Features and Animations
 * Canvas Neural Net, Typewriter, 3D Card Hover Tilts, and English/Turkish Language Switcher
 */

document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initNeuralCanvas();
  initHeroTypewriter();
  initLlmTypewriter();
  init3DTilt();
  initShowcaseWidget();
  initCleanRouting();
});

/* =========================================================================
   0. LANGUAGE SWITCHER SYSTEM (tr/en)
   ========================================================================= */
let currentLang = localStorage.getItem('lang') || 'tr';
window.typewriterDone = false;

function updateLanguageUI(lang) {
  // 1. Update text of elements having data-tr and data-en
  const translatableElements = document.querySelectorAll('[data-tr][data-en]');
  translatableElements.forEach(el => {
    const isHeroTypewriterElement = el.id === 'hero-tagline-text' || el.id === 'hero-title-text' || el.id === 'hero-desc-text';
    if (!isHeroTypewriterElement || window.typewriterDone) {
      el.textContent = el.getAttribute(`data-${lang}`);
    }
  });

  // 2. Update meta description and page title
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && metaDesc.hasAttribute(`data-${lang}-content`)) {
    metaDesc.setAttribute('content', metaDesc.getAttribute(`data-${lang}-content`));
  }
  const pageTitle = document.querySelector('title');
  if (pageTitle && pageTitle.hasAttribute(`data-${lang}`)) {
    pageTitle.textContent = pageTitle.getAttribute(`data-${lang}`);
  }

  // 3. Update input placeholders and button texts
  const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
  inputs.forEach(input => {
    if (input.hasAttribute(`data-${lang}-placeholder`)) {
      input.setAttribute('placeholder', input.getAttribute(`data-${lang}-placeholder`));
    }
  });

  // 4. Update the language button text in header
  const switchBtn = document.getElementById('lang-switch');
  if (switchBtn) {
    switchBtn.textContent = lang === 'tr' ? 'EN' : 'TR';
  }

  // 5. Save selected language
  localStorage.setItem('lang', lang);
}

function initLanguageSwitcher() {
  const switchBtn = document.getElementById('lang-switch');
  
  // Set initial language from storage or default
  currentLang = localStorage.getItem('lang') || 'tr';
  updateLanguageUI(currentLang);

  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      currentLang = currentLang === 'tr' ? 'en' : 'tr';
      updateLanguageUI(currentLang);
      
      // Instantly trigger LLM Typewriter loop restart for active language update
      if (typeof window.restartLlmTypewriter === 'function') {
        window.restartLlmTypewriter();
      }
    });
  }
}

/* =========================================================================
   1. NEURAL NETWORK CANVAS BACKGROUND
   ========================================================================= */
function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const particleCount = Math.min(80, Math.floor((width * height) / 20000));
  const connectionDistance = 120;
  
  let mouse = { x: null, y: null, active: false };

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce boundaries
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse magnetism (gentle pull)
      if (mouse.active && mouse.x && mouse.y) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          this.x += dx * 0.005;
          this.y += dy * 0.005;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(185, 100%, 65%, 0.3)';
      ctx.fill();
    }
  }

  // Populate particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `hsla(215, 100%, 75%, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Connection to mouse
      if (mouse.active && mouse.x && mouse.y) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `hsla(185, 100%, 50%, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  animate();
}

/* =========================================================================
   2. LLM TYPEWRITER CHAT SIMULATOR (Bilingual tr/en support)
   ========================================================================= */
function initLlmTypewriter() {
  const container = document.querySelector('.llm-body');
  const statusIndicator = document.querySelector('.llm-status');
  if (!container) return;

  const conversationLoops = {
    tr: [
      {
        prompt: "Eğitim uygulamalarınızda yapay zeka ne gibi faydalar sağlıyor?",
        response: "Yapay zeka modellerimiz, öğrencilerin performans verilerini analiz ederek kişiselleştirilmiş öğrenme yolları çizer. Akıllı sınav sistemleri ile zayıf yönleri tespit edip özel pekiştirici materyaller öneririz."
      },
      {
        prompt: "Sağlık alanındaki çözümleriniz nelerdir?",
        response: "Derin öğrenme tabanlı tanı destek sistemleri, tıbbi görüntü analizi (MR, Röntgen vb.) ve hasta takip yazılımları geliştiriyoruz. Amacımız doktorların karar verme süreçlerini hızlandırmaktır."
      },
      {
        prompt: "Finans ve borsa için tahminleme projeleriniz var mı?",
        response: "Evet. Tarihsel borsa verileri, küresel finans haberleri ve makroekonomik parametreleri sentezleyerek hisse fiyat hareket yönleri ve risk analizleri sunan kestirimci modeller eğitiyoruz."
      },
      {
        prompt: "Şirketler için yapay zeka entegrasyonu nasıl yapılıyor?",
        response: "İşletmenizin mevcut verilerini analiz edip talep tahmini, akıllı stok yönetimi, müşteri segmentasyonu ve kişiselleştirilmiş satış asistanları entegre ederek verimliliğinizi optimize ediyoruz."
      }
    ],
    en: [
      {
        prompt: "What benefits does AI provide in your educational applications?",
        response: "Our AI models analyze student performance data to map personalized learning pathways. With intelligent exam systems, we identify weaknesses and suggest custom reinforcement materials."
      },
      {
        prompt: "What are your solutions in the healthcare field?",
        response: "We develop deep learning-based diagnostic support systems, medical image analysis (MRI, X-ray, etc.), and patient monitoring software. Our goal is to accelerate doctors' decision-making processes."
      },
      {
        prompt: "Do you have forecasting projects for finance and the stock market?",
        response: "Yes. By synthesizing historical stock market data, global financial news, and macroeconomic parameters, we train predictive models that offer share price movement trends and risk analyses."
      },
      {
        prompt: "How is AI integration done for companies?",
        response: "We analyze your business's existing data and optimize your efficiency by integrating demand forecasting, smart inventory management, customer segmentation, and personalized sales assistants."
      }
    ]
  };

  let currentLoopIndex = 0;
  let activeTimeout = null;
  let activeResolve = null;

  async function runCycle() {
    container.innerHTML = '';
    const lang = localStorage.getItem('lang') || 'tr';
    const items = conversationLoops[lang] || conversationLoops['tr'];
    const item = items[currentLoopIndex];

    // 1. User Prompt Bubble
    if (statusIndicator) {
      statusIndicator.innerHTML = lang === 'tr' 
        ? '<div class="llm-pulse"></div><span>Kullanıcı yazıyor...</span>'
        : '<div class="llm-pulse"></div><span>User typing...</span>';
    }
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble bubble-user';
    container.appendChild(userBubble);
    await typeWriter(item.prompt, userBubble, 30);

    // Wait a brief moment
    await new Promise(r => {
      activeResolve = r;
      activeTimeout = setTimeout(r, 800);
    });

    // 2. AI Status "Thinking"
    if (statusIndicator) {
      statusIndicator.innerHTML = lang === 'tr'
        ? '<div class="llm-pulse" style="background-color: var(--accent-cyan)"></div><span>Bilkan AI düşünüyor...</span>'
        : '<div class="llm-pulse" style="background-color: var(--accent-cyan)"></div><span>Bilkan AI thinking...</span>';
    }
    
    // 3. AI Response Bubble
    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble bubble-assistant';
    container.appendChild(aiBubble);
    
    if (statusIndicator) {
      statusIndicator.innerHTML = lang === 'tr'
        ? '<div class="llm-pulse" style="background-color: var(--accent-green)"></div><span>Bilkan AI yanıt üretiyor...</span>'
        : '<div class="llm-pulse" style="background-color: var(--accent-green)"></div><span>Bilkan AI generating response...</span>';
    }
    await typeWriter(item.response, aiBubble, 15);

    // Idle at end
    if (statusIndicator) {
      statusIndicator.innerHTML = lang === 'tr'
        ? '<div class="llm-pulse"></div><span>Çevrimiçi</span>'
        : '<div class="llm-pulse"></div><span>Online</span>';
    }

    // Wait and switch loop
    await new Promise(r => {
      activeResolve = r;
      activeTimeout = setTimeout(r, 5000);
    });
    currentLoopIndex = (currentLoopIndex + 1) % items.length;
    runCycle();
  }

  // Register global toggle hook
  window.restartLlmTypewriter = () => {
    if (activeTimeout) clearTimeout(activeTimeout);
    if (activeResolve) activeResolve();
    runCycle();
  };

  runCycle();
}

/* =========================================================================
   3. 3D CARD INTERACTIVE TILT EFFECT
   ========================================================================= */
function init3DTilt() {
  const cards = document.querySelectorAll('.sector-card');
  
  cards.forEach(card => {
    const art = card.querySelector('.card-visual-art');
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convert to values between -0.5 and 0.5
      const percentX = (x / rect.width) - 0.5;
      const percentY = (y / rect.height) - 0.5;
      
      // Calculate rotation angles (max tilt 20 degrees)
      const rotateY = percentX * 20;
      const rotateX = -percentY * 20;
      
      // Set custom properties for CSS
      card.style.setProperty('--mouse-x', (x / rect.width) * 100 + '%');
      card.style.setProperty('--mouse-y', (y / rect.height) * 100 + '%');
      
      // Smooth inline style transform
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      
      // Parallax effect on inner visual (opposite translation)
      if (art) {
        art.style.transform = `scale(1.15) translateX(${-percentX * 25}px) translateY(${-percentY * 25}px)`;
      }
    });
    
    card.addEventListener('mouseleave', () => {
      // Reset card transform
      card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)`;
      
      // Reset inner visual
      if (art) {
        art.style.transform = 'scale(1.05) translateX(0) translateY(0)';
      }
    });
  });
}

/* =========================================================================
   4. SHOWCASE REALTIME SIMULATED WIDGET CHART
   ========================================================================= */
function initShowcaseWidget() {
  const canvas = document.querySelector('.showcase-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight || 250);

  const dataPoints = [];
  const maxPoints = 25;
  let count = 0;

  // Initialize with some seed data
  for (let i = 0; i < maxPoints; i++) {
    dataPoints.push({
      x: i * (width / maxPoints),
      y: height * 0.65 + Math.sin(i * 0.5) * 20 + (Math.random() - 0.5) * 10
    });
  }

  const lossValueEl = document.getElementById('loss-value');
  const accValueEl = document.getElementById('acc-value');
  const epochValueEl = document.getElementById('epoch-value');

  function drawWidget() {
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // 1. Draw historical trained path
    ctx.beginPath();
    ctx.moveTo(dataPoints[0].x, dataPoints[0].y);
    for (let i = 1; i < dataPoints.length - 6; i++) {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y);
    }
    ctx.strokeStyle = 'hsl(215, 100%, 55%)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Area under path
    ctx.lineTo(dataPoints[dataPoints.length - 7].x, height);
    ctx.lineTo(0, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 2. Draw prediction dotted line (Future prediction)
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(dataPoints[dataPoints.length - 7].x, dataPoints[dataPoints.length - 7].y);
    for (let i = dataPoints.length - 6; i < dataPoints.length; i++) {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y);
    }
    ctx.strokeStyle = 'hsl(145, 100%, 50%)';
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 3. Draw active predicting dot
    const targetIdx = dataPoints.length - 7;
    const activeDot = dataPoints[targetIdx];
    ctx.beginPath();
    ctx.arc(activeDot.x, activeDot.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'hsl(215, 100%, 55%)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pulsing circle around it
    ctx.beginPath();
    ctx.arc(activeDot.x, activeDot.y, 12 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fluctuating values for showcase simulation
    count++;
    if (count % 30 === 0) {
      // Simulate live optimization progress
      if (lossValueEl) {
        let currentLoss = parseFloat(lossValueEl.textContent);
        if (currentLoss > 0.02) {
          lossValueEl.textContent = (currentLoss - 0.001 * Math.random()).toFixed(4);
        }
      }
      if (accValueEl) {
        let currentAcc = parseFloat(accValueEl.textContent);
        if (currentAcc < 99.8) {
          accValueEl.textContent = (currentAcc + 0.02 * Math.random()).toFixed(2) + '%';
        }
      }
      if (epochValueEl) {
        let currentEpoch = parseInt(epochValueEl.textContent);
        epochValueEl.textContent = currentEpoch + 1;
      }

      // Slide points left and add a new dynamic point
      dataPoints.shift();
      const lastPoint = dataPoints[dataPoints.length - 1];
      dataPoints.push({
        x: width,
        y: height * 0.55 + Math.sin(count * 0.05) * 15 + (Math.random() - 0.5) * 25
      });

      // Recalculate X coordinate spacings
      for (let i = 0; i < dataPoints.length; i++) {
        dataPoints[i].x = i * (width / (maxPoints - 1));
      }
    }

    requestAnimationFrame(drawWidget);
  }

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight || 250;
  });

  drawWidget();
}

/* =========================================================================
   5. TYPEWRITER UTILITY & HERO TYPEWRITER
   ========================================================================= */
async function typeWriter(text, element, speed = 25) {
  return new Promise((resolve) => {
    let index = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';
    element.appendChild(cursor);

    function type() {
      if (index < text.length) {
        cursor.insertAdjacentText('beforebegin', text.charAt(index));
        index++;
        setTimeout(type, speed + Math.random() * 20);
      } else {
        cursor.remove();
        resolve();
      }
    }
    type();
  });
}

async function initHeroTypewriter() {
  const taglineEl = document.getElementById('hero-tagline-text');
  const titleEl = document.getElementById('hero-title-text');
  const descEl = document.getElementById('hero-desc-text');
  const taglineCont = document.getElementById('hero-tagline-container');
  const actionsCont = document.getElementById('hero-actions-container');

  if (!taglineEl || !titleEl || !descEl || !actionsCont) return;

  const currentLang = localStorage.getItem('lang') || 'tr';
  const taglineText = taglineEl.getAttribute(`data-${currentLang}`) || "Yapay Zeka Yazılım Teknolojileri";
  const titleText = titleEl.getAttribute(`data-${currentLang}`) || "Yapay Zeka ile Geleceği Şekillendirin";
  const descText = descEl.getAttribute(`data-${currentLang}`) || "Eğitim, sağlık, finans ve ticaret sektörleri için veri odaklı akıllı modeller...";

  // Start with a clean container and wait a moment
  window.typewriterDone = false;
  taglineEl.textContent = "";
  titleEl.textContent = "";
  descEl.textContent = "";
  
  await new Promise(r => setTimeout(r, 400));

  // 1. Show tagline container
  taglineCont.style.opacity = '1';
  await typeWriter(taglineText, taglineEl, 15);
  await new Promise(r => setTimeout(r, 150));

  // 2. Type Title
  await typeWriter(titleText, titleEl, 20);
  await new Promise(r => setTimeout(r, 150));

  // 3. Type Description
  await typeWriter(descText, descEl, 8);
  await new Promise(r => setTimeout(r, 200));

  // 4. Fade in CTA Buttons
  actionsCont.style.opacity = '1';
  actionsCont.style.transform = 'translateY(0)';
  
  // Set typewriter done flag so that future language toggling translates hero texts instantly
  window.typewriterDone = true;
}

/* =========================================================================
   6. CLEAN URL SPA-LIKE ROUTING AND SMOOTH SCROLL SYSTEM
   ========================================================================= */
function initCleanRouting() {
  const cleanPaths = ['/hizmetler', '/sektorler', '/hakkimizda', '/iletisim', '/home', '/'];
  
  // Helper to scroll to section
  function scrollToPath(path, smooth = true) {
    if (path === '/' || path === '' || path === '/home') {
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      return;
    }
    const targetId = path.startsWith('/') ? path.substring(1) : path;
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80; // approximate sticky header height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  // Handle legacy hash URLs on load
  const hash = window.location.hash;
  if (hash) {
    if (hash === '#home') {
      history.replaceState(null, '', '/');
    } else {
      const cleanPath = '/' + hash.substring(1);
      if (cleanPaths.includes(cleanPath)) {
        history.replaceState(null, '', cleanPath);
        setTimeout(() => {
          scrollToPath(cleanPath, false);
        }, 500);
      }
    }
  }

  // Handle initial page load (for clean pathnames)
  const initialPath = window.location.pathname;
  if (cleanPaths.includes(initialPath)) {
    if (initialPath !== '/' && initialPath !== '' && initialPath !== '/home') {
      // Wait a short time for dynamic content/typewriter to settle, then scroll
      setTimeout(() => {
        scrollToPath(initialPath, false);
      }, 500);
    }
  }

  // Intercept click on links targeting clean paths
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const path = url.pathname;
      if (cleanPaths.includes(path)) {
        // Intercept only on the index page where sections actually exist
        const isIndexPage = document.getElementById('hizmetler') !== null;
        if (isIndexPage) {
          e.preventDefault();
          history.pushState(null, '', path);
          scrollToPath(path, true);
        }
      }
    } catch (err) {
      // Ignore URL parsing errors
    }
  });

  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    if (cleanPaths.includes(path)) {
      scrollToPath(path, true);
    }
  });

  // Handle any runtime hash change (e.g. if a link tries to force a hash)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
      if (hash === '#home') {
        history.replaceState(null, '', '/');
        scrollToPath('/', true);
      } else {
        const cleanPath = '/' + hash.substring(1);
        if (cleanPaths.includes(cleanPath)) {
          history.replaceState(null, '', cleanPath);
          scrollToPath(cleanPath, true);
        }
      }
    }
  });
}
