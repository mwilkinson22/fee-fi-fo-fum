//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../components/admin/BasicForm";
import NotFoundPage from "./NotFoundPage";
import LoadingPage from "../components/LoadingPage";
import DeleteButtons from "../components/admin/fields/DeleteButtons";
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

class AdminCountryPage extends BasicForm {
	constructor(props) {
		super(props);

		const { countries, fetchCountries } = props;

		if (!countries) {
			fetchCountries();
		}

		const validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			demonym: Yup.string()
				.required()
				.label("Demonym"),
			slug: validateSlug()
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { countries, match } = nextProps;
		const newState = { isLoading: false };

		newState.isNew = !match.params.slug;

		if (!newState.isNew && !prevState.isDeleted) {
			newState.redirect = false;
		}

		if (!newState.isNew && !countries) {
			newState.isLoading = true;
			return newState;
		}

		newState.country = _.find(countries, ({ slug }) => slug == match.params.slug) || false;

		return newState;
	}

	getDefaults() {
		const { country, isNew } = this.state;
		let values = {
			name: "",
			demonym: "",
			slug: ""
		};

		if (!isNew) {
			values = _.pick(_.cloneDeep(country), Object.keys(values));
		}
		return values;
	}

	async handleSubmit(values) {
		const { createCountry, updateCountry } = this.props;
		const { country, isNew } = this.state;

		if (isNew) {
			const newSlug = await createCountry(values);
			await this.setState({ redirect: `/admin/countries/${newSlug}` });
		} else {
			await updateCountry(country._id, values);
		}
	}

	async handleDelete() {
		const { deleteCountry } = this.props;
		const { country } = this.state;
		const success = await deleteCountry(country._id);
		if (success) {
			this.setState({ isDeleted: true, redirect: "/admin/countries" });
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
		const { redirect, country, isNew, isLoading, validationSchema } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

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
									{ name: "name", type: "text" },
									{ name: "demonym", type: "text" },
									{ name: "slug", type: "text" }
								];

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

export default connect(
	mapStateToProps,
	{ fetchCountries, createCountry, updateCountry, deleteCountry }
)(AdminCountryPage);
