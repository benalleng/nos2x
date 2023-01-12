#!/usr/bin/env node

const esbuild = require('esbuild')
const {sassPlugin} = require('esbuild-sass-plugin')
const {copy} = require('esbuild-plugin-copy')

const prod = process.argv.indexOf('prod') !== -1

esbuild
  .build({
    bundle: true,
    entryPoints: {
      background: './src/background.js',
      'content-script': './src/content-script.js',
      common: './src/common.js',
      'nostr-provider': './src/nostr-provider.js',
      popup: './src/popup.jsx',
      prompt: './src/prompt.jsx',
      options: './src/options.jsx',
      // styles
      style: './src/style.scss'
    },
    outdir: './dist',
    loader: {
      ['.png']: 'dataurl',
      ['.svg']: 'text',
      ['.ttf']: 'file'
    },
    plugins: [
      sassPlugin(),
      copy({
        assets: [
          {
            from: ['./src/*.html', './src/manifest.json'],
            to: ['./']
          },
          {
            from: ['./src/assets/icons/*'],
            to: ['./assets/icons']
          }
        ]
      })
    ],
    sourcemap: prod ? false : 'inline',
    define: {
      window: 'self',
      global: 'self'
    }
  })
  .then(() => console.log('Build success.'))
  .catch(err => console.error('Build error.', err))
