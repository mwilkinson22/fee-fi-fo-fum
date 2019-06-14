const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./webpack.base");

const config = {
	//Tell webpack the root file
	entry: "./client/index.js",

	//output file
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "public")
	},
	devtool: "source-map"
};
module.exports = merge(baseConfig, config);
