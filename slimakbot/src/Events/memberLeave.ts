import { TextChannel } from "discord.js";
import { activatedRoles } from "../db/models/activatedRoles";
import { birthdayModel } from "../db/models/birthday";
import { notifyModel } from "../db/models/notify";
import { Reminders } from "../db/models/reminders";
import { UnixesTimes } from "../db/models/unixesTimes";
import { userModel } from "../db/models/userModel";
import { config, EVENT, util } from "../struct";

const event: EVENT<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  run: async (member, client) => {
    if (member.user?.bot) {
      return;
    }

    const channel = util.getTextChannel(
      config.ids.channelIds.GeneralChat,
      member.guild
    );
    channel
      .send(
        `${member.toString()} (${member.id} | ${
          member.user?.username
        }) Покинул нас 🌹🌹`
      )
      .then((m) => util.deleteMessage(m, 60000 * 10));

    const userData = await userModel.findOne({ uid: member.id });
    const activatedRole = await activatedRoles.findOneAndDelete({
      uid: member.id,
    });

    if (!userData) {
      return;
    }

    if (userData.luv) {
      const luvMember = await member.guild.members.fetch(userData.luv);

      luvMember.roles.remove(config.ids.roleIds.luvRole);

      await userModel.updateOne(
        { uid: luvMember.id },
        {
          luv: null,
        }
      );
    }

    await userModel.deleteOne({ uid: member.id });
    await Reminders.deleteMany({ uid: member.id });
    await notifyModel.deleteOne({ uid: member.id });
    await birthdayModel.deleteOne({ uid: member.id });

    if (activatedRole) {
      const { roleID } = activatedRole;
      member.guild.roles.cache.get(roleID!)?.delete();
    }
  },
};

export default event;
