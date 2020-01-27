module.exports = {
    "plugins": [
        "@babel/proposal-class-properties",
    ],
    "presets": [
        [
            "@babel/env", {
                "targets": {
                    "node": "current",
                },
                "modules": "commonjs",
            },
        ],
        "@babel/typescript",
    ]
}