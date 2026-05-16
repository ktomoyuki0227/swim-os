'use client'

import { useState } from 'react'
import { bulkRecordAttendance } from '@/actions/attendance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'

type AttendanceStatus = 'present' | 'absent' | 'makeup'

interface Member {
  id: string
  name: string
  name_kana: string | null
  current_level: number
  status: string
}

interface Enrollment {
  id: string
  status: string
  members: Member
}

interface ScheduleClass {
  id: string
  name: string
  color: string
  school_id: string
  enrollments: Enrollment[]
}

interface Schedule {
  id: string
  start_time: string
  end_time: string
  classes: ScheduleClass
}

interface AttendanceRecord {
  member_id: string
  status: string
}

interface AttendanceSheetProps {
  schedule: Schedule
  lessonDate: string
  existingRecords: AttendanceRecord[]
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ElementType; class: string }> = {
  present: { label: '出席', icon: CheckCircle2, class: 'bg-green-100 text-green-700 border-green-200' },
  absent: { label: '欠席', icon: XCircle, class: 'bg-red-100 text-red-700 border-red-200' },
  makeup: { label: '振替', icon: RefreshCw, class: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export function AttendanceSheet({ schedule, lessonDate, existingRecords }: AttendanceSheetProps) {
  const members = schedule.classes.enrollments
    .filter((e) => e.status === 'active')
    .map((e) => e.members)

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    existingRecords.forEach((r) => {
      initial[r.member_id] = r.status as AttendanceStatus
    })
    // Default unrecorded members to present
    members.forEach((m) => {
      if (!initial[m.id]) initial[m.id] = 'present'
    })
    return initial
  })

  const [saving, setSaving] = useState(false)

  function toggleStatus(memberId: string) {
    setAttendance((prev) => {
      const current = prev[memberId] ?? 'present'
      const next: AttendanceStatus =
        current === 'present' ? 'absent' : current === 'absent' ? 'makeup' : 'present'
      return { ...prev, [memberId]: next }
    })
  }

  async function handleSave() {
    setSaving(true)
    const records = members.map((m) => ({
      member_id: m.id,
      schedule_id: schedule.id,
      lesson_date: lessonDate,
      status: attendance[m.id] ?? 'present',
    }))

    const result = await bulkRecordAttendance(records)
    setSaving(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('出席を保存しました')
    }
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length
  const makeupCount = Object.values(attendance).filter((s) => s === 'makeup').length

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {schedule.classes.name} &nbsp;
            <span className="text-gray-400 font-normal">
              {schedule.start_time.slice(0, 5)}〜{schedule.end_time.slice(0, 5)}
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-600 font-semibold">{presentCount}出席</span>
              <span className="text-red-500 font-semibold">{absentCount}欠席</span>
              <span className="text-blue-600 font-semibold">{makeupCount}振替</span>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          タップして出席→欠席→振替と切り替えられます（{members.length}名在籍）
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {members.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {members.map((member) => {
              const status = attendance[member.id] ?? 'present'
              const config = STATUS_CONFIG[status]
              const Icon = config.icon
              return (
                <button
                  key={member.id}
                  onClick={() => toggleStatus(member.id)}
                  className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      {member.name_kana && (
                        <p className="text-xs text-gray-400">{member.name_kana}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      {member.current_level}級
                    </Badge>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${config.class}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">
            在籍中の会員がいません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
