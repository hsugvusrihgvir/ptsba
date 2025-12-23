/* assets/js/app.js */

(() => {
    const prefersReducedMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // ========= 0) Loader =========
    (() => {
        const loader = document.createElement("div");
        loader.className = "page-loader";
        loader.innerHTML = `
      <div class="page-loader__card">
        <div class="page-loader__ring" aria-hidden="true"></div>
        <div class="page-loader__title">Загрузка…</div>
        <div class="page-loader__sub">Поволжский центр беспилотной авиации</div>
      </div>
    `;

        document.documentElement.classList.add("is-loading");
        document.body.appendChild(loader);

        window.addEventListener("load", () => {
            document.documentElement.classList.remove("is-loading");
            document.documentElement.classList.add("is-loaded");
            loader.classList.add("is-hide");
            setTimeout(() => loader.remove(), 550);
        });
    })();

    // ========= 1) Year =========
    (() => {
        const el = $("#js-year");
        if (el) el.textContent = String(new Date().getFullYear());
    })();

    // ========= 2) Burger =========
    (() => {
        const toggle = $(".site-nav__toggle");
        const list = $(".site-nav__list");
        if (!toggle || !list) return;

        const closeMenu = () => {
            toggle.setAttribute("aria-expanded", "false");
            list.classList.remove("site-nav__list--open");
        };

        toggle.addEventListener("click", () => {
            const expanded = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!expanded));
            list.classList.toggle("site-nav__list--open");
        });

        list.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link) return;
            closeMenu();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });

        document.addEventListener("click", (e) => {
            if (!list.classList.contains("site-nav__list--open")) return;
            const inside = e.target.closest(".site-nav");
            if (!inside) closeMenu();
        });
    })();

    // ========= 3) Smooth anchors =========
    (() => {
        const links = $$('a[href^="#"]');
        links.forEach((a) => {
            a.addEventListener("click", (e) => {
                const href = a.getAttribute("href");
                if (!href || href === "#") return;

                const target = document.getElementById(href.slice(1));
                if (!target) return;

                e.preventDefault();

                const header = $(".site-header");
                const headerH = header ? header.getBoundingClientRect().height : 0;
                const top =
                    window.scrollY + target.getBoundingClientRect().top - headerH - 12;

                if (prefersReducedMotion) window.scrollTo(0, Math.max(0, top));
                else window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

                history.pushState(null, "", href);
            });
        });
    })();

    // ========= 4) Header shadow =========
    (() => {
        const header = $(".site-header");
        if (!header) return;

        const onScroll = () => {
            header.classList.toggle("site-header--scrolled", window.scrollY > 8);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    })();

    // ========= 5) Active nav =========
    (() => {
        const navLinks = $$(".site-nav__link").filter((a) =>
            a.getAttribute("href")?.startsWith("#")
        );
        if (!navLinks.length) return;

        const map = new Map();
        navLinks.forEach((a) => map.set(a.getAttribute("href").slice(1), a));

        const sections = Array.from(map.keys())
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        if (!sections.length) return;

        const setActive = (id) => {
            navLinks.forEach((a) => a.classList.remove("is-active"));
            map.get(id)?.classList.add("is-active");
        };

        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((x) => x.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible?.target?.id) setActive(visible.target.id);
            },
            { threshold: [0.25, 0.4, 0.6], rootMargin: "-10% 0px -60% 0px" }
        );

        sections.forEach((s) => obs.observe(s));

        const hash = (location.hash || "").slice(1);
        if (hash && map.has(hash)) setActive(hash);
    })();

    // ========= 6) Reveal =========
    (() => {
        if (prefersReducedMotion) return;

        const items = [
            ...$$(".section__content"),
            ...$$(".section__media"),
            ...$$(".card"),
            ...$$(".trust-block"),
            ...$$(".contact-form"),
        ];
        if (!items.length) return;

        items.forEach((el) => el.classList.add("js-reveal"));

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    e.target.classList.add("is-visible");
                    obs.unobserve(e.target);
                });
            },
            { threshold: 0.15 }
        );

        items.forEach((el) => obs.observe(el));
    })();

    // ========= 7) Parallax vars for hero + services + all photos =========
    (() => {
        if (prefersReducedMotion) return;

        const hero = $(".hero");

        // если есть — прям идеально:
        // <section ... data-parallax="services">
        const services =
            $('.section[data-parallax="services"]') || $(".section.section--light");

        const medias = $$(".section__media");

        const clamp01 = (v) => Math.max(0, Math.min(1, v));

        const computeT = (el) => {
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            return clamp01((vh - r.top) / (vh + r.height));
        };

        const applyVar = (el) => {
            if (!el) return;
            el.style.setProperty("--par", String(computeT(el)));
        };

        const onScroll = () => {
            applyVar(hero);
            applyVar(services);
            medias.forEach(applyVar);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();

    // ========= 8) Tilt: strong on photos, tiny on cards =========
// ========= 8) Tilt: strong on photos, tiny on cards (NO contact form) =========
    (() => {
        if (prefersReducedMotion) return;

        const photos = $$(".section__media");
        const cards = $$(".card, .trust-block");

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

        const isFormArea = (el) =>
            el.matches(".contact-form") ||
            el.closest(".contact-form") ||
            el.querySelector?.(".contact-form");

        const bindTilt = (el, cfg) => {
            if (isFormArea(el)) return;

            el.classList.add("tilt");
            let raf = 0;

            const onMove = (e) => {
                if (isFormArea(el)) return;

                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;

                const rx = clamp((0.5 - py) * cfg.rxMul, -cfg.rxMax, cfg.rxMax);
                const ry = clamp((px - 0.5) * cfg.ryMul, -cfg.ryMax, cfg.ryMax);

                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    el.style.transform = `perspective(${cfg.p}px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${cfg.ty}px)`;
                    el.style.setProperty("--tx", `${px * 100}%`);
                    el.style.setProperty("--ty", `${py * 100}%`);
                });
            };

            const onLeave = () => {
                el.style.transform = "";
            };

            el.addEventListener("pointermove", onMove);
            el.addEventListener("pointerleave", onLeave);
        };

        // Фото — заметнее
        photos.forEach((el) =>
            bindTilt(el, { p: 1200, rxMul: 8, ryMul: 10, rxMax: 6, ryMax: 7, ty: -2 })
        );

        // Карточки — очень слабо
        cards.forEach((el) =>
            bindTilt(el, { p: 900, rxMul: 2.6, ryMul: 2.8, rxMax: 1.8, ryMax: 2.0, ty: -1 })
        );
    })();

    // ========= 9) Mobile/Portrait only: scroll progress + tap ripple =========
    (() => {
        const portrait =
            window.matchMedia &&
            window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;

        if (!portrait) return;

        // 1) тонкий прогресс-бар прокрутки
        const bar = document.createElement("div");
        bar.className = "m-scrollbar";
        document.body.appendChild(bar);

        const onScroll = () => {
            const doc = document.documentElement;
            const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
            const p = (window.scrollY / max) * 100;
            document.documentElement.style.setProperty("--m-progress", `${p}%`);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        // 2) ripple на тап (кнопки + кнопки в хэдере)
        const addRipple = (el, e) => {
            const r = el.getBoundingClientRect();
            const size = Math.max(r.width, r.height) * 1.2;

            const ripple = document.createElement("span");
            ripple.className = "tap-ripple";
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - r.left - size / 2}px`;
            ripple.style.top = `${e.clientY - r.top - size / 2}px`;

            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 560);
        };

        const targets = document.querySelectorAll(".btn, .site-nav__link, .site-nav__toggle");
        targets.forEach((el) => {
            el.addEventListener("pointerdown", (e) => addRipple(el, e));
        });
    })();

    // ========= Mobile-only scroll effects (portrait) =========
    (() => {
        const prefersReducedMotion =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const isMobilePortrait =
            window.matchMedia &&
            window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;

        if (prefersReducedMotion || !isMobilePortrait) return;

        const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

        // 1) progress bar
        const bar = document.createElement("div");
        bar.className = "m-scrollbar";
        document.body.appendChild(bar);

        const setProgress = () => {
            const doc = document.documentElement;
            const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
            const p = (window.scrollY / max) * 100;
            doc.style.setProperty("--m-progress", `${p}%`);
        };

        // 2) mobile reveal (ненавязчиво)
        const revealEls = [
            ...$$(".section__inner"),
            ...$$(".card"),
            ...$$(".trust-block"),
            ...$$(".contact-form"),
        ];

        revealEls.forEach((el) => el.classList.add("m-reveal"));

        const ro = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    e.target.classList.add("is-visible");
                    ro.unobserve(e.target);
                });
            },
            { threshold: 0.18 }
        );
        revealEls.forEach((el) => ro.observe(el));

        // 3) micro parallax (hero + photos) based on scroll position
        const heroInner = document.querySelector(".hero__inner");
        const medias = $$(".section__media");

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

        const microParallax = () => {
            // hero чуть “дышит” вверх/вниз
            if (heroInner) {
                const h = heroInner.getBoundingClientRect();
                const t = clamp((window.innerHeight - h.top) / (window.innerHeight + h.height), 0, 1);
                // от +6px до -6px
                const y = (0.5 - t) * 12;
                document.documentElement.style.setProperty("--m-hero", `${y.toFixed(2)}px`);
            }

            // фотки: очень лёгкий подъём + едва заметный поворот
            medias.forEach((el) => {
                const r = el.getBoundingClientRect();
                const t = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
                const y = (0.5 - t) * 10;      // до ~10px
                const rot = (t - 0.5) * 1.2;   // до ~0.6deg
                el.style.setProperty("--m-media", `${y.toFixed(2)}px`);
                el.style.setProperty("--m-rot", `${rot.toFixed(3)}deg`);
            });
        };

        // один общий scroll handler
        const onScroll = () => {
            setProgress();
            microParallax();
        };

        setProgress();
        microParallax();

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();
})();