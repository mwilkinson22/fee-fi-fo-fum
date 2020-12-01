//Controllers
import * as locationController from "../../controllers/rugby/locationController";

//Middleware
import requireAdmin from "~/middlewares/requireAdmin";

export default app => {
	//Getters
	app.get("/api/cities", locationController.getCities);
	app.get("/api/countries", locationController.getCountries);

	//Putters
	app.put("/api/cities/:_id", requireAdmin, locationController.updateCity);
	app.put("/api/countries/:_id", requireAdmin, locationController.updateCountry);

	//Post
	app.post("/api/cities", requireAdmin, locationController.createCity);
	app.post("/api/countries", requireAdmin, locationController.createCountry);

	//Delete
	app.delete("/api/cities/:_id", requireAdmin, locationController.deleteCity);
	app.delete("/api/countries/:_id", requireAdmin, locationController.deleteCountry);
};
