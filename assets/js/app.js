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
    // Header shadow
    // -------------------------
    const header = $(".site-header");
    const syncHeader = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", syncHeader, { passive: true });
    syncHeader();

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
    // Active nav link
    // -------------------------
    (() => {
        const navLinks = $$(".site-nav__link");
        if (!navLinks.length) return;

        const cleanPath = (pathname) => {
            // "/site/" => "/site/index.html"
            if (pathname.endsWith("/")) return pathname + "index.html";
            return pathname;
        };

        const pagePath = cleanPath(window.location.pathname);

        const isHome = () =>
            pagePath.endsWith("/index.html") || pagePath === "index.html";

        const markLink = (a, on) => {
            a.classList.toggle("is-active", on);
            const li = a.closest(".site-nav__item");
            if (li) li.classList.toggle("is-active", on);
        };

        const clearActive = () => {
            navLinks.forEach((a) => markLink(a, false));
        };

        // Anchors in nav
        const hashes = navLinks
            .map((a) => (a.getAttribute("href") || "").trim())
            .filter((h) => h.startsWith("#"));

        const sections = hashes
            .map((h) => document.getElementById(h.slice(1)))
            .filter(Boolean);

        const markHash = (href) => {
            clearActive();
            navLinks.forEach((a) => {
                const h = (a.getAttribute("href") || "").trim();
                if (h === href) markLink(a, true);
            });
        };

        const markPage = () => {
            clearActive();

            navLinks.forEach((a) => {
                const href = (a.getAttribute("href") || "").trim();
                if (!href || href.startsWith("#")) return;

                let url;
                try {
                    url = new URL(href, window.location.href);
                } catch {
                    return;
                }

                const targetPath = cleanPath(url.pathname);
                if (targetPath === pagePath) {
                    markLink(a, true);
                }
            });
        };

        let sectionBounds = [];

        const readSections = () => {
            sectionBounds = sections.map((el) => ({
                id: el.id,
                top: el.offsetTop,
                bottom: el.offsetTop + (el.offsetHeight || 1),
            }));
        };

        const markOnScroll = () => {
            if (!isHome()) return;

            // Если якорей нет, подсвечиваем текущую страницу.
            if (!sections.length) {
                markPage();
                return;
            }

            const y = window.scrollY + 140;
            let activeId = "";

            for (const item of sectionBounds) {
                if (y >= item.top && y < item.bottom) {
                    activeId = item.id;
                    break;
                }
            }

            if (activeId) {
                markHash(`#${activeId}`);
            } else {
                markPage();
            }
        };

        const markByHash = () => {
            if (!isHome()) return;

            const hash = window.location.hash || "";
            if (!hash) return;

            if (hashes.includes(hash)) {
                markHash(hash);
            }
        };

        const syncNav = () => {
            readSections();

            if (isHome()) {
                // Если открыли сразу с hash, подсветим его.
                if (window.location.hash) markByHash();

                // Дальше поддерживаем подсветку по скроллу.
                markOnScroll();
            } else {
                markPage();
            }
        };

        window.addEventListener("hashchange", () => {
            markByHash();
            markOnScroll();
        });

        let navRaf = 0;
        const queueNav = () => {
            if (navRaf) return;
            navRaf = requestAnimationFrame(() => {
                navRaf = 0;
                markOnScroll();
            });
        };

        window.addEventListener("scroll", queueNav, { passive: true });
        window.addEventListener("resize", syncNav);
        window.addEventListener("load", syncNav);

        syncNav();
    })();

    // -------------------------
    // Reveal on scroll
    // -------------------------
    const reveals = $$(".js-reveal");

    if (reveals.length) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add("is-visible");
                });
            },
            { threshold: 0.12 }
        );

        reveals.forEach((el) => io.observe(el));
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
    const year = $("#js-year");
    if (year) year.textContent = String(new Date().getFullYear());

    // -------------------------
    // Reviews slider
    // -------------------------
    (() => {
        const box = $("[data-reviews]");
        if (!box) return;

        const track = $("[data-reviews-track]", box);
        const prev = $("[data-reviews-prev]", box);
        const next = $("[data-reviews-next]", box);
        const count = $("[data-reviews-count]", box);
        const dots = $("[data-reviews-dots]", box);
        const cards = track ? $$(".review-card", track) : [];

        if (!track || cards.length < 2 || !prev || !next) return;

        let index = 0;

        const dotBtns = cards.map((_, i) => {
            const dot = document.createElement("button");
            dot.className = "reviews-dot";
            dot.type = "button";
            dot.setAttribute("aria-label", `Показать отзыв ${i + 1}`);
            dot.addEventListener("click", () => go(i));
            if (dots) dots.append(dot);
            return dot;
        });

        const go = (to) => {
            index = (to + cards.length) % cards.length;
            track.style.transform = `translateX(${-index * 100}%)`;

            cards.forEach((card, i) => {
                card.setAttribute("aria-hidden", String(i !== index));
            });

            dotBtns.forEach((dot, i) => {
                dot.classList.toggle("is-active", i === index);
            });

            if (count) count.textContent = `${index + 1} / ${cards.length}`;
        };

        prev.addEventListener("click", () => go(index - 1));
        next.addEventListener("click", () => go(index + 1));

        go(0);
    })();

    // =========================
    // MOBILE / PORTRAIT effects
    // =========================
    (() => {
        const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        const portrait = window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;
        if (!touch || !portrait) return;

        // Mobile scroll progress
        const setBar = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY || doc.scrollTop || 0;
            const max = (doc.scrollHeight || 1) - (window.innerHeight || 1);
            const p = max > 0 ? (scrollTop / max) * 100 : 0;
            doc.style.setProperty("--m-progress", `${p.toFixed(2)}%`);
        };

        // Mobile reveal
        const mobileReveals = $$(".m-reveal");
        let mobileIO = null;

        if (mobileReveals.length) {
            mobileIO = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        if (e.isIntersecting) e.target.classList.add("is-visible");
                    });
                },
                { threshold: 0.14 }
            );
            mobileReveals.forEach((el) => mobileIO.observe(el));
        }

        // Light mobile motion
        const hero = $(".hero__inner");
        const media = $$(".section__media");

        const setMotion = () => {
            const y = window.scrollY || 0;

            if (hero) {
                const v = Math.max(-12, Math.min(18, y * 0.03));
                document.documentElement.style.setProperty("--m-hero", `${v.toFixed(2)}px`);
            }

            media.forEach((el, idx) => {
                const r = el.getBoundingClientRect();
                const vh = window.innerHeight || 1;
                const t = (r.top + r.height * 0.5) / vh;
                const offset = (0.5 - t) * 10;
                const rot = (0.5 - t) * (idx % 2 ? -1 : 1) * 2;
                el.style.setProperty("--m-media", `${offset.toFixed(2)}px`);
                el.style.setProperty("--m-rot", `${rot.toFixed(2)}deg`);
            });
        };

        const onScroll = () => {
            setBar();
            setMotion();
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();

    // =========================
    // Touch ripple (mobile only)
    // =========================
    (() => {
        const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        if (!touch) return;

        const targets = $$(".btn, .site-nav__link, .site-nav__toggle");
        if (!targets.length) return;

        const addRipple = (e) => {
            const el = e.currentTarget;
            const box = el.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - box.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - box.top;

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
        const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        const portrait = window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;
        if (!touch || !portrait) return;

        const items = Array.from(document.querySelectorAll(".section__image-placeholder"));
        if (!items.length) return;

        document.body.classList.add("is-first-visit");

        const clamp = (v) => Math.max(0, Math.min(1, v));

        const peekFor = (el) => {
            const box = el.getBoundingClientRect();
            const vh = window.innerHeight || 1;

            const elCenter = box.top + box.height / 2;
            const viewCenter = vh / 2;

            const dist = Math.abs(elCenter - viewCenter);
            const norm = 1 - dist / (vh * 0.55);
            return clamp(norm);
        };

        let raf = 0;
        let disabled = false;

        let maxY = window.scrollY || 0;
        let armed = false;

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
                const peek = peekFor(el);
                el.style.setProperty("--m-peek", peek.toFixed(3));

                if (!el.dataset.parLocked) {
                    const box = el.getBoundingClientRect();
                    const t = (box.top + box.height / 2) / vh;
                    const par = clamp(t);
                    el.style.setProperty("--par", par.toFixed(3));

                    if (peek > 0.62) {
                        el.dataset.parLocked = "1";
                        el.style.setProperty("--par", "0.5");
                    }
                } else {
                    el.style.setProperty("--par", "0.5");
                }
            }
        };

        const onScroll = () => {
            if (disabled) return;

            const y = window.scrollY || 0;

            if (y >= maxY) {
                maxY = y;
                if (maxY > 120) armed = true;
            } else {
                if (armed && (maxY - y) > 10) {
                    disable();
                    return;
                }
            }

            if (raf) return;
            raf = requestAnimationFrame(apply);
        };

        apply();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();
})();
