const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "people";
const Person = mongoose.model(collectionName);
const IdLink = mongoose.model("IdLinks");
const SlugRedirect = mongoose.model("slugRedirect");

module.exports = app => {
	app.post("/api/people", async (req, res) => {
		function createSlug(str) {
			return str
				.replace(/\s/g, "-")
				.replace(/[^A-Za-z-]/gi, "")
				.toLowerCase();
		}

		await _.each(req.body, async sql => {
			//Get Variables
			const hometown = (await sql.hometown)
				? await IdLink.convertId(sql.hometown, "cities")
				: null;
			const represents = (await sql.represents)
				? await IdLink.convertId(sql.represents, "countries")
				: null;
			const dob = (await sql.dob) ? await new Date(sql.dob) : null;
			const slug = await createSlug(sql.first_name + " " + sql.last_name);

			//Create New Entry
			const newEntry = new Person({
				name: {
					first: sql.first_name.replace("’", "'"),
					last: sql.last_name.replace("’", "'")
				},
				nickname: sql.nickname,
				dateOfBirth: dob,
				_hometown: hometown,
				_represents: represents,
				twitter: sql.twitter,
				instagram: sql.instagram,
				rflSiteName: sql.rfl_site_name,
				rflSiteId: null,
				isPlayer: false,
				isCoach: false,
				isReferee: false,
				slug: slug
			});
			await newEntry.save();

			//Add new newEntry to idLink document
			await new IdLink({
				_id: newEntry._id,
				sqlId: sql.id,
				collectionName
			}).save();

			//Update SlugRedirect
			await new SlugRedirect({
				oldSlug: sql.id,
				collectionName,
				itemId: newEntry._id
			}).save();
		});
		res.send({});
	});

	app.post("/api/players", async (req, res) => {
		await _.each(req.body, async sql => {
			const personId = await IdLink.convertId(sql.people_id, "people");
			const person = await Person.findById(personId);
			const mainPosition = sql.main_pos ? sql.main_pos : undefined;
			const otherPositions = sql.other_pos
				? sql.other_pos.split(";")
				: undefined;
			person.isPlayer = true;
			person.playerDetails = {
				contractEnds: sql.hudds_contract_ends,
				mainPosition,
				otherPositions
			};
			await person.save();
		});
		res.send({});
	});

	app.post("/api/coaches", async (req, res) => {
		function getCoachRole(num) {
			switch (num) {
				case 0:
					return "head";
				case 1:
					return "assistant";
				case 2:
					return "interim";
			}
		}
		await _.each(req.body, async sql => {
			const personId = await IdLink.convertId(sql.people_id, "people");
			const person = await Person.findById(personId);

			const teamId = await IdLink.convertId(sql.team_id, "teams");
			const role = await getCoachRole(sql.role);
			const from = await new Date(sql.start_career);
			const to = (await sql.end_career)
				? await new Date(sql.end_career)
				: null;

			try {
				person.isCoach = true;
				person.coachDetails.push({
					_team: teamId,
					role,
					from,
					to
				});
				await person.save();
			} catch (error) {
				console.log(error);
			}
		});
		res.send({});
	});

	app.post("/api/referees", async (req, res) => {
		await _.each(req.body, async sql => {
			const personId = await IdLink.convertId(sql.people_id, "people");
			const person = await Person.findById(personId);

			person.isReferee = true;
			person.refereeDetails = {
				from: await new Date(sql.start_career),
				to: null
			};
			await person.save();
		});
		res.send({});
	});

	app.delete("/api/people", async (req, res) => {
		await Person.remove({});
		await SlugRedirect.remove({ collectionName });
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
