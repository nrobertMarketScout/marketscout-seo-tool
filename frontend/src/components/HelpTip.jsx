export default function HelpTip ({ text }) {
  return (
    <span className="group relative inline-block cursor-help text-indigo-600">
      ⓘ
      <span className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block
                       whitespace-pre rounded-md bg-gray-900 px-2 py-1 text-xs text-white z-50">
        {text}
      </span>
    </span>
  );
}
