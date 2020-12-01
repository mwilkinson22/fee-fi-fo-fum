//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";

//Actions
import { createCity, fetchCountries, fetchCities } from "~/client/actions/locationActions";
import {
	fetchAllGrounds,
	createGround,
	updateGround,
	deleteGround
} from "~/client/actions/groundActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminGroundPage extends Component {
	constructor(props) {
		super(props);

		const {
			groundList,
			fetchAllGrounds,
			cities,
			fetchCities,
			countries,
			fetchCountries
		} = props;

		//Get dependencies
		if (!groundList) {
			fetchAllGrounds();
		}

		if (!cities) {
			fetchCities();
		}

		if (!countries) {
			fetchCountries();
		}

		//Check for "new city" field requirement
		const newCityTest = {
			is: "new",
			then: Yup.string().required(),
			otherwise: Yup.string()
		};

		const validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			addThe: Yup.boolean().label("Add 'the'"),
			address: Yup.object().shape({
				street: Yup.string()
					.required()
					.label("Street"),
				street2: Yup.string().label("Street 2"),
				_city: Yup.string()
					.label("City")
					.required(),
				postcode: Yup.string()
					.required()
					.label("Postcode"),
				googlePlaceId: Yup.string()
					.required()
					.label("Google Place ID"),
				newCityName: Yup.string()
					.when("_city", newCityTest)
					.label("New City Name"),
				newCityCountry: Yup.string()
					.when("_city", newCityTest)
					.label("New City Country")
			}),
			parking: Yup.string().label("Parking"),
			image: Yup.string().label("Image")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { groundList, match, cities, countries } = nextProps;
		const newState = { isLoading: false };

		const { _id } = match.params;

		//Check whether an _id param has been passed
		newState.isNew = !_id;

		//Await cities, countries and (in edit mode) the groundList
		if (!cities || !countries || (!newState.isNew && !groundList)) {
			newState.isLoading = true;
			return newState;
		}

		//Get the ground object
		if (!newState.isNew) {
			newState.ground = groundList[_id] || false;
		}

		//Render options for the city selector
		newState.cityOptions = _.chain(cities)
			.groupBy("_country.name")
			.map((cities, country) => {
				const options = _.chain(cities)
					.map(({ name, _id }) => ({
						label: name,
						value: _id
					}))
					.sortBy("label")
					.value();

				return {
					label: country,
					options
				};
			})
			.sortBy("label")
			.value();
		newState.cityOptions.unshift({ label: "Add New City", value: "new" });

		//Render options for country selector
		newState.countryOptions = _.map(countries, c => ({ label: c.name, value: c._id }));

		//Parking options
		newState.parkingOptions = [
			{ label: "None", value: "" },
			{ label: "Stadium", value: "stadium" },
			{ label: "Street", value: "street" }
		];

		return newState;
	}

	getInitialValues() {
		const { ground, isNew } = this.state;

		//First we declare the defaults, for new items or those without certain fields
		const defaultValues = {
			name: "",
			addThe: false,
			address: {
				street: "",
				street2: "",
				_city: "",
				newCity: "",
				_country: "",
				postcode: "",
				googlePlaceId: "",
				newCityName: "",
				newCityCountry: ""
			},
			parking: "",
			image: ""
		};

		if (isNew) {
			//For new grounds, we simply return the defaults
			return defaultValues;
		} else {
			//If we have a ground, pull the corresponding values
			return _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					case "address":
						value = _.mapValues(ground.address, (currentValue, subkey) => {
							let addressValue;

							if (subkey === "_city") {
								addressValue = ground.address._city._id;
							} else {
								addressValue = ground.address[subkey];
							}

							return addressValue != null ? addressValue : defaultValue[subkey];
						});
						break;
					default:
						value = ground[key];
				}

				return value != null ? value : defaultValue;
			});
		}
	}

	getFieldGroups(values) {
		const { cityOptions, countryOptions, ground, parkingOptions } = this.state;

		//Add basic address fields
		const addressFields = [
			{ name: "address.street", type: fieldTypes.text },
			{ name: "address.street2", type: fieldTypes.text },
			{
				name: "address._city",
				type: fieldTypes.select,
				options: cityOptions,
				isNested: true
			}
		];

		//Conditionally add newCity fields
		if (values.address._city === "new") {
			addressFields.push(
				{ name: "address.newCityName", type: fieldTypes.text },
				{
					name: "address.newCityCountry",
					type: fieldTypes.select,
					options: countryOptions
				}
			);
		}

		//Add postcode + google id
		addressFields.push(
			{ name: "address.postcode", type: fieldTypes.text },
			{ name: "address.googlePlaceId", type: fieldTypes.text }
		);

		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{ name: "addThe", type: fieldTypes.boolean }
				]
			},
			{
				label: "Address",
				fields: addressFields
			},
			{
				label: "Travel",
				fields: [{ name: "parking", type: fieldTypes.radio, options: parkingOptions }]
			},
			{
				label: "Image",
				fields: [
					{
						name: "image",
						type: fieldTypes.image,
						path: "images/grounds/",
						acceptSVG: true,
						defaultUploadName: ground ? ground.slug : null,
						resize: {
							gamecard: { height: 300, width: 620, fit: "cover" },
							"large-gamecard": { height: 400, width: 1200, fit: "cover" }
						}
					}
				]
			}
		];
	}

	async handleSubmit(values) {
		const { createCity, createGround, updateGround } = this.props;
		const { ground, isNew } = this.state;

		//Conditionally create new city
		if (values.address._city === "new") {
			values.address._city = await createCity({
				name: values.address.newCityName,
				_country: values.address.newCityCountry
			});
		}

		//Remove newCity values
		delete values.address.newCityName;
		delete values.address.newCityCountry;

		//Upsert city
		if (isNew) {
			return createGround(values);
		} else {
			return updateGround(ground._id, values);
		}
	}

	render() {
		const { ground, isNew, isLoading, validationSchema } = this.state;
		const { deleteGround } = this.props;

		//Wait for cities and ground list to load
		if (isLoading) {
			return <LoadingPage />;
		}

		//404
		if (!isNew && ground === false) {
			return <NotFoundPage message="Ground not found" />;
		}

		//Get Page Title
		const title = isNew ? "Add New Ground" : `${ground.addThe ? "The " : ""}${ground.name}`;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				redirectOnSubmit: id => `/admin/grounds/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteGround(ground._id),
				redirectOnDelete: "/admin/grounds/"
			};
		}

		return (
			<div className="admin-ground-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1>{title}</h1>
					</div>
				</section>
				<section className="form">
					<div className="container">
						<BasicForm
							fieldGroups={values => this.getFieldGroups(values)}
							initialValues={this.getInitialValues()}
							isNew={isNew}
							itemType="Ground"
							onSubmit={values => this.handleSubmit(values)}
							validationSchema={validationSchema}
							{...formProps}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ grounds, locations }) {
	const { groundList } = grounds;
	const { cities, countries } = locations;
	return { cities, countries, groundList };
}

export default withRouter(
	connect(mapStateToProps, {
		fetchAllGrounds,
		createCity,
		fetchCountries,
		fetchCities,
		createGround,
		updateGround,
		deleteGround
	})(AdminGroundPage)
);
