/* ============================================================
   Sabih Shah Portfolio — main.js
   Vanilla JS: no framework needed for a single-page site.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- Loader ---------------- */
  window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    setTimeout(() => loader && loader.classList.add("done"), 400);
  });

  /* ---------------- Scroll progress + nav state ---------------- */
  const progressBar = document.getElementById("scroll-progress");
  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("back-to-top");

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
    if (navbar) navbar.classList.toggle("scrolled", scrollTop > 12);
    if (backToTop) backToTop.classList.toggle("show", scrollTop > 600);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------------- Mobile menu ---------------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobile-menu");
  burger?.addEventListener("click", () => {
    burger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });
  mobileMenu?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("open");
      mobileMenu.classList.remove("open");
    })
  );

  /* ---------------- Active section highlighting ---------------- */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------------- Reveal-on-scroll ---------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* stagger children with data-stagger */
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = i * 70 + "ms";
    });
  });

  /* frame corner reveal for hover-frame elements on scroll into view (mobile touch affordance) */
  const frameObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll(".frame").forEach((el) => frameObserver.observe(el));

  /* ---------------- Hero role rotator ---------------- */
  const roles = ["Computer Vision Engineer", "AI / Deep Learning Developer", "Research Assistant", "Freelance ML Engineer"];
  const roleEl = document.getElementById("hero-role-text");
  if (roleEl) {
    let i = 0;
    let char = 0;
    let deleting = false;
    const tick = () => {
      const word = roles[i];
      if (!deleting) {
        char++;
        roleEl.textContent = word.slice(0, char);
        if (char === word.length) {
          deleting = true;
          setTimeout(tick, 1700);
          return;
        }
      } else {
        char--;
        roleEl.textContent = word.slice(0, char);
        if (char === 0) {
          deleting = false;
          i = (i + 1) % roles.length;
        }
      }
      setTimeout(tick, deleting ? 30 : 55);
    };
    tick();
  }

  /* ---------------- Copy email ---------------- */
  document.querySelectorAll(".copy-email").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = btn.getAttribute("data-email");
      navigator.clipboard?.writeText(email).then(() => showToast("Email copied to clipboard"));
    });
  });

  function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  /* ---------------- Certifications show more ---------------- */
  const certToggle = document.getElementById("cert-toggle");
  certToggle?.addEventListener("click", () => {
    // Query by the stable ".cert-extra" class (never removed) rather than
    // ".cert-hidden" (which gets toggled off/on and would otherwise make
    // this selector return nothing on the second click).
    const extraItems = document.querySelectorAll(".cert-extra");
    const expanding = certToggle.getAttribute("data-expanded") === "false";
    extraItems.forEach((el) => el.classList.toggle("cert-hidden", !expanding));
    certToggle.setAttribute("data-expanded", expanding);
    certToggle.textContent = expanding ? "Show less" : "Show all 15 certifications";
  });

  /* ---------------- Skills show all ---------------- */
  const skillsToggle = document.getElementById("skills-toggle");
  skillsToggle?.addEventListener("click", () => {
    const extraItems = document.querySelectorAll(".skill-extra");
    const expanding = skillsToggle.getAttribute("data-expanded") === "false";
    extraItems.forEach((el) => el.classList.toggle("skill-hidden", !expanding));
    skillsToggle.setAttribute("data-expanded", expanding);
    skillsToggle.textContent = expanding ? "Show less" : "Show all skills";
  });

  /* ---------------- Mouse-follow glow (desktop only, subtle) ---------------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const glow = document.createElement("div");
    glow.id = "mouse-glow";
    glow.style.cssText = `
      position:fixed; width:420px; height:420px; border-radius:50%;
      background: radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%);
      pointer-events:none; z-index:1; will-change: transform;
      left:0; top:0; transform: translate3d(-500px, -500px, 0);
    `;
    document.body.appendChild(glow);
    // Track the cursor with no CSS transition/easing and no extra rAF
    // buffering, so the glow sits exactly under the pointer every frame.
    window.addEventListener("mousemove", (e) => {
      glow.style.transform = `translate3d(${e.clientX - 210}px, ${e.clientY - 210}px, 0)`;
    });
  }

  /* ---------------- Background canvas: neural node network ---------------- */
  const canvas = document.getElementById("bg-canvas");
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = canvas.getContext("2d");
    let w, h, nodes;
    const NODE_COUNT_BASE = 70;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = Math.min(window.innerHeight * 1.4, 1400);
      const count = Math.max(28, Math.min(NODE_COUNT_BASE, Math.floor((w * h) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      }));
    }
    window.addEventListener("resize", resize);
    resize();

    const maxDist = 150;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const o = nodes[j];
          const dx = n.x - o.x, dy = n.y - o.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.strokeStyle = `rgba(99,102,241,${0.14 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(o.x, o.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,0.55)";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------- Skill card tilt (subtle) ---------------- */
  document.querySelectorAll(".project-card:not(.is-locked)").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  /* ---------------- Project category filter ---------------- */
  const filterPills = document.querySelectorAll(".filter-pill");
  const projectCards = document.querySelectorAll("#projects-grid .project-card");
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.getAttribute("data-filter");
      projectCards.forEach((card) => {
        const match = filter === "all" || card.getAttribute("data-category") === filter;
        card.classList.toggle("filtered-out", !match);
      });
    });
  });

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
  };

  const modal = document.getElementById("project-modal");
  const modalTitle = modal?.querySelector(".modal-title");
  const modalTags = modal?.querySelector(".project_tags");
  const modalOverview = modal?.querySelector(".overview");
  const modalFeatures = modal?.querySelector(".features_list");
  const modalTech = modal?.querySelector(".tech_stack");
  const modalLinks = modal?.querySelector(".project_links");
  const modalMain = modal?.querySelector(".modal-media-main");
  const modalThumbs = modal?.querySelector(".modal-thumbs");

  function setMainMedia(item) {
    if (!modalMain) return;
    modalMain.innerHTML =
      item.type === "video"
        ? `<video src="${item.src}" autoplay loop muted playsinline controls></video>`
        : `<img src="${item.src}" alt="Project media" loading="lazy" />`;
  }

  function openProject(key) {
    const p = projectData[key];
    if (!p || !modal) return;
    modalTitle.textContent = p.title;
    modalTags.innerHTML = p.tags.map((t) => `<span>${t}</span>`).join("");
    modalOverview.textContent = p.overview;
    modalFeatures.innerHTML = p.features.map((f) => `<li>${f}</li>`).join("");
    modalTech.innerHTML = p.technologies.map((t) => `<span class="tech_item">${t}</span>`).join("");
    modalLinks.innerHTML = p.links
      .map((l) => `<a class="btn btn-sm ${l.primary ? "btn-primary" : "btn-ghost"}" href="${l.url}" target="_blank" rel="noopener">${l.title}</a>`)
      .join("");

    setMainMedia(p.media[0]);
    modalThumbs.innerHTML = p.media
      .map(
        (m, i) =>
          `<div class="modal-thumb ${i === 0 ? "active" : ""}" data-i="${i}">${
            m.type === "video" ? `<video src="${m.src}" muted></video>` : `<img src="${m.src}" alt="" />`
          }</div>`
      )
      .join("");
    modalThumbs.querySelectorAll(".modal-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        modalThumbs.querySelectorAll(".modal-thumb").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
        setMainMedia(p.media[+thumb.dataset.i]);
      });
    });

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeProject() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => (modalMain.innerHTML = ""), 300);
  }

  document.querySelectorAll("[data-project]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openProject(el.getAttribute("data-project"));
    });
  });
  modal?.querySelector(".modal-close")?.addEventListener("click", closeProject);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeProject();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("open")) closeProject();
  });
})();