import { useTheme } from "../context/ThemeContext"
import { Sun, Moon, Link } from "lucide-react"

interface NavbarProps {
  title: string
  subtitle?: string
  isConnected: boolean
  address?: string
  onConnect?: () => void
}

export default function Navbar({ title, subtitle, isConnected, address, onConnect }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div style={styles.header}>
      <div style={styles.brandGroup}>
         {/* Logo Placeholder or Icon */}
         <div style={styles.logoBox}>
            <div style={styles.logoDot} />
         </div>
      </div>

      <div style={styles.centerGroup}>
         <span style={styles.title}>{title}</span>
         {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>

      <div style={styles.actions}>
        <button onClick={toggleTheme} style={styles.themeBtn}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isConnected ? (
          <div style={styles.walletPill}>
            <div style={{
              ...styles.pillDot, 
              background: 'var(--accent-primary)',
              boxShadow: `0 0 8px var(--accent-primary)`
            }} />
            <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
               {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'CONNECTED'}
            </span>
          </div>
        ) : (
          <button onClick={onConnect} style={styles.connectBtn}>
             CONNECT WALLET
          </button>
        )}
      </div>
    </div>
  )
}

const styles: any = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    paddingTop: "24px", // Added top gap
    paddingBottom: "20px",
    borderBottom: "1px solid var(--border-color)",
    background: "var(--bg-primary)",
    transition: "background 0.3s, border-color 0.3s",
    position: "relative" // Needed for absolute centering
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    zIndex: 2 // Ensure logo stays clickable/visible
  },
  centerGroup: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  logoBox: {
    width: 32, height: 32, 
    background: 'var(--bg-secondary)', 
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--border-color)'
  },
  logoDot: {
    width: 12, height: 12,
    background: 'var(--accent-primary)',
    borderRadius: '50%'
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    zIndex: 2 // Ensure actions stay clickable above any potential center overlap
  },
  themeBtn: {
    background: "transparent",
    border: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    width: 36, height: 36,
    borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  walletPill: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    padding: "8px 16px",
    borderRadius: "20px",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s"
  },
  pillDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "background 0.3s"
  },
  connectBtn: {
    background: "var(--accent-primary)",
    color: "var(--text-on-accent)",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "transform 0.1s"
  }
}
