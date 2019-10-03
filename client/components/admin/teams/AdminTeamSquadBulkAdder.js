//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import Select from "react-select";
import selectStyling from "~/constants/selectStyling";

//Actions
import { parsePlayerList } from "../../../actions/peopleActions";
import { appendTeamSquad, createTeamSquad } from "../../../actions/teamsActions";

//Components
import LoadingPage from "../../LoadingPage";
import Table from "../../Table";

class AdminTeamSquadBulkAdder extends Component {
	constructor(props) {
		super(props);

		this.state = {
			textList: "",
			delimiter: ""
		};
	}

	handleSubmit(players) {
		const {
			appendTeamSquad,
			createTeamSquad,
			resetSquadData,
			teamId,
			squad,
			year,
			teamType
		} = this.props;

		players = _.map(players, ({ nameSelect, ...p }) => ({ ...p, _id: nameSelect.value }));

		if (squad) {
			appendTeamSquad(teamId, squad, players);
			this.setState({
				textList: "",
				delimiter: "",
				parsedList: undefined
			});
		} else {
			createTeamSquad(teamId, { year, _teamType: teamType._id, players });
			resetSquadData();
		}
	}

	async parseList() {
		const { gender, parsePlayerList } = this.props;
		const { textList, delimiter } = this.state;
		const lines = textList.split("\n").filter(line => line.trim().length);

		if (lines.length === 0) {
			this.setState({
				parsedList: undefined
			});
		} else {
			this.setState({
				isLoading: true
			});
			//Get an object with original, name and number
			const parsedLines = lines.map(line => {
				const result = { original: line.trim() };

				//Split the line using delimiter
				let splitLine;
				if (delimiter.length) {
					splitLine = line.trim().split(delimiter);
				} else {
					splitLine = line.trim().split(/(?=[A-Za-z])(.+)/);
				}

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
				gender,
				names: parsedLines.map(p => p.name)
			});

			//Add in the results
			const parsedList = _.chain(parsedLines)
				.map((parsedLine, i) => {
					const { exact, results } = serverResults[i];
					const options = results.map(({ name, extraText, _id }) => ({
						value: _id,
						label: `${name}${extraText ? ` (${extraText})` : ""}`
					}));
					return {
						...parsedLine,
						[exact ? "exact" : "approx"]: options
					};
				})
				.filter(_.identity)
				.sortBy(p => Number(p.number) || 9999)
				.value();

			this.setState({ parsedList, isLoading: false });
		}
	}

	renderParsedList() {
		const { parsedList } = this.state;
		const initialValues = _.chain(parsedList)
			.map((p, key) => {
				const { name, number, exact, approx } = p;
				const values = {
					number: number || "",
					onLoan: false,
					from: "",
					to: ""
				};

				//Name Select
				if (exact && exact.length) {
					values.nameSelect = exact[0];
				} else if (approx && approx.length) {
					values.nameSelect = approx[0];
				} else {
					values.nameSelect = { value: "new", label: "Create new player" };
				}

				//Name String
				const splitName = name.split(" ");
				values.nameString = {
					last: splitName.pop() || "",
					first: splitName.join(" ") || ""
				};

				return [key, values];
			})
			.fromPairs()
			.value();

		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={initialValues}
				enableReinitialize={true}
				render={formikProps => {
					const columns = [
						{ key: "colourCode", label: "" },
						{ key: "original", label: "Original", dataUsesTh: true },
						{ key: "number", label: "#" },
						{ key: "name", label: "Name" },
						{ key: "onLoan", label: "On Loan" },
						{ key: "from", label: "From" },
						{ key: "to", label: "To" }
					];
					const rows = _.map(parsedList, (p, key) => {
						const { original, exact, approx } = p;
						const values = formikProps.values[key];

						//Set Colour Code
						let className;
						if (exact && exact.length) {
							className = "exact";
						} else if (approx && approx.length) {
							className = "approx";
						} else {
							className = "no-match";
						}

						//Get Core Fields
						const data = {};
						data.colourCode = <div className={className} />;
						data.original = original;
						const selectOptions = [
							{ value: "new", label: "Create new player" },
							{ value: "skip", label: "Skip this player" }
						];
						if (exact && exact.length) {
							selectOptions.push({
								label: "Exact matches",
								options: exact
							});
						}
						if (approx && approx.length) {
							selectOptions.push({
								label: "Approx matches",
								options: approx
							});
						}
						const selectFieldName = `${key}.nameSelect`;
						const hideTextFields =
							values && values.nameSelect && values.nameSelect.value === "new";
						data.name = [
							<Field
								component={Select}
								styles={selectStyling}
								options={selectOptions}
								name={selectFieldName}
								value={values.nameSelect}
								onChange={option => {
									formikProps.setFieldValue(selectFieldName, option);
								}}
								key="select"
							/>,
							<Field
								type="text"
								name={`${key}.nameString.first`}
								key="firstName"
								className={hideTextFields ? "" : "hidden"}
								title="First Name"
								placeholder="First Name"
							/>,
							<Field
								type="text"
								name={`${key}.nameString.last`}
								key="lastName"
								className={hideTextFields ? "" : "hidden"}
								title="Last Name"
								placeholder="Last Name"
							/>
						];
						data.number = (
							<Field type="number" min="1" max="99" name={`${key}.number`} />
						);
						data.from = <Field type="date" name={`${key}.from`} />;
						data.to = <Field type="date" name={`${key}.to`} />;
						data.onLoan = (
							<Field
								type="checkbox"
								name={`${key}.onLoan`}
								checked={values ? values.onLoan : false}
							/>
						);

						return {
							key,
							data: _.mapValues(data, content => ({ content })),
							className
						};
					});

					return (
						<Form>
							<div className="form-card">
								<Table
									rows={rows}
									columns={columns}
									defaultSortable={false}
									className="bulk-add-table"
								/>
								<div className="buttons">
									<button type="submit">Submit</button>
								</div>
							</div>
						</Form>
					);
				}}
			/>
		);
	}

	addNewSquadHeader() {
		const { resetSquadData } = this.props;
		return (
			<div>
				<div className="buttons">
					<button onClick={() => resetSquadData()}>Reset Squad Data</button>
				</div>
			</div>
		);
	}

	render() {
		const { parsedList, isLoading } = this.state;
		const { squad, teamType, year } = this.props;

		let content;
		if (isLoading) {
			content = <LoadingPage />;
		} else if (parsedList) {
			content = this.renderParsedList();
		}

		return (
			<div>
				<div className="form-card grid">
					<h6>
						{squad ? "Add Extra Players" : `Add Players to ${year} ${teamType.name}`}
					</h6>
					{!squad && this.addNewSquadHeader()}
					<textarea
						id=""
						rows="20"
						value={this.state.textList}
						onChange={ev => this.setState({ textList: ev.target.value })}
					/>
					<label>Delimiter</label>
					<input
						type="text"
						placeholder="Defaults to regex"
						value={this.state.delimiter}
						onChange={ev => this.setState({ delimiter: ev.target.value })}
					/>
					<div className="buttons">
						<button type="button" onClick={() => this.parseList()}>
							Parse Names
						</button>
					</div>
				</div>
				{content}
			</div>
		);
	}
}

function mapStateToProps({ people, teams }) {
	const { peopleList } = people;
	const { fullTeams } = teams;
	return { peopleList, fullTeams };
}

export default connect(
	mapStateToProps,
	{ parsePlayerList, appendTeamSquad, createTeamSquad }
)(AdminTeamSquadBulkAdder);
