const path = require("path");

module.exports = {
  entry: "./client/src/client.ts", // Your main TypeScript file
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "client/dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  mode: "development",
};
