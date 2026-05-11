function labelFor(window) {
    return {
        appId: window.app_id || "unknown",
        title: window.title || ""
    };
}

function labelText(label) {
    if (!label)
        return "unknown";
    const displayTitle = label.customDisplayName && label.customDisplayName.length > 0 ? label.customDisplayName : label.title;
    if (displayTitle && displayTitle.length > 0)
        return `${label.appId} — ${displayTitle}`;
    return label.appId || "unknown";
}

if (typeof module !== "undefined") {
    module.exports = { labelFor, labelText };
}
