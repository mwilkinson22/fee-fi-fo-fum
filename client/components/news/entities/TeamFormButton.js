//Modules
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

//Megadraft
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import BooleanSlider from "../../fields/BooleanSlider";
import Radio from "../../fields/Radio";
import PopUpDialog from "../../PopUpDialog";

class TeamFormButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			allCompetitions: true,
			formType: null,
			showForm: false
		};
	}

	onClick(e) {
		e.preventDefault();
		const src = window.prompt("Enter a URL");
		if (!src) {
			return;
		}

		const data = { src: src, type: "video", display: "large" };

		this.props.onChange(insertDataBlock(this.props.editorState, data));
	}

	renderForm() {
		const { allCompetitions, formType } = this.state;
		//Get destroy callback
		const onDestroy = () => this.setState({ showForm: false });

		return (
			<PopUpDialog asGrid={true} onDestroy={onDestroy}>
				<label htmlFor="form-type">Form Type</label>
				<Radio
					name="form-type"
					onChange={ev => this.setState({ formType: ev.target.value })}
					options={[
						{ label: "Head To Head", value: "head-to-head" },
						{ label: "Team", value: "per-team" }
					]}
					value={formType}
				/>
				<label htmlFor="allComps">All Competitions?</label>
				<BooleanSlider
					name="allComps"
					value={allCompetitions}
					onChange={() => this.setState({ allCompetitions: !allCompetitions })}
				/>
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
					<button
						type="button"
						className="confirm"
						disabled={!formType}
						onClick={() => {
							this.props.onChange(
								insertDataBlock(this.props.editorState, {
									allCompetitions,
									formType,
									type: "team-form"
								})
							);
							onDestroy();
						}}
					>
						Add Form
					</button>
				</div>
			</PopUpDialog>
		);
	}

	render() {
		const { showForm } = this.state;

		if (showForm) {
			return this.renderForm();
		} else {
			return (
				<button
					className={this.props.className}
					type="button"
					onClick={() => this.setState({ showForm: true })}
					title={this.props.title}
				>
					<div className="sidemenu__button__icon text">VS</div>
				</button>
			);
		}
	}
}

export default withRouter(TeamFormButton);
