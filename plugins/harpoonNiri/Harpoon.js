if (typeof Qt !== "undefined" && Qt.include) {
    Qt.include("WindowCatalog.js");
    Qt.include("WindowLabel.js");
    Qt.include("HarpoonState.js");
    Qt.include("HarpoonCommands.js");
}

if (typeof require !== "undefined") {
    var HarpoonStateExports = require("./HarpoonState.js");
    var WindowCatalogExports = require("./WindowCatalog.js");
    var WindowLabelExports = require("./WindowLabel.js");
    var HarpoonCommandsExports = require("./HarpoonCommands.js");

    module.exports = Object.assign(
        {},
        HarpoonStateExports,
        WindowCatalogExports,
        WindowLabelExports,
        HarpoonCommandsExports
    );
}
