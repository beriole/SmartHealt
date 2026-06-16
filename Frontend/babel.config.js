module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Requis par zod v4 (syntaxe `export * as ns from`).
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
  ],
};
