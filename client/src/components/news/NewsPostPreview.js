import React, { Component } from "react";
import Parser from "html-react-parser";
import { Link } from "react-router-dom";
import "datejs";

export default class NewsPostPreview extends Component {
	generateContent() {
		if (this.props.includeContent) return <div>{Parser(this.props.post.content)}</div>;
		else return null;
	}

	render() {
		const { post } = this.props;
		return (
			<Link to={`/news/post/${post.slug}`}>
				<div
					className="post-preview"
					style={{
						backgroundImage: `url('${post.image}')`
					}}
				>
					<div className="post-content">
						<h5>{post.title}</h5>
						<h6>{new Date(post.dateCreated).toString("dddd dS MMM yyyy H:mm")}</h6>
						{this.generateContent()}
					</div>
				</div>
			</Link>
		);
	}
}
