// TopNav.jsx – shows a slim gradient bar with page title.
// Hidden by parent when "hasSideNav" is true.
export default function TopNav ({ title }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0050ff] to-[#0070ff]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
      </div>
    </header>
  );
}
