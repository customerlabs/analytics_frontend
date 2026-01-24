import Link from 'next/link';

export default function WorkspaceNotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-semibold text-gray-900">
        Workspace not found
      </h1>
      <p className="mt-2 text-gray-500">
        You don&apos;t have access to this workspace.
      </p>
      <Link
        href="/workspaces"
        className="mt-4 inline-block text-blue-600 hover:text-blue-800"
      >
        Go to workspaces
      </Link>
    </div>
  );
}
