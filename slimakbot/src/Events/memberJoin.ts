import { UnixesTimes } from "../db/models/unixesTimes";
import { userModel } from "../db/models/userModel";
import { config, EVENT, util } from "../struct";

const event: EVENT<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  run: async (member, client) => {
    if (member.user.bot) {
      return;
    }

    const mutes = await UnixesTimes.find({ uid: member.id });

    if (mutes) {
      mutes.forEach((entry) => {
        member.roles.add(entry.roleID!);
      });
    }

    await util.findOneOrCreate(
      userModel,
      { uid: member.id },
      { uid: member.id }
    );
  },
};

export default event;
