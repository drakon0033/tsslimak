import { Util } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
  name: "emoji",
  cooldown: 2,
  example: ["emoji serverEmoji"],
  helpInfo: "Команда что бы взять ссылку на эмодзи",
  category: "General",
  permission: "User",
  run: async (Client, message, args) => {
    const possibleEmoji = args[0];

    if (!possibleEmoji) {
      return util.errorMessage(message, {
        text: "Вы не указали эмодзи!",
        reply: true,
      });
    }

    const parsedEmoji = Util.parseEmoji(possibleEmoji);

    if (!parsedEmoji) {
      return util.errorMessage(message, {
        text: "Вы указали неверное эмодзи",
        reply: true,
      });
    }

    const guildEmoji = message.guild?.emojis.cache.find(
      (e) => e.name!.toLowerCase() === parsedEmoji.name.toLowerCase()
    );

    if (!guildEmoji) {
      return util.errorMessage(message, {
        text: "На сервере нет такого эмодзи",
        reply: true,
      });
    }

    message.channel.send({
      content: `${message.author.toString()}, ссылка на эмодзи: ${
        guildEmoji.url
      }`,
    });
  },
};

export default cmd;
