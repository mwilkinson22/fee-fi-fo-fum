//Controllers
import * as locationController from "../../controllers/rugby/locationController";

//Middleware
import requireAdmin from "~/middlewares/requireAdmin";

module.exports = app => {
	//Getters
	app.get("/api/cities", locationController.getCities);
	app.get("/api/countries", locationController.getCountries);

	//Putters
	app.put("/api/countries/:_id", requireAdmin, locationController.updateCountry);

	//Post
	app.post("/api/countries", requireAdmin, locationController.createCountry);

	//Delete
	app.delete("/api/countries/:_id", requireAdmin, locationController.deleteCountry);
};
