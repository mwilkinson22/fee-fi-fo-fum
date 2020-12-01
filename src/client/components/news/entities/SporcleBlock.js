//Modules
import React, { Component } from "react";
import icons from "megadraft/lib/icons";

//Components
import SporcleEmbed from "./SporcleEmbed";

export default class SporcleBlock extends Component {
	constructor(props) {
		super(props);

		this.actions = [
			{
				key: "delete",
				icon: icons.DeleteIcon,
				action: this.props.container.remove
			}
		];
	}

	render() {
		const { height, sporcleId } = this.props.data;
		return (
			<div className="custom-block sporcle-wrapper">
				<SporcleEmbed id={sporcleId} height={height} />
			</div>
		);
	}
}
