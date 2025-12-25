/* =========================================================
   app.js — main interactions (no frameworks)
   - nav active link
   - header on scroll
   - reveal on scroll
   - toast helper
   - to top button
   - mobile: progress bar + reveal + micro parallax
   - mobile: "hover-like" photo effect on first scroll down only
   ========================================================= */

(() => {
    "use strict";

    // -------------------------
    // Helpers
    // -------------------------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // -------------------------
    // Header: sticky shadow on scroll
    // -------------------------
    const header = $(".site-header");
    const onHeaderScroll = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onHeaderScroll, { passive: true });
    onHeaderScroll();

    // -------------------------
    // Mobile nav toggle
    // -------------------------
    const navToggle = $(".site-nav__toggle");
    const navList = $(".site-nav__list");

    if (navToggle && navList) {
        navToggle.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            navToggle.setAttribute("aria-expanded", String(!expanded));
            navList.classList.toggle("is-open", !expanded);
        });

        // close on link click (mobile)
        $$(".site-nav__link", navList).forEach((a) => {
            a.addEventListener("click", () => {
                navToggle.setAttribute("aria-expanded", "false");
                navList.classList.remove("is-open");
            });
        });
    }

    // -------------------------
    // Active nav link on scroll
    // -------------------------
    const sections = $$("section[id]");
    const navLinks = $$(".site-nav__link");

    if (sections.length && navLinks.length) {
        const setActive = () => {
            const y = window.scrollY + 120;
            let currentId = "";

            for (const s of sections) {
                const top = s.offsetTop;
                const height = s.offsetHeight;
                if (y >= top && y < top + height) {
                    currentId = s.id;
                    break;
                }
            }

            navLinks.forEach((a) => {
                const href = a.getAttribute("href") || "";
                const isActive = href === `#${currentId}`;
                a.classList.toggle("is-active", isActive);
            });
        };

        window.addEventListener("scroll", setActive, { passive: true });
        window.addEventListener("resize", setActive);
        setActive();
    }

    // -------------------------
    // Reveal on scroll
    // -------------------------
    const revealItems = $$(".js-reveal");

    if (revealItems.length) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add("is-visible");
                });
            },
            { threshold: 0.12 }
        );

        revealItems.forEach((el) => io.observe(el));
    }

    // -------------------------
    // Toast helper (click to close)
    // -------------------------
    const toast = $(".js-toast");
    if (toast) {
        toast.addEventListener("click", () => toast.classList.remove("is-show"));
    }

    // -------------------------
    // To top button
    // -------------------------
    const toTop = $(".js-to-top");
    if (toTop) {
        const onToTop = () => {
            toTop.classList.toggle("is-show", window.scrollY > 450);
        };
        window.addEventListener("scroll", onToTop, { passive: true });
        onToTop();

        toTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // -------------------------
    // Footer year
    // -------------------------
    const yearEl = $("#js-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // =========================
    // MOBILE / PORTRAIT effects
    // =========================
    (() => {
        const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        const isPortrait = window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;
        if (!isTouch || !isPortrait) return;

        // 1) scroll progress bar (CSS reads --m-progress)
        const setProgress = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY || doc.scrollTop || 0;
            const max = (doc.scrollHeight || 1) - (window.innerHeight || 1);
            const p = max > 0 ? (scrollTop / max) * 100 : 0;
            doc.style.setProperty("--m-progress", `${p.toFixed(2)}%`);
        };

        // 2) mobile reveal (use .m-reveal)
        const mobReveal = $$(".m-reveal");
        let mobIO = null;

        if (mobReveal.length) {
            mobIO = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        if (e.isIntersecting) e.target.classList.add("is-visible");
                    });
                },
                { threshold: 0.14 }
            );
            mobReveal.forEach((el) => mobIO.observe(el));
        }

        // 3) micro parallax vars for hero + media (CSS reads --m-hero, --m-media, --m-rot)
        const heroInner = $(".hero__inner");
        const medias = $$(".section__media");

        const setParallax = () => {
            const y = window.scrollY || 0;

            if (heroInner) {
                // gentle
                const v = Math.max(-12, Math.min(18, y * 0.03));
                document.documentElement.style.setProperty("--m-hero", `${v.toFixed(2)}px`);
            }

            // apply to each media block
            medias.forEach((m, idx) => {
                const r = m.getBoundingClientRect();
                const vh = window.innerHeight || 1;
                const t = (r.top + r.height * 0.5) / vh; // 0..1..2
                const offset = (0.5 - t) * 10; // px
                const rot = (0.5 - t) * (idx % 2 ? -1 : 1) * 2; // deg
                m.style.setProperty("--m-media", `${offset.toFixed(2)}px`);
                m.style.setProperty("--m-rot", `${rot.toFixed(2)}deg`);
            });
        };

        const onScroll = () => {
            setProgress();
            setParallax();
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();

    // =========================
    // Touch ripple (mobile only)
    // =========================
    (() => {
        const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        if (!isTouch) return;

        const targets = $$(".btn, .site-nav__link, .site-nav__toggle");
        if (!targets.length) return;

        const addRipple = (e) => {
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;

            const span = document.createElement("span");
            span.className = "tap-ripple";
            span.style.left = `${x}px`;
            span.style.top = `${y}px`;
            el.appendChild(span);

            span.addEventListener("animationend", () => span.remove());
        };

        targets.forEach((t) => t.addEventListener("touchstart", addRipple, { passive: true }));
    })();

    // =========================
    // Mobile photo "hover-like" on scroll (first visit)
    // =========================
    (() => {
        // только мобилка/тач + портрет
        const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        const isPortrait = window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;
        if (!isTouch || !isPortrait) return;

        const items = Array.from(document.querySelectorAll(".section__image-placeholder"));
        if (!items.length) return;

        // эффекты активны ТОЛЬКО на первом «проходе вниз» после загрузки страницы.
        // логика: пока пользователь скроллит вниз — показываем лёгкий hover-like.
        // как только он впервые начал скроллить ВВЕРХ (после того как уже пролистал вниз),
        // эффекты выключаются до перезагрузки.
        document.body.classList.add("is-first-visit");

        const clamp01 = (v) => Math.max(0, Math.min(1, v));

        const computePeek = (el) => {
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight || 1;

            const elCenter = r.top + r.height / 2;
            const viewCenter = vh / 2;

            const dist = Math.abs(elCenter - viewCenter);
            const norm = 1 - dist / (vh * 0.55); // зона действия
            return clamp01(norm);
        };

        let raf = 0;
        let disabled = false;

        // следим за направлением скролла
        let maxY = window.scrollY || 0;
        let armed = false; // «вооружаемся» после первого заметного скролла вниз

        const disable = () => {
            if (disabled) return;
            disabled = true;

            document.body.classList.remove("is-first-visit");
            for (const el of items) {
                el.style.setProperty("--m-peek", "0");
                el.style.setProperty("--par", "0.5");
            }


            window.removeEventListener("scroll", onScroll, { passive: true });
            window.removeEventListener("resize", onScroll);
        };

        const apply = () => {
            raf = 0;
            if (disabled) return;

            const vh = window.innerHeight || 1;

            for (const el of items) {
                const peek = computePeek(el);
                el.style.setProperty("--m-peek", peek.toFixed(3));

                // 1) Пока элемент "не зафиксирован" — даём ему лёгкий наклон/сдвиг от позиции
                if (!el.dataset.parLocked) {
                    const r = el.getBoundingClientRect();
                    const t = (r.top + r.height / 2) / vh;     // 0..1..2
                    const par = clamp01(t);                   // 0..1
                    el.style.setProperty("--par", par.toFixed(3));

                    // 2) Как только он достаточно "в зоне внимания" — фиксируем ровно (параллельно)
                    if (peek > 0.62) {
                        el.dataset.parLocked = "1";
                        el.style.setProperty("--par", "0.5");
                    }
                } else {
                    // уже зафиксирован — держим ровно
                    el.style.setProperty("--par", "0.5");
                }
            }
        };

        const onScroll = () => {
            if (disabled) return;

            const y = window.scrollY || 0;

            // вниз
            if (y >= maxY) {
                maxY = y;
                if (maxY > 120) armed = true; // порог, чтобы не срабатывало на микро-скролл
            } else {
                // вверх: если уже был проход вниз — выключаем эффекты
                if (armed && (maxY - y) > 10) {
                    disable();
                    return;
                }
            }

            if (raf) return;
            raf = requestAnimationFrame(apply);
        };

        // старт
        apply();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();
})();