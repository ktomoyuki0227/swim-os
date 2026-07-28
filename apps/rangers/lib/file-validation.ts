/**
 * アップロードファイルの実体（マジックナンバー）を検証する。
 * `file.type` はクライアント申告値であり拡張子やContent-Typeの偽装が容易なため、
 * 先頭バイト列を見て実際のファイル形式かどうかを確認する。
 */

type MagicNumberChecker = (bytes: Uint8Array) => boolean

const IMAGE_MAGIC_NUMBERS: Record<string, MagicNumberChecker> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  // WebP: 先頭4バイトが "RIFF"、9〜12バイト目が "WEBP"
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
}

/**
 * ファイルの先頭バイトを読み取り、`declaredType` として申告された画像形式の
 * マジックナンバーと一致するか検証する。対応していない declaredType は常に false。
 */
export async function isValidImageFile(file: File, declaredType: string): Promise<boolean> {
  const checker = IMAGE_MAGIC_NUMBERS[declaredType]
  if (!checker) return false

  const headerSize = 12
  const buffer = await file.slice(0, headerSize).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (bytes.length < headerSize) return false

  return checker(bytes)
}
