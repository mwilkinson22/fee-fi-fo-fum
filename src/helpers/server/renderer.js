import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { renderRoutes } from "react-router-config";
import serialize from "serialize-javascript";
import { Helmet } from "react-helmet";
import Routes from "../../client/Routes";
import path from "path";
import { ChunkExtractor } from "@loadable/server";

export default (req, store, context) => {
	const statsFile = path.resolve("./dist/public/loadable-stats.json");
	const chunkExtractor = new ChunkExtractor({ statsFile });
	const googleFontUrl =
		"https://fonts.googleapis.com/css?family=Montserrat:400,700|Titillium+Web:400,600";
	const app = chunkExtractor.collectChunks(
		<Provider store={store}>
			<StaticRouter location={req.path} context={context}>
				<div>{renderRoutes(Routes)}</div>
			</StaticRouter>
		</Provider>
	);
	const content = renderToString(app);

	const helmet = Helmet.renderStatic();
	return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
   				<link rel="preload" as="stylesheet" href="${googleFontUrl}">
    			<meta name="viewport" content="width=device-width, initial-scale=1.0">
    			<meta name="theme-color" content="#751432">
				<link rel="stylesheet" type="text/css" href="/styles.css" />
				${helmet.title.toString()}
				${helmet.meta.toString()}
			</head>
			<body>
				<div id="root">${content}</div>
				<script id="initial-state-script">window.INITIAL_STATE = ${serialize(store.getState())}</script>
				${chunkExtractor.getScriptTags()}
   				<link href="${googleFontUrl}" rel="stylesheet">
			</body>
		</html>
	`;
};
