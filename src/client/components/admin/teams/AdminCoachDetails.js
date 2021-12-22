//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import { FieldArray } from "formik";

//Components
import Table from "~/client/components/Table";
import BasicForm from "~/client/components/admin/BasicForm";

//Constants
import coachTypes from "~/constants/coachTypes";
import * as fieldTypes from "~/constants/formFieldTypes";

//Actions
import { updatePerson } from "~/client/actions/peopleActions";

//Helpers
import { renderInput } from "~/helpers/formHelper";

class AdminCoachDetails extends Component {
	constructor(props) {
		super(props);

		const { teamList, teamTypes } = props;

		const options = {};
		options.roles = _.map(coachTypes, ({ name, key }) => ({
			value: key,
			label: name + " Coach"
		}));
		options.teams = _.chain(teamList)
			.map(({ _id, name }) => ({ value: _id, label: name.long }))
			.sortBy("label")
			.value();
		options.teamTypes = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(({ _id, name }) => ({ value: _id, label: name }))
			.value();

		const validationSchema = Yup.object().shape({
			additionalCoachStats: Yup.array().of(
				Yup.object().shape({
					_team: Yup.string().label("Team").required(),
					_teamType: Yup.string().label("Team Type").required(),
					role: Yup.string().label("Role").required(),
					from: Yup.date().label("From").required(),
					to: Yup.date().label("To"),
					w: Yup.number().label("Wins").min(0).required(),
					d: Yup.number().label("Draws").min(0).required(),
					l: Yup.number().label("Losses").min(0).required()
				})
			)
		});

		this.state = { options, validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, match } = nextProps;

		const newState = {};

		newState.person = fullPeople[match.params._id];

		return newState;
	}

	renderCoachHistory() {
		const { person } = this.state;
		const { teamList, teamTypes } = this.props;
		let content;

		//Get games
		if (person.coachingRoles && person.coachingRoles.length) {
			const dateFormat = "yyyy/MM/dd";
			content = _.chain(person.coachingRoles)
				.orderBy("from", "desc")
				.map(r => {
					//Set dates
					const team = teamList[r._team].name.long;
					const teamType = teamTypes[r._teamType].name;
					const fromDate = new Date(r.from).toString(dateFormat);
					const toDate = r.to ? new Date(r.to).toString(dateFormat) : "";
					const role = coachTypes.find(({ key }) => key == r.role).name;

					return [
						<label key={r._id + "label"}>
							{fromDate} - {toDate}
						</label>,
						<Link to={`/admin/teams/${r._team}/coaches`} key={r._id + "content"}>
							{team} {teamType} {role} Coach
						</Link>
					];
				})
				.flatten()
				.value();
		} else {
			content = "No coaching data saved";
		}

		return (
			<div className="form-card grid">
				<h6>Coaching Roles</h6>
				{content}
			</div>
		);
	}

	getInitialValues() {
		const additionalCoachStats = this.state.person.additionalCoachStats.map(coachStats => {
			const values = { ...coachStats };
			values.from = values.from.toString("yyyy-MM-dd");
			if (values.to) {
				values.to = values.to.toString("yyyy-MM-dd");
			} else {
				values.to = "";
			}
			return values;
		});

		return { additionalCoachStats };
	}

	getFieldGroups() {
		const { options } = this.state;
		const columns = [
			{ key: "position", label: "Position" },
			{ key: "from", label: "From" },
			{ key: "to", label: "To" },
			{ key: "w", label: "Wins" },
			{ key: "d", label: "Draws" },
			{ key: "l", label: "Losses" },
			{ key: "deleteRecord", label: "" }
		];

		return [
			{
				label: "Coaching History",
				render: values => {
					const rows = _.chain(values.additionalCoachStats)
						.orderBy(["from", "to"], ["desc", "desc"])
						.map((coachStatHistory, i) => {
							const rootName = `additionalCoachStats.${i}`;

							//Get Core Fields
							const data = {};
							data.position = {
								content: [
									renderInput({
										label: "Team",
										type: fieldTypes.select,
										name: `${rootName}._team`,
										options: options.teams,
										isSearchable: true,
										fastField: true
									}),
									renderInput({
										label: "Team",
										type: fieldTypes.select,
										name: `${rootName}._teamType`,
										options: options.teamTypes,
										isSearchable: true,
										fastField: true
									}),
									renderInput({
										label: "Role",
										type: fieldTypes.select,
										name: `${rootName}.role`,
										options: options.roles,
										isSearchable: false,
										fastField: true
									})
								]
							};
							data.from = renderInput({
								label: "From Date",
								type: fieldTypes.date,
								name: `${rootName}.from`,
								required: true
							});
							data.to = renderInput({
								label: "To Date",
								type: fieldTypes.date,
								name: `${rootName}.to`
							});
							data.w = renderInput({
								label: "Wins",
								type: fieldTypes.number,
								name: `${rootName}.w`
							});
							data.d = renderInput({
								label: "Draws",
								type: fieldTypes.number,
								name: `${rootName}.d`
							});
							data.l = renderInput({
								label: "Losses",
								type: fieldTypes.number,
								name: `${rootName}.l`
							});
							data.deleteRecord = (
								<FieldArray name="additionalCoachStats">
									{({ remove }) => (
										<button type="button" onClick={() => remove(i)}>
											✖
										</button>
									)}
								</FieldArray>
							);

							return {
								key: rootName,
								data
							};
						})
						.value();

					return (
						<Table
							key="table"
							rows={rows}
							columns={columns}
							className="full-span"
							defaultSortable={false}
						/>
					);
				}
			},
			{
				fields: [
					{
						name: "additionalCoachStats",
						type: fieldTypes.fieldArray,
						render: ({ push }) => {
							return (
								<button type="button" onClick={() => push(this.getNewRowValues())}>
									Add Row
								</button>
							);
						}
					}
				]
			}
		];
	}

	getNewRowValues() {
		const fields = ["_team", "_teamType", "role", "from", "to", "w", "d", "l"];
		return _.chain(fields)
			.map(field => [field, ""])
			.fromPairs()
			.value();
	}

	render() {
		const { updatePerson } = this.props;
		const { person, validationSchema } = this.state;

		return (
			<div>
				{this.renderCoachHistory()}
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={false}
					itemType="Coaching History"
					onSubmit={values => updatePerson(person._id, values)}
					validationSchema={validationSchema}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people, teams }) {
	const { fullPeople } = people;
	const { teamList, teamTypes } = teams;
	return { fullPeople, teamList, teamTypes };
}
// export default form;
export default connect(mapStateToProps, { updatePerson })(AdminCoachDetails);
