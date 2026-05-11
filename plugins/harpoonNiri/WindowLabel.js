function labelFor(window) {
    return {
        appId: window.app_id || "unknown",
        title: window.title || ""
    };
}

function labelText(label) {
    if (!label)
        return "unknown";
    if (label.title && label.title.length > 0)
        return `${label.appId} — ${label.title}`;
    return label.appId || "unknown";
}

if (typeof module !== "undefined") {
    module.exports = { labelFor, labelText };
}
