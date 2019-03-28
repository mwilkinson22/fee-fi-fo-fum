//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import "datejs";
import Select from "../fields/Select";

//Actions
import { fetchAllTeamTypes, updateTeamSquad } from "../../../actions/teamsActions";

//Components
import Table from "../../Table";

//Helpers
import { processFormFields } from "~/helpers/adminHelper";

class AdminTeamSquads extends Component {
	constructor(props) {
		super(props);

		const { teamTypes, fetchAllTeamTypes } = props;

		if (!teamTypes) {
			fetchAllTeamTypes();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullTeams, slugMap, teamTypes } = nextProps;
		const { slug } = match.params;
		const { id } = slugMap[slug];
		const team = fullTeams[id];
		return { team, teamTypes };
	}

	getValidationSchema() {
		return Yup.object().shape({});
	}

	updateSquad(players) {
		const { team } = this.state;
		const { updateTeamSquad, match } = this.props;
		updateTeamSquad(team._id, match.params.squad, players);
	}

	renderSquadSelector() {
		const { team, teamTypes } = this.state;
		const { match } = this.props;

		const options = _.chain(team.squads)
			.map(squad => {
				const _teamType = _.keyBy(teamTypes, "_id")[squad._teamType];
				return { ...squad, _teamType };
			})
			.orderBy(["year", "sortOrder"], ["desc", "asc"])
			.map(squad => {
				return {
					value: squad._id,
					label: `${squad.year} - ${squad._teamType.name}`
				};
			})
			.value();

		return (
			<Select
				options={[{ value: "new", label: "Add New Squad" }, ...options]}
				onChange={opt =>
					this.props.history.push(`/admin/teams/${team.slug}/squads/${opt.value}`)
				}
				defaultValue={_.find(options, option => option.value === match.params.squad)}
			/>
		);
	}

	renderCurrentSquad() {
		const { team, teamTypes } = this.state;
		const { squad } = this.props.match.params;
		const activeSquad = _.keyBy(team.squads, "_id")[squad];

		//Formik Props
		const initialValues = _.chain(activeSquad.players)
			.map(squadMember => {
				const values = {
					number: squadMember.number || "",
					onLoan: squadMember.onLoan,
					from: squadMember.from ? new Date(squadMember.from).toString("yyyy-MM-dd") : "",
					to: squadMember.to ? new Date(squadMember.to).toString("yyyy-MM-dd") : "",
					delete: false
				};
				return [squadMember._player._id, values];
			})
			.fromPairs()
			.value();
		return (
			<Formik
				validationSchema={() => this.getValidationSchema()}
				onSubmit={values => this.updateSquad(values)}
				initialValues={initialValues}
				enableReinitialize={true}
				render={formikProps => {
					//Table Props
					const columns = [
						{ key: "name", label: "Player", dataUsesTh: true },
						{ key: "number", label: "#" },
						{ key: "onLoan", label: "On Loan" },
						{ key: "from", label: "From" },
						{ key: "to", label: "To" },
						{ key: "delete", label: "Delete" }
					];

					const rows = _.chain(activeSquad.players)
						.sortBy(player => player.number || 99999)
						.map(squadMember => {
							const player = squadMember._player;
							const { name } = player;
							const values = formikProps.values[player._id];

							//Get Core Fields
							const data = {};
							data.name = `${name.first} ${name.last}`;
							data.number = (
								<Field
									component="input"
									type="number"
									min="1"
									max="99"
									name={`${player._id}.number`}
								/>
							);
							data.from = (
								<Field component="input" type="date" name={`${player._id}.from`} />
							);
							data.to = (
								<Field component="input" type="date" name={`${player._id}.to`} />
							);
							data.onLoan = (
								<Field
									type="checkbox"
									name={`${player._id}.onLoan`}
									checked={values ? values.onLoan : false}
								/>
							);
							data.delete = <Field type="checkbox" name={`${player._id}.delete`} />;

							return {
								key: squadMember._id || Math.random(),
								data: _.mapValues(data, content => ({ content }))
							};
						})
						.value();

					return (
						<Form>
							<div className="form-card">
								<h6>
									{activeSquad.year} -{" "}
									{_.keyBy(teamTypes, "_id")[activeSquad._teamType].name}
								</h6>
								<Table rows={rows} columns={columns} defaultSortable={false} />
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

	render() {
		const { teamTypes } = this.state;
		const { squad } = this.props.match.params;
		if (!teamTypes) {
			return null;
		}
		let content;
		if (squad === "new") {
			content = null;
		} else if (squad) {
			content = this.renderCurrentSquad();
		} else {
			content = (
				<div className="block-card team-squad-list">{this.renderSquadSelector()}</div>
			);
		}

		return <div className="container admin-team-squad-page">{content}</div>;
	}
}

//Add Redux Support
function mapStateToProps({ teams }, ownProps) {
	const { slugMap, fullTeams, teamTypes } = teams;
	return { slugMap, fullTeams, teamTypes, ...ownProps };
}

// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllTeamTypes, updateTeamSquad }
)(AdminTeamSquads);
