if ("serviceWorker" in navigator) {
    let hasTriggeredRefresh = false;

    const BANNER_ID = "swUpdateBanner";

    function buildUpdateBanner(onUpdateClick) {
        let banner = document.getElementById(BANNER_ID);
        if (banner) {
            return banner;
        }

        banner = document.createElement("aside");
        banner.id = BANNER_ID;
        banner.className = "update-banner";
        banner.setAttribute("role", "status");
        banner.setAttribute("aria-live", "polite");
        banner.setAttribute("aria-atomic", "true");

        const text = document.createElement("p");
        text.className = "update-banner-text";
        text.textContent = "A newer version is available.";

        const actions = document.createElement("div");
        actions.className = "update-banner-actions";

        const updateButton = document.createElement("button");
        updateButton.type = "button";
        updateButton.className = "update-banner-btn";
        updateButton.textContent = "Update now";
        updateButton.addEventListener("click", onUpdateClick);

        const dismissButton = document.createElement("button");
        dismissButton.type = "button";
        dismissButton.className = "update-banner-btn update-banner-btn-secondary";
        dismissButton.textContent = "Later";
        dismissButton.addEventListener("click", () => {
            banner.classList.remove("is-visible");
        });

        actions.appendChild(updateButton);
        actions.appendChild(dismissButton);

        banner.appendChild(text);
        banner.appendChild(actions);

        document.body.appendChild(banner);
        return banner;
    }

    function showUpdateBanner(registration) {
        if (!registration || !registration.waiting) {
            return;
        }

        const banner = buildUpdateBanner(() => {
            const waitingWorker = registration.waiting;
            if (!waitingWorker) {
                window.location.reload();
                return;
            }
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
        });

        banner.classList.add("is-visible");
    }

    function watchRegistration(registration) {
        if (!registration) {
            return;
        }

        // Poll for updates while the app remains open so users are notified sooner.
        window.setInterval(() => {
            registration.update();
        }, 30 * 60 * 1000);

        if (registration.waiting && navigator.serviceWorker.controller) {
            showUpdateBanner(registration);
        }

        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) {
                return;
            }

            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    showUpdateBanner(registration);
                }
            });
        });
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hasTriggeredRefresh) {
            return;
        }
        hasTriggeredRefresh = true;
        window.location.reload();
    });

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then((registration) => {
                watchRegistration(registration);
            })
            .catch((err) => {
                console.error("Service worker registration failed", err);
            });
    });
}
