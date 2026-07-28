"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { confirmSession, cancelSession, deleteSession, retryPayment, exportSessionRegistrations } from "@/actions/sessions"
import { saveAsTemplate } from "@/actions/templates"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/toast"

interface SessionActionsProps {
  sessionId: string
  teamId: string
  currentStatus: string
  hasFailedPayments?: boolean
  failedRegistrationIds?: string[]
  isCompetition?: boolean
}

type PendingAction = "confirm" | "cancel" | "delete" | "retry" | null

export function SessionActions({
  sessionId,
  teamId,
  currentStatus,
  hasFailedPayments,
  failedRegistrationIds,
  isCompetition,
}: SessionActionsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [showTemplateInput, setShowTemplateInput] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  const runConfirm = async () => {
    setIsConfirming(true)
    const result = await confirmSession(sessionId)
    if (result.error) {
      showToast(result.error, "error")
    } else if (result.failedPayments) {
      showToast(`開催確定しました（決済失敗 ${result.failedPayments}件 — 再試行ボタンで再決済できます）`, "success")
      setTimeout(() => router.refresh(), 500)
    } else {
      showToast("開催確定しました", "success")
      setTimeout(() => router.refresh(), 500)
    }
    setIsConfirming(false)
  }

  const runCancel = async () => {
    setIsCancelling(true)
    const result = await cancelSession(sessionId)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("セッションを中止しました", "success")
      setTimeout(() => router.refresh(), 500)
    }
    setIsCancelling(false)
  }

  const runDelete = async () => {
    setIsDeleting(true)
    const result = await deleteSession(sessionId)
    if (result.error) {
      showToast(result.error, "error")
      setIsDeleting(false)
    } else {
      showToast("セッションを削除しました", "success")
      router.push(`/teams/${teamId}?tab=sessions`)
    }
  }

  const runRetryAll = async () => {
    if (!failedRegistrationIds?.length) return
    setIsRetrying(true)
    let successCount = 0
    for (const regId of failedRegistrationIds) {
      try {
        const result = await retryPayment(regId)
        if (result.success) successCount++
      } catch {
        // 個別失敗はスキップして次へ
      }
    }
    showToast(
      `${successCount}/${failedRegistrationIds.length}件の再決済が完了しました`,
      successCount > 0 ? "success" : "error"
    )
    setIsRetrying(false)
    router.refresh()
  }

  const handleConfirmedAction = async () => {
    const action = pendingAction
    setPendingAction(null)
    if (action === "confirm") await runConfirm()
    else if (action === "cancel") await runCancel()
    else if (action === "delete") await runDelete()
    else if (action === "retry") await runRetryAll()
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    setIsSavingTemplate(true)
    const result = await saveAsTemplate(sessionId, templateName.trim())
    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast(`テンプレート「${templateName}」を保存しました`, "success")
      setShowTemplateInput(false)
      setTemplateName("")
    }
    setIsSavingTemplate(false)
  }

  const handleExport = async () => {
    setIsExporting(true)
    const result = await exportSessionRegistrations(sessionId)
    if (result.error) {
      showToast(result.error, "error")
    } else if (result.data) {
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename || "export.csv"
      a.click()
      URL.revokeObjectURL(url)
      showToast("CSVをダウンロードしました", "success")
    }
    setIsExporting(false)
  }

  const dialogConfig: Record<
    Exclude<PendingAction, null>,
    { title: string; description?: string; confirmLabel: string; variant: "danger" | "primary"; isLoading: boolean }
  > = {
    confirm: {
      title: "このセッションを開催確定しますか？",
      description: "参加者への決済が一括処理されます。",
      confirmLabel: "開催確定する",
      variant: "primary",
      isLoading: isConfirming,
    },
    cancel: {
      title: "このセッションを中止しますか？",
      description: currentStatus === "confirmed" ? "決済済みの参加者には自動返金されます。" : undefined,
      confirmLabel: "中止する",
      variant: "danger",
      isLoading: isCancelling,
    },
    delete: {
      title: "このセッションを削除しますか？",
      description: "この操作は取り消せません。",
      confirmLabel: "削除する",
      variant: "danger",
      isLoading: isDeleting,
    },
    retry: {
      title: `決済失敗 ${failedRegistrationIds?.length ?? 0}件を再試行しますか？`,
      confirmLabel: "再試行する",
      variant: "primary",
      isLoading: isRetrying,
    },
  }
  const activeDialog = pendingAction ? dialogConfig[pendingAction] : null

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {currentStatus === "open" && (
          <Button
            onClick={() => setPendingAction("confirm")}
            disabled={isConfirming || isCancelling || isDeleting}
            className="flex-1 rounded-full bg-[#0f8a4f] hover:opacity-90"
            style={{ minHeight: "48px" }}
          >
            {isConfirming ? "処理中..." : "開催確定・決済"}
          </Button>
        )}
        <Button
          onClick={() => setPendingAction("cancel")}
          disabled={isConfirming || isCancelling || isDeleting}
          variant="outline"
          className="flex-1 rounded-full border-[#c0392b] text-[#c0392b] hover:bg-[#c0392b]/5"
          style={{ minHeight: "48px" }}
        >
          {isCancelling ? "処理中..." : "セッションを中止"}
        </Button>
      </div>

      {/* Retry failed payments */}
      {hasFailedPayments && failedRegistrationIds && failedRegistrationIds.length > 0 && (
        <Button
          onClick={() => setPendingAction("retry")}
          disabled={isRetrying}
          variant="outline"
          className="w-full rounded-full border-[#c0392b] text-[#c0392b] hover:bg-[#fdecea]"
          style={{ minHeight: "44px" }}
        >
          {isRetrying ? "再決済中..." : `決済失敗 ${failedRegistrationIds.length}件を再試行`}
        </Button>
      )}

      {/* Export (competition) */}
      {isCompetition && (
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="w-full rounded-full border-[#005F8C] text-[#005F8C] hover:bg-[#005F8C]/5"
          style={{ minHeight: "44px" }}
        >
          {isExporting ? "エクスポート中..." : "参加者一覧をCSVエクスポート"}
        </Button>
      )}

      {/* Save as template */}
      {!showTemplateInput ? (
        <button
          type="button"
          onClick={() => setShowTemplateInput(true)}
          className="w-full rounded-full border border-dashed border-[#dce3ea] py-2.5 text-sm text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"
        >
          テンプレートとして保存
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate() }}
            placeholder="テンプレート名（例: 水曜朝練）"
            className="h-10 flex-1 rounded-lg border border-[#dce3ea] px-3 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSavingTemplate || !templateName.trim()}
            className="rounded-lg bg-[#005F8C] px-4 text-sm font-medium text-white hover:bg-[#004E73] disabled:opacity-50"
          >
            {isSavingTemplate ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => { setShowTemplateInput(false); setTemplateName("") }}
            className="rounded-lg border border-[#dce3ea] px-3 text-sm text-[#475569] hover:bg-[#f2f7fa]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={() => setPendingAction("delete")}
        disabled={isDeleting || isConfirming || isCancelling}
        className="w-full rounded-full border border-dashed border-[#c0392b]/40 py-3 text-sm text-[#c0392b]/60 hover:border-[#c0392b] hover:text-[#c0392b] disabled:opacity-40"
      >
        {isDeleting ? "削除中..." : "セッションを削除"}
      </button>

      {activeDialog && (
        <ConfirmDialog
          open={!!pendingAction}
          title={activeDialog.title}
          description={activeDialog.description}
          confirmLabel={activeDialog.confirmLabel}
          variant={activeDialog.variant}
          isLoading={activeDialog.isLoading}
          onConfirm={handleConfirmedAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}
