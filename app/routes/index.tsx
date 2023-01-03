import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import createServerSupabase from "utils/supabase.server";
import Login from "components/Login";

import type { LoaderArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });

  const { data } = await supabase.from("messages").select();
  return json({ messages: data ?? [] }, { headers: response.headers });
};

export default function Index() {
  const { messages } = useLoaderData<typeof loader>();
  return (
    <div>
      <Login />
      <pre>{JSON.stringify(messages, null, 2)}</pre>
    </div>
  );
}
