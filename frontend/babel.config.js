module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
  ],
  plugins: [
    [
      'transform-vite-meta-env',
      {
        env: {
          VITE_API_BASE: '' // You can set a default or use process.env.VITE_API_BASE
        }
      }
    ]
  ]
};
