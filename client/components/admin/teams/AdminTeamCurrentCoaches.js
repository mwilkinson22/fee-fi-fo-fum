//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import { Link } from "react-router-dom";
import Select from "react-select";

//Components
import BasicForm from "../BasicForm";
import Table from "../../Table";

//Actions
import { updateCoaches } from "~/client/actions/teamsActions";

//Constants
import selectStyling from "~/constants/selectStyling";
import coachTypes from "~/constants/coachTypes";

class AdminTeamCurrentCoaches extends BasicForm {
	constructor(props) {
		super(props);

		const roles = _.map(coachTypes, ({ name, key }) => ({ value: key, label: name }));

		this.state = { roles };
	}

	static getDerivedStateFromProps(nextProps) {
		const { team } = nextProps;
		return { team };
	}

	getInitialValues() {
		const { team, roles } = this.state;
		return _.chain(team.coaches)
			.each(coach => roles.find(({ value }) => value == coach.role))
			.map(coach => {
				const values = {
					_person: coach._person._id,
					_teamType: coach._teamType,
					role: roles.find(({ value }) => value == coach.role),
					from: coach.from ? new Date(coach.from).toString("yyyy-MM-dd") : "",
					to: coach.to ? new Date(coach.to).toString("yyyy-MM-dd") : "",
					deleteCoach: false
				};
				return [coach._id, values];
			})
			.fromPairs()
			.value();
	}

	handleSubmit(fValues) {
		const { team } = this.state;
		const { updateCoaches } = this.props;
		const values = _.chain(fValues)
			.cloneDeep()
			.mapValues(fields => {
				return _.mapValues(fields, (val, key) => {
					if (key == "role") {
						return val.value;
					} else {
						return val;
					}
				});
			})
			.value();

		updateCoaches(team._id, values);
	}

	render() {
		const { teamTypes } = this.props;
		const { team, roles } = this.state;

		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getInitialValues()}
				enableReinitialize={true}
				render={formikProps => {
					//Table Props
					const columns = [
						{ key: "name", label: "Name", dataUsesTh: true },
						{ key: "role", label: "Role" },
						{ key: "from", label: "From" },
						{ key: "to", label: "To" },
						{ key: "deleteCoach", label: "Delete" }
					];

					const content = _.chain(team.coaches)
						.groupBy("_teamType")
						.map((coaches, _teamType) => ({ coaches, _teamType }))
						.sortBy(({ _teamType }) => teamTypes[_teamType].sortOrder)
						.map(({ _teamType, coaches }) => {
							const rows = _.chain(coaches)
								.orderBy(["from", "to"], ["desc", "desc"])
								.map(coach => {
									const { name, slug } = coach._person;

									//Get Core Fields
									const data = {};
									data.name = (
										<Link to={`/admin/people/${slug}`}>
											{name.first} {name.last}
										</Link>
									);
									data.role = (
										<Select
											styles={selectStyling}
											options={roles}
											onChange={opt =>
												formikProps.setFieldValue(`${coach._id}.role`, opt)
											}
											defaultValue={roles.find(
												({ value }) => value == coach.role
											)}
										/>
									);
									data.from = (
										<Field
											component="input"
											type="date"
											name={`${coach._id}.from`}
											required={true}
										/>
									);
									data.to = (
										<Field
											component="input"
											type="date"
											name={`${coach._id}.to`}
										/>
									);
									data.deleteCoach = (
										<Field type="checkbox" name={`${coach._id}.deleteCoach`} />
									);

									return {
										key: coach._id || Math.random(),
										data: _.mapValues(data, content => ({ content }))
									};
								})
								.value();

							return [
								<h6 key={_teamType + "header"}>{teamTypes[_teamType].name}</h6>,
								<Table
									key={_teamType + "rows"}
									rows={rows}
									columns={columns}
									defaultSortable={false}
								/>
							];
						})

						.value();

					return (
						<Form>
							<div className="form-card">
								{content}
								<div className="buttons">
									<button type="clear">Clear</button>
									<button type="submit">Submit</button>
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
function mapStateToProps({ teams }) {
	const { teamTypes } = teams;
	return { teamTypes };
}

// export default form;
export default connect(
	mapStateToProps,
	{ updateCoaches }
)(AdminTeamCurrentCoaches);
