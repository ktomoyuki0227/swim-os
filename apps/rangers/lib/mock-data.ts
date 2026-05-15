import type { LessonWithInstructor, BookingWithLesson } from "@/types/database"

const now = new Date()

function daysFromNow(days: number) {
  const d = new Date(now)
  d.setDate(d.getDate() + days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

export const MOCK_INSTRUCTOR = {
  id: "mock-instructor-1",
  name: "田中 レイ",
  avatar_url: null,
}

export const MOCK_LESSONS: LessonWithInstructor[] = [
  {
    id: "mock-lesson-1",
    instructor_id: "mock-instructor-1",
    title: "初心者クロール入門",
    description:
      "水が苦手な方・泳げない方向けのクロール基礎レッスンです。\n呼吸法・バタ足・腕の動かし方を丁寧に指導します。",
    price: 3500,
    capacity: 6,
    scheduled_at: daysFromNow(3),
    duration_minutes: 60,
    location: "京都市北区プール",
    status: "published",
    created_at: now.toISOString(),
    instructor: MOCK_INSTRUCTOR,
  },
  {
    id: "mock-lesson-2",
    instructor_id: "mock-instructor-1",
    title: "平泳ぎ・フォーム改善",
    description:
      "平泳ぎのキックとプルを重点的に練習します。\nタイムアップを目指す中級者におすすめです。",
    price: 4000,
    capacity: 4,
    scheduled_at: daysFromNow(5),
    duration_minutes: 90,
    location: "左京区スポーツセンター",
    status: "published",
    created_at: now.toISOString(),
    instructor: MOCK_INSTRUCTOR,
  },
  {
    id: "mock-lesson-3",
    instructor_id: "mock-instructor-1",
    title: "背泳ぎ・バタフライ基礎",
    description:
      "4泳法のうち、背泳ぎとバタフライを集中的に練習します。\n上級者向けの技術指導です。",
    price: 5000,
    capacity: 3,
    scheduled_at: daysFromNow(7),
    duration_minutes: 90,
    location: "右京区温水プール",
    status: "published",
    created_at: now.toISOString(),
    instructor: { id: "mock-instructor-2", name: "山本 カナ", avatar_url: null },
  },
  {
    id: "mock-lesson-4",
    instructor_id: "mock-instructor-1",
    title: "子ども水慣れクラス（4〜6歳）",
    description:
      "水が初めてのお子様でも安心して参加できるクラスです。\n親子で一緒に参加できます。",
    price: 2500,
    capacity: 8,
    scheduled_at: daysFromNow(10),
    duration_minutes: 45,
    location: "伏見区スイミング",
    status: "published",
    created_at: now.toISOString(),
    instructor: MOCK_INSTRUCTOR,
  },
]

export const MOCK_BOOKINGS: BookingWithLesson[] = [
  {
    id: "mock-booking-1",
    lesson_id: "mock-lesson-1",
    swimmer_id: "mock-swimmer-1",
    status: "confirmed",
    stripe_payment_intent_id: null,
    created_at: now.toISOString(),
    lesson: { ...MOCK_LESSONS[0] },
  },
  {
    id: "mock-booking-2",
    lesson_id: "mock-lesson-2",
    swimmer_id: "mock-swimmer-1",
    status: "pending",
    stripe_payment_intent_id: null,
    created_at: now.toISOString(),
    lesson: { ...MOCK_LESSONS[1] },
  },
]
