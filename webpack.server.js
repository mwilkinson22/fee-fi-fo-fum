const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./webpack.base");
const webpackNodeExternals = require("webpack-node-externals");

const config = {
	// Inform webpack we're building a node bundle
	target: "node",

	//Tell webpack the root file
	entry: "./src/index.js",

	//output file
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist", "build")
	},

	externals: [webpackNodeExternals()]
};

module.exports = merge(baseConfig, config);
