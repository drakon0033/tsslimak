import strftime from "strftime";

class MessageLogger {
	time = strftime.timezone(180);
	log = console.log;
	constructor() {}

	message(message: string) {
		this.log(`[${this.time("%F %T", new Date())}] ` + message);
	}
}

export const logger = new MessageLogger();
