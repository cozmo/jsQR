module.exports = {
  entry: {
    './dist/jsQR.js': './src/index.ts',
    './docs/jsQR.js': './src/index.ts',
  },
  output: {
    filename: '[name]',
    libraryTarget: 'umd',
    libraryExport: "default",
    library: "jsQR",
  },
  resolve: {
    extensions: [".ts"]
  },
  module: {
    rules: [
      { test: /\.ts$/, use: [{ loader: "awesome-typescript-loader" }] }
    ]
  }
}
