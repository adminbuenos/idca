"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addNoticeDocument } from "@/lib/notices/document-actions";

const BUCKET_NAME = "idca-notices";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

type DocumentUploadProps = {
  noticeId: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) {
    return null;
  }

  if (extension === "jpeg") {
    return "jpg";
  }

  if (["pdf", "jpg", "png"].includes(extension)) {
    return extension;
  }

  return null;
}

export default function DocumentUpload({
  noticeId,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setError("Only PDF, JPG and PNG files are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size <= 0) {
      setFile(null);
      setError("The selected file is empty.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File size cannot exceed 10 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();

    const extension = getExtension(file.name);

    if (!extension) {
      setError("Unsupported file type.");
      setUploading(false);
      return;
    }

    const uniqueName = `${crypto.randomUUID()}.${extension}`;

    const storagePath = `notices/${noticeId}/${uniqueName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Notice document upload failed:", uploadError);

        setError(
          uploadError.message ||
            "Failed to upload the document."
        );

        return;
      }

      const result = await addNoticeDocument(
        noticeId,
        file.name,
        file.type,
        file.size,
        storagePath
      );

      if (!result.success) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([storagePath]);

        setError(result.error);
        return;
      }

      setFile(null);
      setSuccess(
        `${file.name} uploaded successfully (${formatFileSize(
          file.size
        )}).`
      );

      window.location.reload();
    } catch (uploadError) {
      console.error(
        "Unexpected notice document upload error:",
        uploadError
      );

      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      setError(
        "Something went wrong while uploading the document."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#0b1f33]">
          Upload Signed Copy
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          Upload the official signed or scanned notice copy.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="notice-document"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Notice document
          </label>

          <input
            id="notice-document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-[#0b1f33] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#142f4a] disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="mt-2 text-xs text-gray-500">
            PDF, JPG or PNG · Maximum 10 MB
          </p>
        </div>

        {file && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">
              {file.name}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {file.type} · {formatFileSize(file.size)}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="inline-flex items-center justify-center rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d95f00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Signed Copy"}
        </button>
      </div>
    </div>
  );
}