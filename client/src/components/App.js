import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { connect } from "react-redux";

class App extends Component {
	render() {
		return (
			<div>
				<h2>Hello, World</h2>
				<p>Let's get started</p>
			</div>
		);
	}
}

export default App;
