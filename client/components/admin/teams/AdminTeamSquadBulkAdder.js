//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import AdminTeamSquadBulkAdderResults from "./AdminTeamSquadBulkAdderResults";
import BasicForm from "../BasicForm";

//Actions
import { parsePlayerList } from "../../../actions/peopleActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamSquadBulkAdder extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { team, year, teamType, teamTypes, squad } = nextProps;
		const newState = { team };

		//Create or update
		newState.isNew = !squad;

		//Get current squad, teamType and year
		if (!newState.isNew) {
			newState.squad = squad;
			newState.teamType = teamTypes[squad._teamType];
			newState.year = squad.year;
		} else {
			newState.teamType = teamTypes[teamType];
			newState.year = year;
		}

		//Validation Schema
		newState.validationSchema = Yup.object().shape({
			textList: Yup.string().label("Players"),
			delimiter: Yup.string().label("Delimiter")
		});

		//Get Years To Copy
		const { squads } = team;
		newState.squadsToCopy = _.chain(squads)
			.filter(s => s._teamType == teamType && s.year != year)
			.orderBy(["year"], ["desc"])
			.map(({ _id, year }) => [_id, year])
			.fromPairs()
			.value();

		return newState;
	}

	getInitialValues() {
		return {
			textList: "",
			delimiter: ""
		};
	}

	getFieldGroups() {
		const { squadsToCopy, teamType, year } = this.state;
		const fieldGroups = [{ label: `Add players to ${year} ${teamType.name}` }];

		//Add "Copy" functionality
		if (squadsToCopy && Object.keys(squadsToCopy).length) {
			const options = _.map(squadsToCopy, (year, _id) => (
				<option key={_id} value={_id}>
					{year}
				</option>
			));
			fieldGroups.push({
				render: (values, formikProps) => (
					<select
						key="copy-select"
						className="full-span"
						value="header"
						onChange={ev => this.copySquadToTextArea(ev.target.value, formikProps)}
					>
						<option value="header">Copy Other Squad</option>
						{options}
					</select>
				)
			});
		}

		//Add fields
		fieldGroups.push({
			fields: [
				{ name: "textList", type: fieldTypes.textarea, rows: "20" },
				{ name: "delimiter", type: fieldTypes.text, placeholder: "Defaults to regex" }
			]
		});

		return fieldGroups;
	}

	copySquadToTextArea(id, formikProps) {
		const { team } = this.state;
		const playersToCopy = team.squads.find(s => s._id == id).players;

		const textList = _.chain(playersToCopy)
			.sortBy(p => p.number || p._player.name.first)
			.map(({ _player }) => `${_player.name.first} ${_player.name.last}`)
			.value()
			.join("\n");

		formikProps.setFieldValue("textList", textList);
	}

	async parseList({ textList, delimiter }) {
		const { teamType } = this.state;
		const { parsePlayerList } = this.props;

		//Split the text list into lines
		const lines = textList.split("\n").filter(line => line.trim().length);

		if (lines.length) {
			//Map through the lines and return an object consisting of
			//the original text, the parsed name and the parsed number
			const parsedLines = lines.map(line => {
				const result = { original: line.trim() };

				//Split the line using delimiter
				//Default to regex if none is specified
				const delimiterRegex = new RegExp("(?=[A-Za-z])(.+)");
				const splitLine = line.trim().split(delimiter || delimiterRegex);

				//Get Name and Number
				if (splitLine.length > 1) {
					result.number = splitLine[0].replace(/\D/gi, "");
					result.name = splitLine[1];
				} else {
					result.name = splitLine[0];
				}

				return result;
			});

			//Send it off to the server to get matches
			const serverResults = await parsePlayerList({
				gender: teamType.gender,
				names: parsedLines.map(p => p.name)
			});

			//serverResults will simply be an array of objects with two keys:
			//exact (boolean) and results (array).
			//So before returning, we loop through and join the parsedLines to the results
			return _.chain(parsedLines)
				.map((parsedLine, i) => {
					const { exact, results } = serverResults[i];

					//Get dropdown options
					const options = results.map(({ name, extraText, _id }) => ({
						value: _id,
						label: `${name}${extraText ? ` (${extraText})` : ""}`
					}));

					return {
						...parsedLine,
						exact,
						options
					};
				})
				.filter(_.identity)
				.sortBy(p => Number(p.number) || 9999)
				.value();
		}
	}

	renderParsedList() {
		const { parsedList } = this.state;
		if (parsedList) {
			const props = _.pick(this.state, ["parsedList", "squad", "team", "teamType", "year"]);
			return <AdminTeamSquadBulkAdderResults {...props} />;
		}
	}

	render() {
		const { onReset } = this.props;
		const { validationSchema } = this.state;

		return (
			<div>
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={true}
					itemType="Squad"
					onReset={onReset}
					onSubmit={async values => {
						const parsedList = await this.parseList(values);
						this.setState({ parsedList });
					}}
					submitButtonText="Parse Players"
					validationSchema={validationSchema}
				/>
				{this.renderParsedList()}
			</div>
		);
	}
}

function mapStateToProps({ teams }) {
	const { teamTypes } = teams;
	return { teamTypes };
}

AdminTeamSquadBulkAdder.propTypes = {
	onReset: PropTypes.func,
	squadId: PropTypes.string,
	team: PropTypes.object.isRequired,
	//We must define teamType and year when squad is null
	teamType: PropTypes.string,
	year: PropTypes.number
};

export default connect(mapStateToProps, { parsePlayerList })(AdminTeamSquadBulkAdder);
