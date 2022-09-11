'use strict';

module.exports = {
  '*.{js,jsx,ts,tsx,md,json}': 'prettier --write --ignore-unknown',
  '*.ts': 'eslint --fix --ext .ts .',
};
