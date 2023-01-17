import type { Database } from "db_types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export default function RealtimeMessages({
  serverMessages,
}: {
  serverMessages: Message[];
}) {
  return <pre>{JSON.stringify(serverMessages, null, 2)}</pre>;
}
