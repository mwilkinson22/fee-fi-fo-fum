//Controllers
import * as sponsorController from "../../controllers/rugby/sponsorController";

//Middleware & Utils
import requireAdmin from "../../middlewares/requireAdmin";

export default app => {
	app.get("/api/sponsors", requireAdmin, sponsorController.getSponsors);

	app.put("/api/sponsors/:_id", requireAdmin, sponsorController.updateSponsor);

	app.post("/api/sponsors/", requireAdmin, sponsorController.createSponsor);

	app.delete("/api/sponsors/:_id", requireAdmin, sponsorController.deleteSponsor);
};
