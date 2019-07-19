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

async function getUpdatedCity(id, res) {
	const instance = await City.findById(id).populated();

	res.send(instance);
}

async function getUpdatedCountry(id, res) {
	const instance = await Country.findById(id);

	res.send(instance);
}

//Getters
export async function getCities(req, res) {
	const cities = await City.find({}, {}, { sort: { name: 1 } }).populated();
	res.send(cities);
}

export async function getCountries(req, res) {
	const countries = await Country.find({}, {}, { sort: { name: 1 } });
	res.send(countries);
}

//Putters
export async function updateCity(req, res) {
	const { _id } = req.params;
	const city = await validateItem(City, _id, res);
	if (city) {
		await city.updateOne({ ...req.body });
		await getUpdatedCity(_id, res);
	}
}

export async function updateCountry(req, res) {
	const { _id } = req.params;
	const country = await validateItem(Country, _id, res);
	if (country) {
		await country.updateOne({ ...req.body });
		await getUpdatedCountry(_id, res);
	}
}

//Post
export async function createCity(req, res) {
	const slug = await City.generateSlug(req.body);
	const city = new City({ ...req.body, slug });
	await city.save();
	await getUpdatedCity(city._id, res);
}

export async function createCountry(req, res) {
	const slug = await Country.generateSlug(req.body.name);
	const country = new Country({ ...req.body, slug });
	await country.save();
	await getUpdatedCountry(country._id, res);
}

//Delete
export async function deleteCity(req, res) {
	const { _id } = req.params;
	const city = await validateItem(City, _id, res);
	if (city) {
		const Ground = mongoose.model("grounds");
		const Person = mongoose.model("people");

		const grounds = await Ground.find({ "address._city": _id }, "slug").lean();
		const people = await Person.find({ _hometown: _id }, "slug").lean();

		if (grounds.length || people.length) {
			let error = "City cannot be deleted, as it is required for ";

			if (grounds.length) {
				error += `${grounds.length} ${grounds.length === 1 ? "ground" : "grounds"}`;
				if (people.length) {
					error += " & ";
				}
			}

			if (people.length) {
				error += `${people.length} ${people.length === 1 ? "person" : "people"}`;
			}

			res.status(409).send({
				error,
				toLog: { grounds, people }
			});
		} else {
			await city.remove();
			res.send({});
		}
	}
}

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
