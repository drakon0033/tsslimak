import { CategoryChannel, GuildMember, Message, TextChannel } from "discord.js";
import { guildSettings } from "../../db/models/guildSettings";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
  name: "claimvoice",
  cooldown: 2,
  aliases: ["cv", "cvoice", "claimv"],
  example: ["claimvoice"],
  helpInfo: "Команда для получения доступа к приватному войс каналу",
  category: "Voice",
  permission: "User",
  run: async (Client, message, args) => {
    const voiceState = message.member?.voice;

    if (!voiceState) {
      return util.errorMessage(message, {
        text: "Вы должны находиться в войсе",
        reply: true,
      });
    }

    const voiceChannel = voiceState.channel;
    const guildSetts = await guildSettings.findOne({
      gid: message.guild?.id,
    });
    const category = message.guild?.channels.cache.get(
      guildSetts?.vCat!
    ) as CategoryChannel;

    if (voiceChannel?.parentId != category.id) {
      return util.errorMessage(message, {
        text: `Вы можете получить права на войс только в категории \`${category.name}\``,
        reply: true,
      });
    }
    if (voiceChannel.id === guildSetts?.vChannelCreate) {
      return util.errorMessage(message, {
        text: "Вы не можете получить права для этого войса",
        reply: true,
      });
    }

    const permissions = voiceChannel?.permissionOverwrites.cache.find(
      (perm) =>
        perm.type === "member" && perm.allow.has("CREATE_INSTANT_INVITE")
    );
    let voiceOwner: GuildMember;

    try {
      voiceOwner = await message.guild?.members.fetch(permissions?.id!)!;
    } catch (error) {
      util.DiscordErrorHandler(error, {
        cmd,
        message,
      });
      voiceChannel?.permissionOverwrites.edit(message.member!, {
        CREATE_INSTANT_INVITE: true,
        CONNECT: true,
        SPEAK: true,
      });
      permissions?.delete(`claim channel executed by ${message.author.tag}`);
      return message.channel.send(
        `${message.author.toString()}, вы успешно присвоили канал \`${
          voiceChannel?.name
        }\` себе`
      );
    }

    if (voiceOwner.id === message.author.id) {
      return util.errorMessage(message, {
        text: "Вы и так являетесь овнером этого канала",
        reply: true,
      });
    }

    const executedChannel = message.channel as TextChannel;

    if (
      voiceOwner.presence!.status === "offline" &&
      !voiceOwner.voice.channel
    ) {
      permissions?.delete(`claim channel executed by ${message.author.tag}`);
      voiceChannel?.permissionOverwrites.edit(message.member!, {
        CREATE_INSTANT_INVITE: true,
        CONNECT: true,
        SPEAK: true,
      });
      return message.channel.send(
        `${message.author.toString()}, ${voiceOwner.toString()} не в сети, вы получаете права на этот канал`
      );
    } else {
      const addText = `Что бы передать права, ответьте \`передать\`, если хотите отклонить \`отмена\``;
      const sentMessage = await message.channel.send(
        `${voiceOwner.toString()} юзер ${message.author.toString()} хочет забрать доступ к войс каналу \`${
          voiceChannel?.name
        }\`\n${addText}`
      );

      const filter = (msg: Message) => {
        return (
          msg.author.id === voiceOwner.id &&
          ["передать", "отмена"].includes(msg.content)
        );
      };

      message.channel
        .awaitMessages({ filter, max: 1, time: 60000 * 10 })
        .then(async (collected) => {
          const receivedMsg = collected.first();
          switch (receivedMsg?.content) {
            case "передать":
              permissions?.delete(
                `claim channel executed by ${message.author.tag}`
              );
              voiceChannel?.permissionOverwrites.edit(message.member!, {
                CREATE_INSTANT_INVITE: true,
                CONNECT: true,
                SPEAK: true,
              });
              message.channel.send(
                `${message.author.toString()}, вы успешно присвоили канал \`${
                  voiceChannel?.name
                }\` себе`
              );
              executedChannel.bulkDelete([sentMessage, receivedMsg, message]);
              break;
            case "отмена":
              message.channel.send(
                `${message.author.toString()}, вам отказали в запросе на получение прав к каналу \`${
                  voiceChannel?.name
                }\``
              );
              executedChannel.bulkDelete([sentMessage, receivedMsg, message]);
              break;
          }
        })
        .catch(async (error) => {
          message.channel.send(
            `${message.author.toString()}, спустя 1 час, овнер войса так и не ответил на сообщение\n<${
              sentMessage.url
            }>`
          );
        });
    }
  },
};

export default cmd;
