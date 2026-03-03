import React from 'react';
import { T } from '../../theme.js';

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 28, color = T.orange }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${color}25`, borderTop: `3px solid ${color}`,
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, glow, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.bg2, border: `1px solid ${glow ? glow + '50' : T.border}`,
        borderRadius: 14, padding: '18px 20px',
        boxShadow: glow ? `0 0 22px ${glow}18` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── SectionLabel ─────────────────────────────────────────────────────────────
export function SLabel({ icon, children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ color: T.orange, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>
        {icon} {children}
      </span>
      {right && <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>{right}</span>}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function PBar({ pct, color = T.orange, h = 4 }) {
  return (
    <div style={{ background: T.bg3, borderRadius: h, height: h, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        transition: 'width 0.3s ease', boxShadow: `0 0 8px ${color}50`,
      }} />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? T.green : T.bg3,
        border: `1px solid ${value ? T.green : T.border}`,
        cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.2s',
      }} />
    </div>
  );
}

// ── Pill / Badge ──────────────────────────────────────────────────────────────
export function Pill({ color, children }) {
  return (
    <span style={{
      background: color + '20', color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11,
      fontFamily: T.mono, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

// ── Status Box ────────────────────────────────────────────────────────────────
export function StatusBox({ type, text }) {
  const c = { ok: T.green, warn: T.gold, err: T.red, info: T.blue }[type] || T.textMid;
  const ic = { ok: '✓', warn: '⚠', err: '✗', info: 'ℹ' }[type] || '•';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', background: c + '15',
      border: `1px solid ${c}40`, borderRadius: 8,
      color: c, fontFamily: T.mono, fontSize: 11,
    }}>
      <span>{ic}</span><span>{text}</span>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, variant = 'primary', size = 'md', style = {}, type = 'button' }) {
  const variants = {
    primary: { background: `linear-gradient(135deg,${T.orange},#F59E0B)`, color: '#fff', border: 'none', boxShadow: `0 4px 20px ${T.orange}40` },
    secondary: { background: T.bg3, color: T.text, border: `1px solid ${T.border}`, boxShadow: 'none' },
    danger: { background: T.red + '20', color: T.red, border: `1px solid ${T.red}40`, boxShadow: 'none' },
    ghost: { background: 'transparent', color: T.textMid, border: `1px solid ${T.border}`, boxShadow: 'none' },
    success: { background: T.green + '20', color: T.green, border: `1px solid ${T.green}40`, boxShadow: 'none' },
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 11, borderRadius: 8 },
    md: { padding: '10px 22px', fontSize: 12, borderRadius: 10 },
    lg: { padding: '14px 32px', fontSize: 14, borderRadius: 12 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant], ...sizes[size],
        fontFamily: T.mono, fontWeight: 700, letterSpacing: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Text Input ────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: '10px 14px', color: T.text, fontFamily: T.mono, fontSize: 12,
        width: '100%', transition: 'border-color 0.2s',
        ...style,
      }}
    />
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ value, onChange, placeholder, rows = 4, style = {} }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: '10px 14px', color: T.text, fontFamily: T.mono, fontSize: 12,
        width: '100%', resize: 'vertical', transition: 'border-color 0.2s', lineHeight: 1.6,
        ...style,
      }}
    />
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ color: T.text, fontFamily: T.display, fontSize: 28, letterSpacing: 2, marginBottom: 8 }}>{title}</div>
      <div style={{ color: T.textMid, fontSize: 13, marginBottom: action ? 24 : 0 }}>{subtitle}</div>
      {action}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 18,
          padding: 28, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: T.text, fontFamily: T.display, fontSize: 24, letterSpacing: 2 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMid, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
        <Btn variant={variant} size="sm" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// ── Video Status Badge ────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    draft:      { label: 'Draft', cls: 'badge-draft', dot: '○' },
    rendering:  { label: 'Rendering', cls: 'badge-rendering', dot: '◐' },
    published:  { label: 'Published', cls: 'badge-published', dot: '●' },
    failed:     { label: 'Failed', cls: 'badge-failed', dot: '✗' },
  };
  const m = map[status] || map.draft;
  return <span className={`badge ${m.cls}`}>{m.dot} {m.label}</span>;
}
