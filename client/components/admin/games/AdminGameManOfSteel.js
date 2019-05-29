//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Form, Formik } from "formik";
import * as Yup from "yup";

//Actions
import { setManOfSteelPoints } from "~/client/actions/gamesActions";

//Helpers
import { processFormFields } from "~/helpers/adminHelper";
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGameManOfSteel extends Component {
	constructor(props) {
		super(props);

		const options = convertTeamToSelect(props.game, props.teamList);

		this.state = { options };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {};
	}

	getDefaults() {
		const { game } = this.props;
		const options = _.chain(this.state.options)
			.map(({ options }) => [...options])
			.flatten()
			.value();

		const currentPoints = _.chain(game.manOfSteel)
			.keyBy("points")
			.mapValues("_player")
			.value();

		const defaults = {
			manOfSteel: {}
		};
		for (let i = 1; i <= 3; i++) {
			defaults.manOfSteel[i] = _.find(options, o => o.value == currentPoints[i]) || "";
		}
		return defaults;
	}

	getValidationSchema() {
		const fieldType = Yup.object()
			.required()
			.test("isUnique", "Player selected twice", function({ value }) {
				return (
					_.chain(this.parent)
						.map("value")
						.filter(o => o == value)
						.value().length <= 1
				);
			});

		return Yup.object().shape({
			manOfSteel: Yup.object().shape({
				1: fieldType.label("1 Point"),
				2: fieldType.label("2 Points"),
				3: fieldType.label("3 Points")
			})
		});
	}

	async onSubmit({ manOfSteel }) {
		const { setManOfSteelPoints, game } = this.props;
		await setManOfSteelPoints(game._id, _.mapValues(manOfSteel, "value"));
	}

	render() {
		const { options } = this.state;
		return (
			<div className="container">
				<Formik
					initialValues={this.getDefaults()}
					onSubmit={values => this.onSubmit(values)}
					validationSchema={values => this.getValidationSchema(values)}
					render={() => {
						const fields = [];
						for (let i = 3; i > 0; i--) {
							fields.push({ name: `manOfSteel.${i}`, type: "Select", options });
						}

						return (
							<Form>
								<div className="form-card grid">
									{processFormFields(fields, this.getValidationSchema())}
									<div className="buttons">
										<button type="reset">Reset</button>
										<button type="submit">Update</button>
									</div>
								</div>
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(
	mapStateToProps,
	{ setManOfSteelPoints }
)(AdminGameManOfSteel);
