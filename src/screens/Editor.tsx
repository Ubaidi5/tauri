import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { MoodPicker } from '../components/MoodPicker'
import { OverlayScreen, TopBar } from '../components/OverlayScreen'
import { Pressable } from '../components/Pressable'
import { Sheet } from '../components/Sheet'
import { fullDate, shortTime } from '../lib/date'
import { useNav } from '../lib/nav'
import { newEntry, useApp } from '../lib/store'
import type { Entry } from '../lib/types'

export function Editor({ id }: { id?: string }) {
  const { entries, saveEntry, haptic, showToast } = useApp()
  const { back } = useNav()
  const original = useMemo(() => entries.find((e) => e.id === id) ?? newEntry(), [entries, id])
  const [draft, setDraft] = useState<Entry>(original)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const isNew = !id
  const dirty = draft.title !== original.title || draft.body !== original.body || draft.mood !== original.mood
  const canSave = draft.title.trim().length > 0 || draft.body.trim().length > 0
  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0

  // Grow the body field with its content, like a native notes app.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft.body])

  const save = async () => {
    if (!canSave) return
    await saveEntry({ ...draft, title: draft.title.trim(), updatedAt: Date.now() })
    haptic.notify('success')
    showToast(isNew ? 'Entry saved' : 'Changes saved')
    back()
  }

  const cancel = () => {
    if (dirty && canSave) {
      haptic.notify('warning')
      setConfirmOpen(true)
    } else back()
  }

  return (
    <OverlayScreen from="bottom">
      <TopBar
        left={
          <Pressable onClick={cancel} className="h-10 rounded-full px-3 text-[15px] font-medium text-ink-soft">
            Cancel
          </Pressable>
        }
        center={isNew ? 'New entry' : 'Edit entry'}
        right={
          <Pressable
            onClick={save}
            disabled={!canSave}
            className="h-9 rounded-full bg-ink px-4.5 text-[14px] font-semibold text-canvas transition-opacity disabled:opacity-30"
          >
            Save
          </Pressable>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] md:px-6">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[13px] font-medium text-ink-soft"
          >
            {fullDate(draft.createdAt)} · {shortTime(draft.createdAt)}
          </motion.p>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
            className="mt-4 rounded-3xl border border-line bg-surface p-2 shadow-soft"
          >
            <p className="px-2.5 pt-2 pb-1.5 text-[13px] font-semibold text-ink-soft">How did it feel?</p>
            <MoodPicker value={draft.mood} onChange={(mood) => setDraft((d) => ({ ...d, mood }))} />
          </motion.section>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Title"
              autoFocus={isNew}
              enterKeyHint="next"
              maxLength={80}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  bodyRef.current?.focus()
                }
              }}
              className="mt-7 w-full bg-transparent font-serif text-[34px] leading-tight tracking-[-0.01em] outline-none placeholder:text-ink-faint/70"
            />
            <textarea
              ref={bodyRef}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder="Start writing…"
              rows={8}
              className="mt-3 min-h-60 w-full resize-none bg-transparent text-[17px] leading-[1.65] outline-none placeholder:text-ink-faint/70"
            />
          </motion.div>

          <p className="mt-6 text-xs font-medium text-ink-faint tabular-nums">
            {words} {words === 1 ? 'word' : 'words'}
          </p>
        </div>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Discard changes?">
        <p className="-mt-2 mb-5 text-center text-[15px] text-ink-soft">What you wrote since opening will be lost.</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={() => {
              setConfirmOpen(false)
              back()
            }}
          >
            Discard
          </Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Keep editing
          </Button>
        </div>
      </Sheet>
    </OverlayScreen>
  )
}
