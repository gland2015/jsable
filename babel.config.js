module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: "umd",
        targets: {
          chrome: "92",
        },
      },
    ],
  ],
  plugins: [
    [
      "@babel/plugin-transform-typescript",
      { allowDeclareFields: true, isTSX: true, allExtensions: true },
    ],
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: false }],
  ],
};
