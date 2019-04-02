//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";

//Actions
import { fetchPeopleList } from "../../../actions/peopleActions";
import { appendTeamSquad } from "../../../actions/teamsActions";

//Components
import LoadingPage from "../../LoadingPage";
import Select from "../fields/Select";
import Table from "../../Table";

class AdminTeamSquadBulkAdder extends Component {
	constructor(props) {
		super(props);

		const { peopleList, fetchPeopleList } = this.props;

		if (!peopleList) {
			fetchPeopleList();
		}

		this.state = {
			textList: "",
			delimiter: ""
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { peopleList, gender } = nextProps;

		return {
			peopleList: _.chain(peopleList)
				.filter(p => p.gender === gender)
				.map((p, id) => ({
					id,
					name: `${p.name.first} ${p.name.last}`
				}))
				.value()
		};
	}

	handleSubmit(players) {
		const { appendTeamSquad, teamId, squad } = this.props;

		if (squad) {
			appendTeamSquad(teamId, squad, players);
		} else {
			//
		}

		this.setState({
			textList: "",
			delimiter: "",
			parsedList: undefined
		});
	}

	async parseList() {
		const { textList, delimiter, peopleList } = this.state;
		const lines = _.filter(textList.split("\n"), line => line.trim().length);

		if (lines.length === 0) {
			this.setState({
				parsedList: undefined
			});
		} else {
			const parsedList = _.chain(lines)
				.map(line => {
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

					//Get exact matches
					result.exact = _.chain(peopleList)
						.filter(p => p.name.toLowerCase() === result.name.toLowerCase())
						.map(p => {
							return { label: p.name, value: p.id };
						})
						.value();

					//Get Approx matches
					if (result.exact.length === 0) {
						result.approx = _.chain(peopleList)
							.filter(p => {
								let match = false;

								//Remove all non alphanumeric
								match =
									p.name.toLowerCase().replace(/[^A-Za-z]/gi, "") ==
									result.name.toLowerCase().replace(/[^A-Za-z]/gi, "");

								//Try with just the last name
								if (!match) {
									result.name
										.toLowerCase()
										.split(" ")
										.map(str => {
											if (p.name.toLowerCase().includes(str)) {
												match = true;
											}
										});
								}

								return match;
							})
							.map(p => {
								return { label: p.name, value: p.id };
							})
							.value();
					}

					return result;
				})
				.filter(_.identity)
				.sortBy(p => p.number || 9999)
				.value();

			this.setState({ parsedList: parsedList });
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
				if (exact.length) {
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
						if (exact.length) {
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
						if (exact.length) {
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
								options={selectOptions}
								name={selectFieldName}
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

	render() {
		const { peopleList, parsedList } = this.state;
		const { squad } = this.props;
		if (!peopleList) {
			return <LoadingPage />;
		} else {
			const parsed = parsedList ? this.renderParsedList() : null;
			return (
				<div>
					<div className="form-card grid">
						<h6>{squad ? "Add Extra Players" : "Add Players"}</h6>
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
					{parsed}
				</div>
			);
		}
	}
}

function mapStateToProps({ people }, ownProps) {
	const { peopleList } = people;
	return { peopleList, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchPeopleList, appendTeamSquad }
)(AdminTeamSquadBulkAdder);
