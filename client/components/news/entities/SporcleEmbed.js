import React, { Component } from "react";

class SporcleEmbed extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	render() {
		const { height, id } = this.props;
		return (
			<iframe
				className="sporcle-iframe"
				style={{ width: "1px", minWidth: "100%", height: `${height}px` }}
				frameBorder="0"
				src={`https://www.sporcle.com/framed/?v=8&pm&gid=${id}&fid=${id}`}
			></iframe>
		);
	}
}

export default SporcleEmbed;
