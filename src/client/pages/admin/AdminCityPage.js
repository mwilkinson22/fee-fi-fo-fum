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
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Actions
import { fetchCountries, fetchCities, createCity, updateCity, deleteCity } from "~/client/actions/locationActions";

class AdminCityPage extends Component {
	constructor(props) {
		super(props);

		const { countries, fetchCountries, cities, fetchCities } = props;

		if (!countries) {
			fetchCountries();
		}

		if (!cities) {
			fetchCities();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { countries, cities, match } = nextProps;
		const newState = { isLoading: false };

		//Create or Edit
		newState.isNew = !match.params._id;

		//Check Everything is loaded
		if (!countries || (!newState.isNew && !cities)) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string().required().label("Name"),
			_country: Yup.mixed().required().label("Country")
		});

		//Get Current City
		if (!newState.isNew) {
			newState.city = cities.find(({ _id }) => _id == match.params._id) || false;
		}

		//Get Country Dropdown Options
		newState.countries = _.sortBy(
			countries.map(c => ({ label: c.name, value: c._id })),
			"label"
		);

		return newState;
	}

	getInitialValues() {
		const { city, isNew } = this.state;

		if (isNew) {
			return {
				name: "",
				_country: ""
			};
		} else {
			return {
				name: city.name,
				_country: city._country._id
			};
		}
	}

	getFieldGroups() {
		const { countries } = this.state;
		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{
						name: "_country",
						type: fieldTypes.select,
						options: countries
					}
				]
			}
		];
	}

	render() {
		const { createCity, updateCity, deleteCity } = this.props;
		const { city, isNew, isLoading, validationSchema } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && city === false) {
			return <NotFoundPage message="City not found" />;
		}

		//Get Page Title
		const title = isNew ? "Add New City" : city.name;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createCity(values),
				redirectOnSubmit: id => `/admin/cities/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteCity(city._id),
				onSubmit: values => updateCity(city._id, values),
				redirectOnDelete: "/admin/cities/"
			};
		}

		return (
			<div className="admin-city-page">
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
							itemType="City"
							validationSchema={validationSchema}
							{...formProps}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ locations }) {
	const { countries, cities } = locations;
	return { countries, cities };
}
const mapDispatchToProps = { fetchCountries, fetchCities, createCity, updateCity, deleteCity };

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AdminCityPage));
