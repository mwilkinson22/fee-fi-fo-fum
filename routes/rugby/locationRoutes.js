//Controllers
import * as locationController from "../../controllers/rugby/locationController";

module.exports = app => {
	//Getters
	app.get("/api/cities", locationController.getCities);
	app.get("/api/countries", locationController.getCountries);
};
