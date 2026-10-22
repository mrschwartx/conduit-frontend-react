const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span className="logo-font">Conduit</span>
        <span className="attribution">
          An implementation of the <a href="https://github.com/realworld-apps/realworld">RealWorld</a>{' '}
          specification, powered by <a href="https://react.dev/">React</a> in {YEAR}.
        </span>
      </div>
    </footer>
  )
}
