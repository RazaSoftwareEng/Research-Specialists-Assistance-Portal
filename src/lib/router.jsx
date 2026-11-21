import { useEffect, useState } from 'react'

const current = () => window.location.hash.replace(/^#/, '').split('?')[0] || '/'

/** Tiny hash router: #/about, #/contact ... (works on any static host) */
export function useRoute() {
  const [route, setRoute] = useState(current())
  useEffect(() => {
    const h = () => {
      setRoute(current())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return route
}

export const navigate = (path) => {
  window.location.hash = path
}

export function Link({ to, children, ...rest }) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  )
}
