import { COMMAND, config, maps, util } from "../../struct";
import glob from "glob";
import { promisify } from "util";

const globAsync = promisify(glob);

const cmd: COMMAND = {
	name: "reload",
	category: "Dev",
	cooldown: 0,
	example: [`reload`],
	helpInfo: "Reload any command",
	permission: "Dev",
	run: async (Client, message, args) => {
		try {
			const cmdName = args[0];
			const cmdMap = maps.commands;
			let cmd;
			if (cmdMap.has(cmdName)) {
				cmd = cmdMap.get(cmdName);
			} else if (
				cmdMap.filter(c => c.aliases != undefined).find(c => c.aliases?.includes(cmdName)!)
			) {
				cmd = cmdMap
					.filter(c => c.aliases != undefined)
					.find(c => c.aliases?.includes(cmdName)!);
			} else {
				return message.channel.send(
					`${message.author.toString()}, я не могу найти команду/алиас: \`${cmdName}\`.`
				);
			}

			delete require.cache[
				require.resolve(`../../Commands/${cmd?.category}/${cmd?.name}.js`)
			];
			cmdMap.delete(cmd?.name!);
			const props = (await import(`../../Commands/${cmd?.category}/${cmd?.name}`))
				.default as COMMAND;
			cmdMap.set(props.name, props);
			message.channel
				.send(`${message.author.toString()}, команда: \`${cmd?.name}\` перезагружена.`)
				.then(msg => {
					util.deleteMessage(msg, 2500);
				});
		} catch (error) {
			message.channel.send(`\`\`\`ts\n${error}\`\`\``);
		}
	},
};

export default cmd;
