import { Message, MessageEmbed, TextChannel, Util } from "discord.js";
import { Giveaway } from "../../db/models/giveaway";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "test",
	category: "Dev",
	cooldown: 0,
	example: [`test`],
	helpInfo: "Command for test purposes",
	permission: "Dev",
	run: async (Client, message, args) => {
		// const desc =
		// 	"**Серверные каналы**  \\🍥" +
		// 	"\n\n" +
		// 	"⠀⠀<#646608947624542208> — Основной чат сервера\n" +
		// 	"⠀⠀<#646609398298443776> — Скрины, видосы и прочее\n" +
		// 	"⠀⠀<#646610423466164224> — Управление ботами тут\n" +
		// 	"⠀⠀<#681072969635856385> — Кодинг, и прочее\n" +
		// 	"⠀⠀<#681072890489339914> — Виабу спешил канал \\🌸\n" +
		// 	"⠀⠀<#800702354902220810> — Пасты с интернета\n\n" +
		// 	'⠀⠀<#650657007787048960> — Красивые ("aesthetic") пикчи\n' +
		// 	"⠀⠀<#646609815744937985> — <:peepoCute:855913570528002068>";
		// const embed2 = new MessageEmbed()
		// 	.setColor(config.colors.embedBlankColor)
		// 	.setDescription(desc)
		// 	.setImage("https://i.imgur.com/6L2sWf4.png");
		// const embed1 = new MessageEmbed()
		// 	.setColor(config.colors.embedBlankColor)
		// 	.setImage("https://i.imgur.com/rlIHmck.png");
		// const desc2 =
		// 	"**Роли получаемые за роли** \\🍨" +
		// 	"\n\n" +
		// 	"⠀⠀<@&653700199453032478>\n" +
		// 	"⠀⠀<@&653700212518551583>\n" +
		// 	"⠀⠀<@&653700214913237022>\n" +
		// 	"⠀⠀<@&653700217228623873>\n" +
		// 	"⠀⠀<@&651553004587057162>\n" +
		// 	"⠀⠀<@&747530367065391129>\n";
		// const embed3 = new MessageEmbed()
		// 	.setColor(config.colors.embedBlankColor)
		// 	.setDescription(desc2)
		// 	.setImage("https://i.imgur.com/6L2sWf4.png");
		// const desc3 =
		// 	"**Игровые роли** \\🥥" +
		// 	"\n\n" +
		// 	"⠀⠀<@&855828692973518848> — 🌈\n" +
		// 	"⠀⠀<@&855827000404869120> — <:overwatch:855832414139842570>\n" +
		// 	"⠀⠀<@&855826998467231745> — <:valorant:703785019293958224>\n" + // val
		// 	"⠀⠀<@&855826996806680576> — <a:cod:855832413883203605>\n" + // cod war
		// 	"⠀⠀<@&855826995182567474> — <:apex:855832414000775168>\n" + // apex
		// 	"⠀⠀<@&855826993101930547> — <:fortnite:703785062658998273>\n\n" + // fortnite
		// 	"⠀⠀<@&855826991400222750> — <:CSGO:703783345754079392>\n" + // cs go
		// 	"⠀⠀<@&855826985682599946> — <:eft:732979615143952515>\n" + // eft
		// 	"⠀⠀<@&821483293614669835> — <:lol:855832414136172544>\n" + // lol
		// 	"⠀⠀<@&788450803987775538> — <:osu:703783492483285055>\n" + // osu
		// 	"⠀⠀<@&788449204933754930> — <:dota2:703785090513371156>\n" + // d2
		// 	"⠀⠀<@&788449199132770357> — <:genshin:855832414064738324>\n"; // genshin
		// const embed4 = new MessageEmbed()
		// 	.setColor(config.colors.embedBlankColor)
		// 	.setDescription(desc3)
		// 	.setImage("https://i.imgur.com/6L2sWf4.png");
		// for (let i = 0; i < 4; i++) {
		// 	switch (i) {
		// 		case 0:
		// 			message.channel.send(embed1);
		// 			break;
		// 		case 1:
		// 			message.channel.send(embed2);
		// 			break;
		// 		case 2:
		// 			message.channel.send(embed3);
		// 			break;
		// 		case 3:
		// 			message.channel.send(embed4);
		// 			break;
		// 	}
		// }
		// const desc5 =
		// 	`**Парочка ролей которые вы можете себе взять** \\🥡` +
		// 	`\n\n` +
		// 	`⠀⠀<@&681073372771516437>\n` + // anime
		// 	`⠀⠀<@&681073373987864597>\n` + // coding
		// 	`⠀⠀<@&832299415590010901>\n` + // boost
		// 	`\nВзяв **роль** **<@&832299415590010901>** вы будете получать пинги от ${Client.user?.toString()}\nкогда будет возможность забустить сервер.`;
		// const embed5 = new MessageEmbed()
		// 	.setColor(config.colors.embedBlankColor)
		// 	.setDescription(desc5)
		// 	.setImage("https://i.imgur.com/6L2sWf4.png");
		// message.channel.send(embed5);
		// message.delete();
		// const desc6 =
		// 	`**Оповещения о стримерских событиях у <@303273346009923586>** \\🧊\n\n` +
		// 	`⠀⠀<@&863630160425910273> - 🌺` +
		// 	`\n\nЯ (<@303273346009923586>) буду упоминать вас при старте стрима\nили новостей связанных с твич в канале: <#863631727595618346>.`;
		// const embed6 = new MessageEmbed()
		// 	.setColor(config.colors.embedBlankColor)
		// 	.setDescription(desc6)
		// 	.setImage("https://i.imgur.com/6L2sWf4.png");
		// message.channel.send(embed6);
		// message.delete();
	},
};

export default cmd;
