import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { renderRoutes } from "react-router-config";
import serialize from "serialize-javascript";
import { Helmet } from "react-helmet";
import Routes from "../client/Routes";

export default (req, store, context) => {
	const content = renderToString(
		<Provider store={store}>
			<StaticRouter location={req.path} context={context}>
				<div>{renderRoutes(Routes)}</div>
			</StaticRouter>
		</Provider>
	);

	const helmet = Helmet.renderStatic();
	return `
		<html>
			<head>
				<meta charset="utf-8">
   				<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700|Titillium+Web:200,400,600,700" rel="stylesheet">
    			<meta name="viewport" content="width=device-width, initial-scale=1.0">
    			<meta name="theme-color" content="#751432">
				<link rel="stylesheet" type="text/css" href="/styles.css" />
				${helmet.title.toString()}
				${helmet.meta.toString()}
			</head>
			<body>
				<div id="root">${content}</div>
				<script>window.INITIAL_STATE = ${serialize(store.getState())}</script>
				<script src="/bundle.js"></script>
			</body>
		</html>
	`;
};
