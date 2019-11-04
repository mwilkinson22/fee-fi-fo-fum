//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import DeleteButtons from "../../components/admin/fields/DeleteButtons";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchCountries,
	createCountry,
	updateCountry,
	deleteCountry
} from "~/client/actions/locationActions";

//Helpers
import { validateSlug } from "~/helpers/adminHelper";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCountryPage extends BasicForm {
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
		newState.isNew = !match.params.slug;

		//Check Everything is loaded
		if (!newState.isNew && !countries) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		const rawValidationSchema = {
			name: Yup.string()
				.required()
				.label("Name"),
			demonym: Yup.string()
				.required()
				.label("Demonym")
		};
		if (match.params.slug) {
			rawValidationSchema.slug = validateSlug();
		}
		newState.validationSchema = Yup.object().shape(rawValidationSchema);

		//Get Current Country
		if (!newState.isNew) {
			newState.country = _.find(countries, ({ slug }) => slug == match.params.slug) || false;
		}

		return newState;
	}

	getDefaults() {
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

	async handleSubmit(values) {
		const { createCountry, updateCountry, history } = this.props;
		const { country, isNew } = this.state;

		let newSlug;
		if (isNew) {
			newSlug = await createCountry(values);
		} else {
			newSlug = await updateCountry(country._id, values);
		}
		history.push(`/admin/countries/${newSlug}`);
	}

	async handleDelete() {
		const { deleteCountry, history } = this.props;
		const { country } = this.state;
		const success = await deleteCountry(country._id);
		if (success) {
			history.replace("/admin/countries");
		}
	}

	renderDeleteButtons() {
		if (!this.state.isNew) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { country, isNew, isLoading, validationSchema } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && country === false) {
			return <NotFoundPage message="Country not found" />;
		}

		const title = isNew ? "Add New Country" : country.name;
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
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={() => {
								const fields = [
									{ name: "name", type: fieldTypes.text },
									{ name: "demonym", type: fieldTypes.text }
								];

								if (!isNew) {
									fields.push({ name: "slug", type: fieldTypes.text });
								}

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(fields)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Country
												</button>
											</div>
										</div>
										{this.renderDeleteButtons()}
									</Form>
								);
							}}
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
	connect(
		mapStateToProps,
		{ fetchCountries, createCountry, updateCountry, deleteCountry }
	)(AdminCountryPage)
);
