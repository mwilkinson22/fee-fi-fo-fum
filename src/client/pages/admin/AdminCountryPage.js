//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchCountries,
	createCountry,
	updateCountry,
	deleteCountry
} from "~/client/actions/locationActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCountryPage extends Component {
	constructor(props) {
		super(props);

		const { countries, fetchCountries } = props;

		if (!countries) {
			fetchCountries();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { countries, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Check Everything is loaded
		if (!newState.isNew && !countries) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			demonym: Yup.string()
				.required()
				.label("Demonym")
		});

		//Get Current Country
		if (!newState.isNew) {
			newState.country = countries.find(({ _id }) => _id == match.params._id) || false;
		}

		return newState;
	}

	getInitialValues() {
		const { country, isNew } = this.state;

		if (isNew) {
			return {
				name: "",
				demonym: ""
			};
		} else {
			return country;
		}
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{ name: "demonym", type: fieldTypes.text }
				]
			}
		];
	}

	render() {
		const { createCountry, updateCountry, deleteCountry } = this.props;
		const { country, isNew, isLoading, validationSchema } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && country === false) {
			return <NotFoundPage message="Country not found" />;
		}

		//Get Page Title
		const title = isNew ? "Add New Country" : country.name;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createCountry(values),
				redirectOnSubmit: id => `/admin/countries/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteCountry(country._id),
				onSubmit: values => updateCountry(country._id, values),
				redirectOnDelete: "/admin/countries/"
			};
		}

		return (
			<div className="admin-country-page">
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
							itemType="Country"
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
	const { countries } = locations;
	return { countries };
}

export default withRouter(
	connect(mapStateToProps, { fetchCountries, createCountry, updateCountry, deleteCountry })(
		AdminCountryPage
	)
);
