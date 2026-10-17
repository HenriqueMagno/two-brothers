// Google Analytics 4 com Consent Mode v2 + aviso de cookies (LGPD)
(() => {
    const id = (window.SITE_CONFIG || {}).gaMeasurementId;
    const banner = document.getElementById("cookieBanner");
    if (!id) { banner?.remove(); return; }

    const CONSENT_KEY = "tb_cookie_consent";
    const storage = {
        get: () => { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } },
        set: (v) => { try { localStorage.setItem(CONSENT_KEY, v); } catch { /* sem storage */ } },
    };

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    // Por padrão nada é gravado até o visitante aceitar
    gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        wait_for_update: 500,
    });

    const saved = storage.get();
    if (saved === "granted") gtag("consent", "update", { analytics_storage: "granted" });

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.append(s);
    gtag("js", new Date());
    gtag("config", id);

    // Aviso de cookies
    if (banner) {
        if (saved) {
            banner.remove();
        } else {
            banner.hidden = false;
            const answer = (value) => {
                storage.set(value);
                gtag("consent", "update", { analytics_storage: value });
                banner.remove();
            };
            banner.querySelector("[data-consent=accept]").addEventListener("click", () => answer("granted"));
            banner.querySelector("[data-consent=reject]").addEventListener("click", () => answer("denied"));
        }
    }

    // Eventos de conversão
    document.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        const href = link.getAttribute("href") || "";
        const label = link.textContent.trim();

        if (href.includes("wa.me")) {
            gtag("event", "generate_lead", { method: "whatsapp", link_text: label });
        } else if (link.closest(".plan")) {
            gtag("event", "select_plan", { plan_name: link.closest(".plan").querySelector(".plan__name")?.textContent });
        } else if (href.includes("instagram.com")) {
            gtag("event", "click_instagram", { link_url: href });
        } else if (href.includes("writereview")) {
            gtag("event", "click_write_review");
        }
    });
})();
