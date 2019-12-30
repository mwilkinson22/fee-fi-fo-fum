import * as oAuthController from "../controllers/oAuthController";

export default app => {
	app.get("/api/oauth/authorisedAccounts/", oAuthController.getAuthorisedAccounts);
	app.get("/api/oauth/:service/authorise/", oAuthController.authoriseService);
	app.get("/api/oauth/:service/callback/", oAuthController.callback);
	app.get("/api/oauth/:service/disconnect/", oAuthController.disconnect);
};
