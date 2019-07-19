//Mongoose
import mongoose from "mongoose";
const City = mongoose.model("cities");
const Country = mongoose.model("countries");

//Helpers
async function validateItem(model, _id, res) {
	//This allows us to populate specific fields if necessary
	const item = await model.findById(_id);
	if (item) {
		return item;
	} else {
		res.status(404).send(`No item found with id ${_id}`);
		return false;
	}
}

async function getUpdatedItem(model, id, res) {
	//Get Full Game
	const instance = await model.findById(id);

	res.send(instance);
}

//Getters
export async function getCities(req, res) {
	const cities = await City.find({}, {}, { sort: { name: 1 } }).populate({
		path: "_country",
		select: "name"
	});
	res.send(cities);
}

export async function getCountries(req, res) {
	const countries = await Country.find({}, {}, { sort: { name: 1 } });
	res.send(countries);
}

//Putters
export async function updateCountry(req, res) {
	const { _id } = req.params;
	const country = await validateItem(Country, _id, res);
	if (country) {
		await country.updateOne({ ...req.body });
		await getUpdatedItem(Country, _id, res);
	}
}

//Post
export async function createCountry(req, res) {
	const country = new Country(req.body);
	await country.save();
	await getUpdatedItem(Country, country._id, res);
}

//Delete
export async function deleteCountry(req, res) {
	const { _id } = req.params;
	const country = await validateItem(Country, _id, res);
	if (country) {
		const cities = await City.find({ _country: _id }, "slug").lean();

		if (cities.length) {
			const error = `Country cannot be deleted, as ${cities.length} ${
				cities.length == 1 ? "city" : "cities"
			} depend on it`;

			res.status(409).send({
				error,
				toLog: { cities }
			});
		} else {
			await country.remove();
			res.send({});
		}
	}
}
