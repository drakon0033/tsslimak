import { COMMAND, config, maps, util } from "../../struct";
import glob from "glob";
import { promisify } from "util";

const globAsync = promisify(glob);

const cmd: COMMAND = {
	name: "load",
	category: "Dev",
	cooldown: 0,
	example: [`load cmdName cmdCategory`],
	helpInfo: "load any command",
	permission: "Dev",
	run: async (Client, message, args) => {
		try {
			const cmdName = args[0];
			const categoryName = args[1];
			const cmdMap = maps.commands;
			if (cmdMap.has(cmdName)) {
				return util.errorMessage(message, {
					text: `\`${cmdName}\` уже загружена`,
					reply: true,
				});
			}

			const props = (await import(`../../Commands/${categoryName}/${cmdName}`))
				.default as COMMAND;
			cmdMap.set(props.name, props);
			message.channel
				.send(`${message.author.toString()}, команда: \`${props.name}\` была загружена.`)
				.then(msg => {
					msg.delete();
				});
		} catch (error) {
			message.channel.send(`\`\`\`ts\n${error}\`\`\``);
		}
	},
};

export default cmd;
