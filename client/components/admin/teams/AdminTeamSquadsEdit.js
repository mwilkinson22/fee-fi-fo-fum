//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";
import { Link } from "react-router-dom";

//Actions
import { updateTeamSquad } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import Table from "../../Table";
import AdminTeamSquadBulkAdder from "./AdminTeamSquadBulkAdder";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { renderInput } from "~/helpers/formHelper";

class AdminTeamSquadsEdit extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { team, squad } = nextProps;
		const newState = { team, squad };

		//Validation Schema
		const validationSchema = _.chain(squad.players)
			.map(player => {
				const playerLabel = name => `${player._player.name.full} - ${name}`;
				const schema = Yup.object().shape({
					number: Yup.string().label(playerLabel("Squad Number")),
					onLoan: Yup.boolean().label(playerLabel("On Loan")),
					from: Yup.string().label(playerLabel("From Date")),
					to: Yup.string().label(playerLabel("To Date")),
					deletePlayer: Yup.boolean().label(playerLabel("Delete Player"))
				});
				return [player._player._id, schema];
			})
			.fromPairs()
			.value();
		newState.validationSchema = Yup.object().shape(validationSchema);

		return newState;
	}

	getInitialValues() {
		const { squad } = this.state;
		const defaultValues = {
			number: "",
			onLoan: false,
			from: "",
			to: "",
			deletePlayer: false
		};

		return _.chain(squad.players)
			.map(player => {
				const values = _.mapValues(defaultValues, (defaultValue, key) => {
					if (player[key] == null) {
						return defaultValue;
					}
					switch (key) {
						case "from":
						case "to":
							return new Date(player[key]).toString("yyyy-MM-dd");
						default:
							return player[key];
					}
				});

				return [player._player._id, values];
			})
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		const { squad } = this.state;

		const columns = [
			{ key: "player", label: "Player", dataUsesTh: true },
			{ key: "number", label: "#" },
			{ key: "onLoan", label: "On Loan" },
			{ key: "from", label: "From" },
			{ key: "to", label: "To" },
			{ key: "deletePlayer", label: "Delete" }
		];

		return [
			{
				render: values => {
					const rows = _.chain(squad.players)
						.sortBy(p => p.number || p._player.name.full)
						.map(({ _player }) => {
							const { _id, name } = _player;
							//Only run if values are present
							//This prevents an error when switching squads
							if (!values[_id]) {
								return null;
							}

							//Get Common Field Props
							const baseName = name => `${_id}.${name}`;
							const disabled = values[_id].deletePlayer;

							//Get Row Data
							const data = {};

							//Get Read Only Player Name
							data.player = <Link to={`/admin/people/${_id}`}>{name.full}</Link>;

							//Squad Number
							data.number = renderInput({
								name: baseName("number"),
								type: fieldTypes.number,
								disabled
							});

							//Loan Status
							data.onLoan = renderInput({
								name: baseName("onLoan"),
								type: fieldTypes.boolean,
								disabled
							});

							//To/From dates
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

							//Delete Boolean
							data.deletePlayer = renderInput({
								name: baseName("deletePlayer"),
								type: fieldTypes.boolean
							});

							return {
								key: _player._id,
								data: _.mapValues(data, content => ({ content })),
								className: disabled ? "disabled" : ""
							};
						})
						.filter(_.identity)
						.value();

					return (
						<Table key="table" rows={rows} columns={columns} defaultSortable={false} />
					);
				}
			}
		];
	}

	render() {
		const { updateTeamSquad } = this.props;
		const { squad, team, validationSchema } = this.state;

		return (
			<div>
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={false}
					itemType="Squad"
					onSubmit={players => updateTeamSquad(team._id, squad._id, players)}
					redirectOnSubmit={() => `/admin/teams/${team._id}/squads`}
					validationSchema={validationSchema}
				/>
				<AdminTeamSquadBulkAdder squad={squad} team={team} />
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teams }) {
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, teamTypes };
}

// export default form;
export default connect(mapStateToProps, { updateTeamSquad })(AdminTeamSquadsEdit);
