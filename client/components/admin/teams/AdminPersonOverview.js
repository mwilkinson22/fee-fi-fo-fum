//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { fetchCities, fetchCountries } from "~/client/actions/locationActions";
import { updatePerson, createPerson, deletePerson } from "~/client/actions/peopleActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";
import DeleteButtons from "../fields/DeleteButtons";

class AdminPersonOverview extends BasicForm {
	constructor(props) {
		super(props);

		const { cities, fetchCities, countries, fetchCountries } = props;

		if (!cities) {
			fetchCities();
		}

		if (!countries) {
			fetchCountries();
		}

		const validationSchema = Yup.object().shape({
			name: Yup.object().shape({
				first: Yup.string()
					.required()
					.label("First Name"),
				last: Yup.string()
					.required()
					.label("Last Name")
			}),
			nickname: Yup.string().label("Nickname"),
			gender: Yup.mixed()
				.required()
				.label("Gender"),
			dateOfBirth: Yup.date().label("Date of Birth"),
			_hometown: Yup.mixed().label("Hometown"),
			_represents: Yup.mixed().label("Represents"),
			twitter: Yup.mixed().label("Twitter"),
			instagram: Yup.mixed().label("Instagram"),
			isPlayer: Yup.boolean().label("Player"),
			isCoach: Yup.boolean().label("Coach"),
			isReferee: Yup.boolean().label("Referee"),
			image: Yup.string().label("Image")
		});

		this.state = {
			validationSchema
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullPeople, slugMap, match, countries, cities } = nextProps;

		const newState = {
			isNew: !(match && match.params.slug),
			isLoading: false
		};

		if (!countries || !cities) {
			newState.isLoading = true;
			return newState;
		}

		if (!prevState.options) {
			newState.options = {
				_hometown: _.map(cities, c => ({
					label: `${c.name}, ${c._country.name}`,
					value: c._id
				})),
				_represents: _.map(countries, ({ name, _id }) => ({ label: name, value: _id }))
			};
		}

		if (!newState.isNew) {
			const { slug } = match.params;
			const { id } = slugMap[slug];
			newState.person = fullPeople[id];
		}

		return newState;
	}

	getDefaults() {
		const { person, options } = this.state;

		//Set basics for new teams:
		let defaults = {
			name: {
				first: "",
				last: ""
			},
			nickname: "",
			gender: "",
			dateOfBirth: "",
			_hometown: "",
			_represents: "",
			twitter: "",
			instagram: "",
			image: "",
			isPlayer: false,
			isCoach: false,
			isReferee: false
		};

		if (person) {
			defaults = _.mapValues(defaults, (val, key) => {
				if (person[key] != null) {
					switch (key) {
						case "_hometown":
						case "_represents":
							return options[key].find(o => o.value == person[key]._id);
						case "dateOfBirth":
							return person[key].toString("yyyy-MM-dd");
						case "name":
							return _.pick(person[key], ["first", "last"]);
						default:
							return person[key];
					}
				} else {
					return val;
				}
			});
		}

		return defaults;
	}

	async onSubmit(fValues) {
		const { person, isNew } = this.state;
		const { updatePerson, createPerson } = this.props;

		const values = _.chain(fValues)
			.cloneDeep()
			.mapValues((val, key) => {
				if (val === "") {
					return null;
				}

				switch (key) {
					case "_hometown":
					case "_represents":
						return val.value;
					default:
						return val;
				}
			})
			.value();

		if (isNew) {
			const newSlug = await createPerson(values);
			await this.setState({ redirect: `/admin/people/${newSlug}` });
		} else {
			updatePerson(person._id, values);
		}
	}

	async onDelete() {
		const { deletePerson } = this.props;
		const { person } = this.state;
		await deletePerson(person._id, () => this.setState({ redirect: "/admin/people" }));
	}

	render() {
		const { redirect, isLoading, options, isNew, person } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={() => {
						const mainFields = [
							{ name: "name.first", type: "text" },
							{ name: "name.last", type: "text" },
							{ name: "nickname", type: "text" },
							{ name: "dateOfBirth", type: "date" },
							{
								name: "gender",
								type: "Radio",
								options: [
									{ label: "Male", value: "M" },
									{ label: "Female", value: "F" }
								],
								readOnly: !isNew
							},
							{
								name: "_hometown",
								type: "Select",
								isClearable: true,
								options: options._hometown
							},
							{
								name: "_represents",
								type: "Select",
								isClearable: true,
								options: options._represents
							}
						];

						const roleFields = [
							{
								name: "isPlayer",
								type: "Boolean",
								readOnly: person && person.isPlayer
							},
							{
								name: "isCoach",
								type: "Boolean",
								readOnly: person && person.isCoach
							},
							{
								name: "isReferee",
								type: "Boolean",
								readOnly:
									person &&
									person.isReferee &&
									person.reffedGames &&
									person.reffedGames.length
							}
						];

						const socialFields = [
							{ name: "twitter", type: "text" },
							{ name: "instagram", type: "text" }
						];

						const imageFields = [
							{
								name: "image",
								type: "Image",
								path: "images/people/full/",
								acceptSVG: false
							}
						];

						let deleteButtons;
						if (!isNew) {
							deleteButtons = (
								<div className="form-card grid">
									<DeleteButtons onDelete={() => this.onDelete()} />
								</div>
							);
						}

						return (
							<Form>
								<div className="form-card grid">
									{this.renderFieldGroup(mainFields)}
									<h6>Roles</h6>
									{this.renderFieldGroup(roleFields)}
									<h6>Social Media</h6>
									{this.renderFieldGroup(socialFields)}
									<h6>Images</h6>
									{this.renderFieldGroup(imageFields)}
									<div className="buttons">
										<button type="clear">Clear</button>
										<button type="submit" className="confirm">
											{isNew ? "Add" : "Update"} Person
										</button>
									</div>
								</div>
								{deleteButtons}
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people, locations }) {
	const { fullPeople, slugMap } = people;
	const { cities, countries } = locations;
	return { fullPeople, slugMap, cities, countries };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchCities, fetchCountries, updatePerson, createPerson, deletePerson }
)(AdminPersonOverview);
