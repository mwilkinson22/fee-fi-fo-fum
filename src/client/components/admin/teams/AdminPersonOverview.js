//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { fetchCities, fetchCountries } from "~/client/actions/locationActions";
import { updatePerson, createPerson, deletePerson } from "~/client/actions/peopleActions";
import { fetchSponsors } from "~/client/actions/sponsorActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminPersonOverview extends Component {
	constructor(props) {
		super(props);

		const { cities, fetchCities, countries, fetchCountries, sponsorList, fetchSponsors } = props;

		if (!cities) {
			fetchCities();
		}

		if (!countries) {
			fetchCountries();
		}

		if (!sponsorList) {
			fetchSponsors();
		}

		const validationSchema = Yup.object().shape({
			name: Yup.object().shape({
				first: Yup.string().required().label("First Name"),
				last: Yup.string().required().label("Last Name")
			}),
			nickname: Yup.string().label("Nickname"),
			gender: Yup.string().required().label("Gender"),
			dateOfBirth: Yup.date().label("Date of Birth"),
			_hometown: Yup.mixed().label("Hometown"),
			_represents: Yup.mixed().label("Represents"),
			twitter: Yup.mixed().label("Twitter"),
			instagram: Yup.mixed().label("Instagram"),
			isPlayer: Yup.boolean().label("Player"),
			isCoach: Yup.boolean().label("Coach"),
			isReferee: Yup.boolean().label("Referee"),
			images: Yup.object().shape({
				main: Yup.string().label("Main Image"),
				player: Yup.string().label("Player Image"),
				coach: Yup.string().label("Coach Image"),
				midpage: Yup.string().label("Midpage Image")
			}),
			description: Yup.string().label("Description"),
			_sponsor: Yup.mixed().label("Sponsor")
		});

		this.state = {
			validationSchema
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, match, countries, cities, sponsorList } = nextProps;
		const newState = { isLoading: false };

		//Create or Edit
		newState.isNew = !match.params._id;

		//Check everything is loaded
		if (!countries || !cities || !sponsorList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Current Person
		if (!newState.isNew) {
			newState.person = fullPeople[match.params._id];
		}

		//Set Dropdown Options
		newState.options = {
			_hometown: _.chain(cities)
				.map(c => ({
					label: `${c.name}, ${c._country.name}`,
					value: c._id
				}))
				.sortBy("label")
				.value(),
			_represents: _.chain(countries)
				.map(({ name, _id }) => ({
					label: name,
					value: _id
				}))
				.sortBy("label")
				.value(),
			_sponsor: _.chain(sponsorList)
				.map(({ name, _id }) => ({ label: name, value: _id }))
				.sortBy("label")
				.value()
		};

		return newState;
	}

	getInitialValues() {
		const { isNew, person } = this.state;

		//Set basics for new teams:
		const defaultValues = {
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
			images: {
				main: "",
				coach: "",
				player: "",
				midpage: ""
			},
			isPlayer: false,
			isCoach: false,
			isReferee: false,
			description: "",
			_sponsor: ""
		};

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				if (person[key] == null) {
					return defaultValue;
				}
				switch (key) {
					case "_hometown":
					case "_represents":
					case "_sponsor":
						return person[key]._id;
					case "dateOfBirth":
						return person[key].toString("yyyy-MM-dd");
					case "images":
						return _.mapValues(person.images, image => image || "");
					case "name":
						return _.pick(person[key], ["first", "last"]);
					case "description":
						return person[key].join("\n");
					default:
						return person[key];
				}
			});
		}
	}

	getFieldGroups() {
		const { isNew, person, options } = this.state;
		return [
			{
				fields: [
					{ name: "name.first", type: fieldTypes.text },
					{ name: "name.last", type: fieldTypes.text },
					{ name: "nickname", type: fieldTypes.text },
					{ name: "dateOfBirth", type: fieldTypes.date },
					{
						name: "gender",
						type: fieldTypes.radio,
						options: [
							{ label: "Male", value: "M" },
							{ label: "Female", value: "F" }
						],
						readOnly: !isNew
					},
					{
						name: "_hometown",
						type: fieldTypes.select,
						isClearable: true,
						options: options._hometown
					},
					{
						name: "_represents",
						type: fieldTypes.select,
						isClearable: true,
						options: options._represents
					},
					{
						name: "_sponsor",
						type: fieldTypes.select,
						isClearable: true,
						options: options._sponsor
					},
					{
						name: "description",
						type: fieldTypes.textarea
					}
				]
			},
			{
				label: "Roles",
				fields: [
					{
						name: "isPlayer",
						type: fieldTypes.boolean,
						disabled: person && person.playedGames && person.playedGames.length
					},
					{
						name: "isCoach",
						type: fieldTypes.boolean,
						disabled: person && person.coachingRoles && person.coachingRoles.length
					},
					{
						name: "isReferee",
						type: fieldTypes.boolean,
						disabled: person && person.isReferee && person.reffedGames && person.reffedGames.length
					}
				]
			},
			{
				label: "Social Media",
				fields: [
					{ name: "twitter", type: fieldTypes.text },
					{ name: "instagram", type: fieldTypes.text }
				]
			},
			{
				label: "Images",
				fields: ["main", "player", "coach", "midpage"].map(type => {
					let resize, path, cacheMaxAge;
					if (type === "midpage") {
						resize = {};
						path = `images/people/midpage/`;
					} else {
						resize = {
							medium: { width: 200 },
							small: { width: 100 }
						};
						path = `images/people/full/`;
						cacheMaxAge = 604800;
					}
					return {
						name: `images.${type}`,
						type: fieldTypes.image,
						acceptSVG: false,
						path,
						resize,
						cacheMaxAge
					};
				})
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		if (values.description) {
			values.description = _.filter(values.description.split("\n"), _.identity);
		}
	}

	render() {
		const { createPerson, updatePerson, deletePerson } = this.props;
		const { isLoading, isNew, person, validationSchema } = this.state;

		//Wait for dropdown fields
		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createPerson(values),
				redirectOnSubmit: id => `/admin/people/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deletePerson(person._id),
				onSubmit: values => updatePerson(person._id, values),
				redirectOnDelete: "/admin/people/"
			};
		}

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={isNew}
				itemType="Person"
				validationSchema={validationSchema}
				{...formProps}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people, locations, sponsors }) {
	const { fullPeople } = people;
	const { cities, countries } = locations;
	const { sponsorList } = sponsors;
	return { fullPeople, cities, countries, sponsorList };
}
// export default form;
export default connect(mapStateToProps, {
	fetchCities,
	fetchCountries,
	updatePerson,
	createPerson,
	deletePerson,
	fetchSponsors
})(AdminPersonOverview);
