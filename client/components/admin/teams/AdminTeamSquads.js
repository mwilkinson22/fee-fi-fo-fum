//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Link, Redirect } from "react-router-dom";
import Select from "react-select";
import selectStyling from "~/constants/selectStyling";

//Actions
import { updateTeamSquad } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import Table from "../../Table";
import AdminTeamSquadBulkAdder from "./AdminTeamSquadBulkAdder";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamSquads extends BasicForm {
	constructor(props) {
		super(props);

		const validationSchema = Yup.object().shape({
			year: Yup.number()
				.required()
				.min(1895)
				.max(new Date().getFullYear() + 1)
				.label("Year"),
			teamType: Yup.string()
				.required()
				.label("Team Type")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullTeams, slugMap, teamTypes } = nextProps;
		const { slug } = match.params;
		const { id } = slugMap[slug];
		const team = fullTeams[id];
		return {
			team,
			teamTypes
		};
	}

	updateSquad(players) {
		const { team } = this.state;
		const { updateTeamSquad, match } = this.props;
		updateTeamSquad(team._id, match.params.squad, players);
	}

	renderSquadSelector() {
		const { team, teamTypes } = this.state;
		const { match } = this.props;

		const teamTypeOptions = _.chain(team.squads)
			.map(squad => {
				const _teamType = teamTypes[squad._teamType];
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

		const options = [{ value: "new", label: "Add New Squad" }, ...teamTypeOptions];

		return (
			<Select
				styles={selectStyling}
				options={options}
				onChange={opt => {
					this.props.history.push(`/admin/teams/${team.slug}/squads/${opt.value}`);
					this.setState({ newSquadData: undefined });
				}}
				defaultValue={_.find(options, option => option.value === match.params.squad)}
			/>
		);
	}

	renderNewSquadFields() {
		const { teamTypes } = this.props;
		const { newSquadData, newSquadError, team, validationSchema } = this.state;
		if (!newSquadData) {
			const initialValues = {
				year: new Date().getFullYear(),
				teamType: ""
			};
			const options = _.chain(teamTypes)
				.values()
				.sortBy("sortOrder")
				.map(t => ({ label: t.name, value: t._id }))
				.value();

			const fields = [
				{ name: "year", type: fieldTypes.number },
				{ name: "teamType", type: fieldTypes.select, options }
			];
			return (
				<Formik
					validationSchema={validationSchema}
					initialValues={initialValues}
					onSubmit={values => this.handleNewSquadFields(values)}
					render={() => (
						<Form>
							<div className="form-card grid">
								<h6>New Squad</h6>
								{this.renderFieldGroup(fields)}
								<div className="buttons">
									<button type="submit">Add Players</button>
								</div>
								{newSquadError}
							</div>
						</Form>
					)}
				/>
			);
		} else {
			const { teamType, year } = newSquadData;
			const teamTypeObject = teamTypes[teamType.value];
			return (
				<AdminTeamSquadBulkAdder
					teamId={team._id}
					gender={teamTypeObject.gender}
					year={year}
					teamType={teamTypeObject}
					resetSquadData={() => this.setState({ newSquadData: undefined })}
				/>
			);
		}
	}

	handleNewSquadFields(values) {
		const { year, teamType } = values;
		const { team } = this.state;
		const teamExists = _.find(
			team.squads,
			s => s.year == year && s._teamType == teamType.value
		);

		if (teamExists) {
			this.setState({
				newSquadError: (
					<div className="error">
						This squad already exists.{" "}
						<Link
							to={`/admin/teams/${team.slug}/squads/${teamExists._id}`}
							onClick={() => this.setState({ newSquadError: undefined })}
						>
							Click here
						</Link>{" "}
						to edit it or add new players
					</div>
				)
			});
		} else {
			this.setState({ newSquadData: values, newSquadError: undefined });
		}
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
					deletePlayer: false
				};
				return [squadMember._player._id, values];
			})
			.fromPairs()
			.value();
		return (
			<Formik
				key="currentSquad"
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
						{ key: "deletePlayer", label: "Delete" }
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
							data.deletePlayer = (
								<Field type="checkbox" name={`${player._id}.deletePlayer`} />
							);

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
									{activeSquad.year} - {teamTypes[activeSquad._teamType].name}
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
		const { team } = this.state;
		const { teamTypes, match } = this.props;
		const squads = _.keyBy(team.squads, "_id");
		const { squad } = match.params;

		//Determine page type
		let pageType;
		switch (squad) {
			case "new":
				pageType = "new";
				break;
			case undefined:
				pageType = "root";
				break;
			default:
				if (!squads[squad]) {
					return <Redirect to={`/admin/teams/${team.slug}/squads`} />;
				} else {
					pageType = "edit";
				}
				break;
		}

		//Determine Content
		let content;
		if (pageType === "new") {
			content = this.renderNewSquadFields();
		} else if (pageType === "edit") {
			const { _teamType } = squads[squad] || {};
			content = [
				this.renderCurrentSquad(),
				<AdminTeamSquadBulkAdder
					key="bulk"
					squad={squad}
					teamId={team._id}
					gender={teamTypes[_teamType].gender}
				/>
			];
		}

		//Render
		return (
			<div className="container admin-team-squad-page">
				<div className="block-card team-squad-list">{this.renderSquadSelector()}</div>
				{content}
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teams }) {
	const { slugMap, fullTeams, teamTypes } = teams;
	return { slugMap, fullTeams, teamTypes };
}

// export default form;
export default connect(
	mapStateToProps,
	{ updateTeamSquad }
)(AdminTeamSquads);
