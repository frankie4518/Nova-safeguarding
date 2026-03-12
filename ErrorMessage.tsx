"use client";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
      {message}
    </div>
  );
}
