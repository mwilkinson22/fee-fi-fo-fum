//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Form, Formik } from "formik";
import * as Yup from "yup";

//Actions
import { setMotm } from "~/client/actions/gamesActions";

//Helpers
import { processFormFields } from "~/helpers/adminHelper";
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGameManOfTheMatch extends Component {
	constructor(props) {
		super(props);

		const { game, teamList, localTeam } = props;

		const motmOptions = convertTeamToSelect(game, teamList, false, true);
		const fanMotmOptions = convertTeamToSelect(game, teamList, localTeam, true);

		this.state = { motmOptions, fanMotmOptions };
	}

	getDefaults() {
		const { game } = this.props;
		const { motmOptions, fanMotmOptions } = this.state;
		return {
			_motm:
				_.find(motmOptions[1].options, p => p.value == game._motm) ||
				_.find(motmOptions[2].options, p => p.value == game._motm) ||
				motmOptions[0],
			_fan_motm: _.find(fanMotmOptions, p => p.value == game._fan_motm) || fanMotmOptions[0],
			fan_motm_link: game.fan_motm_link || ""
		};
	}

	getValidationSchema() {
		return Yup.object().shape({
			_motm: Yup.object().label("Man of the Match"),
			_fan_motm: Yup.object().label("Fans' Man of the Match"),
			fan_motm_link: Yup.string().label("Poll Link")
		});
	}

	async onSubmit(values) {
		const { _motm, _fan_motm, fan_motm_link } = values;
		const { game, setMotm } = this.props;
		const newValues = {
			_motm: _motm.value || null,
			_fan_motm: _fan_motm.value || null,
			fan_motm_link: fan_motm_link || null
		};
		await setMotm(game._id, newValues);
	}

	render() {
		const { motmOptions, fanMotmOptions } = this.state;
		return (
			<div className="container">
				<Formik
					initialValues={this.getDefaults()}
					onSubmit={values => this.onSubmit(values)}
					validationSchema={values => this.getValidationSchema(values)}
					render={() => {
						const fields = [
							{ name: "_motm", type: "Select", options: motmOptions },
							{ name: "_fan_motm", type: "Select", options: fanMotmOptions },
							{ name: "fan_motm_link", type: "text" }
						];

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
	{ setMotm }
)(AdminGameManOfTheMatch);
