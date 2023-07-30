import chalk from "chalk";
import util from "util";
import { createLogger, format, transports } from "winston";

const customFormat = format.printf(({ level, message, ...metadata }) => {
	let colour;
	switch (level) {
		case "error":
			colour = chalk.red;
			break;
		case "warn":
			colour = chalk.yellow;
			break;
		case "info":
			colour = chalk.blue;
			break;
		case "debug":
			colour = chalk.dim;
			break;
		case "verbose":
			colour = chalk.magenta;
			break;
		case "silly":
			colour = chalk.cyan;
			break;
		default:
			colour = chalk.white;
	}

	let logMessage = message instanceof Error ? message.stack : message;

	delete metadata[Symbol.for("level")];
	delete metadata[Symbol.for("splat")];

	if (Object.keys(metadata).length > 0) {
		let indentedMetadataStr = chalk.hex("#E06C75")("\t\t{\n");

		const nestedfn = (obj: { [x: string]: any }, depth = 3) => {
			const keys = Object.keys(obj);

			keys.forEach((key, i) => {
				const value = obj[key];
				const isLastProp = i === keys.length - 1;
				if (Array.isArray(value)) {
					if (value.length === 0) {
						indentedMetadataStr +=
							"\t".repeat(depth) +
							chalk.hex("#E07C6C")(`${key}: `) +
							chalk.hex("#E06C75")("[]") +
							(!isLastProp ? "," : "") +
							"\n";
					} else {
						indentedMetadataStr +=
							"\t".repeat(depth) +
							chalk.hex("#E07C6C")(`${key}: `) +
							chalk.hex("#E06C75")("[") +
							"\n";
						value.forEach((item, j) => {
							nestedfn(item, depth + 1);
							if (j !== value.length - 1) {
								indentedMetadataStr += ",";
							}
							indentedMetadataStr += "\n";
						});
						indentedMetadataStr +=
							"\t".repeat(depth) +
							chalk.hex("#E06C75")("]") +
							(!isLastProp ? "," : "") +
							"\n";
					}
				} else if (
					typeof value === "object" &&
					value !== null &&
					!util.types.isProxy(value)
				) {
					indentedMetadataStr +=
						"\t".repeat(depth) +
						chalk.hex("#E06C75")(`${key}: `) +
						chalk.hex("#E06C75")("{") +
						"\n";
					nestedfn(value, depth + 1);
					indentedMetadataStr +=
						"\t".repeat(depth) +
						chalk.hex("#E06C75")("}") +
						(!isLastProp ? "," : "") +
						"\n";
				} else {
					indentedMetadataStr +=
						"\t".repeat(depth) +
						chalk.hex("#E07C6C")(`${key}: `) +
						(typeof value === "string"
							? chalk.hex("#98C379")(`"${value}"`)
							: typeof value === "number"
							? chalk.hex("#D19A66")(value)
							: typeof value === "boolean"
							? chalk.hex("#56B6C2")(value)
							: chalk.hex("#56B6C2")(value)) +
						(isLastProp ? "" : ",") +
						"\n";
				}
			});
		};

		nestedfn(metadata, 3);
		indentedMetadataStr += chalk.hex("#E06C75")("\t\t}\n");
		logMessage = `${logMessage}\n${indentedMetadataStr}`;
	}

	return colour(
		`
[START OF ${level.toUpperCase()}]
       ${logMessage}
       Date: ${new Date().toLocaleString()}
[END OF ${level.toUpperCase()}]
      `.padStart(level.length + 1)
	);
});

export const logger = createLogger({
	level: "silly",
	format: customFormat,
	transports: [new transports.Console()]
});

const testSubject = {
	_id: "60d5ec8576e5a5a3c34feaa5",
	serverId: "123456789",
	serverName: "My Server",
	createdBy: {
		_id: "60d5ec8576e5a5a3c34feaa6",
		name: "John"
	},
	cases: {
		whitelist: {
			users: [
				{
					_id: "60d5ec8576e5a5a3c34feaa7",
					name: "Alice"
				}
			],
			roles: [],
			channels: [],
			commands: [
				{
					_id: "60d5ec8576e5a5a3c34feaa8",
					commandName: "kick"
				}
			],
			caseNumber: 1
		},
		blacklist: {
			users: [],
			roles: [],
			channels: [],
			commands: [],
			caseNumber: 2
		},
		actions: [
			{
				_id: "60d5ec8576e5a5a3c34feaa9",
				target: {
					_id: "60d5ec8576e5a5a3c34feaa7",
					name: "Alice"
				},
				executor: {
					_id: "60d5ec8576e5a5a3c34feaa6",
					name: "John"
				},
				type: "BAN",
				reason: "Spamming",
				caseNumber: 1
			}
		]
	},
	createdAt: "2022-01-01T00:00:00.000Z",
	updatedAt: "2022-01-01T00:00:00.000Z",
	__v: 2
};

logger.info("Test subject", testSubject);
