//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { appendTeamSquad, createTeamSquad } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import Table from "../../Table";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { renderInput } from "~/helpers/formHelper";

class AdminTeamSquadBulkAdderResults extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = _.pick(nextProps, ["parsedList", "squad", "team", "teamType", "year"]);

		//Create or update
		newState.isNew = !newState.squad;

		//Validation Schema
		const validationSchema = _.mapValues(p =>
			Yup.object().shape({
				_player: Yup.mixed()
					.label(`${p.original} Name`)
					.required(),
				name: Yup.object().shape({
					first: Yup.string().label(`${p.original} First Name`),
					last: Yup.string().label(`${p.original} Last Name`)
				}),
				number: Yup.number()
					.min(1)
					.max(99)
					.label(`${p.original} Number`),
				from: Yup.string().label(`${p.original} From`),
				to: Yup.string().label(`${p.original} To`),
				onLoan: Yup.boolean().label(`${p.original} On Loan`)
			})
		);
		newState.validationSchema = Yup.object().shape(validationSchema);

		//Select options, to be used in addition to returned names
		newState.defaultOptions = [
			{ value: "new", label: "Create new player" },
			{ value: "skip", label: "Skip this player" }
		];

		return newState;
	}

	onSubmit(players) {
		const { isNew, squad, team, teamType, year } = this.state;
		const { appendTeamSquad, createTeamSquad } = this.props;

		players = _.map(players, ({ nameSelect, ...p }) => ({ ...p, _id: nameSelect }));

		if (isNew) {
			const values = {
				year,
				_teamType: teamType._id,
				players
			};
			createTeamSquad(team._id, values);
		} else {
			appendTeamSquad(team._id, squad, players);
		}
	}

	getInitialValues() {
		const { parsedList } = this.state;
		return _.mapValues(parsedList, p => {
			const values = {
				number: p.number,
				from: "",
				to: "",
				onLoan: false
			};

			//Get Name Select default
			if (p.options.length) {
				values._player = p.options[0].value;
			} else {
				values._player = "new";
			}

			//Get Name Input defaults
			const name = p.name.split(" ");
			values.name = {
				last: name.pop(),
				first: name.join(" ")
			};

			return values;
		});
	}

	getFieldGroups() {
		const { defaultOptions, parsedList } = this.state;
		const columns = [
			{ key: "colourCode", label: "" },
			{ key: "original", label: "Original", dataUsesTh: true },
			{ key: "name", label: "Name", className: "stretch" },
			{ key: "number", label: "Squad Number" },
			{ key: "onLoan", label: "On Loan" },
			{ key: "from", label: "From" },
			{ key: "to", label: "To" }
		];
		return [
			{
				render: values => {
					const rows = parsedList
						.map((parsedLine, i) => {
							if (!values[i]) {
								return null;
							}

							const { exact, options, original } = parsedLine;

							//Get common field props
							const baseName = name => `${i}.${name}`;
							const disabled = values[i]._player === "skip";

							//Get Row Class Name
							let className;
							if (exact) {
								className = "exact";
							} else if (options.length) {
								className = "approx";
							} else {
								className = "no-match";
							}

							//Get Row Data
							const data = {};

							//Read-only fields, not used by Formik
							data.colourCode = " ";
							data.original = original;

							//Squad Number
							data.number = renderInput({
								name: baseName("number"),
								type: fieldTypes.number,
								disabled
							});

							//Name
							//We make this an array so we can conditionally display
							//the name input fields
							data.name = [
								renderInput({
									name: baseName("_player"),
									type: fieldTypes.select,
									options: [...defaultOptions, ...options]
								})
							];
							if (values[i]._player === "new") {
								data.name.push(
									renderInput({
										name: baseName("name.first"),
										type: fieldTypes.text
									}),
									renderInput({
										name: baseName("name.last"),
										type: fieldTypes.text
									})
								);
							}

							//Loan
							data.onLoan = renderInput({
								name: baseName("onLoan"),
								type: fieldTypes.boolean,
								disabled
							});

							//Dates
							data.from = renderInput({
								name: baseName("from"),
								type: fieldTypes.date,
								disabled
							});
							data.to = renderInput({
								name: baseName("to"),
								type: fieldTypes.date,
								disabled
							});

							return {
								key: i,
								data: _.mapValues(data, content => ({ content })),
								className: `${className} ${disabled ? "disabled" : ""}`
							};
						})
						.filter(r => r);

					return (
						<div className="table-wrapper" key="table">
							<Table
								rows={rows}
								columns={columns}
								defaultSortable={false}
								className="bulk-add-table"
							/>
						</div>
					);
				}
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		return _.reject(values, ({ _player }) => _player === "skip");
	}

	render() {
		const { createTeamSquad, appendTeamSquad } = this.props;
		const { isNew, squad, team, teamType, validationSchema, year } = this.state;

		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: players =>
					createTeamSquad(team._id, { year, _teamType: teamType._id, players }),
				redirectOnSubmit: id => `/admin/teams/${team._id}/squads/${id}`
			};
		} else {
			formProps = {
				onSubmit: players => appendTeamSquad(team._id, squad._id, players)
			};
		}

		return (
			<div className="scroll-x">
				<BasicForm
					alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={true}
					itemType="Players"
					isInitialValid={true}
					validationSchema={validationSchema}
					{...formProps}
				/>
			</div>
		);
	}
}

function mapStateToProps({ people, teams }) {
	const { peopleList } = people;
	const { teamTypes } = teams;
	return { peopleList, teamTypes };
}

AdminTeamSquadBulkAdderResults.propTypes = {
	squad: PropTypes.object,
	parsedList: PropTypes.array.isRequired,
	team: PropTypes.object.isRequired,
	teamType: PropTypes.object.isRequired,
	year: PropTypes.number.isRequired
};

export default connect(mapStateToProps, { appendTeamSquad, createTeamSquad })(
	AdminTeamSquadBulkAdderResults
);
