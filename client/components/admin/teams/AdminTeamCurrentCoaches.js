//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";
import { Link } from "react-router-dom";

//Components
import BasicForm from "../BasicForm";
import Table from "../../Table";

//Actions
import { updateTeam } from "~/client/actions/teamsActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import coachTypes from "~/constants/coachTypes";

//Helpers
import { renderInput } from "~/helpers/formHelper";

class AdminTeamCurrentCoaches extends Component {
	constructor(props) {
		super(props);

		const roles = _.map(coachTypes, ({ name, key }) => ({ value: key, label: name }));

		this.state = { roles };
	}

	static getDerivedStateFromProps(nextProps) {
		const { team, teamTypes } = nextProps;
		const newState = { team };

		const validationSchema = newState.team.coaches.map(coach => {
			const label = `${coach._person.name.full} (${teamTypes[coach._teamType].name})`;

			return [
				coach._id,
				Yup.object().shape({
					_person: Yup.string().required(),
					_teamType: Yup.string().required(),
					deleteCoach: Yup.bool(),
					from: Yup.string()
						.required()
						.label(`${label} - From Date`),
					to: Yup.string()
						.label(`${label} - To Date`)
						.nullable(),
					role: Yup.mixed()
						.required()
						.label(`${label} - Role`)
				})
			];
		});
		newState.validationSchema = Yup.object().shape(_.fromPairs(validationSchema));

		return newState;
	}

	getInitialValues() {
		const { team, roles } = this.state;
		return _.chain(team.coaches)
			.each(coach => roles.find(({ value }) => value == coach.role))
			.map(coach => {
				const values = {
					_person: coach._person._id,
					_teamType: coach._teamType,
					role: coach.role,
					from: coach.from ? new Date(coach.from).toString("yyyy-MM-dd") : "",
					to: coach.to ? new Date(coach.to).toString("yyyy-MM-dd") : "",
					deleteCoach: false
				};
				return [coach._id, values];
			})
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		const { teamTypes } = this.props;
		const { team, roles } = this.state;
		const columns = [
			{ key: "name", label: "Name", dataUsesTh: true },
			{ key: "role", label: "Role" },
			{ key: "from", label: "From" },
			{ key: "to", label: "To" },
			{ key: "deleteCoach", label: "Delete" }
		];

		return _.chain(team.coaches)
			.groupBy("_teamType")
			.map((coaches, _teamType) => ({ coaches, _teamType }))
			.sortBy(({ _teamType }) => teamTypes[_teamType].sortOrder)
			.map(({ _teamType, coaches }) => {
				return {
					label: teamTypes[_teamType].name,
					render: values => {
						const rows = _.chain(coaches)
							.orderBy(["from", "to"], ["desc", "desc"])
							.map(coach => {
								const { name, slug } = coach._person;

								//Get Core Fields
								const disabled = values[coach._id] && values[coach._id].deleteCoach;
								const data = {};
								data.name = (
									<Link to={`/admin/people/${slug}`}>
										{name.first} {name.last}
									</Link>
								);
								data.role = renderInput({
									label: "Role",
									type: fieldTypes.select,
									name: `${coach._id}.role`,
									options: roles,
									isSearchable: false,
									fastField: true,
									isDisabled: disabled
								});
								data.from = renderInput({
									label: "From Date",
									type: fieldTypes.date,
									name: `${coach._id}.from`,
									required: true,
									disabled
								});
								data.to = renderInput({
									label: "To Date",
									type: fieldTypes.date,
									name: `${coach._id}.to`,
									disabled
								});
								data.deleteCoach = renderInput({
									label: "Delete",
									name: `${coach._id}.deleteCoach`,
									type: fieldTypes.boolean
								});

								return {
									key: coach._id || Math.random(),
									data: _.mapValues(data, content => ({ content }))
								};
							})
							.value();
						return (
							<Table
								key={_teamType + "rows"}
								rows={rows}
								columns={columns}
								className="full-span"
								defaultSortable={false}
							/>
						);
					}
				};
			})
			.value();
	}

	alterValuesBeforeSubmit(values) {
		const coaches = _.chain(values)
			.map((data, _id) => {
				if (!data.deleteCoach) {
					return { ...data, role: data.role.value, _id };
				}
			})
			.filter(_.identity)
			.value();
		return { coaches };
	}

	render() {
		const { updateTeam } = this.props;
		const { team, validationSchema } = this.state;

		return (
			<BasicForm
				alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Coaches"
				onSubmit={values => updateTeam(team._id, values)}
				validationSchema={validationSchema}
			/>
		);
	}
}

function mapStateToProps({ teams }) {
	const { teamTypes } = teams;
	return { teamTypes };
}

export default connect(
	mapStateToProps,
	{ updateTeam }
)(AdminTeamCurrentCoaches);
