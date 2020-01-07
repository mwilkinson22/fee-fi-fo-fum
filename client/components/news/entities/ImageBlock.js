import React, { Component } from "react";
import icons from "megadraft/lib/icons";

export default class ImageBlock extends Component {
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
		return (
			<div className="custom-block image-wrapper">
				<img
					src={`https://storage.googleapis.com/feefifofum/images/news/inline/${this.props.data.src}`}
					alt=""
				/>
			</div>
		);
	}
}
