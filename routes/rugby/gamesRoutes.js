import mongoose from "mongoose";
const collectionName = "games";

//Models
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");

//Controllers
import * as gamesController from "../../controllers/rugby/gamesController";

//Middleware
import requireAdmin from "../../middlewares/requireAdmin";

module.exports = app => {
	//Getters
	app.get("/api/games/neutral", gamesController.getNeutralGames);
	app.get("/api/games/:ids", gamesController.getGames);
	app.get("/api/games", gamesController.getList);

	//Putters
	app.put("/api/games/:_id/basics", requireAdmin, gamesController.updateGameBasics);
	app.put("/api/games/:_id/pregame", requireAdmin, gamesController.setPregameSquads);

	//Post
	app.post("/api/games", requireAdmin, async (req, res) => {
		const { data } = req.body;

		//Add ground
		if (!data._ground) {
			const opposition = await Team.findById(data._opposition);
			data._ground = opposition._ground;
		}

		const game = await new Game({
			...data,

			//Create Slug
			slug: Game.generateSlug(data._opposition, data.date),

			//Convert DOB to date format
			date: new Date(data.date)
		});

		await game.save();

		res.send(game);
	});
};
