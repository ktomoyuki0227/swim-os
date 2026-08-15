"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface MemberMenuProps {
  swimmerId: string
  memberName: string
  isAdmin: boolean
  isRemoving: boolean
  onOpen: (id: string) => void
  onRemove: (id: string, name: string) => void
  /** 「詳細・編集」と「削除」の間に差し込む追加メニュー項目(例: 回数券の購入履歴) */
  extraActions?: { label: string; onClick: () => void }[]
}

// 各メニュー項目の高さ目安(全社ルールの44pxタッチターゲットに合わせている)。
// 開く方向(上/下)を決める際の必要スペース見積もりに使う
const MENU_ITEM_HEIGHT = 44

/**
 * 会員の「•••」メニュー(詳細・編集/削除)。元は member-list.tsx 内のローカル
 * コンポーネントだったが、会費管理ページの各種一覧(年会費/月謝マトリクス・
 * 回数券一覧)からも同じメニューを呼び出せるよう共有コンポーネントに切り出した。
 *
 * ドロップダウンは createPortal で document.body 直下に描画する。会費マトリクスの
 * sticky な列/行(position: sticky + z-index)は、それ自体が独立したスタッキング
 * コンテキストを作るため、その内側に描画されたfixed要素はどれだけz-indexを
 * 上げても「祖先のスタッキングコンテキスト止まり」になり、別の祖先(同じz-index
 * 帯の他のsticky要素等)の下に隠れてしまう。portalでDOMツリーごとbody直下に
 * 逃がすことで、どんな祖先の構造が変わっても常に最前面に描画されるようにする。
 */
export function MemberMenu({
  swimmerId,
  memberName,
  isAdmin,
  isRemoving,
  onOpen,
  onRemove,
  extraActions = [],
}: MemberMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const itemCount = 1 + extraActions.length + (isAdmin ? 0 : 1)
  const estimatedMenuHeight = itemCount * MENU_ITEM_HEIGHT

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      // 下に十分な余白があればボタンの下に開く(従来通り)。無い場合は、
      // 上下どちらか広い方に開く。「常に上」「常に下」の固定だと、リストの
      // 先頭付近/末尾付近のどちらかで必ず画面外にはみ出るケースが残るため、
      // ボタンの位置に応じて動的に決める
      const openBelow = spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove
      setMenuPos(
        openBelow
          ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
          : { bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right }
      )
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleScroll() {
      setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("scroll", handleScroll, true)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("scroll", handleScroll, true)
    }
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={isRemoving}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#f2f7fa] hover:text-[#475569] disabled:opacity-50"
        aria-label="メニューを開く"
      >
        <span className="text-base leading-none tracking-tighter">•••</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[140px] overflow-hidden rounded-xl border border-[#dce3ea] bg-white shadow-lg"
          style={{ top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right }}
        >
          <button
            onClick={() => {
              setOpen(false)
              onOpen(swimmerId)
            }}
            className="flex w-full items-center px-4 py-2.5 text-sm text-[#1a2332] transition-colors hover:bg-[#f2f7fa]"
          >
            詳細・編集
          </button>
          {extraActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
              className="flex w-full items-center px-4 py-2.5 text-sm text-[#1a2332] transition-colors hover:bg-[#f2f7fa]"
            >
              {action.label}
            </button>
          ))}
          {!isAdmin && (
            <button
              onClick={() => {
                setOpen(false)
                onRemove(swimmerId, memberName)
              }}
              className="flex w-full items-center px-4 py-2.5 text-sm text-[#c0392b] transition-colors hover:bg-[#fdecea]"
            >
              削除
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
