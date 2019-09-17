//Modules
import _ from "lodash";
import React from "react";
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

class AdminTeamAddCoach extends BasicForm {
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
		} else {
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
		}
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

	handleSubmit(fValues) {
		const { addCoach, team } = this.props;
		const values = _.chain(fValues)
			.cloneDeep()
			.mapValues(v => v.value || v)
			.value();
		addCoach(team._id, values);
	}

	render() {
		const { isLoading, options, validationSchema } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getInitialValues()}
				validationSchema={validationSchema}
				enableReinitialize={true}
				render={() => {
					const fields = [
						{
							name: "_person",
							type: fieldTypes.select,
							options: options._person
						},
						{ name: "_teamType", type: fieldTypes.select, options: options.teamTypes },
						{ name: "role", type: fieldTypes.select, options: options.roles },
						{ name: "from", type: fieldTypes.date },
						{ name: "to", type: fieldTypes.date }
					];
					return (
						<Form>
							<div className="form-card grid">
								<h6>Add New Coach</h6>
								{this.renderFieldGroup(fields)}
								<div className="buttons">
									<button type="clear">Clear</button>
									<button type="submit">Add Coach</button>
								</div>
							</div>
						</Form>
					);
				}}
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
export default connect(
	mapStateToProps,
	{ fetchPeopleList, addCoach }
)(AdminTeamAddCoach);
