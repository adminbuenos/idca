"use client";

import { useActionState } from "react";
import type { CreateEmployeeLoginResult } from "./types";

type LoginFormProps = {
 action: (
  previousState: CreateEmployeeLoginResult,
  formData: FormData
) => Promise<CreateEmployeeLoginResult>;
  defaultEmail: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
  canManageRoles: boolean;
};

const initialState: CreateEmployeeLoginResult = {
  success: true,
};

export default function LoginForm({
  action,
  defaultEmail,
  roles,
  canManageRoles,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {!state.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium"
        >
          Email Address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />

        <p className="mt-1 text-xs text-gray-500">
          Minimum 8 characters.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          className="mb-2 block text-sm font-medium"
        >
          Confirm Password
        </label>

        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      {canManageRoles && (
        <div>
          <label
            htmlFor="role_id"
            className="mb-2 block text-sm font-medium"
          >
            Role
          </label>

          <select
            id="role_id"
            name="role_id"
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            <option value="">No role assigned</option>

            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating Login..." : "Create Login"}
        </button>
      </div>
    </form>
  );
}