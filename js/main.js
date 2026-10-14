(() => {
    // Header com fundo ao rolar
    const header = document.getElementById("header");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Menu mobile
    const toggle = document.getElementById("menuToggle");
    const nav = document.getElementById("nav");
    const setMenu = (open) => {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

    // Rolagem para âncoras: corrige o destino se a página crescer durante o
    // scroll (imagens lazy da galeria carregam no caminho e empurram o conteúdo)
    let stopFollow = null;
    document.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        history.pushState(null, "", link.getAttribute("href"));

        if (stopFollow) stopFollow();
        const scrollTo = () => target.scrollIntoView({ behavior: "smooth", block: "start" });
        scrollTo();

        const ro = new ResizeObserver(scrollTo);
        ro.observe(document.body);
        const cancel = () => stopFollow && stopFollow();
        const timer = setTimeout(cancel, 2500);
        window.addEventListener("wheel", cancel, { passive: true, once: true });
        window.addEventListener("touchstart", cancel, { passive: true, once: true });
        stopFollow = () => {
            ro.disconnect();
            clearTimeout(timer);
            window.removeEventListener("wheel", cancel);
            window.removeEventListener("touchstart", cancel);
            stopFollow = null;
        };
    });

    // Animação de entrada
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        revealEls.forEach((el, i) => {
            el.style.transitionDelay = `${(i % 4) * 80}ms`;
            io.observe(el);
        });
    } else {
        revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    // Fallback para fotos que não carregarem
    document.querySelectorAll(".barber__photo img, .gallery__item img").forEach((img) => {
        img.addEventListener("error", () => {
            const parent = img.parentElement;
            img.remove();
            parent.classList.add("img-fallback");
        }, { once: true });
    });

    // Lightbox
    const lightbox = document.getElementById("lightbox");
    const lbImg = document.getElementById("lbImg");
    const lbCaption = document.getElementById("lbCaption");
    let current = 0;

    const items = () => [...document.querySelectorAll(".gallery__item img")];

    const show = (index) => {
        const list = items();
        if (!list.length) return;
        current = (index + list.length) % list.length;
        const img = list[current];
        lbImg.src = img.currentSrc.replace(/w=\d+/, "w=1600");
        lbImg.alt = img.alt;
        lbCaption.textContent = img.alt;
    };

    const open = (index) => {
        show(index);
        lightbox.hidden = false;
        requestAnimationFrame(() => lightbox.classList.add("is-open"));
        document.body.style.overflow = "hidden";
        document.getElementById("lbClose").focus();
    };

    const close = () => {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
        setTimeout(() => { lightbox.hidden = true; }, 300);
    };

    document.getElementById("gallery").addEventListener("click", (e) => {
        const img = e.target.closest(".gallery__item")?.querySelector("img");
        if (img) open(items().indexOf(img));
    });

    document.getElementById("lbClose").addEventListener("click", close);
    document.getElementById("lbPrev").addEventListener("click", () => show(current - 1));
    document.getElementById("lbNext").addEventListener("click", () => show(current + 1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });

    document.addEventListener("keydown", (e) => {
        if (lightbox.hidden) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(current - 1);
        if (e.key === "ArrowRight") show(current + 1);
    });

    // Swipe no mobile
    let touchX = null;
    lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
        touchX = null;
    });

    document.getElementById("year").textContent = new Date().getFullYear();
})();
