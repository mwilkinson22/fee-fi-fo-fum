//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "~/client/components/LoadingPage";

//Actions
import { fetchPeopleList } from "~/client/actions/peopleActions";
import { addCoach } from "~/client/actions/teamsActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import coachTypes from "~/constants/coachTypes";

class AdminTeamAddCoach extends Component {
	constructor(props) {
		super(props);

		const { teamTypes, peopleList, fetchPeopleList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		const options = {
			roles: _.map(coachTypes, ({ name, key }) => ({ value: key, label: name })),
			teamTypes: _.sortBy(teamTypes, "sortOrder").map(({ _id, name }) => ({
				value: _id,
				label: name
			}))
		};
		const validationSchema = Yup.object().shape({
			_person: Yup.mixed()
				.required()
				.label("Person"),
			_teamType: Yup.mixed()
				.required()
				.label("Team Type"),
			role: Yup.mixed()
				.required()
				.label("Role"),
			from: Yup.date()
				.required()
				.label("From"),
			to: Yup.date().label("To")
		});
		this.state = { options, validationSchema };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { team, peopleList } = nextProps;

		const newState = {
			isLoading: false,
			team
		};

		if (!peopleList) {
			newState.isLoading = true;
			return newState;
		}

		newState.options = {
			...prevState.options,
			_person: _.chain(peopleList)
				.filter("isCoach")
				.map(({ _id, name }) => ({
					value: _id,
					label: `${name.first} ${name.last}`
				}))
				.sortBy("label")
				.value()
		};

		return newState;
	}

	getInitialValues() {
		return {
			_person: "",
			_teamType: "",
			from: "",
			to: "",
			role: ""
		};
	}

	getFieldGroups() {
		const { options } = this.state;
		return [
			{
				fields: [
					{
						name: "_person",
						type: fieldTypes.select,
						options: options._person
					},
					{ name: "_teamType", type: fieldTypes.select, options: options.teamTypes },
					{ name: "role", type: fieldTypes.select, options: options.roles },
					{ name: "from", type: fieldTypes.date },
					{ name: "to", type: fieldTypes.date }
				]
			}
		];
	}

	render() {
		const { addCoach } = this.props;
		const { isLoading, team, validationSchema } = this.state;

		//Await Perople List
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={true}
				itemType="Coach"
				onSubmit={(values, formikProps) => {
					addCoach(team._id, values);
					formikProps.resetForm();
				}}
				validationSchema={validationSchema}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people, teams }) {
	const { peopleList } = people;
	const { teamTypes } = teams;
	return { peopleList, teamTypes };
}

// export default form;
export default connect(mapStateToProps, { fetchPeopleList, addCoach })(AdminTeamAddCoach);
