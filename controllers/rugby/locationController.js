//Mongoose
import mongoose from "mongoose";
const City = mongoose.model("cities");
const Country = mongoose.model("countries");

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
