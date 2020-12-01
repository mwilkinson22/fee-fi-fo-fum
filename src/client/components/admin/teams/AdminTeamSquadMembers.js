//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";
import { Link } from "react-router-dom";

//Actions
import { updatePeople, fetchPeople } from "~/client/actions/peopleActions";
import { fetchTeam } from "~/client/actions/teamsActions";
import { fetchSponsors } from "~/client/actions/sponsorActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";
import Table from "../../Table";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import playerPositions from "~/constants/playerPositions";

//Helpers
import { renderInput } from "~/helpers/formHelper";

class AdminTeamSquadMembers extends Component {
	constructor(props) {
		super(props);

		const { fetchSponsors, sponsorList } = props;
		if (!sponsorList) {
			fetchSponsors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchPeople, fullPeople, team, sponsorList, squad } = nextProps;
		const newState = {
			team,
			squad,
			isLoading: false,
			isLoadingPeople: prevState.isLoadingPeople
		};

		//Check we have the sponsor list
		if (!sponsorList) {
			newState.isLoading = true;
		}

		//Check we have all people
		const peopleToLoad = squad.players
			.map(({ _player }) => _player._id)
			.filter(id => !fullPeople[id]);
		if (peopleToLoad.length) {
			if (!prevState.isLoadingPeople) {
				fetchPeople(peopleToLoad);
				newState.isLoadingPeople = true;
			}

			return newState;
		} else {
			newState.isLoadingPeople = false;
		}

		if (newState.isLoading || newState.isLoadingPeople) {
			return newState;
		}

		//Validation Schema
		const validationSchema = _.chain(squad.players)
			.map(player => {
				const playerLabel = name => `${player._player.name.full} - ${name}`;
				const schema = Yup.object().shape({
					playingPositions: Yup.string().label(playerLabel("Positions")),
					_sponsor: Yup.string().label(playerLabel("Sponsor")),
					twitter: Yup.string().label(playerLabel("Twitter")),
					instagram: Yup.string().label(playerLabel("Instagram")),
					contractedUntil: Yup.string().label(playerLabel("Contracted To"))
				});
				return [player._player._id, schema];
			})
			.fromPairs()
			.value();
		newState.validationSchema = Yup.object().shape(validationSchema);

		//Dropdown Options
		newState.options = {};

		//Positions
		newState.options.positions = _.map(playerPositions, ({ name }, key) => ({
			label: name,
			value: key
		})).filter(o => o.value !== "I");

		//Sponsors
		newState.options._sponsor = _.chain(sponsorList)
			.map(({ name, _id }) => ({ label: name, value: _id }))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { fullPeople } = this.props;
		const { squad } = this.state;

		const defaultValues = {
			playingPositions: [],
			_sponsor: "",
			twitter: "",
			instagram: "",
			contractedUntil: ""
		};

		return _.chain(squad.players)
			.map(({ _player }) => {
				const person = fullPeople[_player._id];

				const values = _.mapValues(defaultValues, (defaultValue, key) => {
					if (!person[key]) {
						return defaultValue;
					}

					switch (key) {
						case "_sponsor":
							return person[key]._id;
						default:
							return person[key];
					}
				});

				return [_player._id, values];
			})
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		const { options, squad } = this.state;

		const columns = [
			{ key: "player", label: "Player", dataUsesTh: true },
			{ key: "playingPositions", label: "Positions" },
			{ key: "_sponsor", label: "Sponsor" },
			{ key: "social", label: "Social" },
			{ key: "contractedUntil", label: "Contracted Until" }
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

							//Get Row Data
							const data = {};

							//Get Read Only Player Name
							data.player = <Link to={`/admin/people/${_id}`}>{name.full}</Link>;

							//Playing Positions
							data.playingPositions = renderInput({
								name: baseName("playingPositions"),
								type: fieldTypes.select,
								isClearable: true,
								isMulti: true,
								isSearchable: false,
								options: options.positions
							});

							//Sponsor
							data._sponsor = renderInput({
								name: baseName("_sponsor"),
								type: fieldTypes.select,
								options: options._sponsor
							});

							//Social
							data.social = (
								<div>
									{renderInput({
										name: baseName("twitter"),
										type: fieldTypes.text,
										placeholder: "Twitter"
									})}
									{renderInput({
										name: baseName("instagram"),
										type: fieldTypes.text,
										placeholder: "Instagram"
									})}
								</div>
							);

							//Contracted Date
							data.contractedUntil = renderInput({
								name: baseName("contractedUntil"),
								type: fieldTypes.number
							});

							return {
								key: _player._id,
								data
							};
						})
						.filter(_.identity)
						.value();

					return (
						<div className="table-wrapper" key="table">
							<Table rows={rows} columns={columns} defaultSortable={false} />
						</div>
					);
				}
			}
		];
	}

	render() {
		const { fetchTeam, updatePeople } = this.props;
		const { isLoading, isLoadingPeople, team, validationSchema } = this.state;

		if (isLoading || isLoadingPeople) {
			return <LoadingPage />;
		}

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Squad"
				onSubmit={async players => {
					await updatePeople(players);
					await fetchTeam(team._id);
				}}
				redirectOnSubmit={() => `/admin/teams/${team._id}/squads`}
				validationSchema={validationSchema}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ sponsors, people, teams }) {
	const { sponsorList } = sponsors;
	const { fullPeople } = people;
	const { fullTeams, teamTypes } = teams;
	return { fullPeople, fullTeams, sponsorList, teamTypes };
}

// export default form;
export default connect(mapStateToProps, { fetchPeople, fetchTeam, updatePeople, fetchSponsors })(
	AdminTeamSquadMembers
);
