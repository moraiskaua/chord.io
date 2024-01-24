import getNewChord from '@/app/helpers/getNewChord';
import { prisma } from '@/database/prismadb';
import { NextResponse } from 'next/server';

export const POST = async req => {
  try {
    const body = await req.json();
    const { userEmail, userInput, calculatedPoints } = body;
    const dailyChord = await getNewChord();
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const existingUserChord = await prisma.userChord.findFirst({
      where: {
        userId: user.id,
        dailyChordId: dailyChord.id,
      },
    });

    if (existingUserChord && existingUserChord.correct) {
      return NextResponse.json('User already answered correctly', {
        status: 200,
      });
    }

    if (userInput === dailyChord.name) {
      await prisma.userChord.create({
        data: {
          userId: user.id,
          dailyChordId: dailyChord.id,
          correct: true,
        },
      });

      await prisma.user.update({
        where: {
          email: userEmail,
        },
        data: {
          points: user.points + calculatedPoints,
        },
      });

      return NextResponse.json('Correct chord!', { status: 200 });
    }

    return NextResponse.json('Incorrect chord!', { status: 200 });
  } catch {
    return new NextResponse('Internal server error', { status: 500 });
  }
};
