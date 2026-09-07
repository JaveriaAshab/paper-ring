import Friendship from "../models/Friendship.js";

export async function areFriends(userA, userB) {
  if (String(userA) === String(userB)) return true;

  const friendship = await Friendship.exists({
    users: { $all: [userA, userB] }
  });

  return Boolean(friendship);
}

export async function getFriendIds(userId) {
  const rows = await Friendship.find({ users: userId }).lean();
  return rows.map((row) =>
    row.users.find((id) => String(id) !== String(userId))
  );
}
