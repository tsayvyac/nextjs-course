"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const syncUser = async () => {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;
    const existedUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (existedUser) return existedUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: user.fullName,
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.log(error);
  }
};

export const getUserByClerkId = async (clerkId: string) => {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
};

export const getDbUserId = async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  return user.id;
};

export const getRandomUsers = async () => {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          { NOT: { followers: { some: { followerId: userId } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.error("Error fetching random users: ", error);
    return [];
  }
};

export const toggleFollow = async (targetId: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;
    if (userId === targetId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetId,
          },
        }),
        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetId,
            creatorId: userId,
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow", error);
    return { success: false, error: "Error in toggleFollow" };
  }
};
