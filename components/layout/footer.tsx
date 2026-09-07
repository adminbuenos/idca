export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-4">
        <p className="text-center text-xs text-gray-500">
          Powered By{" "}
          <a
            href="https://buenostechnology.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 transition hover:text-black hover:underline"
          >
            Buenos Technology Corp™
          </a>
        </p>
      </div>
    </footer>
  );
}