// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Contenu en français : les apostrophes dans le JSX sont volontaires.
      'react/no-unescaped-entities': 'off',
      // Imports multiples du même module : simple avertissement.
      'import/no-duplicates': 'warn',
      // Faux positifs sur axios.isAxiosError / i18n.use() (usages corrects).
      'import/no-named-as-default-member': 'off',
    },
  },
]);
