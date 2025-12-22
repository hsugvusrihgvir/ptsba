/* assets/js/app.js */

(() => {
    const prefersReducedMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // ========= 0) Loader (интро при загрузке) =========
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

    // ========= 1) Год в футере =========
    (() => {
        const el = $("#js-year");
        if (el) el.textContent = String(new Date().getFullYear());
    })();

    // ========= 2) Бургер =========
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

    // ========= 3) Плавный скролл =========
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

    // ========= 4) Хедер при скролле =========
    (() => {
        const header = $(".site-header");
        if (!header) return;

        const onScroll = () => {
            header.classList.toggle("site-header--scrolled", window.scrollY > 8);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    })();

    // ========= 5) Активный пункт меню по секциям =========
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

    // ========= 7) Параллакс по скроллу: hero + “Чем мы занимаемся” =========
    (() => {
        if (prefersReducedMotion) return;

        const hero = $(".hero");

        // Секция "Чем мы занимаемся":
        // 1) если ты добавила data-parallax="services" — возьмём её
        // 2) иначе fallback: первая .section.section--light
        const services =
            $('.section[data-parallax="services"]') || $(".section.section--light");

        const clamp01 = (v) => Math.max(0, Math.min(1, v));

        const apply = (el) => {
            if (!el) return;
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const t = clamp01((vh - r.top) / (vh + r.height));
            el.style.setProperty("--par", String(t));
        };

        const onScroll = () => {
            apply(hero);
            apply(services);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    })();

    // ========= 8) Tilt + shine на фотках и карточках =========
    (() => {
        if (prefersReducedMotion) return;

        const targets = $$(".card, .trust-block, .section__media");
        if (!targets.length) return;

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

        targets.forEach((el) => {
            el.classList.add("tilt");

            let raf = 0;

            const onMove = (e) => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;

                const rx = clamp((0.5 - py) * 9, -7, 7);
                const ry = clamp((px - 0.5) * 11, -9, 9);

                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
                    el.style.setProperty("--tx", `${px * 100}%`);
                    el.style.setProperty("--ty", `${py * 100}%`);
                });
            };

            const onLeave = () => {
                el.style.transform = "";
            };

            el.addEventListener("pointermove", onMove);
            el.addEventListener("pointerleave", onLeave);
        });
    })();
})();
