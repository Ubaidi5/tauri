import { motion } from 'motion/react'
import { ChevronLeft, Copy, Ellipsis, Heart, PenLine, Share, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { MoodPill } from '../components/MoodPicker'
import { OverlayScreen, TopBar } from '../components/OverlayScreen'
import { Pressable } from '../components/Pressable'
import { Sheet } from '../components/Sheet'
import { fullDate, shortTime } from '../lib/date'
import { moodMeta } from '../lib/moods'
import { useNav } from '../lib/nav'
import { useApp } from '../lib/store'
import type { Entry } from '../lib/types'
import { native } from '../native'

export function entryAsText(entry: Entry): string {
  const header = `${entry.title || 'Untitled'}\n${fullDate(entry.createdAt)} · ${moodMeta(entry.mood).label}`
  return `${header}\n\n${entry.body}`.trim()
}

export function EntryView({ id }: { id: string }) {
  const { entries, toggleFavorite, deleteEntry, haptic, showToast } = useApp()
  const { back, open } = useNav()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const entry = entries.find((e) => e.id === id)

  if (!entry) {
    return (
      <OverlayScreen>
        <TopBar left={<BackButton onClick={back} />} />
        <p className="py-24 text-center text-ink-soft">This entry no longer exists.</p>
      </OverlayScreen>
    )
  }

  const share = async () => {
    haptic.impact('light')
    const result = await native.share({ title: entry.title || 'Journal entry', text: entryAsText(entry) })
    if (result === 'copied') showToast('Copied to clipboard')
  }

  const copy = async () => {
    setMenuOpen(false)
    await native.copy(entryAsText(entry))
    haptic.notify('success')
    showToast('Copied to clipboard')
  }

  const favorite = async () => {
    haptic.impact(entry.favorite ? 'light' : 'medium')
    await toggleFavorite(entry.id)
  }

  const remove = async () => {
    setConfirmDelete(false)
    haptic.notify('warning')
    back()
    // Let the screen slide away before the list animates the card out.
    window.setTimeout(() => deleteEntry(entry.id).then(() => showToast('Entry deleted')), 280)
  }

  const words = entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0

  return (
    <OverlayScreen>
      <TopBar
        left={<BackButton onClick={back} />}
        right={
          <>
            <IconButton label={entry.favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={favorite}>
              <motion.span
                key={String(entry.favorite)}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              >
                <Heart
                  className={`size-5.5 transition-colors ${entry.favorite ? 'fill-danger text-danger' : ''}`}
                  strokeWidth={1.8}
                />
              </motion.span>
            </IconButton>
            <IconButton label="Share" onClick={share}>
              <Share className="size-5.5" strokeWidth={1.8} />
            </IconButton>
            <IconButton label="More" onClick={() => setMenuOpen(true)}>
              <Ellipsis className="size-5.5" strokeWidth={1.8} />
            </IconButton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-2xl px-5 pt-7 pb-[calc(env(safe-area-inset-bottom)+4rem)] md:px-6"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <MoodPill mood={entry.mood} />
            <span className="text-[13px] font-medium text-ink-soft">
              {fullDate(entry.createdAt)} · {shortTime(entry.createdAt)}
            </span>
          </div>
          <h1 className="mt-5 font-serif text-[40px] leading-[1.05] tracking-[-0.01em] text-balance md:text-[48px]">
            {entry.title || 'Untitled'}
          </h1>
          <div className="mt-6 text-[17px] leading-[1.7] whitespace-pre-wrap text-ink/90 select-text">
            {entry.body || <span className="text-ink-faint">No words yet.</span>}
          </div>
          <p className="mt-10 border-t border-line pt-4 text-xs font-medium text-ink-faint">
            {words} {words === 1 ? 'word' : 'words'}
            {entry.updatedAt - entry.createdAt > 60_000 && ` · Edited ${shortTime(entry.updatedAt)}`}
          </p>
        </motion.article>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="overflow-hidden rounded-3xl bg-sunken">
          <MenuItem
            icon={<PenLine className="size-5" strokeWidth={1.8} />}
            onClick={() => {
              setMenuOpen(false)
              open({ kind: 'compose', id: entry.id })
            }}
          >
            Edit entry
          </MenuItem>
          <MenuItem icon={<Copy className="size-5" strokeWidth={1.8} />} onClick={copy}>
            Copy text
          </MenuItem>
          <MenuItem
            danger
            icon={<Trash2 className="size-5" strokeWidth={1.8} />}
            onClick={() => {
              setMenuOpen(false)
              haptic.notify('warning')
              window.setTimeout(() => setConfirmDelete(true), 220)
            }}
          >
            Delete entry
          </MenuItem>
        </div>
        <Button variant="secondary" className="mt-3 bg-transparent" onClick={() => setMenuOpen(false)}>
          Cancel
        </Button>
      </Sheet>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this entry?">
        <p className="-mt-2 mb-5 text-center text-[15px] text-ink-soft">This can't be undone.</p>
        <div className="flex flex-col gap-2">
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </OverlayScreen>
  )
}

function BackButton({ onClick }: { onClick(): void }) {
  return (
    <Pressable
      onClick={onClick}
      className="flex h-10 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-[15px] font-medium text-ink-soft"
    >
      <ChevronLeft className="size-6" strokeWidth={1.8} />
      Journal
    </Pressable>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick(): void; children: ReactNode }) {
  return (
    <Pressable
      onClick={onClick}
      aria-label={label}
      scale={0.88}
      className="flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sunken"
    >
      {children}
    </Pressable>
  )
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: ReactNode
  children: ReactNode
  onClick(): void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 w-full items-center gap-3.5 border-b border-line/70 px-5 text-left text-[16px] font-medium transition-colors last:border-b-0 active:bg-line/60 ${
        danger ? 'text-danger' : 'text-ink'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
