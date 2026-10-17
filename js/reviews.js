// Avaliações do Google — busca direto do perfil da barbearia via Places API (New)
(() => {
    const cfg = window.SITE_CONFIG || {};
    const root = document.getElementById("reviews");
    if (!root) return;

    const summary = root.querySelector(".reviews__summary");
    const list = root.querySelector(".reviews__list");
    const heroRating = document.getElementById("heroRating");
    const PLACE_ID_KEY = "tb_place_id";
    const mapsSearchUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(cfg.placeQuery || "Barbearia Two Brothers");

    const stars = (rating) => {
        const wrap = document.createElement("span");
        wrap.className = "stars";
        wrap.setAttribute("aria-label", `${rating.toFixed(1).replace(".", ",")} de 5 estrelas`);
        wrap.style.setProperty("--rating", rating);
        wrap.textContent = "★★★★★";
        return wrap;
    };

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    };

    const showFallback = () => {
        root.classList.add("is-fallback");
        summary.replaceChildren(
            el("p", "reviews__fallback-text", "Veja o que nossos clientes falam da Two Brothers no Google."),
            Object.assign(el("a", "btn btn--outline", "Ver avaliações no Google"), {
                href: mapsSearchUrl, target: "_blank", rel: "noopener",
            })
        );
        list.remove();
    };

    const render = (place) => {
        const rating = place.rating || 0;
        const total = place.userRatingCount || 0;
        const mapsUrl = place.googleMapsURI || mapsSearchUrl;
        const writeUrl = `https://search.google.com/local/writereview?placeid=${place.id}`;

        if (heroRating && rating) heroRating.textContent = rating.toFixed(1).replace(".", ",") + "★";

        const score = el("div", "reviews__score");
        score.append(
            el("strong", null, rating.toFixed(1).replace(".", ",")),
            stars(rating),
            el("span", null, `${total.toLocaleString("pt-BR")} avaliações no Google`)
        );

        const actions = el("div", "reviews__actions");
        actions.append(
            Object.assign(el("a", "btn btn--outline btn--sm", "Ver todas"), { href: mapsUrl, target: "_blank", rel: "noopener" }),
            Object.assign(el("a", "btn btn--gold btn--sm", "Avaliar no Google"), { href: writeUrl, target: "_blank", rel: "noopener" })
        );
        summary.replaceChildren(score, actions);

        const reviews = (place.reviews || []).filter((r) => r.text);
        if (!reviews.length) { list.remove(); return; }

        list.replaceChildren(...reviews.map((r) => {
            const author = r.authorAttribution || {};
            const card = el("article", "review");

            const head = el("header", "review__head");
            const avatar = el("img", "review__avatar");
            avatar.src = author.photoURI || "assets/icon-180.png";
            avatar.alt = "";
            avatar.loading = "lazy";
            avatar.referrerPolicy = "no-referrer";

            const who = el("div");
            const name = author.uri
                ? Object.assign(el("a", "review__name", author.displayName), { href: author.uri, target: "_blank", rel: "noopener" })
                : el("span", "review__name", author.displayName || "Cliente Google");
            who.append(name, el("span", "review__time", r.relativePublishTimeDescription || ""));
            head.append(avatar, who);

            const text = el("p", "review__text", r.text);
            card.append(head, stars(r.rating || 5), text);

            // "Ler mais" só aparece se o texto foi cortado
            requestAnimationFrame(() => {
                if (text.scrollHeight > text.clientHeight + 2) {
                    const more = el("button", "review__more", "Ler mais");
                    more.type = "button";
                    more.addEventListener("click", () => {
                        const open = card.classList.toggle("is-expanded");
                        more.textContent = open ? "Ler menos" : "Ler mais";
                    });
                    card.append(more);
                }
            });
            return card;
        }));
    };

    // Loader oficial da Google Maps JavaScript API (carregamento dinâmico de bibliotecas)
    const loadMaps = (key) => {
        ((g) => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({ key, v: "weekly", language: "pt-BR", region: "BR" });
    };

    const storage = {
        get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
        set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
    };

    const load = async () => {
        if (!cfg.googleMapsApiKey) { showFallback(); return; }
        try {
            loadMaps(cfg.googleMapsApiKey);
            const { Place } = await google.maps.importLibrary("places");

            // O Place ID pode ser guardado; o restante do conteúdo é sempre buscado ao vivo
            let id = cfg.placeId || storage.get(PLACE_ID_KEY);
            if (!id) {
                const { places } = await Place.searchByText({ textQuery: cfg.placeQuery, fields: ["id"], maxResultCount: 1 });
                id = places?.[0]?.id;
                if (!id) throw new Error("Perfil não encontrado para: " + cfg.placeQuery);
                storage.set(PLACE_ID_KEY, id);
            }

            const place = new Place({ id, requestedLanguage: "pt-BR" });
            await place.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] });
            render(place);
        } catch (err) {
            console.error("[Avaliações Google]", err);
            showFallback();
        }
    };

    // Só busca quando a seção está perto de aparecer — economiza requisições da API
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
        }, { rootMargin: "800px 0px" });
        io.observe(root);
    } else {
        load();
    }
})();
