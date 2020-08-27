const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./webpack.base");
const LoadablePlugin = require("@loadable/webpack-plugin");

const config = {
	//Tell webpack the root file
	entry: {
		main: "./client/index.js",
		admin: "./client/components/admin/index.js"
	},

	//output file
	output: {
		filename: "[name].[contenthash].bundle.js",
		path: path.resolve(__dirname, "public"),
		publicPath: "/"
	},

	optimization: {
		splitChunks: {
			chunks: "all",
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name(module) {
						//Declare which modules to separate
						const separateModules = ["lodash", "react", "datejs"];

						// get the name. E.g. node_modules/packageName/not/this/part.js
						// or node_modules/packageName
						const packageName = module.context.match(
							/[\\/]node_modules[\\/](.*?)([\\/]|$)/
						)[1];

						//By default, we just call it "bundles"
						let bundleName;
						if (separateModules.find(m => packageName == m)) {
							bundleName = packageName;
						} else {
							bundleName = "bundles";
						}

						// npm package names are URL-safe, but some servers don't like @ symbols
						return `npm.${bundleName.replace("@", "")}`;
					}
				}
			}
		}
	},

	plugins: [new LoadablePlugin()]
};
module.exports = merge(baseConfig, config);
