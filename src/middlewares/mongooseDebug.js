import { logMongooseTimings } from "~/config/keys";

export function mongooseDebug(schema, logEverything = false) {
	if (logMongooseTimings || logEverything) {
		schema.pre("find", function() {
			this._startTime = Date.now();
		});

		schema.post("find", function() {
			if (this._startTime != null) {
				const collectionName = this.mongooseCollection.name;
				const query = this._conditions;
				const runtime = Date.now() - this._startTime;
				console.info(`--------------------------------------------------------
Collection: ${collectionName}
Query: ${JSON.stringify(query, null, 0)}

Runtime: ${runtime}ms
--------------------------------------------------------`);
			}
		});
	}
}
