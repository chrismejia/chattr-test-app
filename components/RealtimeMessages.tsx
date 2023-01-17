import { useEffect, useState } from "react";
import { useOutletContext } from "@remix-run/react";

import type { Database } from "db_types";
import type { SupabaseOutletContext } from "~/root";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export default function RealtimeMessages({
  serverMessages,
}: {
  serverMessages: Message[];
}) {
  const [messages, setMessages] = useState(serverMessages);
  const { supabase } = useOutletContext<SupabaseOutletContext>();

  /**
   * To update this component if `serverMessages` changes b/c user logs in/out
   */
  useEffect(() => {
    setMessages(serverMessages);
  }, [serverMessages]);

  /**
   * Subscribe to realtime changes to messages table.
   * Add each new message to all logged in users by adding to end of new array
   */
  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          /**
           * If we can't find the message, in a new array, spread the old messages,
           * then add the new message to array as the latest message
           */
          if (!messages.find((message) => message.id === newMessage.id)) {
            setMessages([...messages, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, messages, setMessages]);

  // Render the dynamic messages array
  return <pre>{JSON.stringify(messages, null, 2)}</pre>;
}
