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

//Actions
import { fetchCities } from "~/client/actions/locationActions";
import {
	fetchAllGrounds,
	createGround,
	updateGround,
	deleteGround
} from "~/client/actions/groundActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminGroundPage extends BasicForm {
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
			})
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { groundList, match, cities } = nextProps;
		const newState = { isLoading: false };

		newState.isNew = !match.params.slug;

		if (!newState.isNew && !prevState.isDeleted) {
			newState.redirect = false;
		}

		if (!cities || (!newState.isNew && !groundList)) {
			newState.isLoading = true;
			return newState;
		}

		newState.ground = _.find(groundList, ({ slug }) => slug == match.params.slug) || false;
		newState.cityOptions = cities.map(city => ({
			label: `${city.name}, ${city._country.name}`,
			value: city._id
		}));

		return newState;
	}

	getDefaults() {
		const { ground, isNew, cityOptions } = this.state;
		let values = {
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
			}
		};

		if (!isNew) {
			values = _.pick(_.cloneDeep(ground), Object.keys(values));
			values.address.street2 = values.address.street2 || ""; //Nullable
			values.address._city = cityOptions.find(
				({ value }) => value == ground.address._city._id
			);
		}
		return values;
	}

	async handleSubmit(fValues) {
		const { createGround, updateGround } = this.props;
		const { ground, isNew } = this.state;
		const values = _.cloneDeep(fValues);
		values.address._city = values.address._city.value;

		if (isNew) {
			const newSlug = await createGround(values);
			await this.setState({ redirect: `/admin/grounds/${newSlug}` });
		} else {
			await updateGround(ground._id, values);
		}
	}

	async handleDelete() {
		const { deleteGround } = this.props;
		const { ground } = this.state;
		const success = await deleteGround(ground._id);
		if (success) {
			this.setState({ isDeleted: true, redirect: "/admin/grounds" });
		}
	}

	render() {
		const { redirect, ground, isNew, isLoading, validationSchema, cityOptions } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && ground === false) {
			return <NotFoundPage message="Ground not found" />;
		}

		const title = isNew ? "Add New Ground" : `${ground.addThe ? "The " : ""}${ground.name}`;
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
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={() => {
								const mainFields = [
									{ name: "name", type: "text" },
									{ name: "addThe", type: "Boolean" }
								];
								const addressFields = [
									{ name: "address.street", type: "text" },
									{ name: "address.street2", type: "text" },
									{ name: "address._city", type: "Select", options: cityOptions },
									{ name: "address.postcode", type: "text" },
									{ name: "address.googlePlaceId", type: "text" }
								];

								const travelFields = [
									{ name: "parking.stadium", type: "Boolean" },
									{ name: "parking.roadside", type: "Boolean" }
								];

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(mainFields)}
											<h6>Address</h6>
											{this.renderFieldGroup(addressFields)}
											<h6>Travel</h6>
											{this.renderFieldGroup(travelFields)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Ground
												</button>
											</div>
										</div>
										<DeleteButtons onDelete={() => this.handleDelete()} />
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

function mapStateToProps({ grounds, locations }) {
	const { groundList } = grounds;
	const { cities } = locations;
	return { cities, groundList };
}

export default connect(
	mapStateToProps,
	{ fetchAllGrounds, fetchCities, createGround, updateGround, deleteGround }
)(AdminGroundPage);
