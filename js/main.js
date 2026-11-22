/* ============================================================
   Sabih Shah Portfolio — main.js
   Vanilla JS + GSAP ScrollTrigger + Lenis (all loaded from CDN).
   Everything degrades: with no JS, no CDN, or reduced motion,
   the page renders in its final, fully visible state.
   ============================================================ */

(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motionOK = hasGsap && !reduceMotion;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const refresh = () => hasGsap && ScrollTrigger.refresh();

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (motionOK && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToY(y, immediate) {
    if (lenis) lenis.scrollTo(y, { immediate: !!immediate });
    else window.scrollTo({ top: y, behavior: immediate || reduceMotion ? "auto" : "smooth" });
  }

  /* ---------------- Nav: progress, state, mobile menu ---------------- */
  const progressBar = $("#scroll-progress");
  const navbar = $("#navbar");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    navbar?.classList.toggle("scrolled", window.scrollY > 12);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $("#burger");
  const mobileMenu = $("#mobile-menu");
  function setMenu(open) {
    burger?.classList.toggle("open", open);
    mobileMenu?.classList.toggle("open", open);
    burger?.setAttribute("aria-expanded", String(open));
    burger?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));

  // In-page links: route through Lenis so smooth scroll and pinned sections agree.
  $$('a[href^="#"]:not(.skip-link)').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && document.querySelector(id);
      setMenu(false);
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
      history.replaceState(null, "", id);
    })
  );

  /* ---------------- Active section highlighting ---------------- */
  const navLinks = $$(".nav-links a, .mobile-menu a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = "#" + entry.target.id;
        navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach((s) => sectionObserver.observe(s));

  /* ============================================================
     HERO — the page "runs detection" as you scroll
     ============================================================ */
  const stage = $(".hero-stage");
  const portraitImg = $(".hero-portrait img");
  const boxes = $$(".hero .det").map((el) => {
    const box = document.createElement("div");
    box.className = "bbox";
    box.dataset.cls = el.dataset.cls;
    box.setAttribute("aria-hidden", "true");
    box.style.setProperty("--c", `var(--${el.dataset.cls})`);
    const frame = document.createElement("span");
    frame.className = "bbox-frame";
    box.appendChild(frame);
    const label = document.createElement("span");
    label.className = "bbox-label";
    box.appendChild(label);
    stage.appendChild(box);
    return { el, box, frame, label, name: el.dataset.label, conf: parseFloat(el.dataset.conf) };
  });
  const setLabel = (d, p) => (d.label.textContent = `${d.name} ${(d.conf * p).toFixed(2)}`);

  function placeBoxes() {
    const sr = stage.getBoundingClientRect();
    boxes.forEach((d) => {
      const r = d.el.getBoundingClientRect();
      const pad = d.el.tagName === "IMG" ? 10 : 4;
      d.box.style.left = r.left - sr.left - pad + "px";
      d.box.style.top = r.top - sr.top - pad + "px";
      d.box.style.width = r.width + pad * 2 + "px";
      d.box.style.height = r.height + pad * 2 + "px";
    });
  }
  window.addEventListener("resize", placeBoxes);
  placeBoxes();

  if (!motionOK) {
    boxes.forEach((d) => setLabel(d, 1));
    $(".hero-portrait")?.classList.add("detected");
  } else {
    const buildDetection = (scrollTrigger) => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger });
      tl.to(".scroll-hint", { opacity: 0, duration: 0.15 }, 0)
        .fromTo(".scan", { top: 0, opacity: 0 }, { top: "100%", duration: 1.3, ease: "power1.inOut" }, 0)
        .to(".scan", { opacity: 1, duration: 0.05 }, 0)
        .to(".scan", { opacity: 0, duration: 0.1 }, 1.3);
      boxes.forEach((d, i) => {
        const at = 0.3 + i * 0.35;
        const p = { v: 0 };
        setLabel(d, 0);
        tl.fromTo(d.frame, { clipPath: "inset(0% 100% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35, ease: "power2.out" }, at)
          .fromTo(d.label, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.15, ease: "power2.out" }, at + 0.1)
          .to(p, { v: 1, duration: 0.45, onUpdate: () => setLabel(d, p.v) }, at);
      });
      tl.fromTo(portraitImg, { filter: "grayscale(1) contrast(1.05)" }, { filter: "grayscale(0) contrast(1)", duration: 0.4 }, 1.0)
        .fromTo(".readout", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, 1.4)
        .to({}, { duration: 0.3 }); // short hold before the pin releases
      return tl;
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", () => {
      buildDetection({ trigger: stage, start: "top top", end: "+=120%", pin: true, scrub: 0.6, onRefresh: placeBoxes });
    });
    mm.add("(max-width: 860px)", () => {
      // No pin on phones: play the detection once, when the hero is on screen.
      buildDetection({ trigger: stage, start: "top 80%", toggleActions: "play none none none" }).timeScale(1.4);
    });
  }

  /* ---------------- Experience: the timeline draws as you scroll ---------------- */
  const timelineItems = $$(".timeline-item");
  if (motionOK) {
    gsap.fromTo(".timeline-fill", { scaleY: 0 }, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: ".timeline", start: "top 65%", end: "bottom 65%", scrub: 0.5 },
    });
    timelineItems.forEach((it) =>
      ScrollTrigger.create({
        trigger: it, start: "top 65%",
        onEnter: () => it.classList.add("lit"),
        onLeaveBack: () => it.classList.remove("lit"),
      })
    );
  } else {
    timelineItems.forEach((it) => it.classList.add("lit"));
  }

  /* ---------------- Copy email ---------------- */
  $$(".copy-email").forEach((btn) =>
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-email");
      if (navigator.clipboard) navigator.clipboard.writeText(email).then(() => showToast("Email address copied"));
      else showToast(email);
    })
  );
  let toastTimer;
  function showToast(msg) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  /* ---------------- Certifications: show all ---------------- */
  const certToggle = $("#cert-toggle");
  certToggle?.addEventListener("click", () => {
    const expanding = certToggle.getAttribute("aria-expanded") === "false";
    $$(".cert-extra").forEach((el) => el.classList.toggle("cert-hidden", !expanding));
    certToggle.setAttribute("aria-expanded", String(expanding));
    certToggle.textContent = expanding ? "Show fewer" : "Show all 15";
    refresh(); // page height changed: re-measure the pinned sections below
  });

  /* ============================================================
     PROJECTS — horizontal filmstrip, scrubbed by vertical scroll
     ============================================================ */
  const work = $("#work");
  const pinEl = $(".work-pin");
  const viewport = $(".strip-viewport");
  const strip = $("#projects-grid");
  const cards = $$(".project-card", strip);
  const frameNow = $("#frame-now");
  const frameTotal = $("#frame-total");
  const scrubFill = $("#scrub-fill");
  const classLabels = {
    "detection-tracking": "tracking",
    "3d-reconstruction": "3d",
    "pose-gesture": "pose",
    "generative-restoration": "generative",
    "document-vlm": "vision-language",
  };
  cards.forEach((c) => (c.querySelector(".project-media").dataset.clsLabel = classLabels[c.dataset.category] || ""));

  const visibleCards = () => cards.filter((c) => !c.classList.contains("filtered-out") && !c.classList.contains("is-hidden"));
  const projectsToggle = $("#projects-toggle");
  let activeFilter = "all";
  let projectsExpanded = false;

  // "All" shows the featured projects first; the rest sit behind "Show all".
  // A category filter always shows every project in that category.
  function applyProjectVisibility() {
    cards.forEach((c) => {
      const filtered = activeFilter !== "all" && c.dataset.category !== activeFilter;
      const collapsed = activeFilter === "all" && !projectsExpanded && c.classList.contains("is-extra");
      c.classList.toggle("filtered-out", filtered);
      c.classList.toggle("is-hidden", !filtered && collapsed);
    });
    if (projectsToggle) {
      projectsToggle.hidden = activeFilter !== "all";
      projectsToggle.textContent = projectsExpanded ? "Show featured only" : `Show all ${cards.length} projects`;
      projectsToggle.setAttribute("aria-expanded", String(projectsExpanded));
    }
  }
  applyProjectVisibility();

  // After the set of visible cards changes: re-measure, optionally jump back to the first card.
  function afterStripChange(backToStart) {
    viewport.scrollLeft = 0;
    refresh();
    if (backToStart && stripTween) scrollToY(stripTween.scrollTrigger.start, true);
    updateFrames(stripTween ? stripTween.scrollTrigger.progress : 0);
    if (motionOK) gsap.fromTo(visibleCards(), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" });
  }
  const pad2 = (n) => String(n).padStart(2, "0");
  function updateFrames(p) {
    const n = visibleCards().length;
    frameTotal.textContent = pad2(n);
    frameNow.textContent = pad2(n ? Math.round(p * (n - 1)) + 1 : 0);
    scrubFill.style.transform = `scaleX(${p})`;
  }
  const stripDist = () => Math.max(0, strip.scrollWidth - viewport.clientWidth);
  let stripTween = null;

  if (motionOK) {
    gsap.matchMedia().add("(min-width: 861px)", () => {
      stripTween = gsap.to(strip, {
        x: () => -stripDist(),
        ease: "none",
        scrollTrigger: {
          trigger: pinEl, start: "top top", end: () => "+=" + stripDist(),
          pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => updateFrames(self.progress),
        },
      });
      return () => { stripTween = null; };
    });

    // Keyboard: tabbing to an off-screen card scrolls the page to where that card is in view.
    strip.addEventListener("focusin", (e) => {
      const card = e.target.closest(".project-card");
      if (!card || !stripTween) return;
      viewport.scrollLeft = 0;
      const st = stripTween.scrollTrigger;
      const d = stripDist();
      const x = Math.min(d, Math.max(0, card.offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft)));
      scrollToY(st.start + (d ? x / d : 0) * (st.end - st.start), true);
    });
  } else {
    // No pinning: the strip becomes a native horizontal scroller.
    work.classList.add("no-pin");
    viewport.addEventListener("scroll", () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      updateFrames(max > 0 ? viewport.scrollLeft / max : 0);
    }, { passive: true });
  }
  updateFrames(0);

  /* ---------------- Category filter ---------------- */
  const filterPills = $$(".filter-pill");
  filterPills.forEach((pill) =>
    pill.addEventListener("click", () => {
      const f = pill.dataset.filter;
      filterPills.forEach((p) => {
        p.classList.toggle("active", p === pill);
        p.setAttribute("aria-pressed", String(p === pill));
      });
      activeFilter = f;
      projectsExpanded = false;
      applyProjectVisibility();
      afterStripChange(true);
    })
  );

  projectsToggle?.addEventListener("click", () => {
    projectsExpanded = !projectsExpanded;
    applyProjectVisibility();
    // Expanding only adds cards to the right, so the current position stays valid.
    // Collapsing can leave the page past the shortened strip, so go back to the start.
    afterStripChange(!projectsExpanded);
  });

  // Layout settles after web fonts and images: re-measure everything once.
  const remeasure = () => { placeBoxes(); refresh(); };
  document.fonts?.ready.then(remeasure);
  window.addEventListener("load", remeasure);

  /* ============================================================
     Project data + modal
     ============================================================ */
  const projectData = {
    handball: {
      title: "Handball Analytics System",
      tags: ["Computer Vision", "Sports Analytics", "Deep Learning", "Tracking"],
      overview:
        "An advanced computer vision framework that employs multi-object tracking and temporal analysis to provide real-time performance insight for handball gameplay. YOLO-based detection is coupled with DeepSORT tracking to maintain consistent player identities across frames, while court homography transformations map pixel coordinates to real-world positions for accurate distance and velocity calculations.",
      features: [
        "Player tracking and identification",
        "Ball trajectory analysis and prediction",
        "Automated game event detection",
        "Performance metrics",
      ],
      technologies: ["Python", "OpenCV", "PyTorch", "YOLO", "DeepSORT", "NumPy"],
      media: [{ type: "image", src: "assets/img/portfolio/project-1/1.jpg" }],
      links: [],
    },
    pointcloud: {
      title: "3D Point Cloud Classification & Segmentation",
      tags: ["Computer Vision", "Self-Supervised Learning", "3D Processing", "Segmentation"],
      overview:
        "A comprehensive intra- and cross-modal contrastive learning method for point cloud understanding. By combining data from the point cloud and image modalities, the model learns 3D representations from unlabeled data — mapping concepts the human visual system learns from 2D images onto the 3D world.",
      features: [
        "Multi-class point cloud classification",
        "3D object segmentation and part segmentation",
        "Support for various 3D formats",
        "Multi-modal learning with images and 3D-rendered views",
      ],
      technologies: ["Python", "PyTorch", "Open3D", "PointNet++", "CUDA", "DGCNN"],
      media: [
        { type: "image", src: "assets/img/portfolio/project-2/2.jpg" },
        { type: "image", src: "assets/img/portfolio/project-2/image-1.png" },
        { type: "image", src: "assets/img/portfolio/project-2/image-2.png" },
        { type: "image", src: "assets/img/portfolio/project-2/image-3.png" },
        { type: "image", src: "assets/img/portfolio/project-2/image-4.png" },
      ],
      links: [],
    },
    depth: {
      title: "Monocular Depth Estimation & Point Cloud Generation",
      tags: ["Computer Vision", "Deep Learning", "3D Reconstruction", "Depth Estimation"],
      overview:
        "Extracts a point cloud from a single image using depth estimation, enhanced with keypoint detection. LeReS (encoder–decoder) produces accurate depth maps across diverse, complex scenes using a self-attention mechanism for global consistency and a fusion module that blends local and global depth information. Each pixel is back-projected into 3D space using the known depth value.",
      features: [
        "Single-image depth prediction",
        "Point cloud generation from depth",
        "Depth-aware image effects",
        "Keypoint detection and 3D enhancement",
      ],
      technologies: ["Python", "PyTorch", "OpenCV", "LeReS", "Open3D"],
      media: [
        { type: "image", src: "assets/img/portfolio/project-3/3.jpg" },
        { type: "image", src: "assets/img/portfolio/project-3/image-1.png" },
        { type: "image", src: "assets/img/portfolio/project-3/image-2.png" },
        { type: "image", src: "assets/img/portfolio/project-3/image-3.png" },
        { type: "image", src: "assets/img/portfolio/project-3/image-4.png" },
        { type: "video", src: "assets/img/portfolio/project-3/video.mp4" },
      ],
      links: [{ title: "View on GitHub", url: "https://github.com/SabihShah/3D-Point-Cloud-from-single-image.git", primary: true }],
    },
    yoga: {
      title: "Yoga Pose Estimation & Correction",
      tags: ["Computer Vision", "Pose Estimation", "MediaPipe", "Real-Time"],
      overview:
        "An intelligent pose-estimation framework that leverages MediaPipe landmark detection to provide real-time biomechanical analysis and form-correction guidance for yoga practitioners. A multi-stage pipeline combines 2D pose estimation with geometric angle calculations, scoring joint alignments against reference pose templates to generate targeted improvement feedback.",
      features: [
        "Real-time pose detection and analysis",
        "Automated form-correction feedback",
        "Progress tracking and analytics",
        "Multiple yoga style support",
      ],
      technologies: ["Python", "PyTorch", "Machine Learning", "OpenCV", "MediaPipe", "YOLO"],
      media: [
        { type: "image", src: "assets/img/portfolio/project-5/5.jpg" },
        { type: "image", src: "assets/img/portfolio/project-5/image-1.png" },
        { type: "video", src: "assets/img/portfolio/project-5/video-1.mp4" },
        { type: "video", src: "assets/img/portfolio/project-5/video-2.mp4" },
      ],
      links: [],
    },
    "4dgs": {
      title: "4D Gaussian Splatting — Dynamic Scene Reconstruction",
      tags: ["3D Reconstruction", "Neural Rendering", "Research", "Dynamic Scene"],
      overview:
        "4D Gaussian Splatting extends 3D Gaussian splatting to dynamic scenes by incorporating the temporal dimension, enabling real-time photorealistic rendering of scenes with complex motion. A progressive propagation strategy densifies 3D Gaussians in a way that respects existing geometric structure; at each timestamp, 4D Gaussians are sliced into dynamic 3D Gaussians and projected into 2D — with applications across VR, AR, and film production.",
      features: [
        "Dynamic scene modeling with 4D Gaussians",
        "Real-time novel view synthesis",
        "Temporal consistency optimization",
        "High-quality rendering pipeline",
      ],
      technologies: ["Python", "CUDA", "PyTorch", "3D Gaussian Splatting", "NeRF", "COLMAP"],
      media: [
        { type: "video", src: "assets/img/portfolio/4.mp4" },
        { type: "image", src: "assets/img/portfolio/project-4/image-1.jpg" },
        { type: "image", src: "assets/img/portfolio/project-4/image-2.png" },
        { type: "image", src: "assets/img/portfolio/project-4/image-3.png" },
        { type: "video", src: "assets/img/portfolio/project-4/video-2.mp4" },
      ],
      links: [],
    },
    license: {
      title: "License Plate Detection & Recognition System",
      tags: ["Computer Vision", "OCR", "Security", "Deep Learning"],
      overview:
        "A license plate detection and recognition system built on Faster R-CNN and YOLO architectures, optimized for accuracy on high-speed vehicles. Text is extracted from detected plate patches using PaddleOCR. Extensive model training and evaluation across varied datasets improved detection robustness under changing lighting and motion conditions.",
      features: [
        "Multi-country license plate support",
        "High-accuracy OCR engine",
        "Database management for records",
        "Multi-stage model for maximum accuracy",
      ],
      technologies: ["Python", "OpenCV", "PaddleOCR", "YOLO"],
      media: [
        { type: "image", src: "assets/img/portfolio/project-6/6.jpeg" },
        { type: "image", src: "assets/img/portfolio/project-6/image-1.jpeg" },
        { type: "image", src: "assets/img/portfolio/project-6/image-2.png" },
        { type: "video", src: "assets/img/portfolio/project-6/video-1.mp4" },
      ],
      links: [],
    },
    REID: {
      title: "Multi-Camera Person Tracking & Re-Identification",
      metric: "One global ID per person across cameras, 4 tracker backends",
      tags: ["Computer Vision", "Multi-Camera Tracking", "Person Re-ID", "Surveillance"],
      overview:
        "A multi-camera person tracking pipeline that preserves identity across different video streams by combining single-camera tracking with appearance-based cross-camera re-identification. The system assigns a consistent global ID as a person moves between cameras, enabling robust identity continuity in surveillance and analytics scenarios.",
      features: [
        "Single-camera tracking with ByteTrack, DeepSORT, BoT-SORT, and OC-SORT",
        "Cross-camera identity matching using OSNet and agw embeddings",
        "Global ID assignment across multiple camera views",
        "Boundary-aware filtering to reduce false matches at frame edges",
        "Scalable person tracking for security and retail analytics",
      ],
      technologies: ["Python", "OpenCV", "PyTorch", "OSNet", "agw", "Cosine Similarity"],
      media: [
        { type: "image", src: "assets/img/portfolio/reid/reid_diagram.png" },
        { type: "image", src: "assets/img/portfolio/reid/reid-1.png" },
        { type: "video", src: "assets/img/portfolio/reid/Person REID.webm" }
      ],
      links: [{ title: "View on GitHub", url: "https://github.com/SabihShah/Person-ReIdentification", primary: true }],
    },
    "3D Object Detection": {
      title: "3D Object Detection with Monocular Camera",
      tags: ["Computer Vision", "3D Vision", "Autonomous Perception"],
      overview:
        "A camera-only 3D object detection pipeline that predicts full 3D bounding boxes — position, dimensions, and orientation — from single RGB frames, without relying on LiDAR. Built on FCOS3D with a custom batch inference pipeline for images and video, enabling real-time visualization of detected objects in 3D space using only a standard camera feed.",
      features: [
        "Monocular 3D detection using FCOS3D (dense prediction, anchor-free)",
        "Custom inference pipeline for batch image and video processing",
        "Live OpenCV visualization of projected 3D bounding boxes",
        "Camera intrinsics estimation for calibration-free deployment",
        "Multi-class detection across vehicles, pedestrians, and obstacles"
      ],
      technologies: ["Python", "PyTorch", "mmdetection3d", "FCOS3D", "OpenCV"],
      media: [
        { type: "image", src: "assets/img/portfolio/3d OD/3d OD.png" },
        { type: "image", src: "assets/img/portfolio/3d OD/output.jpg" },
      ],
      links: []
    },
    "Sign Language Recognition": {
      title: "Sign Language Recognition with CNN",
      metric: "Trained on 87,000 images across 39 classes",
      tags: ["Computer Vision", "Real-Time Detection", "Image Classification", "Deep Learning"],
      overview:
        "Real-time American Sign Language alphabet and digit recognition system using a custom 2D CNN. Trained on 87,000 ASL images (29 classes) and Sign Language Digits dataset (10 classes).",
      features: [
        "Real-time hand gesture classification from live video feed",
        "4-layer Convolutional Neural Network (16→32→64→128 filters)",
        "Dual dataset support (alphabets + digits, 39 total classes)",
        "Data augmentation pipeline for improved generalization",
        "One-vs-all encoding with CSV-based label mapping"
      ],
      technologies: ["Python", "PyTorch", "OpenCV", "Albumentations", "CNN"],
      media: [
        { type: "image", src: "assets/img/portfolio/Hand sign/12.jpg" },
        { type: "image", src: "assets/img/portfolio/Hand sign/18.jpg" },
        { type: "image", src: "assets/img/portfolio/Hand sign/19.jpg" },
      ],
      links: [{title: "More Detail", url: "https://github.com/SabihShah/Hand-Sign-Recognition-paper", primary: true}]
    },
    "Email Automation": {
      title: "Document Parsing & Email Automation",
      metric: "4 documents generated and sent back per order",
      tags: ["Document Parsing", "Email Automation", "Workflow Automation", "RPA"],
      overview:
        "An Outlook-integrated automation bot that monitors an inbox for incoming Purchase Order PDFs, extracts structured data via a document-parsing API, and auto-generates Invoices, Pro Forma Invoices, Packing Slips, and Material Certs — then replies to the original email with the completed documents attached.",
      features: [
        "Real-time inbox monitoring with automatic PDF attachment detection",
        "LLM/API-based PDF data extraction (order details, line items, shipping info)",
        "Auto-fills Excel templates (including grouped textboxes/merged cells) and exports to PDF",
        "Generates multiple document types per order: Invoice, Pro Forma, Packing Slip, Material Certs",
        "Auto-reply to sender with generated documents attached",
        "Retry logic for API calls + processing logs for auditability"
      ],
      technologies: ["Python", "win32com (Outlook & Excel COM automation)", "Document Parsing API (RapidAPI)", "pdf2image", "PIL", "Excel/PDF automation"],
      media: [
        { type: "image", src: "assets/img/portfolio/Email/image1.png" },
        { type: "image", src: "assets/img/portfolio/Email/image2.png" },
      ],
      links: []
    },
    "InPainting": {
      title: "Inpainting",
      metric: "3 swappable pipelines, 18 clothing labels",
      tags: ["Diffusion Models", "Generative AI", "Semantic Segmentation"],
      overview:
        "An AI-powered fashion image editor combining segmentation and diffusion inpainting. Select any region of a photo — clothing, hair, background — and replace it via text prompts, with a Gradio GUI supporting multiple sequential edits in a single run.",
      features: [
        "Three interchangeable segmentation+inpainting pipelines (SAM+SD2, SAM2+SDXL, SegFormer+SDXL)",
        "Clothing-specific segmentation across 18 semantic labels (shirt, hair, pants, shoes, etc.)",
        "Multi-region edit queue — apply several prompt-guided edits sequentially in one run",
        "Live mask preview and color-coded segmentation map",
        "Prompt engineering support (negative prompts, texture/lighting cues) for higher-fidelity results"
      ],
      technologies: ['Python', 'PyTorch', 'Segment Anything (SAM & SAM 2)', 'SegFormer', 'Stable Diffusion 2 / SDXL', 'Diffusers', 'Transformers', 'OpenCV'],
      media: [
        { type: "image", src: "assets/img/portfolio/inpainting/img2.jpg" },
        { type: "image", src: "assets/img/portfolio/inpainting/seg-mask.png" },
        { type: "image", src: "assets/img/portfolio/inpainting/mask.png" },
        { type: "image", src: "assets/img/portfolio/inpainting/output.png" }
      ],
      links: [
        {title: "View on GitHub", url: "https://github.com/SabihShah/InPainting.git", primary: true},
        {title: "Colab Demo", url: "https://colab.research.google.com/drive/17fR7KGvX0r4WjuweYIDHtjXDgzfILmhX?usp=sharing", primary: false}
      ]
    },
    "3d-scanner": {
      title: "Multi-View 3D Object Scanner",
      metric: "360° handheld video in, textured 3D mesh out",
      tags: ["3D Reconstruction", "Structure from Motion", "Photogrammetry", "Point Cloud Processing", "Computer Vision", "Mesh Generation"],
      overview:
      "A full 3D reconstruction pipeline that turns a 360° handheld video of an object into a textured, vertex-colored 3D mesh. Built with COLMAP for structure-from-motion and dense stereo, Open3D for Poisson meshing, and OpenMVS for optional UV texturing — demonstrated end-to-end on a real-world object (a chair).",
      features: [
        "Full video-to-mesh pipeline: frame extraction → masking → SfM → dense stereo → fusion → meshing → export",
        "Automated background masking with rembg (U2Net)",
        "Interactive point cloud cropping and Poisson surface reconstruction",
        "Mesh cleanup (duplicate/degenerate face removal, non-manifold edge fixes) for print/texture readiness",
        "Vertex-color fallback appearance pipeline when UV texturing hits scale limits",
        "OBJ/STL export for downstream use (3D printing, viewers)",
        "Extensive documented failure-mode troubleshooting (VRAM limits, OOM kills, fusion tuning)"
      ],
      technologies: ["COLMAP (SfM + MVS)", "Open3D", "OpenMVS", "Python", "rembg", "CUDA", "Poisson Surface Reconstruction"],
      media: [
        { type: "image", src: "assets/img/portfolio/3d-scanner/image.png" },
        { type: "image", src: "assets/img/portfolio/3d-scanner/image copy.png" },
        { type: "image", src: "assets/img/portfolio/3d-scanner/mesh.png" },
        { type: "video", src: "assets/img/portfolio/3d-scanner/video-1.webm" },
      ],
      links: [
        {title: "View on GitHub", url: "https://github.com/SabihShah/Multi-View-3D-Object-Scanner.git", primary: true}
      ]
    },
    "Face Recognition": {
      title: "Facial Recognition System",
      tags: ["Face Recognition", "Vector Search", "Biometric Identification", "Computer Vision", "REST API", "Docker"],
      overview:
      "A dockerized face recognition service combining InsightFace for face detection/embedding extraction with Milvus as a vector database for fast similarity search. Includes a REST API for indexing, recognition, and search, plus a CLI and webcam client for managing and querying the face database.",
      features: [
        "Real-time face detection and embedding extraction via InsightFace-REST",
        "Vector similarity search backed by Milvus for scalable face matching",
        "Full REST API: extract, recognize, search_image, db_list, remove/wipe entries",
        "CLI tool (manage_db.py) for bulk add/delete/list operations on the face DB",
        "Webcam client (run.py) for live recognition against the indexed database",
        "Dockerized deployment with CPU, GPU, and multi-GPU compose configurations"
      ],
      technologies: ["Python", "InsightFace", "Milvus", "ONNX Runtime / TensorRT", "Docker", "REST API (FastAPI-based)", "OpenCV"],
      media: [
        { type: "image", src: "assets/img/portfolio/face/output-1.jpg" },
        { type: "video", src: "assets/img/portfolio/face/video.mp4" },
      ],
      links: [
        {title: "View on GitHub", url: "https://github.com/SabihShah/Facial-Recognition.git", primary: true}
      ]
    },
    "Visual QA": {
      title: "Visual Question Answering (VQA) System",
      metric: "7B vision-language model running in under 8 GB VRAM",
      tags: ["Vision-Language Models", "Visual Question Answering", "Image Captioning", "Multi-modal AI", "Generative AI"],
      overview:
      "A unified vision-language system that performs both image captioning and visual question answering by switching input format at inference. Combines a frozen CLIP encoder with a lightweight MLP projection into GPT-2 (ClipCap-style), with an accompanying Qwen2.5-VL-7B inference pipeline for stronger real-world demo results under 8GB VRAM.",
      features: [
        "Dual-mode: captioning and VQA handled by a single architecture via prompt/format switching",
        "Custom ClipCap-style pipeline (CLIP ViT-B/32 frozen → MLP projection → GPT-2 decoder)",
        "Production-ready inference via Qwen2.5-VL-7B-Instruct with 4-bit quantization for low-VRAM deployment",
        "Full training pipeline for fine-tuning on custom datasets (Flickr8k-ready)",
        "Interactive Gradio demo for live caption/VQA testing",
        "Configurable architecture (YAML-based) with guidance on unfreezing vision layers"
      ],
      technologies: ["Python", "PyTorch", "CLIP (ViT-B/32)", "GPT-2", "Qwen2.5-VL-7B-Instruct", "Transformers", "Gradio"],
      media: [
        { type: "image", src: "assets/img/portfolio/Visual QA/img-1.png" },
        { type: "image", src: "assets/img/portfolio/Visual QA/img-2.png" }
      ],
      links: [
        { title: "View on GitHub", url: "https://github.com/SabihShah/Visual-QA.git", primary: true }
      ]
    },
    "Sketch-Translation": {
      title: "Sketch to Photo Translation",
      metric: "LoRA fine-tuning that fits on an 8 GB GPU",
      tags: ["Image-to-Image Translation", "Diffusion Models", "Generative AI", "Sketch-to-Image", "LoRA Fine-Tuning"],
      overview:
      "Converts hand-drawn or scanned sketches (objects, animals, architecture) into photorealistic images using ControlNet (SoftEdge) conditioning with Stable Diffusion 1.5, with optional LoRA fine-tuning for domains the base model handles poorly.",
      features: [
        "Full pipeline: sketch preprocessing → softedge extraction (PidiNet) → ControlNet-guided diffusion generation",
        "LoRA fine-tuning path for narrow/unfamiliar object domains",
        "Tuned defaults (conditioning_scale=1.2, 35 steps) validated across multiple object categories (mug, sneaker, watch, backpack)",
        "Uses photorealism-focused Realistic Vision checkpoint over base SD1.5 for stronger results with zero training",
        "Documented failure-mode learnings (edge-padding artifacts, thresholding mismatches) baked into default flags",
        "Low-VRAM LoRA training config (rank/alpha/batch size tunable, batch_size=1 default for 8GB GPUs)"
      ],
      technologies: ["Diffusers", "ControlNet (SoftEdge)", "Stable Diffusion", "PEFT (LoRA)", "OpenCV"],
      media: [
        { type: "image", src: "assets/img/portfolio/sketch/img.jpg" },
        { type: "image", src: "assets/img/portfolio/sketch/cup-img.jpg" },
        { type: "image", src: "assets/img/portfolio/sketch/cup-out.jpg" }
      ],
      links: [
        { title: "View on Github", url: "https://github.com/SabihShah/Sketch-to-Photo.git" }
      ]
    }
  };

  const modal = $("#project-modal");
  const modalBox = $(".modal-box", modal);
  const modalTitle = $(".modal-title", modal);
  const modalTags = $(".project_tags", modal);
  const modalOverview = $(".overview", modal);
  const modalFeatures = $(".features_list", modal);
  const modalTech = $(".tech_stack", modal);
  const modalLinks = $(".project_links", modal);
  const modalMain = $(".modal-media-main", modal);
  const modalThumbs = $(".modal-thumbs", modal);
  const closeBtn = $(".modal-close", modal);
  let lastFocus = null;
  let closeTimer;

  function setMainMedia(item) {
    modalMain.innerHTML =
      item.type === "video"
        ? `<video src="${item.src}" autoplay loop muted playsinline controls></video>`
        : `<img src="${item.src}" alt="${modalTitle.textContent}" />`;
  }

  function openProject(key) {
    const p = projectData[key];
    if (!p) return;
    clearTimeout(closeTimer);
    modalTitle.textContent = p.title;
    modalTags.innerHTML = p.tags.map((t) => `<span>${t}</span>`).join("");
    modalOverview.textContent = p.overview;
    modalFeatures.innerHTML = p.features.map((f) => `<li>${f}</li>`).join("");
    modalTech.innerHTML = p.technologies.map((t) => `<span class="tech_item">${t}</span>`).join("");
    modalLinks.innerHTML = p.links
      .map((l) => `<a class="btn btn-sm ${l.primary ? "btn-primary" : "btn-ghost"}" href="${l.url}" target="_blank" rel="noopener">${l.title}</a>`)
      .join("");

    setMainMedia(p.media[0]);
    modalThumbs.innerHTML =
      p.media.length < 2
        ? ""
        : p.media
            .map(
              (m, i) =>
                `<button type="button" class="modal-thumb ${i === 0 ? "active" : ""}" data-i="${i}" aria-label="Show ${m.type} ${i + 1} of ${p.media.length}">${
                  m.type === "video" ? `<video src="${m.src}" muted preload="metadata"></video>` : `<img src="${m.src}" alt="" loading="lazy" />`
                }</button>`
            )
            .join("");
    $$(".modal-thumb", modalThumbs).forEach((thumb) =>
      thumb.addEventListener("click", () => {
        $$(".modal-thumb", modalThumbs).forEach((t) => t.classList.toggle("active", t === thumb));
        setMainMedia(p.media[+thumb.dataset.i]);
      })
    );

    lastFocus = document.activeElement;
    modal.hidden = false;
    modalBox.scrollTop = 0;
    requestAnimationFrame(() => modal.classList.add("open"));
    lenis?.stop();
    document.body.style.overflow = "hidden";
    closeBtn.focus({ preventScroll: true });
  }

  function closeProject() {
    if (modal.hidden) return;
    modal.classList.remove("open");
    lenis?.start();
    document.body.style.overflow = "";
    closeTimer = setTimeout(() => {
      modal.hidden = true;
      modalMain.innerHTML = "";
    }, 260);
    lastFocus?.focus({ preventScroll: true });
  }

  /* Cards: add the key-result line and code/demo links from projectData */
  const linkLabel = (l) => (/colab\.research/.test(l.url) ? "Colab demo" : /github\.com/.test(l.url) ? "Code on GitHub" : l.title);
  cards.forEach((card) => {
    const p = projectData[card.dataset.project];
    if (!p) return;
    if (p.metric) {
      const m = document.createElement("span");
      m.className = "project-metric";
      m.textContent = p.metric;
      card.querySelector(".project-desc").after(m);
    }
    const links = document.createElement("div");
    links.className = "project-links";
    links.innerHTML = p.links
      .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${linkLabel(l)}</a>`)
      .join("");
    card.appendChild(links);
    card.querySelector(".project-open").addEventListener("click", () => openProject(card.dataset.project));
  });
  refresh();
  closeBtn.addEventListener("click", closeProject);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeProject(); });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") closeProject();
    if (e.key === "Tab") {
      // keep focus inside the dialog
      const f = $$("button, a[href], video[controls]", modal).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
