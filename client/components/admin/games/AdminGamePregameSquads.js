import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../../LoadingPage";
import { fetchYearsWithSquads } from "../../../actions/teamsActions";
import { fetchSquad } from "../../../actions/teamsActions";
import Table from "../../Table";
import { Formik, Form, Field } from "formik";

class AdminGamePregameSquads extends Component {
	constructor(props) {
		super(props);
		const { game, squads } = props;

		this.state = { game };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, fetchYearsWithSquads, fetchSquad, squads } = nextProps;
		const home = game.teams.home._id;
		const away = game.teams.away._id;
		const year = new Date(game.date).getFullYear();

		const newState = { game, squads: {} };

		for (const ha of [home, away]) {
			if (!squads[ha]) {
				fetchYearsWithSquads(ha);
			} else if (!squads[ha][year]) {
				fetchSquad(year, ha);
			} else {
				newState.squads[ha] = squads[ha][year];
			}
		}

		return newState;
	}

	renderRows(ha, values) {
		const { game, squads } = this.state;
		const team = game.teams[ha];
		const squad = squads[team._id];
		return squad.map(player => ({
			key: player._id,
			data: {
				checkbox: {
					content: (
						<Field
							component="input"
							type="checkbox"
							name={`${team._id}.${player._id}]`}
							defaultChecked={values[team._id][player._id]}
						/>
					)
				},
				number: {
					content: player.number || " ",
					sortValue: player.number || 999999999
				},
				first: {
					content: player.name.first
				},
				last: {
					content: player.name.last
				}
			}
		}));
	}

	getDefaults() {
		const { game, squads } = this.state;

		return _.mapValues(squads, (squad, teamId) => {
			const ha = game.teams.home._id === teamId ? "home" : "away";
			return _.chain(squad)
				.map(player => {
					const id = player._id;
					return [id, game.pregameSquads[ha].indexOf(id) > -1];
				})
				.fromPairs()
				.value();
		});
	}

	handleRowClick(elem) {
		while (elem.tagName !== "TR") {
			elem = elem.parentElement;
		}

		console.log(elem);
	}

	renderFoot(values) {
		return {
			last: `Total: ${_.filter(values, value => value).length}`
		};
	}

	render() {
		const { game, squads } = this.state;

		if (Object.keys(squads).length < 2) {
			return <LoadingPage />;
		}

		const columns = [
			{
				key: "checkbox",
				label: "",
				sortable: false
			},
			{
				key: "number",
				label: "#"
			},
			{
				key: "first",
				label: "First Name"
			},
			{
				key: "last",
				label: "Last Name"
			}
		];

		const tableProps = {
			columns,
			defaultAscSort: true,
			sortBy: { key: "number", asc: true }
		};

		return (
			<div className="admin-pregame-squad-page">
				<Formik
					onSubmit={values => console.log(values)}
					initialValues={this.getDefaults()}
					render={formikProps => {
						return (
							<Form>
								<div className="container">
									{["home", "away"].map(ha => {
										return (
											<div key={ha} className="pregame-squad-wrapper">
												<h2>{game.teams[ha].name.short}</h2>
												<Table
													{...tableProps}
													rows={this.renderRows(ha, formikProps.values)}
													foot={this.renderFoot(
														formikProps.values[game.teams[ha]._id]
													)}
													stickyFoot={true}
												/>
											</div>
										);
									})}
								</div>
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

function mapStateToProps({ teams }, ownProps) {
	const { squads } = teams;
	return { squads, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchYearsWithSquads, fetchSquad }
)(AdminGamePregameSquads);
