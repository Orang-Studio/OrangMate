import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from './store'
import { PgnInput } from './ui/PgnInput'
import { Review } from './ui/Review'
import { History } from './ui/History'
import { Settings } from './ui/Settings'
import { About } from './ui/About'
import { ProgressOverlay } from './ui/ProgressOverlay'

function Header() {
  const link = ({ isActive }: { isActive: boolean }) =>
    'flex items-center px-2.5 sm:px-3 py-2 text-2xs uppercase tracking-wide border-l border-ink-700 whitespace-nowrap ' +
    (isActive ? 'text-orange-400 bg-ink-800' : 'text-ink-300 hover:text-ink-100')
  return (
    <header className="sticky top-0 z-40 flex items-stretch justify-between border-b border-ink-700 bg-ink-850">
      <NavLink to="/" className="flex items-center gap-2 px-2.5 sm:px-3 py-2 shrink-0">
        <img src="/icons/icon.png" alt="" className="h-5 w-5" />
        {}
        <span className="hidden xs:inline font-semibold tracking-tight">
          Orang<span className="text-orange-400">Mate</span>
        </span>
      </NavLink>
      <nav className="flex items-stretch overflow-x-auto">
        <NavLink to="/" end className={link}>
          New
        </NavLink>
        <NavLink to="/review" className={link}>
          Review
        </NavLink>
        <NavLink to="/history" className={link}>
          History
        </NavLink>
        <NavLink to="/settings" className={link}>
          Settings
        </NavLink>
        <NavLink to="/about" className={link}>
          About
        </NavLink>
      </nav>
    </header>
  )
}

function useThemeAttributes() {
  const boardTheme = useStore((s) => s.settings.boardTheme)
  const pieceSet = useStore((s) => s.settings.pieceSet)
  useEffect(() => {
    document.documentElement.setAttribute('data-board', boardTheme)
    document.documentElement.setAttribute('data-pieces', pieceSet)
  }, [boardTheme, pieceSet])
}

function useAutoNavigate() {
  const analysis = useStore((s) => s.analysis)
  const analyzing = useStore((s) => s.analyzing)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (analysis && !analyzing && location.pathname === '/') {
      navigate('/review')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, analyzing])
}

function RequireAnalysis({ children }: { children: JSX.Element }) {
  const analysis = useStore((s) => s.analysis)
  return analysis ? children : <Navigate to="/" replace />
}

export default function App() {
  useThemeAttributes()
  useAutoNavigate()
  const error = useStore((s) => s.error)

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      {error && (
        <div className="border-b border-cls-blunder/60 bg-cls-blunder/10 px-4 py-2 text-xs text-cls-blunder">
          {error}
        </div>
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PgnInput />} />
          <Route
            path="/review"
            element={
              <RequireAnalysis>
                <Review />
              </RequireAnalysis>
            }
          />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-ink-800 px-4 py-3 text-center text-2xs text-ink-500">
        OrangMate · independent tool, not affiliated with Chess.com or Lichess · engine runs in your
        browser · <NavLink to="/about" className="text-ink-400 hover:text-orange-400">about &amp; licenses</NavLink>
      </footer>
      <ProgressOverlay />
    </div>
  )
}