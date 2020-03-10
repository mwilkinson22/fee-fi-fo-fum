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
import { fetchCities } from "~/client/actions/locationActions";
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

		const { groundList, fetchAllGrounds, cities, fetchCities } = props;

		if (!groundList) {
			fetchAllGrounds();
		}

		if (!cities) {
			fetchCities();
		}

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
				_city: Yup.mixed()
					.label("City")
					.required(),
				postcode: Yup.string()
					.required()
					.label("Postcode"),
				googlePlaceId: Yup.string()
					.required()
					.label("Google Place ID")
			}),
			parking: Yup.object().shape({
				stadium: Yup.boolean().label("Stadium Parking"),
				roadside: Yup.boolean().label("Roadside Parking")
			}),
			image: Yup.string().label("Image")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { groundList, match, cities } = nextProps;
		const newState = { isLoading: false };

		const { _id } = match.params;

		//Check whether an _id param has been passed
		newState.isNew = !_id;

		//Await cities and (in edit mode) the groundList
		if (!cities || (!newState.isNew && !groundList)) {
			newState.isLoading = true;
			return newState;
		}

		//Get the ground object
		if (!newState.isNew) {
			newState.ground = groundList[_id] || false;
		}

		//Render options for the city selector
		newState.cityOptions = cities.map(city => ({
			label: `${city.name}, ${city._country.name}`,
			value: city._id
		}));

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
				postcode: "",
				googlePlaceId: ""
			},
			parking: {
				stadium: false,
				roadside: false
			},
			image: ""
		};

		if (isNew) {
			//For new grounds, we simply return the defaults
			return defaultValues;
		} else {
			//If we have a ground, pull the corresponding values
			const values = _.mapValues(defaultValues, (defaultValue, key) =>
				ground.hasOwnProperty(key) ? ground[key] : defaultValue
			);

			//Convert potential null values to empty strings
			values.address.street2 = values.address.street2 || "";
			values.image = values.image || "";

			//Convert City ObjectId to dropdown Option
			values.address._city = ground.address._city._id;

			return values;
		}
	}

	getFieldGroups() {
		const { cityOptions, ground } = this.state;
		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{ name: "addThe", type: fieldTypes.boolean }
				]
			},
			{
				label: "Address",
				fields: [
					{ name: "address.street", type: fieldTypes.text },
					{ name: "address.street2", type: fieldTypes.text },
					{
						name: "address._city",
						type: fieldTypes.select,
						options: cityOptions
					},
					{ name: "address.postcode", type: fieldTypes.text },
					{ name: "address.googlePlaceId", type: fieldTypes.text }
				]
			},
			{
				label: "Travel",
				fields: [
					{ name: "parking.stadium", type: fieldTypes.boolean },
					{ name: "parking.roadside", type: fieldTypes.boolean }
				]
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
							gamecard: { height: 400 }
						}
					}
				]
			}
		];
	}

	render() {
		const { ground, isNew, isLoading, validationSchema } = this.state;
		const { createGround, updateGround, deleteGround } = this.props;

		//Wait for cities and groundlist to load
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
				onSubmit: values => createGround(values),
				redirectOnSubmit: id => `/admin/grounds/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteGround(ground._id),
				onSubmit: values => updateGround(ground._id, values),
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
							fieldGroups={this.getFieldGroups()}
							initialValues={this.getInitialValues()}
							isNew={isNew}
							itemType="Ground"
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
	const { cities } = locations;
	return { cities, groundList };
}

export default withRouter(
	connect(mapStateToProps, {
		fetchAllGrounds,
		fetchCities,
		createGround,
		updateGround,
		deleteGround
	})(AdminGroundPage)
);
