//Modules
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

//Megadraft
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import PopUpDialog from "../../PopUpDialog";
import SporcleEmbed from "./SporcleEmbed";
import SporcleIcon from "./SporcleIcon";

class SporcleButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showInput: false,
			sporcleId: "",
			previewSporcleId: null,
			height: 500
		};
	}

	onClick(e) {
		e.preventDefault();
		const src = window.prompt("Enter a URL");
		if (!src) {
			return;
		}

		const data = { src: src, type: "sporcle", display: "large" };

		this.props.onChange(insertDataBlock(this.props.editorState, data));
	}

	renderInput() {
		const { height, previewSporcleId, sporcleId } = this.state;

		//Get destroy callback
		const onDestroy = () =>
			this.setState({ showInput: false, sporcleId: "", previewSporcleId: null });

		//Render preview
		let previewQuiz;
		if (previewSporcleId) {
			previewQuiz = (
				<div className="full-span sporcle-preview">
					{<SporcleEmbed id={previewSporcleId} height={height} />}
				</div>
			);
		}

		return (
			<PopUpDialog asGrid={true} onDestroy={onDestroy}>
				<label>Sporcle Quiz ID</label>
				<input
					type="text"
					onChange={ev =>
						this.setState({ sporcleId: ev.target.value, previewSporcleId: null })
					}
				/>
				<label>Height (px)</label>
				<input
					type="number"
					value={height}
					onChange={ev =>
						this.setState({ height: ev.target.value, previewSporcleId: null })
					}
				/>
				{previewQuiz}
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => this.setState({ previewSporcleId: sporcleId })}
					>
						Preview
					</button>
					<button
						type="button"
						className="confirm"
						disabled={!sporcleId.length}
						onClick={() => {
							this.props.onChange(
								insertDataBlock(this.props.editorState, {
									sporcleId,
									height,
									type: "sporcle"
								})
							);
							onDestroy();
						}}
					>
						Add Quiz
					</button>
				</div>
			</PopUpDialog>
		);
	}

	render() {
		const { showInput } = this.state;

		if (showInput) {
			return this.renderInput();
		} else {
			return (
				<button
					className={this.props.className}
					type="button"
					onClick={() => this.setState({ showInput: true })}
					title={this.props.title}
				>
					<div className="sidemenu__button__icon">
						<SporcleIcon />
					</div>
				</button>
			);
		}
	}
}

export default withRouter(SporcleButton);
