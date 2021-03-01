//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "~/client/components/LoadingPage";
import PopUpBasicForm from "../PopUpBasicForm";

//Actions
import { fetchPeopleList, createPerson } from "~/client/actions/peopleActions";
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
		this.state = { options, validationSchema, showNonCoaches: false };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { team, peopleList } = nextProps;
		const { showNonCoaches } = prevState;

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
				.filter(p => showNonCoaches || p.isCoach)
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
		const { options, showNonCoaches } = this.state;
		return [
			{
				render: () => (
					<div className="buttons" key="btns">
						<button type="button" onClick={() => this.setState({ showNonCoaches: !showNonCoaches })}>
							{showNonCoaches ? "Hide" : "Show"} Non-Coaches
						</button>
						<button type="button" onClick={() => this.setState({ addNewCoachDialog: true })}>
							Add New Coach
						</button>
					</div>
				)
			},
			{
				fields: [
					{
						name: "_person",
						type: fieldTypes.select,
						options: options._person,
						fastField: false
					},
					{ name: "_teamType", type: fieldTypes.select, options: options.teamTypes },
					{ name: "role", type: fieldTypes.select, options: options.roles },
					{ name: "from", type: fieldTypes.date },
					{ name: "to", type: fieldTypes.date }
				]
			}
		];
	}

	renderNewCoachDialog() {
		const { addNewCoachDialog } = this.state;
		const { createPerson } = this.props;

		if (addNewCoachDialog) {
			const validationSchema = Yup.object().shape({
				name: Yup.object().shape({
					first: Yup.string()
						.label("First Name")
						.required(),
					last: Yup.string()
						.label("Last Name")
						.required()
				}),
				gender: Yup.string()
					.label("Gender")
					.required()
			});

			const fieldGroups = [
				{
					fields: [
						{ name: "name.first", type: fieldTypes.text },
						{ name: "name.last", type: fieldTypes.text },
						{
							name: "gender",
							type: fieldTypes.radio,
							options: [
								{ label: "Male", value: "M" },
								{ label: "Female", value: "F" }
							]
						}
					],
					label: "Add New Coach"
				}
			];

			const initialValues = {
				name: {
					first: "",
					last: ""
				},
				gender: "M",
				isCoach: true
			};
			return (
				<PopUpBasicForm
					onDestroy={() => this.setState({ addNewCoachDialog: false })}
					fieldGroups={fieldGroups}
					initialValues={initialValues}
					isNew={true}
					itemType="Coach"
					onSubmit={async values => {
						//Create new coach
						await createPerson(values);

						//Kill dialog
						this.setState({ addNewCoachDialog: false });
					}}
					validationSchema={validationSchema}
				/>
			);
		}
	}

	render() {
		const { addCoach } = this.props;
		const { isLoading, team, validationSchema } = this.state;

		//Await People List
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div>
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
				{this.renderNewCoachDialog()}
			</div>
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
export default connect(mapStateToProps, { fetchPeopleList, addCoach, createPerson })(AdminTeamAddCoach);
