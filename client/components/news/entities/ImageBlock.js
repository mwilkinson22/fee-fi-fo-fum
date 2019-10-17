import React, { Component } from "react";

import icons from "megadraft/lib/icons";

import ImageBlockStyle from "megadraft/lib/plugins/image/ImageBlockStyle";

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
			<img
				className="news-inline-image"
				style={ImageBlockStyle.image}
				src={`https://storage.googleapis.com/feefifofum/images/news/inline/${this.props.data.src}`}
				alt=""
			/>
		);
	}
}
