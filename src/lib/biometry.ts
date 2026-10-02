import { Fingerprint, ScanEye, ScanFace, type LucideIcon } from 'lucide-react'
import type { BiometryKind, Platform } from '../native/types'

export function biometryLabel(kind: BiometryKind, platform: Platform): string {
  const apple = platform === 'ios'
  switch (kind) {
    case 'face':
      return apple ? 'Face ID' : 'Face unlock'
    case 'fingerprint':
      return apple ? 'Touch ID' : 'Fingerprint'
    case 'iris':
      return 'Iris unlock'
    default:
      return 'Biometrics'
  }
}

export function biometryIcon(kind: BiometryKind): LucideIcon {
  if (kind === 'face') return ScanFace
  if (kind === 'iris') return ScanEye
  return Fingerprint
}
