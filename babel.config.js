export default {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: false,
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
